export const CELL_SIZE = 512;

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

export async function buildAtlas(imagePaths) {
  const count = imagePaths.length;
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);

  const canvas = document.createElement('canvas');
  canvas.width = cols * CELL_SIZE;
  canvas.height = rows * CELL_SIZE;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f6f6f4';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const pathToIndex = new Map();

  for (let index = 0; index < imagePaths.length; index += 1) {
    const path = imagePaths[index];
    pathToIndex.set(path, index);

    const img = await loadImage(path);
    const col = index % cols;
    const row = Math.floor(index / cols);
    drawImageCover(ctx, img, col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  }

  return { canvas, cols, rows, count, pathToIndex };
}

export function getTextureIndex(post, pathToIndex) {
  if (!post.imagePath) return 0;
  return pathToIndex.get(post.imagePath) ?? 0;
}
