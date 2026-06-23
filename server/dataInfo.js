import { existsSync, readFileSync } from 'fs';
import { dbPath, uploadsDir } from './paths.js';

function isPathMounted(mountPath) {
  if (!existsSync('/proc/mounts')) return null;

  try {
    const mounts = readFileSync('/proc/mounts', 'utf8');
    return mounts.split('\n').some((line) => {
      const parts = line.split(' ');
      return parts[1] === mountPath;
    });
  } catch {
    return null;
  }
}

export function getDataInfo(postCount = 0) {
  const dataDir = process.env.DATA_DIR || null;
  const volumeMounted = dataDir ? isPathMounted(dataDir) : null;

  return {
    dataDir,
    dbPath,
    uploadsDir,
    postCount,
    volumeMounted,
    persistent: Boolean(dataDir && volumeMounted !== false),
  };
}

export function logDataInfo(postCount = 0) {
  const info = getDataInfo(postCount);

  console.log(`[data] db=${info.dbPath} uploads=${info.uploadsDir} posts=${info.postCount}`);

  if (process.env.NODE_ENV === 'production' && info.dataDir && info.volumeMounted === false) {
    console.warn(
      `[data] WARNING: ${info.dataDir} is not a volume mount — posts may be lost on redeploy.`
    );
  }

  return info;
}
