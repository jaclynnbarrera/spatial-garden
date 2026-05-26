export function getTextureKey(post) {
  if (post.imagePath) return post.imagePath;
  return `__text__:${post.id}`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function drawImageCover(ctx, img, x, y, width, height) {
  const scale = Math.max(width / img.width, height / img.height);
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  const offsetX = x + (width - drawWidth) / 2;
  const offsetY = y + (height - drawHeight) / 2;

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function drawTextCard(ctx, x, y, size, post) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, size, size);

  ctx.fillStyle = '#111111';
  ctx.font = '600 42px Inter, system-ui, sans-serif';
  const titleLines = wrapText(ctx, post.title, size - 64).slice(0, 3);

  let cursorY = y + 48;
  for (const line of titleLines) {
    ctx.fillText(line, x + 32, cursorY);
    cursorY += 48;
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.font = '400 28px Inter, system-ui, sans-serif';
  const excerpt = post.excerpt || (post.type === 'link' ? post.url : '');
  const excerptLines = wrapText(ctx, excerpt, size - 64).slice(0, 5);

  cursorY += 12;
  for (const line of excerptLines) {
    ctx.fillText(line, x + 32, cursorY);
    cursorY += 36;
  }

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
}

export const CELL_SIZE = 512;

export async function buildAtlas(posts) {
  const count = posts.length;
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);

  const canvas = document.createElement('canvas');
  canvas.width = cols * CELL_SIZE;
  canvas.height = rows * CELL_SIZE;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f6f6f4';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const pathToIndex = new Map();

  for (let index = 0; index < posts.length; index += 1) {
    const post = posts[index];
    const key = getTextureKey(post);
    pathToIndex.set(key, index);

    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = col * CELL_SIZE;
    const y = row * CELL_SIZE;

    if (post.imagePath) {
      const img = await loadImage(post.imagePath);
      drawImageCover(ctx, img, x, y, CELL_SIZE, CELL_SIZE);
    } else {
      drawTextCard(ctx, x, y, CELL_SIZE, post);
    }
  }

  return { canvas, cols, rows, count, pathToIndex };
}

export function getTextureIndex(post, pathToIndex) {
  return pathToIndex.get(getTextureKey(post)) ?? 0;
}
