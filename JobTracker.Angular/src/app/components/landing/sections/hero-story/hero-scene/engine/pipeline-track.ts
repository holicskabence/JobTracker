import * as THREE from 'three';
import type { StationWaypoints } from './pipeline-config';

export interface TrackBuildResult {
  group: THREE.Group;
  curve: THREE.CatmullRomCurve3;
  highlightMaterial: THREE.MeshStandardMaterial;
  railMesh: THREE.Mesh;
  dispose(): void;
}

/**
 * The physical connector: a substantial "conveyor" rail (not a thin diagram line) running
 * beneath each station's base, with a slim green inset channel along its top surface.
 */
export function buildTrack(waypoints: StationWaypoints): TrackBuildResult {
  const points = [
    new THREE.Vector3(...waypoints.application),
    new THREE.Vector3(...waypoints.screening),
    new THREE.Vector3(...waypoints.interview),
    new THREE.Vector3(...waypoints.offer)
  ];
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.4);

  const railGeometry = new THREE.TubeGeometry(curve, 90, 0.13, 12, false);
  const railMaterial = new THREE.MeshStandardMaterial({ color: 0xe6e1d5, roughness: 0.65, metalness: 0.05 });
  const rail = new THREE.Mesh(railGeometry, railMaterial);
  rail.castShadow = true;
  rail.receiveShadow = true;

  const channelOffsetPoints = points.map((point, index) => {
    const next = points[Math.min(index + 1, points.length - 1)];
    const prev = points[Math.max(index - 1, 0)];
    const tangent = next.clone().sub(prev).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3().crossVectors(tangent, up).normalize();
    const normal = new THREE.Vector3().crossVectors(side, tangent).normalize();
    return point.clone().addScaledVector(normal, 0.1);
  });
  const channelCurve = new THREE.CatmullRomCurve3(channelOffsetPoints, false, 'catmullrom', 0.4);
  const channelGeometry = new THREE.TubeGeometry(channelCurve, 90, 0.035, 8, false);
  const highlightMaterial = new THREE.MeshStandardMaterial({
    color: 0x26ac00,
    roughness: 0.4,
    metalness: 0.08,
    emissive: 0x123f00,
    emissiveIntensity: 0.4
  });
  const channel = new THREE.Mesh(channelGeometry, highlightMaterial);

  const group = new THREE.Group();
  group.add(rail, channel);

  return {
    group,
    curve,
    highlightMaterial,
    railMesh: rail,
    dispose() {
      railGeometry.dispose();
      railMaterial.dispose();
      channelGeometry.dispose();
      highlightMaterial.dispose();
    }
  };
}
