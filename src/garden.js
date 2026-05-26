import { buildAtlas } from './atlas.js';
import { animateParticleIn, animateScatterIn } from './animations.js';
import { fetchPosts } from './api.js';
import { createControls } from './controls.js';
import { createDetailView } from './detail.js';
import { createHoverController } from './interaction.js';
import { createParticles } from './particles.js';
import { createScene } from './scene.js';

function disposePoints(mesh) {
  mesh.geometry.dispose();
  mesh.material.dispose();
  mesh.material.uniforms.uAtlas.value.dispose();
}

export function createGarden() {
  const state = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    mesh: null,
    posts: [],
    postCountEl: null,
    hover: null,
    detail: null,
  };

  function updatePostCount(count) {
    if (state.postCountEl) {
      state.postCountEl.textContent = String(count);
    }
  }

  async function renderPosts(posts, { mode = 'scatter' } = {}) {
    const atlas = await buildAtlas(posts);
    const particleData = createParticles(posts, atlas);

    if (state.mesh) {
      state.scene.remove(state.mesh);
      disposePoints(state.mesh);
    }

    state.mesh = particleData.mesh;
    state.scene.add(state.mesh);
    state.posts = posts;
    state.hover?.reset();
    state.detail?.forceClose();

    const markDirty = () => {
      particleData.geometry.attributes.position.needsUpdate = true;
    };

    if (mode === 'scatter') {
      animateScatterIn({
        positions: particleData.positions,
        targetPositions: particleData.targetPositions,
        onUpdate: markDirty,
      });
      return;
    }

    if (mode === 'add-latest') {
      const lastIndex = posts.length - 1;

      for (let i = 0; i < lastIndex; i += 1) {
        const i3 = i * 3;
        particleData.positions[i3] = particleData.targetPositions[i3];
        particleData.positions[i3 + 1] = particleData.targetPositions[i3 + 1];
        particleData.positions[i3 + 2] = particleData.targetPositions[i3 + 2];
      }

      markDirty();

      animateParticleIn({
        positions: particleData.positions,
        targetPositions: particleData.targetPositions,
        index: lastIndex,
        onUpdate: markDirty,
      });
    }
  }

  return {
    async init({ postCountEl }) {
      state.postCountEl = postCountEl;
      const posts = await fetchPosts();

      const { scene, camera, renderer } = createScene();
      state.scene = scene;
      state.camera = camera;
      state.renderer = renderer;
      state.controls = createControls(camera, renderer);
      state.detail = createDetailView({
        getControls: () => state.controls,
        getUniforms: () => state.mesh?.material?.uniforms ?? null,
      });
      state.hover = createHoverController({
        camera,
        renderer,
        controls: state.controls,
        getMesh: () => state.mesh,
        detail: state.detail,
      });

      updatePostCount(posts.length);
      await renderPosts(posts, { mode: 'scatter' });

      return renderer;
    },

    async addPost() {
      const posts = await fetchPosts();
      updatePostCount(posts.length);
      await renderPosts(posts, { mode: 'add-latest' });
    },

    start() {
      const loop = () => {
        requestAnimationFrame(loop);
        state.controls.update();
        state.renderer.render(state.scene, state.camera);
      };
      loop();
    },
  };
}
