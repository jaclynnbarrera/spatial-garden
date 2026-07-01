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

function randomPosition() {
  return [
    (Math.random() - 0.5) * 22,
    (Math.random() - 0.5) * 22,
    (Math.random() - 0.5) * 22,
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

export function updatePost(id, { title, excerpt, url, imagePath }) {
  const existing = getPostById(id);
  if (!existing) return null;

  db.prepare(
    `UPDATE posts
     SET title = @title, excerpt = @excerpt, url = @url, image_path = @imagePath
     WHERE id = @id`
  ).run({
    id,
    title,
    excerpt: excerpt ?? null,
    url: url ?? null,
    imagePath: imagePath ?? null,
  });

  return getPostById(id);
}

export function deletePost(id) {
  const post = getPostById(id);
  if (!post) return null;

  db.prepare('DELETE FROM posts WHERE id = @id').run({ id });
  return post;
}

export default db;
