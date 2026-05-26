import { Router } from 'express';
import multer from 'multer';
import { dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';
import { createPost } from '../db.js';
import { downloadImageToUploads } from '../downloadImage.js';
import { fetchLinkPreview } from '../linkPreview.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(__dirname, '../../public/uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const extension = extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${uuid()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image uploads are allowed'));
  },
});

const router = Router();

router.post('/preview-link', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    const preview = await fetchLinkPreview(url);
    res.json(preview);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Could not preview link' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { type, title, excerpt, url, imagePath } = req.body;

    if (!type || !title?.trim()) {
      res.status(400).json({ error: 'Type and title are required' });
      return;
    }

    if (!['link', 'image', 'text'].includes(type)) {
      res.status(400).json({ error: 'Invalid post type' });
      return;
    }

    if (type === 'link' && !url) {
      res.status(400).json({ error: 'URL is required for link posts' });
      return;
    }

    let savedImagePath = imagePath || null;

    if (type === 'link' && imagePath?.startsWith('http')) {
      try {
        savedImagePath = await downloadImageToUploads(imagePath, url);
      } catch {
        savedImagePath = null;
      }
    }

    const post = createPost({
      type,
      title: title.trim(),
      excerpt: excerpt?.trim() || null,
      url: url || null,
      imagePath: savedImagePath,
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Could not create post' });
  }
});

router.post('/image', upload.single('image'), (req, res) => {
  try {
    const title = req.body.title?.trim();
    const excerpt = req.body.excerpt?.trim() || null;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'Image file is required' });
      return;
    }

    const post = createPost({
      type: 'image',
      title,
      excerpt,
      imagePath: `/uploads/${req.file.filename}`,
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Could not create image post' });
  }
});

export default router;
