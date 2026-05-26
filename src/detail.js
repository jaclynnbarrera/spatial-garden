import gsap from 'gsap';

const TYPE_LABELS = {
  link: 'Link',
  image: 'Image',
  text: 'Text',
};

export function createDetailView({ getControls, getUniforms }) {
  const root = document.createElement('div');
  root.className = 'detail-root';
  root.hidden = true;
  root.innerHTML = `
    <div class="detail-backdrop" data-backdrop></div>
    <div class="detail-panel" data-panel>
      <button type="button" class="detail__close" aria-label="Close">×</button>
      <div class="detail__media" data-media hidden></div>
      <div class="detail__body">
        <p class="detail__type" data-type></p>
        <h2 class="detail__title" data-title></h2>
        <p class="detail__excerpt" data-excerpt></p>
        <a class="detail__link" data-link target="_blank" rel="noopener noreferrer" hidden>Open link →</a>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const backdrop = root.querySelector('[data-backdrop]');
  const panel = root.querySelector('[data-panel]');
  const media = root.querySelector('[data-media]');
  const typeEl = root.querySelector('[data-type]');
  const titleEl = root.querySelector('[data-title]');
  const excerptEl = root.querySelector('[data-excerpt]');
  const linkEl = root.querySelector('[data-link]');
  const closeBtn = root.querySelector('.detail__close');

  let isOpen = false;
  let timeline = null;
  let focusedIndex = -1;

  function renderMedia(post) {
    media.innerHTML = '';

    if (post.imagePath) {
      const img = document.createElement('img');
      img.src = post.imagePath;
      img.alt = post.title;
      media.appendChild(img);
      media.hidden = false;
      return;
    }

    media.hidden = true;
  }

  function populate(post) {
    typeEl.textContent = TYPE_LABELS[post.type] || 'Post';
    titleEl.textContent = post.title;

    const excerpt = post.excerpt || (post.type === 'link' ? post.url : '');
    excerptEl.textContent = excerpt;
    excerptEl.hidden = !excerpt;

    renderMedia(post);

    if (post.type === 'link' && post.url) {
      linkEl.href = post.url;
      linkEl.hidden = false;
    } else {
      linkEl.hidden = true;
      linkEl.removeAttribute('href');
    }
  }

  function animateFocus(index, opening) {
    const uniforms = getUniforms();
    if (!uniforms) return null;

    if (opening) {
      uniforms.uFocusedIndex.value = index;
      uniforms.uHoverAmount.value = 0;
      uniforms.uHoveredIndex.value = -1;

      return gsap.to(uniforms.uFocusAmount, {
        value: 1,
        duration: 0.48,
        ease: 'power3.inOut',
      });
    }

    return gsap.to(uniforms.uFocusAmount, {
      value: 0,
      duration: 0.34,
      ease: 'power3.inOut',
      onComplete: () => {
        uniforms.uFocusedIndex.value = -1;
      },
    });
  }

  function open(post, index) {
    if (isOpen) return;
    isOpen = true;
    focusedIndex = index;
    populate(post);

    root.hidden = false;
    getControls().enabled = false;

    gsap.set(backdrop, { opacity: 0 });
    gsap.set(panel, { opacity: 0, scale: 0.92, y: 20 });

    if (timeline) timeline.kill();
    timeline = gsap.timeline();

    timeline.add(animateFocus(index, true), 0);
    timeline.to(backdrop, { opacity: 1, duration: 0.35, ease: 'power2.out' }, 0.04);
    timeline.to(panel, { opacity: 1, scale: 1, y: 0, duration: 0.48, ease: 'power3.out' }, 0.1);
  }

  function resetPanelStyles() {
    gsap.set([backdrop, panel], { clearProps: 'all' });
  }

  function forceClose() {
    if (timeline) timeline.kill();
    isOpen = false;
    focusedIndex = -1;
    root.hidden = true;
    resetPanelStyles();
    getControls().enabled = true;

    const uniforms = getUniforms();
    if (uniforms) {
      uniforms.uFocusedIndex.value = -1;
      uniforms.uFocusAmount.value = 0;
    }
  }

  function close() {
    if (!isOpen) {
      if (!root.hidden) forceClose();
      return;
    }
    isOpen = false;

    if (timeline) timeline.kill();
    timeline = gsap.timeline({
      onComplete: () => {
        root.hidden = true;
        resetPanelStyles();
        getControls().enabled = true;
        focusedIndex = -1;
      },
    });

    timeline.to(panel, { opacity: 0, scale: 0.96, y: 12, duration: 0.28, ease: 'power2.in' }, 0);
    timeline.to(backdrop, { opacity: 0, duration: 0.28, ease: 'power2.in' }, 0.04);
    timeline.add(animateFocus(focusedIndex, false), 0);
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') close();
  }

  backdrop.addEventListener('click', close);
  closeBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    close();
  });
  document.addEventListener('keydown', onKeyDown);

  return {
    open,
    close,
    forceClose,
    isOpen: () => isOpen,
    dispose() {
      if (timeline) timeline.kill();
      document.removeEventListener('keydown', onKeyDown);
      root.remove();
    },
  };
}
