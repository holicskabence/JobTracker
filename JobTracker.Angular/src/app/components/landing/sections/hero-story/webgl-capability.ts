/**
 * Cheap, dependency-free WebGL probe. Deliberately does not import 'three' so this
 * check can run before the Three.js chunk is ever requested — an incapable browser
 * never pays for the download.
 */
export function isWebglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}
