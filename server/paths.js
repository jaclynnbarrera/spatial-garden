import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.DATA_DIR) {
  console.error('');
  console.error('ERROR: DATA_DIR must be set in production.');
  console.error('Without it, posts.db lives inside the container and is wiped on every deploy.');
  console.error('Railway: attach a volume at /data and set DATA_DIR=/data on this service.');
  console.error('');
  process.exit(1);
}

const dataRoot = process.env.DATA_DIR || join(projectRoot, 'data');
const uploadsRoot = process.env.DATA_DIR
  ? join(process.env.DATA_DIR, 'uploads')
  : join(projectRoot, 'public/uploads');

mkdirSync(dataRoot, { recursive: true });
mkdirSync(uploadsRoot, { recursive: true });

export const dbPath = join(dataRoot, 'posts.db');
export const uploadsDir = uploadsRoot;
export const distDir = join(projectRoot, 'dist');
