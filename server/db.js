import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../data/posts.db');

mkdirSync(dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('link', 'image', 'text')),
    title TEXT NOT NULL,
    excerpt TEXT,
    url TEXT,
    image_path TEXT,
    position_x REAL,
    position_y REAL,
    position_z REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const PLACEHOLDER_POSTS = [
  {
    id: 'placeholder-1',
    type: 'link',
    title: 'The Art of Slow Reading',
    excerpt: 'Why taking your time with an article changes how you remember it.',
    url: 'https://example.com/slow-reading',
    position: [-8, 4, -6],
  },
  {
    id: 'placeholder-2',
    type: 'image',
    title: 'Morning light study',
    excerpt: 'A screenshot from a walk — colors worth keeping.',
    position: [6, -3, 5],
  },
  {
    id: 'placeholder-3',
    type: 'text',
    title: 'Garden note',
    excerpt: 'Every saved thing becomes a star in the map of what you care about.',
    position: [2, 7, -10],
  },
  {
    id: 'placeholder-4',
    type: 'link',
    title: 'Building in public',
    excerpt: 'A short essay on sharing work before it feels finished.',
    url: 'https://example.com/build-in-public',
    position: [-5, -6, 8],
  },
  {
    id: 'placeholder-5',
    type: 'image',
    title: 'Color palette grab',
    excerpt: 'Muted blues and warm amber — saving this combo for later.',
    position: [10, 2, -4],
  },
];

function seedPlaceholders() {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO posts (id, type, title, excerpt, url, position_x, position_y, position_z)
    VALUES (@id, @type, @title, @excerpt, @url, @position_x, @position_y, @position_z)
  `);

  const insertMany = db.transaction((posts) => {
    for (const post of posts) {
      insert.run({
        id: post.id,
        type: post.type,
        title: post.title,
        excerpt: post.excerpt ?? null,
        url: post.url ?? null,
        position_x: post.position[0],
        position_y: post.position[1],
        position_z: post.position[2],
      });
    }
  });

  insertMany(PLACEHOLDER_POSTS);
}

seedPlaceholders();

export function getAllPosts() {
  const rows = db
    .prepare(
      `SELECT id, type, title, excerpt, url, image_path AS imagePath,
              position_x, position_y, position_z, created_at AS createdAt
       FROM posts
       ORDER BY created_at ASC`
    )
    .all();

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    excerpt: row.excerpt,
    url: row.url,
    imagePath: row.imagePath,
    createdAt: row.createdAt,
    position: [row.position_x, row.position_y, row.position_z],
  }));
}

export default db;
