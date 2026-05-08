// routes/posts.js — community feed posts
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authRequired, authOptional } = require('../middleware/auth');

// GET /api/posts?field=design
router.get('/', (req, res) => {
  const field = String(req.query.field || '').toLowerCase();
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
  if (!field) return res.status(400).json({ error: 'field required' });
  const rows = db.prepare(`
    SELECT p.id, p.body, p.created_at,
           u.handle as author_handle, u.name as author_name, u.avatar_path as author_avatar
    FROM posts p JOIN users u ON u.id = p.author_id
    WHERE p.field = ?
    ORDER BY p.created_at DESC LIMIT ?
  `).all(field, limit);
  res.json({ posts: rows });
});

// POST /api/posts
router.post('/', authRequired, (req, res) => {
  const { field, body } = req.body || {};
  if (!field || !body) return res.status(400).json({ error: 'field and body required' });
  if (body.length < 1 || body.length > 2000) return res.status(400).json({ error: 'body length 1-2000' });
  const r = db.prepare('INSERT INTO posts (author_id, field, body) VALUES (?, ?, ?)')
    .run(req.userId, String(field).toLowerCase().slice(0, 40), String(body));
  res.json({ ok: true, id: r.lastInsertRowid });
});

// DELETE /api/posts/:id
router.delete('/:id', authRequired, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const post = db.prepare('SELECT author_id FROM posts WHERE id = ?').get(id);
  if (!post) return res.status(404).json({ error: 'not found' });
  if (post.author_id !== req.userId) return res.status(403).json({ error: 'forbidden' });
  db.prepare('DELETE FROM posts WHERE id = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;
