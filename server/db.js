import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';
import { dbPath } from './paths.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
    type: 'image',
    title: 'Aquatic',
    excerpt: 'Saved to the garden.',
    imagePath: '/media/aquatic.png',
    position: [-8, 4, -6],
  },
  {
    id: 'placeholder-2',
    type: 'image',
    title: 'Softi',
    excerpt: 'Saved to the garden.',
    imagePath: '/media/softi.png',
    position: [6, -3, 5],
  },
  {
    id: 'placeholder-3',
    type: 'image',
    title: 'Tang',
    excerpt: 'Saved to the garden.',
    imagePath: '/media/tang.png',
    position: [2, 7, -10],
  },
  {
    id: 'placeholder-4',
    type: 'image',
    title: 'Bondy',
    excerpt: 'Saved to the garden.',
    imagePath: '/media/bondy.png',
    position: [-5, -6, 8],
  },
  {
    id: 'placeholder-5',
    type: 'image',
    title: 'Wata',
    excerpt: 'Saved to the garden.',
    imagePath: '/media/wata.png',
    position: [10, 2, -4],
  },
  {
    id: 'placeholder-6',
    type: 'image',
    title: 'Chair',
    excerpt: 'Saved to the garden.',
    imagePath: '/media/chair.png',
    position: [-12, -2, 2],
  },
  {
    id: 'placeholder-7',
    type: 'image',
    title: 'Trick',
    excerpt: 'Saved to the garden.',
    imagePath: '/media/trick.png',
    position: [4, 5, 6],
  },
  {
    id: 'placeholder-8',
    type: 'image',
    title: 'Plebian',
    excerpt: 'Saved to the garden.',
    imagePath: '/media/plebian.png',
    position: [-3, 8, 4],
  },
  {
    id: 'placeholder-9',
    type: 'image',
    title: 'Vav',
    excerpt: 'Saved to the garden.',
    imagePath: '/media/vav.png',
    position: [8, -5, -8],
  },
  {
    id: 'placeholder-10',
    type: 'image',
    title: 'CBD',
    excerpt: 'Saved to the garden.',
    imagePath: '/media/cbd.png',
    position: [-7, 1, 12],
  },
];

function seedPlaceholders() {
  const upsert = db.prepare(`
    INSERT INTO posts (id, type, title, excerpt, url, image_path, position_x, position_y, position_z)
    VALUES (@id, @type, @title, @excerpt, @url, @imagePath, @position_x, @position_y, @position_z)
    ON CONFLICT(id) DO UPDATE SET
      type = excluded.type,
      title = excluded.title,
      excerpt = excluded.excerpt,
      url = excluded.url,
      image_path = excluded.image_path,
      position_x = excluded.position_x,
      position_y = excluded.position_y,
      position_z = excluded.position_z
  `);

  const upsertMany = db.transaction((posts) => {
    for (const post of posts) {
      upsert.run({
        id: post.id,
        type: post.type,
        title: post.title,
        excerpt: post.excerpt ?? null,
        url: post.url ?? null,
        imagePath: post.imagePath ?? null,
        position_x: post.position[0],
        position_y: post.position[1],
        position_z: post.position[2],
      });
    }
  });

  upsertMany(PLACEHOLDER_POSTS);
}

seedPlaceholders();

function randomPosition() {
  return [
    (Math.random() - 0.5) * 40,
    (Math.random() - 0.5) * 40,
    (Math.random() - 0.5) * 40,
  ];
}

function mapRow(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    excerpt: row.excerpt,
    url: row.url,
    imagePath: row.imagePath,
    createdAt: row.createdAt,
    position: [row.position_x, row.position_y, row.position_z],
  };
}

export function createPost({ type, title, excerpt, url, imagePath }) {
  const id = uuid();
  const position = randomPosition();

  db.prepare(
    `INSERT INTO posts (id, type, title, excerpt, url, image_path, position_x, position_y, position_z)
     VALUES (@id, @type, @title, @excerpt, @url, @imagePath, @position_x, @position_y, @position_z)`
  ).run({
    id,
    type,
    title,
    excerpt: excerpt ?? null,
    url: url ?? null,
    imagePath: imagePath ?? null,
    position_x: position[0],
    position_y: position[1],
    position_z: position[2],
  });

  return getPostById(id);
}

export function getPostById(id) {
  const row = db
    .prepare(
      `SELECT id, type, title, excerpt, url, image_path AS imagePath,
              position_x, position_y, position_z, created_at AS createdAt
       FROM posts WHERE id = @id`
    )
    .get({ id });

  return row ? mapRow(row) : null;
}

export function getAllPosts() {
  const rows = db
    .prepare(
      `SELECT id, type, title, excerpt, url, image_path AS imagePath,
              position_x, position_y, position_z, created_at AS createdAt
       FROM posts
       ORDER BY created_at ASC`
    )
    .all();

  return rows.map(mapRow);
}

export default db;
