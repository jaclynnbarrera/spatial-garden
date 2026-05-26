import './style.css';
import { mountComposePanel } from './admin/ComposePanel.js';
import { createGarden } from './garden.js';

function mountCanvas(renderer) {
  const app = document.querySelector('#app');
  app.innerHTML = '';
  app.appendChild(renderer.domElement);
}

function mountHud() {
  const existing = document.querySelector('.hud');
  if (existing) existing.remove();

  const hud = document.createElement('div');
  hud.className = 'hud';
  hud.innerHTML = `
    <h1 class="hud__title">Naomi Barrera</h1>
    <p class="hud__copy">My internet brain, rendered in 3D.</p>
    <ul class="hud__instructions">
      <li>Scroll to explore</li>
      <li>Drag to orbit</li>
      <li>Click anything</li>
    </ul>
  `;
  document.body.appendChild(hud);
}

async function init() {
  const garden = createGarden();
  mountHud();
  const renderer = await garden.init();

  mountCanvas(renderer);
  garden.start();

  mountComposePanel({
    onPostCreated: () => garden.addPost(),
  });
}

init().catch((error) => {
  console.error(error);
  document.querySelector('#app').innerHTML = `
    <div class="error">
      <h1>Could not load</h1>
      <p>Make sure the API is running: <code>npm run dev:server</code></p>
      <pre>${error.message}</pre>
    </div>
  `;
});
