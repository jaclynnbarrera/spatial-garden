import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const dataRoot = process.env.DATA_DIR || join(projectRoot, 'data');
const uploadsRoot = process.env.DATA_DIR
  ? join(process.env.DATA_DIR, 'uploads')
  : join(projectRoot, 'public/uploads');

mkdirSync(dataRoot, { recursive: true });
mkdirSync(uploadsRoot, { recursive: true });

export const dbPath = join(dataRoot, 'posts.db');
export const uploadsDir = uploadsRoot;
export const distDir = join(projectRoot, 'dist');
