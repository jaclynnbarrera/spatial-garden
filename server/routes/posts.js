import { Router } from 'express';
import multer from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import { createPost, deletePost, getPostById, updatePost } from '../db.js';
import { deleteUploadFile } from '../uploadFiles.js';
import { downloadImageToUploads } from '../downloadImage.js';
import { fetchLinkPreview } from '../linkPreview.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { uploadsDir } from '../paths.js';

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

router.post('/preview-link', requireAdmin, async (req, res) => {
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

router.post('/', requireAdmin, async (req, res) => {
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

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = getPostById(id);

    if (!existing) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const title = req.body.title?.trim();
    const excerpt = req.body.excerpt?.trim() || null;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    let url = existing.url;
    let imagePath = existing.imagePath;

    if (existing.type === 'link') {
      const nextUrl = req.body.url?.trim();
      if (!nextUrl) {
        res.status(400).json({ error: 'URL is required for link posts' });
        return;
      }
      url = nextUrl;

      if (req.body.imagePath !== undefined) {
        let savedImagePath = req.body.imagePath || null;

        if (savedImagePath?.startsWith('http')) {
          try {
            savedImagePath = await downloadImageToUploads(savedImagePath, url);
          } catch {
            savedImagePath = existing.imagePath;
          }
        }

        if (savedImagePath !== existing.imagePath) {
          deleteUploadFile(existing.imagePath);
        }

        imagePath = savedImagePath;
      }
    }

    const post = updatePost(id, { title, excerpt, url, imagePath });
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Could not update post' });
  }
});

router.patch('/:id/image', requireAdmin, upload.single('image'), (req, res) => {
  try {
    const { id } = req.params;
    const existing = getPostById(id);

    if (!existing) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    if (existing.type !== 'image') {
      res.status(400).json({ error: 'Only image posts can replace their image' });
      return;
    }

    const title = req.body.title?.trim();
    const excerpt = req.body.excerpt?.trim() || null;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    let imagePath = existing.imagePath;

    if (req.file) {
      deleteUploadFile(existing.imagePath);
      imagePath = `/uploads/${req.file.filename}`;
    }

    const post = updatePost(id, { title, excerpt, url: null, imagePath });
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Could not update image post' });
  }
});

router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const post = deletePost(req.params.id);

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    deleteUploadFile(post.imagePath);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Could not delete post' });
  }
});

router.post('/image', requireAdmin, upload.single('image'), (req, res) => {
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
