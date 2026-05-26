import cors from 'cors';
import express from 'express';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getAllPosts } from './db.js';
import postsRouter from './routes/posts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(__dirname, '../public/uploads');
mkdirSync(uploadsDir, { recursive: true });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/posts', (_req, res) => {
  res.json(getAllPosts());
});

app.use('/api/posts', postsRouter);

app.use((error, _req, res, _next) => {
  res.status(400).json({ error: error.message || 'Request failed' });
});

app.listen(PORT, () => {
  console.log(`Spatial Garden API running on http://localhost:${PORT}`);
});
