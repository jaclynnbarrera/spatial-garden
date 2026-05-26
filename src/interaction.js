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
  const { uBaseSize, uScale, uMinSize, uMaxSize, uHoverScale } = material.uniforms;

  let pointSize = uBaseSize.value * (uScale.value / dist);
  pointSize = Math.max(uMinSize.value, Math.min(uMaxSize.value, pointSize));
  pointSize *= 1 + (uHoverScale.value - 1) * hoverAmount;

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

export function createHoverController({ camera, renderer, controls, getMesh }) {
  const tooltip = mountTooltip();
  let hoveredIndex = -1;
  let isDragging = false;
  let hoverTween = null;

  function animateHover(index) {
    const uniforms = getHoverUniforms(getMesh());
    if (!uniforms) return;

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
    isDragging = true;
    clearHover();
  });

  controls.addEventListener('end', () => {
    isDragging = false;
  });

  function clearHover() {
    if (hoveredIndex === -1) {
      animateHover(-1);
      return;
    }

    hoveredIndex = -1;
    tooltip.el.hidden = true;
    renderer.domElement.style.cursor = '';
    animateHover(-1);
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

  function onPointerMove(event) {
    if (isDragging || event.target !== renderer.domElement) {
      return;
    }

    const rect = renderer.domElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const index = findHoveredIndex({
      camera,
      mesh: getMesh(),
      renderer,
      mouseX,
      mouseY,
      hoveredIndex,
    });

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

  function onPointerLeave() {
    clearHover();
  }

  renderer.domElement.addEventListener('pointermove', onPointerMove);
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
      }
    },
    dispose() {
      if (hoverTween) hoverTween.kill();
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      tooltip.el.remove();
      hoveredIndex = -1;
      renderer.domElement.style.cursor = '';
    },
  };
}
