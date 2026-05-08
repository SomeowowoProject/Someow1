// routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authRequired, authOptional } = require('../middleware/auth');
const upload = require('../middleware/upload');

const PUBLIC_FIELDS = `
  id, handle, name, headline, bio, location, location_full, website,
  availability, avatar_path, cover_path,
  pronouns, languages, rates, education_short, available_for,
  custom_about_json, skills_json, tools_json, experience_json, education_json,
  created_at
`;

const parseJSON = (s, fallback) => { try { return JSON.parse(s); } catch { return fallback; } };

function shapeUser(u) {
  if (!u) return null;
  return {
    id: u.id, handle: u.handle, name: u.name,
    headline: u.headline, bio: u.bio,
    location: u.location, locationFull: u.location_full, website: u.website,
    availability: u.availability,
    avatarPath: u.avatar_path, coverPath: u.cover_path,
    pronouns: u.pronouns, languages: u.languages, rates: u.rates,
    educationShort: u.education_short, availableFor: u.available_for,
    customAbout: parseJSON(u.custom_about_json, []),
    skills: parseJSON(u.skills_json, []),
    tools: parseJSON(u.tools_json, []),
    experience: parseJSON(u.experience_json, []),
    education: parseJSON(u.education_json, []),
    createdAt: u.created_at
  };
}

// GET /api/users — list (search optional)
router.get('/', authOptional, (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
  let rows;
  if (q) {
    const like = `%${q}%`;
    rows = db.prepare(
      `SELECT ${PUBLIC_FIELDS} FROM users
       WHERE LOWER(name) LIKE ? OR LOWER(handle) LIKE ? OR LOWER(headline) LIKE ?
       ORDER BY created_at DESC LIMIT ?`
    ).all(like, like, like, limit);
  } else {
    rows = db.prepare(
      `SELECT ${PUBLIC_FIELDS} FROM users ORDER BY created_at DESC LIMIT ?`
    ).all(limit);
  }
  res.json({ users: rows.map(shapeUser) });
});

// GET /api/users/:handle
router.get('/:handle', authOptional, (req, res) => {
  const user = db.prepare(`SELECT ${PUBLIC_FIELDS} FROM users WHERE handle = ?`).get(req.params.handle.toLowerCase());
  if (!user) return res.status(404).json({ error: 'user not found' });

  const stats = {
    projects: db.prepare('SELECT COUNT(*) as c FROM projects WHERE author_id = ?').get(user.id).c,
    followers: db.prepare('SELECT COUNT(*) as c FROM follows WHERE followee_id = ?').get(user.id).c,
    following: db.prepare('SELECT COUNT(*) as c FROM follows WHERE follower_id = ?').get(user.id).c,
    collaborations: db.prepare(
      `SELECT COUNT(DISTINCT project_id) as c FROM project_members WHERE user_id = ? AND status = 'accepted'`
    ).get(user.id).c
  };

  let isFollowing = false;
  if (req.userId) {
    isFollowing = !!db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?').get(req.userId, user.id);
  }

  res.json({ user: shapeUser(user), stats, isFollowing, isMe: req.userId === user.id });
});

// PUT /api/users/me — update own profile
router.put('/me/profile', authRequired, (req, res) => {
  const allowed = [
    'name','headline','bio','location','location_full','website','availability',
    'pronouns','languages','rates','education_short','available_for'
  ];
  const jsonAllowed = ['custom_about_json','skills_json','tools_json','experience_json','education_json'];

  const setParts = [];
  const values = [];
  const body = req.body || {};

  for (const field of allowed) {
    const camel = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (body[camel] !== undefined) { setParts.push(`${field} = ?`); values.push(String(body[camel] || '').slice(0, 5000)); }
    else if (body[field] !== undefined) { setParts.push(`${field} = ?`); values.push(String(body[field] || '').slice(0, 5000)); }
  }
  for (const field of jsonAllowed) {
    const camel = field.replace(/_json$/, '').replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (body[camel] !== undefined) {
      setParts.push(`${field} = ?`);
      values.push(JSON.stringify(body[camel]).slice(0, 50000));
    }
  }
  if (setParts.length === 0) return res.json({ ok: true });

  setParts.push(`updated_at = strftime('%s','now')`);
  values.push(req.userId);
  db.prepare(`UPDATE users SET ${setParts.join(', ')} WHERE id = ?`).run(...values);
  res.json({ ok: true });
});

// POST /api/users/me/avatar
router.post('/me/avatar', authRequired, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  const path = '/uploads/' + req.file.filename;
  db.prepare('UPDATE users SET avatar_path = ?, updated_at = strftime(\'%s\',\'now\') WHERE id = ?').run(path, req.userId);
  res.json({ ok: true, path });
});

// POST /api/users/me/cover
router.post('/me/cover', authRequired, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  const path = '/uploads/' + req.file.filename;
  db.prepare('UPDATE users SET cover_path = ?, updated_at = strftime(\'%s\',\'now\') WHERE id = ?').run(path, req.userId);
  res.json({ ok: true, path });
});

// POST /api/users/:handle/follow
router.post('/:handle/follow', authRequired, (req, res) => {
  const target = db.prepare('SELECT id FROM users WHERE handle = ?').get(req.params.handle.toLowerCase());
  if (!target) return res.status(404).json({ error: 'user not found' });
  if (target.id === req.userId) return res.status(400).json({ error: 'cannot follow self' });
  db.prepare('INSERT OR IGNORE INTO follows (follower_id, followee_id) VALUES (?, ?)').run(req.userId, target.id);
  res.json({ ok: true });
});

// DELETE /api/users/:handle/follow
router.delete('/:handle/follow', authRequired, (req, res) => {
  const target = db.prepare('SELECT id FROM users WHERE handle = ?').get(req.params.handle.toLowerCase());
  if (!target) return res.status(404).json({ error: 'user not found' });
  db.prepare('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?').run(req.userId, target.id);
  res.json({ ok: true });
});

// GET /api/users/:handle/reviews
router.get('/:handle/reviews', (req, res) => {
  const target = db.prepare('SELECT id FROM users WHERE handle = ?').get(req.params.handle.toLowerCase());
  if (!target) return res.status(404).json({ error: 'user not found' });
  const rows = db.prepare(`
    SELECT r.id, r.body, r.meta, r.created_at,
           u.handle as author_handle, u.name as author_name, u.avatar_path as author_avatar
    FROM reviews r
    JOIN users u ON u.id = r.author_id
    WHERE r.subject_id = ?
    ORDER BY r.created_at DESC LIMIT 50
  `).all(target.id);
  res.json({ reviews: rows });
});

// POST /api/users/:handle/reviews — write a review
router.post('/:handle/reviews', authRequired, (req, res) => {
  const target = db.prepare('SELECT id FROM users WHERE handle = ?').get(req.params.handle.toLowerCase());
  if (!target) return res.status(404).json({ error: 'user not found' });
  if (target.id === req.userId) return res.status(400).json({ error: 'cannot review self' });
  const { body, meta } = req.body || {};
  if (!body || body.length < 5) return res.status(400).json({ error: 'review too short' });
  db.prepare('INSERT INTO reviews (subject_id, author_id, body, meta) VALUES (?, ?, ?, ?)')
    .run(target.id, req.userId, String(body).slice(0, 2000), String(meta || '').slice(0, 200));
  res.json({ ok: true });
});

module.exports = router;
