import gsap from 'gsap';
import * as THREE from 'three';

const TYPE_LABELS = {
  link: 'Link',
  image: 'Image',
  text: 'Text',
};

function mountTooltip() {
  const el = document.createElement('div');
  el.className = 'tooltip';
  el.hidden = true;
  el.innerHTML = `
    <p class="tooltip__type"></p>
    <p class="tooltip__title"></p>
    <p class="tooltip__excerpt"></p>
  `;
  document.body.appendChild(el);

  return {
    el,
    type: el.querySelector('.tooltip__type'),
    title: el.querySelector('.tooltip__title'),
    excerpt: el.querySelector('.tooltip__excerpt'),
  };
}

function getHoverUniforms(mesh) {
  return mesh?.material?.uniforms ?? null;
}

function estimatePointRadius(camera, material, positionAttribute, index, pixelRatio, hoverAmount = 0) {
  const worldPos = new THREE.Vector3().fromBufferAttribute(positionAttribute, index);
  worldPos.applyMatrix4(camera.matrixWorldInverse);

  const dist = Math.max(worldPos.length(), 0.001);
  const { uBaseSize, uScale, uMinSize, uMaxSize, uHoverScale, uFocusScale, uFocusAmount, uFocusedIndex } =
    material.uniforms;

  let pointSize = uBaseSize.value * (uScale.value / dist);
  pointSize = Math.max(uMinSize.value, Math.min(uMaxSize.value, pointSize));

  if (index === uFocusedIndex.value && uFocusAmount.value > 0) {
    pointSize *= 1 + (uFocusScale.value - 1) * uFocusAmount.value;
  } else {
    pointSize *= 1 + (uHoverScale.value - 1) * hoverAmount;
  }

  return (pointSize * 0.55) / pixelRatio;
}

function findHoveredIndex({ camera, mesh, renderer, mouseX, mouseY, hoveredIndex }) {
  if (!mesh) return -1;

  const posts = mesh.userData.posts;
  const positions = mesh.geometry.attributes.position;
  const canvas = renderer.domElement;
  const pixelRatio = renderer.getPixelRatio();
  const uniforms = getHoverUniforms(mesh);

  const projected = new THREE.Vector3();
  let bestIndex = -1;
  let bestDistance = Infinity;

  for (let i = 0; i < posts.length; i += 1) {
    const hoverAmount = i === hoveredIndex ? uniforms?.uHoverAmount.value ?? 0 : 0;
    projected.fromBufferAttribute(positions, i);
    projected.project(camera);

    if (projected.z > 1) continue;

    const screenX = (projected.x * 0.5 + 0.5) * canvas.clientWidth;
    const screenY = (-projected.y * 0.5 + 0.5) * canvas.clientHeight;
    const radius = estimatePointRadius(
      camera,
      mesh.material,
      positions,
      i,
      pixelRatio,
      hoverAmount
    );
    const distance = Math.hypot(screenX - mouseX, screenY - mouseY);

    if (distance <= radius && distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }

  return bestIndex;
}

export function createHoverController({ camera, renderer, controls, getMesh, detail }) {
  const tooltip = mountTooltip();
  let hoveredIndex = -1;
  let hoverTween = null;
  let pointerOrigin = null;
  const DRAG_THRESHOLD = 8;

  function pointerMovedEnough(event) {
    if (!pointerOrigin) return false;
    return (
      Math.hypot(event.clientX - pointerOrigin.x, event.clientY - pointerOrigin.y) > DRAG_THRESHOLD
    );
  }

  function animateHover(index) {
    const uniforms = getHoverUniforms(getMesh());
    if (!uniforms || detail.isOpen()) return;

    if (hoverTween) hoverTween.kill();

    if (index === -1) {
      hoverTween = gsap.to(uniforms.uHoverAmount, {
        value: 0,
        duration: 0.26,
        ease: 'power3.out',
        onComplete: () => {
          uniforms.uHoveredIndex.value = -1;
        },
      });
      return;
    }

    uniforms.uHoveredIndex.value = index;
    hoverTween = gsap.to(uniforms.uHoverAmount, {
      value: 1,
      duration: 0.38,
      ease: 'power3.out',
    });
  }

  controls.addEventListener('start', () => {
    clearHover();
  });

  function clearHover() {
    hoveredIndex = -1;
    tooltip.el.hidden = true;
    renderer.domElement.style.cursor = '';
    if (!detail.isOpen()) animateHover(-1);
  }

  function showTooltip(post, clientX, clientY) {
    tooltip.type.textContent = TYPE_LABELS[post.type] || 'Post';
    tooltip.title.textContent = post.title;

    const excerpt = post.excerpt || (post.type === 'link' ? post.url : '');
    tooltip.excerpt.textContent = excerpt;
    tooltip.excerpt.hidden = !excerpt;

    tooltip.el.hidden = false;
    tooltip.el.style.left = `${clientX}px`;
    tooltip.el.style.top = `${clientY}px`;
    renderer.domElement.style.cursor = 'pointer';
  }

  function pickIndex(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    return findHoveredIndex({
      camera,
      mesh: getMesh(),
      renderer,
      mouseX: event.clientX - rect.left,
      mouseY: event.clientY - rect.top,
      hoveredIndex,
    });
  }

  function onPointerDown(event) {
    if (event.button !== 0) return;

    const rect = renderer.domElement.getBoundingClientRect();
    const insideCanvas =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (!insideCanvas) return;
    pointerOrigin = { x: event.clientX, y: event.clientY };
  }

  function onPointerMove(event) {
    if (detail.isOpen() || event.target !== renderer.domElement) {
      return;
    }

    if (pointerOrigin && pointerMovedEnough(event)) {
      pointerOrigin = null;
      clearHover();
      return;
    }

    const index = pickIndex(event);

    if (index === -1) {
      if (hoveredIndex !== -1) clearHover();
      return;
    }

    if (index === hoveredIndex) {
      tooltip.el.style.left = `${event.clientX}px`;
      tooltip.el.style.top = `${event.clientY}px`;
      return;
    }

    hoveredIndex = index;
    animateHover(index);

    const posts = getMesh()?.userData.posts || [];
    showTooltip(posts[index], event.clientX, event.clientY);
  }

  function onPointerUp(event) {
    if (event.button !== 0 || detail.isOpen()) {
      pointerOrigin = null;
      return;
    }

    if (!pointerOrigin) return;

    const dragged = pointerMovedEnough(event);
    pointerOrigin = null;
    if (dragged) return;

    const index = pickIndex(event);
    if (index === -1) return;

    const posts = getMesh()?.userData.posts || [];
    const post = posts[index];
    if (!post) return;

    clearHover();
    detail.open(post, index);
  }

  function onPointerCancel() {
    pointerOrigin = null;
  }

  function onPointerLeave() {
    pointerOrigin = null;
    if (!detail.isOpen()) clearHover();
  }

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerCancel);
  renderer.domElement.addEventListener('pointerleave', onPointerLeave);

  return {
    reset() {
      if (hoverTween) hoverTween.kill();
      hoveredIndex = -1;
      tooltip.el.hidden = true;
      renderer.domElement.style.cursor = '';

      const uniforms = getHoverUniforms(getMesh());
      if (uniforms) {
        uniforms.uHoveredIndex.value = -1;
        uniforms.uHoverAmount.value = 0;
        uniforms.uFocusedIndex.value = -1;
        uniforms.uFocusAmount.value = 0;
      }
    },
    dispose() {
      if (hoverTween) hoverTween.kill();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      tooltip.el.remove();
      hoveredIndex = -1;
      renderer.domElement.style.cursor = '';
    },
  };
}
