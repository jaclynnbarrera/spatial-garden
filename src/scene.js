import * as THREE from 'three';

const VOID_COLOR = '#f6f6f4';

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(VOID_COLOR);
  scene.fog = new THREE.FogExp2(VOID_COLOR, 0.006);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );
  camera.position.set(0, 0, 19);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const ambient = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.35);
  keyLight.position.set(10, 20, 10);
  scene.add(keyLight);

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener('resize', onResize);

  return { scene, camera, renderer, onResize };
}
