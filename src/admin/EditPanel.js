import gsap from 'gsap';
import { previewLink, updateImagePost, updatePost } from '../api.js';
import { TYPE_LABELS } from './ComposePanel.js';

export function mountEditPanel({ onPostUpdated }) {
  const root = document.createElement('div');
  root.className = 'edit';
  root.hidden = true;
  root.innerHTML = `
    <section class="edit__panel" aria-hidden="true">
      <div class="edit__header">
        <div>
          <p class="edit__eyebrow" data-type-label></p>
          <h2 class="edit__title">Edit save</h2>
        </div>
        <button type="button" class="edit__close" aria-label="Close edit panel">×</button>
      </div>

      <form class="edit__form">
        <div class="edit__field edit__field--link">
          <label for="edit-url">URL</label>
          <div class="edit__row">
            <input id="edit-url" name="url" type="url" placeholder="https://..." />
            <button type="button" class="edit__secondary" data-action="preview">Preview</button>
          </div>
        </div>

        <div class="edit__field edit__field--image">
          <label for="edit-image">Replace image</label>
          <input id="edit-image" name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
          <div class="edit__preview" data-image-preview hidden></div>
        </div>

        <div class="edit__field">
          <label for="edit-title">Title</label>
          <input id="edit-title" name="title" type="text" placeholder="Title or name" required />
        </div>

        <div class="edit__field">
          <label for="edit-excerpt">Excerpt</label>
          <textarea id="edit-excerpt" name="excerpt" rows="3" placeholder="A note — optional"></textarea>
        </div>

        <div class="edit__preview edit__preview--link" data-link-preview hidden>
          <img alt="" data-link-image hidden />
          <p data-link-host></p>
        </div>

        <p class="edit__error" hidden></p>

        <button type="submit" class="edit__submit">Save changes</button>
      </form>
    </section>
  `;

  document.body.appendChild(root);

  const panel = root.querySelector('.edit__panel');
  const closeBtn = root.querySelector('.edit__close');
  const form = root.querySelector('.edit__form');
  const typeLabel = root.querySelector('[data-type-label]');
  const errorEl = root.querySelector('.edit__error');
  const previewButton = root.querySelector('[data-action="preview"]');
  const linkPreview = root.querySelector('[data-link-preview]');
  const linkImage = root.querySelector('[data-link-image]');
  const linkHost = root.querySelector('[data-link-host]');
  const imagePreview = root.querySelector('[data-image-preview]');
  const imageInput = root.querySelector('#edit-image');

  let activePost = null;
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
    panel.setAttribute('aria-hidden', String(!open));
    root.hidden = !open;

    if (reducedMotion) {
      gsap.set(panel, { autoAlpha: open ? 1 : 0, y: 0, scale: 1 });
      return;
    }

    if (open) {
      panelTween = gsap.to(panel, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.48,
        ease: 'expo.out',
      });
      return;
    }

    panelTween = gsap.to(panel, {
      autoAlpha: 0,
      y: 10,
      scale: 0.98,
      duration: 0.34,
      ease: 'power2.in',
    });
  }

  function setError(message = '') {
    errorEl.hidden = !message;
    errorEl.textContent = message;
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

  function setFieldsForPost(post) {
    root.querySelectorAll('.edit__field--link, .edit__field--image').forEach((field) => {
      field.hidden = true;
    });

    typeLabel.textContent = TYPE_LABELS[post.type] || 'Post';
    form.title.value = post.title;
    form.excerpt.value = post.excerpt || '';
    resetPreview();
    resetImagePreview();
    imageInput.value = '';
    setError('');

    if (post.type === 'link') {
      root.querySelector('.edit__field--link').hidden = false;
      form.url.value = post.url || '';

      if (post.imagePath) {
        linkPreview.hidden = false;
        linkImage.hidden = false;
        linkImage.src = post.imagePath;
        linkHost.textContent = post.url ? new URL(post.url).hostname : '';
      }
    }

    if (post.type === 'image') {
      root.querySelector('.edit__field--image').hidden = false;

      if (post.imagePath) {
        imagePreview.hidden = false;
        imagePreview.innerHTML = `<img src="${post.imagePath}" alt="Current image" />`;
      }
    }
  }

  function open(post) {
    activePost = post;
    setFieldsForPost(post);
    setOpen(true);
  }

  function close() {
    activePost = null;
    setOpen(false);
  }

  closeBtn.addEventListener('click', close);

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
      form.title.value = previewData.title || form.title.value;
      form.excerpt.value = previewData.excerpt || form.excerpt.value;

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
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = null;
    }

    const [file] = imageInput.files;
    if (!file) {
      if (activePost?.imagePath) {
        imagePreview.hidden = false;
        imagePreview.innerHTML = `<img src="${activePost.imagePath}" alt="Current image" />`;
      } else {
        imagePreview.hidden = true;
        imagePreview.innerHTML = '';
      }
      return;
    }

    previewObjectUrl = URL.createObjectURL(file);
    imagePreview.hidden = false;
    imagePreview.innerHTML = `<img src="${previewObjectUrl}" alt="Selected image preview" />`;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!activePost) return;

    setError('');

    const title = form.title.value.trim();
    const excerpt = form.excerpt.value.trim();

    if (!title) {
      setError('Title is required.');
      return;
    }

    const submit = form.querySelector('.edit__submit');
    submit.disabled = true;
    submit.textContent = 'Saving…';

    try {
      if (activePost.type === 'link') {
        const url = form.url.value.trim();
        if (!url) {
          throw new Error('URL is required for links.');
        }

        await updatePost(activePost.id, {
          title,
          excerpt,
          url,
          imagePath:
            previewData === null ? (activePost.imagePath ?? null) : previewData.image || null,
        });
      } else if (activePost.type === 'image') {
        const [file] = imageInput.files;
        await updateImagePost(activePost.id, { title, excerpt, file });
      } else {
        await updatePost(activePost.id, { title, excerpt });
      }

      close();
      await onPostUpdated();
    } catch (error) {
      setError(error.message);
    } finally {
      submit.disabled = false;
      submit.textContent = 'Save changes';
    }
  });

  return {
    open,
    close,
    destroy() {
      if (panelTween) panelTween.kill();
      resetImagePreview();
      root.remove();
    },
  };
}
