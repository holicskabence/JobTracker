import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * Shared geometries/materials for the "application card" motif (chaos cards + the hero
 * card). Built once per scene instance and reused across every card mesh -- cards only
 * differ by their group transform and which avatar material variant they pick up.
 */
export interface CardKit {
  bodyGeometry: THREE.BufferGeometry;
  outlineGeometry: THREE.BufferGeometry;
  heroOutlineGeometry: THREE.BufferGeometry;
  avatarGeometry: THREE.BufferGeometry;
  barWideGeometry: THREE.BufferGeometry;
  barNarrowGeometry: THREE.BufferGeometry;
  statusGeometry: THREE.BufferGeometry;
  bodyMaterial: THREE.MeshStandardMaterial;
  heroBodyMaterial: THREE.MeshStandardMaterial;
  outlineMaterial: THREE.MeshStandardMaterial;
  heroOutlineMaterial: THREE.MeshStandardMaterial;
  barMaterial: THREE.MeshStandardMaterial;
  statusMaterial: THREE.MeshStandardMaterial;
  heroStatusMaterial: THREE.MeshStandardMaterial;
  avatarMaterials: THREE.MeshStandardMaterial[];
  dispose(): void;
}

export function createCardKit(): CardKit {
  const bodyGeometry = new RoundedBoxGeometry(1.0, 0.66, 0.05, 2, 0.08);
  const outlineGeometry = new RoundedBoxGeometry(1.06, 0.72, 0.03, 2, 0.09);
  // Noticeably thicker border gap than the chaos-card outline -- the hero card must read
  // as the protagonist at a glance, not just a slightly-bigger chaos card.
  const heroOutlineGeometry = new RoundedBoxGeometry(1.16, 0.82, 0.03, 2, 0.1);
  const avatarGeometry = new THREE.CircleGeometry(0.09, 20);
  const barWideGeometry = new THREE.PlaneGeometry(0.5, 0.055);
  const barNarrowGeometry = new THREE.PlaneGeometry(0.32, 0.055);
  const statusGeometry = new THREE.CircleGeometry(0.04, 16);

  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xfbfaf8, roughness: 0.85, metalness: 0.03 });
  const heroBodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0.04 });
  const outlineMaterial = new THREE.MeshStandardMaterial({ color: 0xe4e0da, roughness: 0.9, metalness: 0 });
  const heroOutlineMaterial = new THREE.MeshStandardMaterial({
    color: 0x26ac00,
    roughness: 0.5,
    metalness: 0.08,
    emissive: 0x0e3f00,
    emissiveIntensity: 0.35
  });
  const barMaterial = new THREE.MeshStandardMaterial({ color: 0xd9d5cd, roughness: 0.95, metalness: 0 });
  const statusMaterial = new THREE.MeshStandardMaterial({ color: 0xb3aea4, roughness: 0.8, metalness: 0 });
  const heroStatusMaterial = new THREE.MeshStandardMaterial({
    color: 0x26ac00,
    roughness: 0.4,
    metalness: 0.1,
    emissive: 0x0e3f00,
    emissiveIntensity: 0.5
  });

  const avatarPalette = [0xb7c4d1, 0xd7cdb8, 0xc4d0c2, 0xcac7c2, 0xc9bfd6];
  const avatarMaterials = avatarPalette.map(
    color => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.02 })
  );

  return {
    bodyGeometry,
    outlineGeometry,
    heroOutlineGeometry,
    avatarGeometry,
    barWideGeometry,
    barNarrowGeometry,
    statusGeometry,
    bodyMaterial,
    heroBodyMaterial,
    outlineMaterial,
    heroOutlineMaterial,
    barMaterial,
    statusMaterial,
    heroStatusMaterial,
    avatarMaterials,
    dispose() {
      bodyGeometry.dispose();
      outlineGeometry.dispose();
      heroOutlineGeometry.dispose();
      avatarGeometry.dispose();
      barWideGeometry.dispose();
      barNarrowGeometry.dispose();
      statusGeometry.dispose();
      bodyMaterial.dispose();
      heroBodyMaterial.dispose();
      outlineMaterial.dispose();
      heroOutlineMaterial.dispose();
      barMaterial.dispose();
      statusMaterial.dispose();
      heroStatusMaterial.dispose();
      avatarMaterials.forEach(m => m.dispose());
    }
  };
}

export interface CardOptions {
  avatarVariant: number;
  hero?: boolean;
}

/** Builds one application-card group: outline/border, body, avatar mark, two text bars, status dot. */
export function buildCard(kit: CardKit, options: CardOptions): THREE.Group {
  const group = new THREE.Group();

  const outline = new THREE.Mesh(
    options.hero ? kit.heroOutlineGeometry : kit.outlineGeometry,
    options.hero ? kit.heroOutlineMaterial : kit.outlineMaterial
  );
  outline.position.z = -0.012;
  group.add(outline);

  const body = new THREE.Mesh(kit.bodyGeometry, options.hero ? kit.heroBodyMaterial : kit.bodyMaterial);
  group.add(body);

  if (options.hero) {
    // Only the protagonist card is worth a shadow-map draw -- chaos cards stay cheap.
    outline.castShadow = true;
    body.castShadow = true;
  }

  const avatarMaterial = kit.avatarMaterials[options.avatarVariant % kit.avatarMaterials.length];
  const avatar = new THREE.Mesh(kit.avatarGeometry, avatarMaterial);
  avatar.position.set(-0.36, 0.19, 0.03);
  group.add(avatar);

  const barWide = new THREE.Mesh(kit.barWideGeometry, kit.barMaterial);
  barWide.position.set(-0.11, 0.04, 0.03);
  group.add(barWide);

  const barNarrow = new THREE.Mesh(kit.barNarrowGeometry, kit.barMaterial);
  barNarrow.position.set(-0.2, -0.1, 0.03);
  group.add(barNarrow);

  const status = new THREE.Mesh(kit.statusGeometry, options.hero ? kit.heroStatusMaterial : kit.statusMaterial);
  status.position.set(0.42, 0.24, 0.03);
  group.add(status);

  return group;
}
