import './style.css';
import { mountComposePanel } from './admin/ComposePanel.js';
import { createGarden } from './garden.js';

function mountCanvas(renderer) {
  const app = document.querySelector('#app');
  app.innerHTML = '';
  app.appendChild(renderer.domElement);
}

function mountHud(postCountEl) {
  const existing = document.querySelector('.hud');
  if (existing) existing.remove();

  const hud = document.createElement('div');
  hud.className = 'hud';
  hud.innerHTML = `
    <p class="hud__eyebrow">Spatial Garden</p>
    <h1 class="hud__title">Your garden</h1>
    <p class="hud__copy"><span data-post-count>${postCountEl.textContent}</span> cards floating in the void. Press <strong>+</strong> to add something new.</p>
  `;
  document.body.appendChild(hud);

  return hud.querySelector('[data-post-count]');
}

async function init() {
  const garden = createGarden();
  const postCountEl = mountHud({ textContent: '…' });
  const renderer = await garden.init({ postCountEl });

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
      <h1>Could not start Spatial Garden</h1>
      <p>Make sure the API is running: <code>npm run dev:server</code></p>
      <pre>${error.message}</pre>
    </div>
  `;
});
