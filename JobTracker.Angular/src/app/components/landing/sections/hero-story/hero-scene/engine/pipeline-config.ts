export type QualityTier = 'desktop' | 'tablet' | 'mobile';

export type Vec3 = [number, number, number];

export interface StationWaypoints {
  application: Vec3;
  screening: Vec3;
  interview: Vec3;
  offer: Vec3;
}

export interface ChaosCluster {
  center: Vec3;
  /** Half-extent of jitter around the center, per axis. */
  spread: Vec3;
  count: number;
}

export interface PipelineSceneConfig {
  tier: QualityTier;
  dprCap: number;
  targetFps?: number;
  fov: number;
  cameraPosition: Vec3;
  cameraTarget: Vec3;
  waypoints: StationWaypoints;
  heroCardPosition: Vec3;
  heroCardScale: number;
  chaosClusters: ChaosCluster[];
  chaosSeed: number;
  pointerParallax: boolean;
}

// Matches the approved concept reference: a staged product installation viewed slightly
// from above/front, travelling mostly left -> right with only shallow Z depth (NOT a
// staircase receding into the distance). Anchors are each station's ground-contact point.
const DESKTOP: PipelineSceneConfig = {
  tier: 'desktop',
  dprCap: 2,
  fov: 50,
  cameraPosition: [-0.4, 1.6, 8.8],
  cameraTarget: [-0.4, 0.1, -0.2],
  waypoints: {
    application: [-3.2, -0.8, 0.8],
    screening: [-1.1, -0.2, 0.3],
    interview: [1.1, 0.3, -0.2],
    offer: [3.4, 1.1, -0.8]
  },
  heroCardPosition: [-3.8, -1.1, 1.6],
  heroCardScale: 1.3,
  chaosClusters: [
    { center: [-2.0, 1.8, -1.5], spread: [1.2, 0.6, 0.8], count: 4 },
    { center: [2.0, 2.0, -1.8], spread: [1.1, 0.6, 0.7], count: 4 }
  ],
  chaosSeed: 1337,
  pointerParallax: true
};

const TABLET: PipelineSceneConfig = {
  tier: 'tablet',
  dprCap: 1.75,
  fov: 54,
  cameraPosition: [-0.3, 1.4, 8.2],
  cameraTarget: [-0.3, 0.08, -0.15],
  waypoints: {
    application: [-2.4, -0.6, 0.6],
    screening: [-0.8, -0.15, 0.2],
    interview: [0.8, 0.2, -0.15],
    offer: [2.6, 0.8, -0.6]
  },
  heroCardPosition: [-2.9, -0.8, 1.2],
  heroCardScale: 1.26,
  chaosClusters: [
    { center: [-1.5, 1.4, -1.1], spread: [0.9, 0.5, 0.6], count: 3 },
    { center: [1.5, 1.5, -1.3], spread: [0.85, 0.5, 0.55], count: 3 }
  ],
  chaosSeed: 4242,
  pointerParallax: true
};

// Mobile keeps the same physical station language but a compact vertical/zig-zag path
// (Application low, Offer high) instead of the desktop's horizontal travel.
const MOBILE: PipelineSceneConfig = {
  tier: 'mobile',
  dprCap: 1.5,
  targetFps: 30,
  fov: 52,
  cameraPosition: [-0.1, 0.3, 5.4],
  cameraTarget: [-0.1, 0.0, -0.1],
  waypoints: {
    application: [-0.9, -1.3, 0.5],
    screening: [0.3, -0.5, 0.2],
    interview: [-0.4, 0.4, -0.1],
    offer: [0.6, 1.3, -0.4]
  },
  heroCardPosition: [-1.3, -1.6, 0.9],
  heroCardScale: 1.28,
  chaosClusters: [
    { center: [-0.9, 1.1, -0.8], spread: [0.55, 0.4, 0.4], count: 2 },
    { center: [0.9, -1.0, -0.9], spread: [0.5, 0.4, 0.4], count: 2 }
  ],
  chaosSeed: 777,
  pointerParallax: false
};

const CONFIG_BY_TIER: Record<QualityTier, PipelineSceneConfig> = {
  desktop: DESKTOP,
  tablet: TABLET,
  mobile: MOBILE
};

export function getSceneConfig(tier: QualityTier): PipelineSceneConfig {
  return CONFIG_BY_TIER[tier];
}
