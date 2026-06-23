import './style.css';
import { deletePost } from './api.js';
import { initAdminMode, isAdminMode } from './adminMode.js';
import { mountComposePanel } from './admin/ComposePanel.js';
import { mountEditPanel } from './admin/EditPanel.js';
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
    <p class="hud__brand">resonance.world</p>
    <h1 class="hud__title">Naomi Barrera</h1>
    <p class="hud__copy">Things I save when they resonate.</p>
    <p class="hud__copy">Links, images, notes in 3D space.</p>
    <ul class="hud__instructions">
      <li>Scroll to explore</li>
      <li>Drag to orbit</li>
      <li>Click anything</li>
    </ul>
  `;
  document.body.appendChild(hud);
}

async function init() {
  initAdminMode();

  const garden = createGarden();
  const isAdmin = isAdminMode();
  let editPanel = null;

  mountHud();
  const renderer = await garden.init({
    isAdmin,
    onEdit: (post) => editPanel?.open(post),
    onDelete: async (post) => {
      await deletePost(post.id);
      await garden.refreshPosts();
    },
  });

  mountCanvas(renderer);
  garden.start();

  if (isAdmin) {
    mountComposePanel({
      onPostCreated: () => garden.addPost(),
    });
    editPanel = mountEditPanel({
      onPostUpdated: () => garden.refreshPosts(),
    });
  }
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
