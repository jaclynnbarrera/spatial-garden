import { mkdirSync, writeFileSync } from 'fs';
import { dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(__dirname, '../public/uploads');

mkdirSync(uploadsDir, { recursive: true });

const USER_AGENT =
  'Mozilla/5.0 (compatible; SpatialGarden/1.0; +https://github.com/jaclynnbarrera/spatial-garden)';

export async function downloadImageToUploads(imageUrl, sourceUrl) {
  const response = await fetch(imageUrl, {
    headers: {
      'User-Agent': USER_AGENT,
      Referer: sourceUrl,
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Could not download preview image (${response.status})`);
  }

  const contentType = response.headers.get('content-type') || '';
  let extension = extname(new URL(imageUrl).pathname);

  if (!extension || extension.length > 6) {
    if (contentType.includes('png')) extension = '.png';
    else if (contentType.includes('webp')) extension = '.webp';
    else if (contentType.includes('gif')) extension = '.gif';
    else extension = '.jpg';
  }

  const filename = `${uuid()}${extension}`;
  const filePath = join(uploadsDir, filename);
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(filePath, buffer);

  return `/uploads/${filename}`;
}
