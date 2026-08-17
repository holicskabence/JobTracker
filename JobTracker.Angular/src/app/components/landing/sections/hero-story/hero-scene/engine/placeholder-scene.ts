import * as THREE from 'three';

/**
 * Temporary Phase 1 placeholder — proves the render/resize/dispose lifecycle and the
 * lazy-loading boundary work end to end. This gets replaced by the real chaos -> pipeline
 * scene in a later phase; nothing here is meant to represent the final visual design.
 */

export interface PlaceholderSceneOptions {
  reducedMotion: boolean;
  qualityTier: 'desktop' | 'mobile';
}

export interface PlaceholderSceneHandle {
  setPaused(paused: boolean): void;
  dispose(): void;
}

const BRAND_GREEN = 0x26ac00;

export function createPlaceholderScene(canvas: HTMLCanvasElement, options: PlaceholderSceneOptions): PlaceholderSceneHandle {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: options.qualityTier === 'desktop',
    powerPreference: 'high-performance'
  });
  const pixelRatioCap = options.qualityTier === 'desktop' ? 2 : 1.5;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  const geometry = new THREE.IcosahedronGeometry(1.6, 0);
  const edges = new THREE.EdgesGeometry(geometry);
  const material = new THREE.LineBasicMaterial({ color: BRAND_GREEN, transparent: true, opacity: 0.85 });
  const wireframe = new THREE.LineSegments(edges, material);
  scene.add(wireframe);

  const clock = new THREE.Clock();
  let paused = false;
  let frameId = 0;

  function resize(): void {
    const { clientWidth, clientHeight } = canvas;
    if (!clientWidth || !clientHeight) return;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  }

  function renderFrame(): void {
    if (!options.reducedMotion) {
      const delta = clock.getDelta();
      wireframe.rotation.x += delta * 0.15;
      wireframe.rotation.y += delta * 0.22;
    }
    renderer.render(scene, camera);
  }

  function tick(): void {
    if (!paused) renderFrame();
    frameId = requestAnimationFrame(tick);
  }

  resize();
  renderFrame();
  if (!options.reducedMotion) {
    frameId = requestAnimationFrame(tick);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  return {
    setPaused(next: boolean): void {
      paused = next;
    },
    dispose(): void {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      geometry.dispose();
      edges.dispose();
      material.dispose();
      renderer.dispose();
    }
  };
}
