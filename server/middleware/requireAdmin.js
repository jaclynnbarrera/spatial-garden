export function requireAdmin(req, res, next) {
  const secret = process.env.ADMIN_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      res.status(503).json({ error: 'Uploads are disabled' });
      return;
    }
    next();
    return;
  }

  if (req.headers['x-admin-key'] !== secret) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  next();
}
