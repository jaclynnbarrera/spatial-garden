import * as THREE from 'three';
import { getTextureIndex } from './atlas.js';
import fragmentShader from './shaders/particle.frag?raw';
import vertexShader from './shaders/particle.vert?raw';

export function createParticles(posts, atlas) {
  const { canvas, cols, rows, pathToIndex } = atlas;
  const count = posts.length;

  const positions = new Float32Array(count * 3);
  const targetPositions = new Float32Array(count * 3);
  const textureIndices = new Float32Array(count);
  const particleIndices = new Float32Array(count);

  posts.forEach((post, i) => {
    const [tx, ty, tz] = post.position;
    const i3 = i * 3;

    positions[i3] = 0;
    positions[i3 + 1] = 0;
    positions[i3 + 2] = 0;

    targetPositions[i3] = tx;
    targetPositions[i3 + 1] = ty;
    targetPositions[i3 + 2] = tz;

    textureIndices[i] = getTextureIndex(post, pathToIndex);
    particleIndices[i] = i;
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aTextureIndex', new THREE.BufferAttribute(textureIndices, 1));
  geometry.setAttribute('aParticleIndex', new THREE.BufferAttribute(particleIndices, 1));

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.flipY = false;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uAtlas: { value: texture },
      uGridSize: { value: new THREE.Vector2(cols, rows) },
      uBaseSize: { value: 520 },
      uScale: { value: 1 },
      uMinSize: { value: 28 },
      uMaxSize: { value: 340 },
      uHoveredIndex: { value: -1 },
      uHoverAmount: { value: 0 },
      uHoverScale: { value: 1.58 },
      uFocusedIndex: { value: -1 },
      uFocusAmount: { value: 0 },
      uFocusScale: { value: 2.35 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  points.userData.posts = posts;

  return {
    mesh: points,
    geometry,
    positions,
    targetPositions,
    texture,
  };
}
