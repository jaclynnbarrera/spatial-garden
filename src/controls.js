import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);

  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.minDistance = 5;
  controls.maxDistance = 120;
  controls.target.set(0, 0, 0);

  return controls;
}
