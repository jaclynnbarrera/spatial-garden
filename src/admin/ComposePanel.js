import gsap from 'gsap';
import { createImagePost, createPost, previewLink } from '../api.js';

const TYPE_LABELS = {
  link: 'Link',
  image: 'Image',
  text: 'Text',
};

export function mountComposePanel({ onPostCreated }) {
  const root = document.createElement('div');
  root.className = 'compose';
  root.innerHTML = `
    <button type="button" class="compose__toggle" aria-expanded="false" aria-controls="compose-panel">
      +
    </button>
    <section id="compose-panel" class="compose__panel" aria-hidden="true">
      <div class="compose__header">
        <div>
          <p class="compose__eyebrow">New save</p>
          <h2 class="compose__title">Save something</h2>
        </div>
        <button type="button" class="compose__close" aria-label="Close compose panel">×</button>
      </div>

      <div class="compose__types" role="tablist">
        <button type="button" class="compose__type is-active" data-type="link">Link</button>
        <button type="button" class="compose__type" data-type="image">Image</button>
        <button type="button" class="compose__type" data-type="text">Text</button>
      </div>

      <form class="compose__form">
        <div class="compose__field compose__field--link">
          <label for="compose-url">URL</label>
          <div class="compose__row">
            <input id="compose-url" name="url" type="url" placeholder="https://..." />
            <button type="button" class="compose__secondary" data-action="preview">Preview</button>
          </div>
        </div>

        <div class="compose__field compose__field--image">
          <label for="compose-image">Image</label>
          <input id="compose-image" name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
          <div class="compose__preview" data-image-preview hidden></div>
        </div>

        <div class="compose__field">
          <label for="compose-title">Title</label>
          <input id="compose-title" name="title" type="text" placeholder="Title or name" required />
        </div>

        <div class="compose__field">
          <label for="compose-excerpt">Excerpt</label>
          <textarea id="compose-excerpt" name="excerpt" rows="3" placeholder="A note — optional"></textarea>
        </div>

        <div class="compose__preview compose__preview--link" data-link-preview hidden>
          <img alt="" data-link-image hidden />
          <p data-link-host></p>
        </div>

        <p class="compose__error" hidden></p>

        <button type="submit" class="compose__submit">Save</button>
      </form>
    </section>
  `;

  document.body.appendChild(root);

  const toggle = root.querySelector('.compose__toggle');
  const panel = root.querySelector('.compose__panel');
  const close = root.querySelector('.compose__close');
  const form = root.querySelector('.compose__form');
  const typeButtons = [...root.querySelectorAll('.compose__type')];
  const errorEl = root.querySelector('.compose__error');
  const previewButton = root.querySelector('[data-action="preview"]');
  const linkPreview = root.querySelector('[data-link-preview]');
  const linkImage = root.querySelector('[data-link-image]');
  const linkHost = root.querySelector('[data-link-host]');
  const imagePreview = root.querySelector('[data-image-preview]');
  const imageInput = root.querySelector('#compose-image');

  let activeType = 'link';
  let previewData = null;
  let previewObjectUrl = null;
  let isOpen = false;
  let panelTween = null;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  gsap.set(panel, { autoAlpha: 0, y: 14, scale: 0.97, transformOrigin: 'right bottom' });

  function setOpen(open) {
    if (open === isOpen) return;

    if (panelTween) panelTween.kill();
    isOpen = open;
    toggle.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));

    if (reducedMotion) {
      gsap.set(panel, { autoAlpha: open ? 1 : 0, y: 0, scale: 1 });
      panel.hidden = !open;
      gsap.set(toggle, { rotate: open ? 45 : 0 });
      return;
    }

    if (open) {
      panel.hidden = false;
      panelTween = gsap.to(panel, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.48,
        ease: 'expo.out',
      });
      gsap.to(toggle, { rotate: 45, duration: 0.38, ease: 'power2.out' });
      return;
    }

    panelTween = gsap.to(panel, {
      autoAlpha: 0,
      y: 10,
      scale: 0.98,
      duration: 0.34,
      ease: 'power2.in',
      onComplete: () => {
        panel.hidden = true;
      },
    });
    gsap.to(toggle, { rotate: 0, duration: 0.32, ease: 'power2.inOut' });
  }

  function setError(message = '') {
    errorEl.hidden = !message;
    errorEl.textContent = message;
  }

  function setType(type) {
    activeType = type;
    typeButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.type === type);
    });

    root.querySelectorAll('.compose__field--link, .compose__field--image').forEach((field) => {
      field.hidden = true;
    });

    if (type === 'link') {
      root.querySelector('.compose__field--link').hidden = false;
      linkPreview.hidden = !previewData;
    }

    if (type === 'image') {
      root.querySelector('.compose__field--image').hidden = false;
    }
  }

  function resetPreview() {
    previewData = null;
    linkPreview.hidden = true;
    linkImage.hidden = true;
    linkImage.removeAttribute('src');
    linkHost.textContent = '';
  }

  function resetImagePreview() {
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = null;
    }
    imagePreview.hidden = true;
    imagePreview.innerHTML = '';
  }

  function resetForm() {
    form.reset();
    resetPreview();
    resetImagePreview();
    setError('');
    setType(activeType);
  }

  toggle.addEventListener('click', () => setOpen(!isOpen));
  close.addEventListener('click', () => setOpen(false));

  typeButtons.forEach((button) => {
    button.addEventListener('click', () => setType(button.dataset.type));
  });

  previewButton.addEventListener('click', async () => {
    const url = form.url.value.trim();
    if (!url) {
      setError('Paste a URL first.');
      return;
    }

    setError('');
    previewButton.disabled = true;
    previewButton.textContent = 'Loading…';

    try {
      previewData = await previewLink(url);
      form.title.value = previewData.title || '';
      form.excerpt.value = previewData.excerpt || '';

      linkPreview.hidden = false;
      linkHost.textContent = new URL(previewData.url).hostname;

      if (previewData.image) {
        linkImage.hidden = false;
        linkImage.src = previewData.image;
      } else {
        linkImage.hidden = true;
        linkImage.removeAttribute('src');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      previewButton.disabled = false;
      previewButton.textContent = 'Preview';
    }
  });

  imageInput.addEventListener('change', () => {
    resetImagePreview();
    const [file] = imageInput.files;

    if (!file) return;

    previewObjectUrl = URL.createObjectURL(file);
    imagePreview.hidden = false;
    imagePreview.innerHTML = `<img src="${previewObjectUrl}" alt="Selected image preview" />`;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setError('');

    const title = form.title.value.trim();
    const excerpt = form.excerpt.value.trim();

    if (!title) {
      setError('Title is required.');
      return;
    }

    const submit = form.querySelector('.compose__submit');
    submit.disabled = true;
    submit.textContent = 'Saving…';

    try {
      if (activeType === 'link') {
        const url = form.url.value.trim();
        if (!url) {
          throw new Error('URL is required for links.');
        }

        await createPost({
          type: 'link',
          title,
          excerpt,
          url,
          imagePath: previewData?.image || null,
        });
      } else if (activeType === 'image') {
        const [file] = imageInput.files;
        if (!file) {
          throw new Error('Choose an image to upload.');
        }

        await createImagePost({ title, excerpt, file });
      } else {
        await createPost({
          type: 'text',
          title,
          excerpt,
        });
      }

      resetForm();
      setOpen(false);
      await onPostCreated();
    } catch (error) {
      setError(error.message);
    } finally {
      submit.disabled = false;
      submit.textContent = 'Save';
    }
  });

  setType('link');
  panel.hidden = true;

  return {
    destroy() {
      if (panelTween) panelTween.kill();
      resetImagePreview();
      root.remove();
    },
  };
}

export { TYPE_LABELS };
