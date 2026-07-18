import './style.css';
import { deletePost } from './api.js';
import { initAdminMode, isAdminMode } from './adminMode.js';
import { mountComposePanel } from './admin/ComposePanel.js';
import { mountEditPanel } from './admin/EditPanel.js';
import { createGarden } from './garden.js';
import { mountMusicPlayer } from './music/player.js';

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
      <li>Scroll to zoom in & out</li>
      <li>Click + Drag to orbit</li>
      <li>Click cards for details</li>
    </ul>
  `;
  document.body.appendChild(hud);
}

function mountShuffleButton({ onShuffle } = {}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'shuffle-button';
  button.title = 'Shuffle';
  button.setAttribute('aria-label', 'Shuffle');
  button.innerHTML = `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  `;
  button.addEventListener('click', () => onShuffle?.());

  // Sits beside the music play button; falls back to a floating spot if the
  // music player didn't mount (no tracks).
  const musicBar = document.querySelector('.music__bar');
  if (musicBar) {
    musicBar.appendChild(button);
  } else {
    button.classList.add('shuffle-button--floating');
    document.body.appendChild(button);
  }
}

async function init() {
  initAdminMode();

  const garden = createGarden();
  const isAdmin = isAdminMode();
  let editPanel = null;

  mountHud();
  mountMusicPlayer();
  mountShuffleButton({ onShuffle: () => garden.shuffle() });

  const renderer = garden.setup({
    isAdmin,
    onEdit: (post) => editPanel?.open(post),
    onDelete: async (post) => {
      await deletePost(post.id);
      await garden.refreshPosts();
    },
  });

  mountCanvas(renderer);
  garden.start();

  garden.loadInitialPosts().catch((error) => {
    console.error(error);
    document.querySelector('#app').innerHTML = `
      <div class="error">
        <h1>Could not load</h1>
        <p>Make sure the API is running: <code>npm run dev:server</code></p>
        <pre>${error.message}</pre>
      </div>
    `;
  });

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
