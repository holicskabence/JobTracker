import * as THREE from 'three';
import type { CardKit } from './pipeline-card';
import { buildCard } from './pipeline-card';
import type { ChaosCluster } from './pipeline-config';

/** Deterministic PRNG (mulberry32) so the "chaos" layout is fixed across page loads. */
function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ChaosCardHandle {
  group: THREE.Group;
  basePosition: THREE.Vector3;
  baseRotationZ: number;
  phase: number;
  floatSpeed: number;
}

export interface ChaosBuildResult {
  group: THREE.Group;
  cards: ChaosCardHandle[];
}

/**
 * Scatters cards within a handful of art-directed clusters, jittering position/rotation/
 * scale with a seeded RNG so the "chaos" reads as messy but is identical on every load.
 */
export function buildChaosGroup(kit: CardKit, clusters: ChaosCluster[], seed: number): ChaosBuildResult {
  const rand = mulberry32(seed);
  const group = new THREE.Group();
  const cards: ChaosCardHandle[] = [];

  clusters.forEach(cluster => {
    for (let i = 0; i < cluster.count; i++) {
      const jitterX = (rand() * 2 - 1) * cluster.spread[0];
      const jitterY = (rand() * 2 - 1) * cluster.spread[1];
      const jitterZ = (rand() * 2 - 1) * cluster.spread[2];
      const rotY = (rand() * 2 - 1) * 0.55;
      const rotZ = (rand() * 2 - 1) * 0.3;
      const scale = 0.78 + rand() * 0.32;
      const avatarVariant = Math.floor(rand() * kit.avatarMaterials.length);

      const card = buildCard(kit, { avatarVariant });
      const position = new THREE.Vector3(
        cluster.center[0] + jitterX,
        cluster.center[1] + jitterY,
        cluster.center[2] + jitterZ
      );
      card.position.copy(position);
      card.rotation.set(0, rotY, rotZ);
      card.scale.setScalar(scale);
      group.add(card);

      cards.push({
        group: card,
        basePosition: position.clone(),
        baseRotationZ: rotZ,
        phase: rand() * Math.PI * 2,
        floatSpeed: 0.35 + rand() * 0.35
      });
    }
  });

  return { group, cards };
}
