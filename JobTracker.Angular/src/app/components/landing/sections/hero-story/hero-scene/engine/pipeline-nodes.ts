import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { StationWaypoints } from './pipeline-config';
import { buildStationIcon, type StationKind } from './pipeline-icons';

/**
 * A station is a physical object, not a chart node: a thick platform/base, a short stem,
 * a raised rounded "display panel" tilted toward the camera, a large icon on its face,
 * and a thin accent stripe. Each stage carries its own accent color (per the approved
 * concept reference), not a uniform green -- Offer alone gets an elevated, greener base.
 */
export interface StationHandle {
  kind: StationKind;
  group: THREE.Group;
  panel: THREE.Mesh;
  base: THREE.Mesh;
  accent: THREE.Mesh;
  active: boolean;
}

export interface NodesBuildResult {
  group: THREE.Group;
  stations: Record<StationKind, StationHandle>;
  shadowCasters: THREE.Object3D[];
  dispose(): void;
}

const ORDER: StationKind[] = ['application', 'screening', 'interview', 'offer'];

// application: brand green: screening: warm gold: interview: soft blue: offer: strong green.
const STAGE_ACCENT: Record<StationKind, number> = {
  application: 0x26ac00,
  screening: 0xe6a400,
  interview: 0x4fa3e6,
  offer: 0x1f8a00
};

const BASE_HEIGHT = 0.18;
const BASE_RADIUS = 0.42;
const OFFER_BASE_HEIGHT = 0.3;
const OFFER_BASE_RADIUS = 0.48;
const STEM_HEIGHT = 0.14;
const PANEL_WIDTH = 0.64;
const PANEL_HEIGHT = 0.8;
const PANEL_DEPTH = 0.09;
const PANEL_TILT = -0.16;

export function buildStations(waypoints: StationWaypoints): NodesBuildResult {
  const disposables: Array<{ dispose(): void }> = [];

  const baseGeometry = new THREE.CylinderGeometry(BASE_RADIUS, BASE_RADIUS * 1.06, BASE_HEIGHT, 32);
  const baseTrimGeometry = new THREE.CylinderGeometry(BASE_RADIUS * 0.86, BASE_RADIUS * 0.86, BASE_HEIGHT * 0.42, 32);
  const offerBaseGeometry = new THREE.CylinderGeometry(OFFER_BASE_RADIUS, OFFER_BASE_RADIUS * 1.06, OFFER_BASE_HEIGHT, 32);
  const offerBaseTrimGeometry = new THREE.CylinderGeometry(OFFER_BASE_RADIUS * 0.86, OFFER_BASE_RADIUS * 0.86, OFFER_BASE_HEIGHT * 0.42, 32);
  const stemGeometry = new THREE.CylinderGeometry(0.1, 0.12, STEM_HEIGHT, 20);
  const panelGeometry = new RoundedBoxGeometry(PANEL_WIDTH, PANEL_HEIGHT, PANEL_DEPTH, 3, 0.1);
  const accentGeometry = new THREE.PlaneGeometry(PANEL_WIDTH * 0.72, 0.05);
  disposables.push(baseGeometry, baseTrimGeometry, offerBaseGeometry, offerBaseTrimGeometry, stemGeometry, panelGeometry, accentGeometry);

  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xe9e4d9, roughness: 0.7, metalness: 0.04 });
  const baseTrimMaterial = new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.65, metalness: 0.05 });
  const offerBaseMaterial = new THREE.MeshStandardMaterial({
    color: 0x26ac00, roughness: 0.55, metalness: 0.05, emissive: 0x0e3f00, emissiveIntensity: 0.28
  });
  const offerBaseTrimMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f8a00, roughness: 0.5, metalness: 0.06, emissive: 0x0e3f00, emissiveIntensity: 0.2
  });
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2926, roughness: 0.6, metalness: 0.08 });
  const panelMaterial = new THREE.MeshStandardMaterial({ color: 0xfffdf9, roughness: 0.55, metalness: 0.03 });
  const panelOfferMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4fbef, roughness: 0.5, metalness: 0.03, emissive: 0x0a2600, emissiveIntensity: 0.08
  });
  disposables.push(baseMaterial, baseTrimMaterial, offerBaseMaterial, offerBaseTrimMaterial, stemMaterial, panelMaterial, panelOfferMaterial);

  const accentMaterials: Record<StationKind, THREE.MeshStandardMaterial> = {} as any;
  const iconMaterials: Record<StationKind, THREE.MeshStandardMaterial> = {} as any;
  ORDER.forEach(kind => {
    const isOffer = kind === 'offer';
    const color = STAGE_ACCENT[kind];
    accentMaterials[kind] = new THREE.MeshStandardMaterial({
      color, roughness: 0.45, metalness: 0.06, emissive: color, emissiveIntensity: isOffer ? 0.35 : 0.18
    });
    iconMaterials[kind] = new THREE.MeshStandardMaterial({
      color, roughness: 0.4, metalness: 0.04, emissive: color, emissiveIntensity: isOffer ? 0.3 : 0.12
    });
    disposables.push(accentMaterials[kind], iconMaterials[kind]);
  });

  const group = new THREE.Group();
  const stations = {} as Record<StationKind, StationHandle>;
  const shadowCasters: THREE.Object3D[] = [];
  const iconGeometries: THREE.BufferGeometry[] = [];

  ORDER.forEach(kind => {
    const isOffer = kind === 'offer';
    const isActive = kind === 'application';
    const anchor = waypoints[kind];
    const baseHeight = isOffer ? OFFER_BASE_HEIGHT : BASE_HEIGHT;

    const stationGroup = new THREE.Group();
    stationGroup.position.set(...anchor);

    const base = new THREE.Mesh(isOffer ? offerBaseGeometry : baseGeometry, isOffer ? offerBaseMaterial : baseMaterial);
    base.position.y = baseHeight / 2;
    base.castShadow = true;
    base.receiveShadow = true;
    stationGroup.add(base);

    const baseTrim = new THREE.Mesh(
      isOffer ? offerBaseTrimGeometry : baseTrimGeometry,
      isOffer ? offerBaseTrimMaterial : baseTrimMaterial
    );
    baseTrim.position.y = baseHeight * 0.8;
    stationGroup.add(baseTrim);

    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = baseHeight + STEM_HEIGHT / 2;
    stationGroup.add(stem);

    const panelY = baseHeight + STEM_HEIGHT + PANEL_HEIGHT / 2 - 0.04;
    const panel = new THREE.Mesh(panelGeometry, isOffer ? panelOfferMaterial : panelMaterial);
    panel.position.y = panelY;
    panel.rotation.x = PANEL_TILT;
    panel.castShadow = true;
    stationGroup.add(panel);

    const accent = new THREE.Mesh(accentGeometry, accentMaterials[kind]);
    accent.position.set(0, panelY - PANEL_HEIGHT / 2 + 0.09, PANEL_DEPTH / 2 + 0.005);
    accent.rotation.x = PANEL_TILT;
    stationGroup.add(accent);

    const icon = buildStationIcon(kind, iconMaterials[kind]);
    icon.scale.setScalar(2.1);
    icon.position.set(0, panelY + 0.04, PANEL_DEPTH / 2 + 0.06);
    icon.rotation.x = PANEL_TILT;
    icon.traverse(child => {
      if (child instanceof THREE.Mesh) iconGeometries.push(child.geometry);
    });
    stationGroup.add(icon);

    group.add(stationGroup);
    shadowCasters.push(base, panel);
    stations[kind] = { kind, group: stationGroup, panel, base, accent, active: isActive };
  });

  return {
    group,
    stations,
    shadowCasters,
    dispose() {
      disposables.forEach(d => d.dispose());
      iconGeometries.forEach(g => g.dispose());
    }
  };
}
