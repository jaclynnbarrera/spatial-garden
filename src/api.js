export async function fetchPosts() {
  const response = await fetch('/api/posts');
  if (!response.ok) {
    throw new Error(`Failed to load posts (${response.status})`);
  }
  return response.json();
}

export async function previewLink(url) {
  const response = await fetch('/api/posts/preview-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Could not preview link');
  }
  return data;
}

export async function createPost(payload) {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Could not save post');
  }
  return data;
}

export async function createImagePost({ title, excerpt, file }) {
  const formData = new FormData();
  formData.append('title', title);
  if (excerpt) formData.append('excerpt', excerpt);
  formData.append('image', file);

  const response = await fetch('/api/posts/image', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Could not save image');
  }
  return data;
}
