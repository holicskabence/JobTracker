import * as THREE from 'three';

export type StationKind = 'application' | 'screening' | 'interview' | 'offer';

function starShape(points: number, outerRadius: number, innerRadius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * step - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

/**
 * Small, cheap glyphs mounted on each station puck -- built from primitives rather than
 * imported artwork, echoing the same silhouettes used by the DOM/SVG fallback (paper
 * plane / magnifying glass / chat bubble / star) without needing readable 3D text.
 */
export function buildStationIcon(kind: StationKind, material: THREE.Material): THREE.Object3D {
  switch (kind) {
    case 'application': {
      const geometry = new THREE.ConeGeometry(0.1, 0.22, 3);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.z = -Math.PI / 2;
      mesh.scale.set(0.9, 1, 0.35);
      return mesh;
    }
    case 'screening': {
      const group = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.065, 0.095, 20), material);
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.13, 6), material);
      handle.rotation.z = Math.PI / 4;
      handle.position.set(0.085, -0.085, 0);
      group.add(ring, handle);
      return group;
    }
    case 'interview': {
      const geometry = new THREE.PlaneGeometry(0.22, 0.16);
      const mesh = new THREE.Mesh(geometry, material);
      const tail = new THREE.Mesh(new THREE.CircleGeometry(0.035, 3), material);
      tail.position.set(-0.06, -0.1, 0);
      tail.rotation.z = Math.PI;
      const group = new THREE.Group();
      group.add(mesh, tail);
      return group;
    }
    case 'offer': {
      const geometry = new THREE.ShapeGeometry(starShape(5, 0.12, 0.05));
      return new THREE.Mesh(geometry, material);
    }
  }
}
