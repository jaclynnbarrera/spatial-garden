import './style.css';
import { animateScatterIn } from './animations.js';
import { createControls } from './controls.js';
import { createParticles } from './particles.js';
import { createScene } from './scene.js';

async function fetchPosts() {
  const response = await fetch('/api/posts');
  if (!response.ok) {
    throw new Error(`Failed to load posts (${response.status})`);
  }
  return response.json();
}

function mountCanvas(renderer) {
  const app = document.querySelector('#app');
  app.innerHTML = '';
  app.appendChild(renderer.domElement);
}

function mountHud(postCount) {
  const hud = document.createElement('div');
  hud.className = 'hud';
  hud.innerHTML = `
    <p class="hud__eyebrow">Spatial Garden</p>
    <h1 class="hud__title">Phase 1</h1>
    <p class="hud__copy">${postCount} placeholder posts in 3D space. Drag to rotate, scroll to zoom, right-drag to pan.</p>
    <ul class="hud__legend">
      <li><span class="dot dot--link"></span> Link</li>
      <li><span class="dot dot--image"></span> Image</li>
      <li><span class="dot dot--text"></span> Text</li>
    </ul>
  `;
  document.body.appendChild(hud);
}

async function init() {
  const posts = await fetchPosts();
  const { scene, camera, renderer } = createScene();
  const controls = createControls(camera, renderer);

  mountCanvas(renderer);
  mountHud(posts.length);

  const { mesh, geometry, positions, targetPositions } = createParticles(posts);
  scene.add(mesh);

  const markPositionsDirty = () => {
    geometry.attributes.position.needsUpdate = true;
  };

  animateScatterIn({ positions, targetPositions, onUpdate: markPositionsDirty });

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}

init().catch((error) => {
  console.error(error);
  document.querySelector('#app').innerHTML = `
    <div class="error">
      <h1>Could not start Spatial Garden</h1>
      <p>Make sure the API is running: <code>npm run dev:server</code></p>
      <pre>${error.message}</pre>
    </div>
  `;
});
