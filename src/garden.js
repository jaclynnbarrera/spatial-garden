import { buildAtlas } from './atlas.js';
import { animateParticleIn, animateScatterIn, animateShuffle } from './animations.js';
import { fetchPosts } from './api.js';
import { createControls } from './controls.js';
import { createDetailView } from './detail.js';
import { createHoverController } from './interaction.js';
import { createParticles, randomWorldPosition } from './particles.js';
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
    hover: null,
    detail: null,
    renderGeneration: 0,
    postsPromise: null,
    particleData: null,
    positionTween: null,
  };

  function setPositionTween(tween) {
    state.positionTween?.kill();
    state.positionTween = tween;
  }

  async function renderPosts(posts, { mode = 'scatter' } = {}) {
    const generation = ++state.renderGeneration;
    const atlas = await buildAtlas(posts);

    if (generation !== state.renderGeneration) return;

    const particleData = createParticles(posts, atlas);

    if (state.mesh) {
      setPositionTween(null);
      state.scene.remove(state.mesh);
      disposePoints(state.mesh);
    }

    state.mesh = particleData.mesh;
    state.scene.add(state.mesh);
    state.posts = posts;
    state.particleData = particleData;
    state.hover?.reset();
    state.detail?.forceClose();

    const markDirty = () => {
      particleData.geometry.attributes.position.needsUpdate = true;
    };

    if (mode === 'scatter') {
      setPositionTween(
        animateScatterIn({
          positions: particleData.positions,
          targetPositions: particleData.targetPositions,
          onUpdate: markDirty,
        })
      );
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

      setPositionTween(
        animateParticleIn({
          positions: particleData.positions,
          targetPositions: particleData.targetPositions,
          index: lastIndex,
          onUpdate: markDirty,
        })
      );
      return;
    }

    if (mode === 'replace') {
      for (let i = 0; i < posts.length; i += 1) {
        const i3 = i * 3;
        particleData.positions[i3] = particleData.targetPositions[i3];
        particleData.positions[i3 + 1] = particleData.targetPositions[i3 + 1];
        particleData.positions[i3 + 2] = particleData.targetPositions[i3 + 2];
      }
      markDirty();
    }
  }

  return {
    setup({ isAdmin = false, onEdit, onDelete } = {}) {
      state.postsPromise = fetchPosts();

      const { scene, camera, renderer } = createScene();
      state.scene = scene;
      state.camera = camera;
      state.renderer = renderer;
      state.controls = createControls(camera, renderer);
      state.detail = createDetailView({
        getControls: () => state.controls,
        getUniforms: () => state.mesh?.material?.uniforms ?? null,
        isAdmin,
        onEdit,
        onDelete,
      });
      state.hover = createHoverController({
        camera,
        renderer,
        controls: state.controls,
        getMesh: () => state.mesh,
        detail: state.detail,
      });

      return renderer;
    },

    async loadInitialPosts() {
      const posts = await state.postsPromise;
      await renderPosts(posts, { mode: 'scatter' });
    },

    async addPost() {
      const posts = await fetchPosts();
      await renderPosts(posts, { mode: 'add-latest' });
    },

    async refreshPosts() {
      const posts = await fetchPosts();
      await renderPosts(posts, { mode: 'replace' });
    },

    shuffle() {
      const particleData = state.particleData;
      if (!particleData) return;

      state.hover?.reset();
      state.detail?.forceClose();

      for (let i = 0; i < state.posts.length; i += 1) {
        const [x, y, z] = randomWorldPosition();
        const i3 = i * 3;
        particleData.targetPositions[i3] = x;
        particleData.targetPositions[i3 + 1] = y;
        particleData.targetPositions[i3 + 2] = z;
      }

      setPositionTween(
        animateShuffle({
          positions: particleData.positions,
          targetPositions: particleData.targetPositions,
          onUpdate: () => {
            particleData.geometry.attributes.position.needsUpdate = true;
          },
        })
      );
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
