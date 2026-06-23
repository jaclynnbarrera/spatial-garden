import gsap from 'gsap';
import { TYPE_LABELS, formatAddedLabel } from './postMeta.js';

const MOTION = {
  focusOpen: { duration: 0.82, ease: 'sine.inOut' },
  focusClose: { duration: 0.68, ease: 'sine.inOut' },
  backdropOpen: { duration: 0.72, ease: 'power1.out' },
  backdropClose: { duration: 0.62, ease: 'power2.inOut' },
  panelOpen: { duration: 0.92, ease: 'expo.out' },
  panelClose: { duration: 0.6, ease: 'power2.inOut' },
  contentOpen: { duration: 0.56, stagger: 0.07, ease: 'power2.out' },
  contentClose: { duration: 0.4, stagger: 0.045, ease: 'power2.inOut' },
};

export function createDetailView({ getControls, getUniforms, isAdmin = false, onEdit, onDelete }) {
  const root = document.createElement('div');
  root.className = 'detail-root';
  root.hidden = true;
  root.innerHTML = `
    <div class="detail-backdrop" data-backdrop></div>
    <div class="detail-panel" data-panel>
      <button type="button" class="detail__close" aria-label="Close">×</button>
      <div class="detail__scroll">
        <div class="detail__media" data-media hidden></div>
        <div class="detail__body">
        <div class="detail__meta">
          <p class="detail__type" data-type></p>
          <p class="detail__date" data-date hidden></p>
        </div>
        <h2 class="detail__title" data-title></h2>
        <p class="detail__excerpt" data-excerpt></p>
        <div class="detail__footer" data-footer hidden>
          <a class="detail__link" data-link target="_blank" rel="noopener noreferrer" hidden>Open link →</a>
          <div class="detail__actions" data-actions hidden>
            <button type="button" class="detail__edit" data-edit>Edit</button>
            <button type="button" class="detail__delete" data-delete>Delete</button>
          </div>
        </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const backdrop = root.querySelector('[data-backdrop]');
  const panel = root.querySelector('[data-panel]');
  const media = root.querySelector('[data-media]');
  const typeEl = root.querySelector('[data-type]');
  const dateEl = root.querySelector('[data-date]');
  const titleEl = root.querySelector('[data-title]');
  const excerptEl = root.querySelector('[data-excerpt]');
  const footerEl = root.querySelector('[data-footer]');
  const linkEl = root.querySelector('[data-link]');
  const actionsEl = root.querySelector('[data-actions]');
  const editBtn = root.querySelector('[data-edit]');
  const deleteBtn = root.querySelector('[data-delete]');
  const closeBtn = root.querySelector('.detail__close');

  let isOpen = false;
  let timeline = null;
  let focusedIndex = -1;
  let currentPost = null;

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

    const addedLabel = formatAddedLabel(post.createdAt);
    dateEl.textContent = addedLabel;
    dateEl.hidden = !addedLabel;

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

    actionsEl.hidden = !isAdmin;
    footerEl.hidden = linkEl.hidden && actionsEl.hidden;
  }

  function getAnimatedContent() {
    const items = [];

    if (!media.hidden) {
      const img = media.querySelector('img');
      if (img) items.push(img);
    }

    items.push(typeEl);
    if (!dateEl.hidden) items.push(dateEl);
    items.push(titleEl);
    if (!excerptEl.hidden) items.push(excerptEl);
    if (!footerEl.hidden) items.push(footerEl);

    return items;
  }

  function setContentInitial() {
    gsap.set(getAnimatedContent(), { opacity: 0, y: 16 });
  }

  function animateFocus(index, opening) {
    const uniforms = getUniforms();
    if (!uniforms) return null;

    const motion = opening ? MOTION.focusOpen : MOTION.focusClose;

    if (opening) {
      uniforms.uFocusedIndex.value = index;
      uniforms.uHoverAmount.value = 0;
      uniforms.uHoveredIndex.value = -1;

      return gsap.to(uniforms.uFocusAmount, {
        value: 1,
        duration: motion.duration,
        ease: motion.ease,
      });
    }

    return gsap.to(uniforms.uFocusAmount, {
      value: 0,
      duration: motion.duration,
      ease: motion.ease,
      onComplete: () => {
        uniforms.uFocusedIndex.value = -1;
      },
    });
  }

  function open(post, index) {
    if (isOpen) return;
    isOpen = true;
    focusedIndex = index;
    currentPost = post;
    populate(post);
    setContentInitial();

    root.hidden = false;
    getControls().enabled = false;

    gsap.set(backdrop, { opacity: 0, backdropFilter: 'blur(0px)' });
    gsap.set(panel, { opacity: 0, scale: 0.94, y: 44 });
    gsap.set(closeBtn, { opacity: 0, scale: 0.92 });

    if (timeline) timeline.kill();
    timeline = gsap.timeline();

    timeline.add(animateFocus(index, true), 0);

    timeline.to(
      backdrop,
      {
        opacity: 1,
        backdropFilter: 'blur(12px)',
        duration: MOTION.backdropOpen.duration,
        ease: MOTION.backdropOpen.ease,
      },
      0.06
    );

    timeline.to(
      panel,
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: MOTION.panelOpen.duration,
        ease: MOTION.panelOpen.ease,
      },
      0.14
    );

    timeline.to(
      closeBtn,
      {
        opacity: 1,
        scale: 1,
        duration: 0.48,
        ease: 'power2.out',
      },
      0.34
    );

    timeline.to(
      getAnimatedContent(),
      {
        opacity: 1,
        y: 0,
        duration: MOTION.contentOpen.duration,
        stagger: MOTION.contentOpen.stagger,
        ease: MOTION.contentOpen.ease,
      },
      0.3
    );
  }

  function resetPanelStyles() {
    gsap.set([backdrop, panel, closeBtn, ...getAnimatedContent()], { clearProps: 'all' });
  }

  function forceClose() {
    if (timeline) timeline.kill();
    isOpen = false;
    focusedIndex = -1;
    currentPost = null;
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

    const content = getAnimatedContent();
    const closingIndex = focusedIndex;

    if (timeline) timeline.kill();
    timeline = gsap.timeline({
      onComplete: () => {
        root.hidden = true;
        resetPanelStyles();
        getControls().enabled = true;
        focusedIndex = -1;
        currentPost = null;
      },
    });

    timeline.to(
      content,
      {
        opacity: 0,
        y: 12,
        duration: MOTION.contentClose.duration,
        stagger: MOTION.contentClose.stagger,
        ease: MOTION.contentClose.ease,
      },
      0
    );

    timeline.to(
      closeBtn,
      {
        opacity: 0,
        scale: 0.94,
        duration: 0.32,
        ease: 'power2.inOut',
      },
      0.02
    );

    timeline.to(
      panel,
      {
        opacity: 0,
        scale: 0.965,
        y: 30,
        duration: MOTION.panelClose.duration,
        ease: MOTION.panelClose.ease,
      },
      0.1
    );

    timeline.to(
      backdrop,
      {
        opacity: 0,
        backdropFilter: 'blur(0px)',
        duration: MOTION.backdropClose.duration,
        ease: MOTION.backdropClose.ease,
      },
      0.14
    );

    timeline.add(animateFocus(closingIndex, false), 0.08);
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') close();
  }

  backdrop.addEventListener('click', close);
  closeBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    close();
  });

  if (isAdmin) {
    editBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      if (!currentPost || !onEdit) return;
      const post = currentPost;
      close();
      onEdit(post);
    });

    deleteBtn.addEventListener('click', async (event) => {
      event.stopPropagation();
      if (!currentPost || !onDelete) return;
      if (!window.confirm('Delete this post? This cannot be undone.')) return;

      const post = currentPost;
      deleteBtn.disabled = true;

      try {
        await onDelete(post);
        close();
      } catch (error) {
        window.alert(error.message || 'Could not delete post');
      } finally {
        deleteBtn.disabled = false;
      }
    });
  }

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
