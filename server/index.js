import cors from 'cors';
import express from 'express';
import { existsSync } from 'fs';
import { join } from 'path';
import { getAllPosts } from './db.js';
import { distDir, uploadsDir } from './paths.js';
import postsRouter from './routes/posts.js';

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

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

if (isProduction && existsSync(distDir)) {
  app.use(express.static(distDir));

  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      next();
      return;
    }
    res.sendFile(join(distDir, 'index.html'));
  });
}

app.use((error, _req, res, _next) => {
  res.status(400).json({ error: error.message || 'Request failed' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
