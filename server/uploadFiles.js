import { existsSync, unlinkSync } from 'fs';
import { basename, join } from 'path';
import { uploadsDir } from './paths.js';

export function deleteUploadFile(imagePath) {
  if (!imagePath?.startsWith('/uploads/')) return;

  const filePath = join(uploadsDir, basename(imagePath));
  if (!existsSync(filePath)) return;

  try {
    unlinkSync(filePath);
  } catch {
    // Best-effort cleanup; ignore missing or locked files.
  }
}
