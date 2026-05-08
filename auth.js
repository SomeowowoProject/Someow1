// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../db');
const { signToken, authRequired } = require('../middleware/auth');

const HANDLE_RE = /^[a-z0-9_]{3,24}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.COOKIE_SECURE === 'true',
  maxAge: 30 * 24 * 3600 * 1000
};

router.post('/signup', (req, res) => {
  const { email, handle, password, name } = req.body || {};
  if (!email || !handle || !password || !name)
    return res.status(400).json({ error: 'email, handle, password, name are required' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'invalid email' });
  if (!HANDLE_RE.test(handle)) return res.status(400).json({ error: 'handle must be 3–24 chars, alphanumeric/underscore' });
  if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR handle = ?').get(email.toLowerCase(), handle.toLowerCase());
  if (existing) return res.status(409).json({ error: 'email or handle already in use' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (email, handle, password_hash, name) VALUES (?, ?, ?, ?)'
  ).run(email.toLowerCase(), handle.toLowerCase(), hash, name);

  const token = signToken(result.lastInsertRowid);
  res.cookie('token', token, COOKIE_OPTS);
  res.json({ ok: true, user: { id: result.lastInsertRowid, email, handle: handle.toLowerCase(), name } });
});

router.post('/login', (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password)
    return res.status(400).json({ error: 'identifier and password are required' });
  const user = db.prepare(
    'SELECT * FROM users WHERE email = ? OR handle = ?'
  ).get(identifier.toLowerCase(), identifier.toLowerCase());
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  if (!bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'invalid credentials' });
  const token = signToken(user.id);
  res.cookie('token', token, COOKIE_OPTS);
  res.json({ ok: true, user: { id: user.id, email: user.email, handle: user.handle, name: user.name } });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', authRequired, (req, res) => {
  const user = db.prepare(
    'SELECT id, email, handle, name, headline, bio, avatar_path FROM users WHERE id = ?'
  ).get(req.userId);
  if (!user) return res.status(404).json({ error: 'user not found' });
  res.json({ user });
});

module.exports = router;
