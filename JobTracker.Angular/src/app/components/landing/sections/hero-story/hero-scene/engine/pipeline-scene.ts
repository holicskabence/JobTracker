import * as THREE from 'three';
import { createCardKit, buildCard, type CardKit } from './pipeline-card';
import { buildChaosGroup, type ChaosCardHandle } from './pipeline-chaos';
import { buildTrack } from './pipeline-track';
import { buildStations, type StationHandle } from './pipeline-nodes';
import type { StationKind } from './pipeline-icons';
import type { PipelineSceneConfig } from './pipeline-config';

export interface StationScreenPosition {
  leftPct: number;
  topPct: number;
  visible: boolean;
}

export interface PipelineSceneOptions {
  reducedMotion: boolean;
  /** Called every rendered frame with each station's current screen-space position, so
   *  DOM labels can track the 3D objects instead of using hardcoded pixel coordinates. */
  onStationsProjected?: (positions: Record<StationKind, StationScreenPosition>) => void;
}

export interface PipelineSceneHandle {
  setPaused(paused: boolean): void;
  resize(): void;
  dispose(): void;

  // Exposed for Phase 4 (scroll choreography) -- unused by Phase 3 itself.
  readonly chaosGroup: THREE.Group;
  readonly chaosCards: ChaosCardHandle[];
  readonly trackCurve: THREE.CatmullRomCurve3;
  readonly stations: Record<StationKind, StationHandle>;
  readonly heroCard: THREE.Group;
  readonly camera: THREE.PerspectiveCamera;
  readonly cameraTarget: THREE.Vector3;
}

const STATION_ORDER: StationKind[] = ['application', 'screening', 'interview', 'offer'];
const CLOCK = () => new THREE.Clock();

export function createPipelineScene(
  canvas: HTMLCanvasElement,
  config: PipelineSceneConfig,
  options: PipelineSceneOptions
): PipelineSceneHandle {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, config.dprCap));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Real (but tightly-bounded) shadows: only ~6 casters (4 stations + hero card + rail),
  // so a modest shadow map stays cheap across every tier.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  // near/far tuned so Offer (the deepest station) stays clearly visible -- only the
  // background chaos cards behind it should fade meaningfully into the page bg.
  scene.fog = new THREE.Fog(0xf4f2f0, 8, 17);

  const camera = new THREE.PerspectiveCamera(config.fov, 1, 0.1, 40);
  const basePosition = new THREE.Vector3(...config.cameraPosition);
  const cameraTarget = new THREE.Vector3(...config.cameraTarget);
  camera.position.copy(basePosition);
  camera.lookAt(cameraTarget);

  // ---- lighting: restrained 3-point studio setup, no HDR/environment map ----
  const hemi = new THREE.HemisphereLight(0xffffff, 0xd8d3c8, 1.1);
  const key = new THREE.DirectionalLight(0xffffff, 1.9);
  key.position.set(4, 6, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0018;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 14;
  key.shadow.camera.left = -5.5;
  key.shadow.camera.right = 5.5;
  key.shadow.camera.top = 4.5;
  key.shadow.camera.bottom = -3.5;
  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.4);
  fill.position.set(-4, 1.5, -2);
  const rim = new THREE.DirectionalLight(0xfff2df, 0.4);
  rim.position.set(-3, 2.5, -6.5);
  scene.add(hemi, key, fill, rim);

  // ---- scene content ----
  const cardKit: CardKit = createCardKit();
  const { group: chaosGroup, cards: chaosCards } = buildChaosGroup(cardKit, config.chaosClusters, config.chaosSeed);
  const track = buildTrack(config.waypoints);
  const nodes = buildStations(config.waypoints);

  const heroCard = buildCard(cardKit, { avatarVariant: 0, hero: true });
  heroCard.position.set(...config.heroCardPosition);
  heroCard.scale.setScalar(config.heroCardScale);
  heroCard.rotation.set(0, 0.16, -0.05);

  // Shadow-catching ground: fully transparent except where a shadow lands on it, so the
  // scene stays visually "in" the page (no dark canvas rectangle) while still grounding
  // the stations/hero card instead of letting them float in empty space.
  const groundY = config.waypoints.application[1] - 0.35;
  const groundGeometry = new THREE.PlaneGeometry(40, 40);
  const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.22 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = groundY;
  ground.receiveShadow = true;

  scene.add(chaosGroup, track.group, nodes.group, heroCard, ground);

  // ---- idle motion state ----
  const clock = CLOCK();
  let paused = false;
  let frameId = 0;
  const pointer = new THREE.Vector2(0, 0);
  const pointerTarget = new THREE.Vector2(0, 0);
  const applicationAccentMaterial = nodes.stations.application.accent.material as THREE.MeshStandardMaterial;
  const baseActiveEmissive = applicationAccentMaterial.emissiveIntensity;

  const onPointerMove = (event: PointerEvent) => {
    pointerTarget.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointerTarget.y = (event.clientY / window.innerHeight) * 2 - 1;
  };
  if (config.pointerParallax && !options.reducedMotion) {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
  }

  function resize(): void {
    const { clientWidth, clientHeight } = canvas;
    if (!clientWidth || !clientHeight) return;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  }

  const projectedPositions = {} as Record<StationKind, StationScreenPosition>;
  const worldPos = new THREE.Vector3();

  function projectStations(): void {
    if (!options.onStationsProjected) return;
    STATION_ORDER.forEach(kind => {
      nodes.stations[kind].panel.getWorldPosition(worldPos);
      const ndc = worldPos.project(camera);
      projectedPositions[kind] = {
        leftPct: ((ndc.x + 1) / 2) * 100,
        topPct: ((1 - ndc.y) / 2) * 100,
        visible: ndc.z < 1 && Math.abs(ndc.x) <= 1.05 && Math.abs(ndc.y) <= 1.05
      };
    });
    options.onStationsProjected(projectedPositions);
  }

  function renderStaticFrame(): void {
    camera.position.copy(basePosition);
    camera.lookAt(cameraTarget);
    renderer.render(scene, camera);
    projectStations();
  }

  function renderFrame(): void {
    const elapsed = clock.getElapsedTime();

    // Chaos cards: barely-perceptible float + rotation drift.
    chaosCards.forEach(card => {
      const offset = Math.sin(elapsed * card.floatSpeed + card.phase) * 0.045;
      card.group.position.y = card.basePosition.y + offset;
      card.group.rotation.z = card.baseRotationZ + Math.sin(elapsed * 0.25 + card.phase) * 0.025;
    });

    // Hero card: slower, smaller hover.
    heroCard.position.y = config.heroCardPosition[1] + Math.sin(elapsed * 0.6) * 0.03;

    // Active (Application) station: subtle emissive pulse.
    applicationAccentMaterial.emissiveIntensity = baseActiveEmissive + (Math.sin(elapsed * 1.4) * 0.5 + 0.5) * 0.2;

    // Track channel: gentle brightness breathing (no UV scroll / dash animation yet -- Phase 4).
    track.highlightMaterial.emissiveIntensity = 0.3 + (Math.sin(elapsed * 0.8) * 0.5 + 0.5) * 0.2;

    // Pointer parallax (desktop only) + camera breathing, both heavily damped.
    pointer.lerp(pointerTarget, 0.04);
    const breatheX = Math.sin(elapsed * 0.18) * 0.05;
    const breatheY = Math.cos(elapsed * 0.14) * 0.035;
    const parallaxX = config.pointerParallax ? pointer.x * 0.18 : 0;
    const parallaxY = config.pointerParallax ? -pointer.y * 0.12 : 0;

    camera.position.set(
      basePosition.x + breatheX + parallaxX,
      basePosition.y + breatheY + parallaxY,
      basePosition.z
    );
    camera.lookAt(cameraTarget);

    renderer.render(scene, camera);
    projectStations();
  }

  function tick(): void {
    if (!paused) renderFrame();
    frameId = requestAnimationFrame(tick);
  }

  resize();
  if (options.reducedMotion) {
    renderStaticFrame();
  } else {
    renderFrame();
    frameId = requestAnimationFrame(tick);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  return {
    chaosGroup,
    chaosCards,
    trackCurve: track.curve,
    stations: nodes.stations,
    heroCard,
    camera,
    cameraTarget,

    setPaused(next: boolean): void {
      paused = next;
    },
    resize,
    dispose(): void {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      if (config.pointerParallax) window.removeEventListener('pointermove', onPointerMove);
      cardKit.dispose();
      track.dispose();
      nodes.dispose();
      groundGeometry.dispose();
      groundMaterial.dispose();
      renderer.dispose();
    }
  };
}
