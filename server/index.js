import cors from 'cors';
import express from 'express';
import { getAllPosts } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/posts', (_req, res) => {
  res.json(getAllPosts());
});

app.listen(PORT, () => {
  console.log(`Spatial Garden API running on http://localhost:${PORT}`);
});
