// routes/projects.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authRequired, authOptional } = require('../middleware/auth');
const upload = require('../middleware/upload');

const parseJSON = (s, f) => { try { return JSON.parse(s); } catch { return f; } };

function shapeProject(p) {
  return {
    id: p.id,
    authorId: p.author_id,
    authorHandle: p.author_handle,
    authorName: p.author_name,
    authorAvatar: p.author_avatar,
    title: p.title,
    description: p.description,
    field: p.field,
    tags: parseJSON(p.tags_json, []),
    coverPath: p.cover_path,
    visibility: p.visibility,
    openRoles: parseJSON(p.open_roles_json, []),
    createdAt: p.created_at,
    updatedAt: p.updated_at
  };
}

const PROJECT_SELECT = `
  p.id, p.author_id, p.title, p.description, p.field, p.tags_json,
  p.cover_path, p.visibility, p.open_roles_json, p.created_at, p.updated_at,
  u.handle as author_handle, u.name as author_name, u.avatar_path as author_avatar
`;

// GET /api/projects — list with filters
router.get('/', authOptional, (req, res) => {
  const { field, q, sort = 'recent', author, viewed } = req.query;
  const limit = Math.min(parseInt(req.query.limit || '24', 10), 100);
  const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

  // "viewed" filter: from view_history of current user
  if (viewed === '1') {
    if (!req.userId) return res.json({ projects: [] });
    const rows = db.prepare(`
      SELECT ${PROJECT_SELECT}
      FROM view_history v
      JOIN projects p ON p.id = v.project_id
      JOIN users u ON u.id = p.author_id
      WHERE v.user_id = ?
      ORDER BY v.viewed_at DESC LIMIT ? OFFSET ?
    `).all(req.userId, limit, offset);
    return res.json({ projects: rows.map(shapeProject) });
  }

  // "recommended": projects in fields the user has viewed most
  if (sort === 'recommended' && req.userId) {
    const top = db.prepare(`
      SELECT p.field, COUNT(*) as c
      FROM view_history v JOIN projects p ON p.id = v.project_id
      WHERE v.user_id = ?
      GROUP BY p.field ORDER BY c DESC LIMIT 1
    `).get(req.userId);
    if (top && top.field) {
      const rows = db.prepare(`
        SELECT ${PROJECT_SELECT} FROM projects p JOIN users u ON u.id = p.author_id
        WHERE p.field = ? ORDER BY p.created_at DESC LIMIT ? OFFSET ?
      `).all(top.field, limit, offset);
      return res.json({ projects: rows.map(shapeProject) });
    }
  }

  let where = '1=1';
  const params = [];
  if (field && field !== 'all') {
    where += ' AND p.field = ?';
    params.push(String(field).toLowerCase());
  }
  if (author) {
    where += ' AND u.handle = ?';
    params.push(String(author).toLowerCase());
  }
  if (q) {
    const like = `%${String(q).toLowerCase()}%`;
    where += ' AND (LOWER(p.title) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(p.tags_json) LIKE ? OR LOWER(u.name) LIKE ?)';
    params.push(like, like, like, like);
  }

  const orderBy = sort === 'recent' ? 'p.created_at DESC' : 'p.created_at DESC';
  const sql = `
    SELECT ${PROJECT_SELECT}
    FROM projects p JOIN users u ON u.id = p.author_id
    WHERE ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;
  params.push(limit, offset);
  const rows = db.prepare(sql).all(...params);
  res.json({ projects: rows.map(shapeProject) });
});

// GET /api/projects/:id
router.get('/:id', authOptional, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'bad id' });
  const row = db.prepare(`
    SELECT ${PROJECT_SELECT} FROM projects p JOIN users u ON u.id = p.author_id
    WHERE p.id = ?
  `).get(id);
  if (!row) return res.status(404).json({ error: 'project not found' });

  const media = db.prepare('SELECT id, path, mime, position FROM project_media WHERE project_id = ? ORDER BY position ASC').all(id);
  const members = db.prepare(`
    SELECT pm.role, pm.status, u.handle, u.name, u.avatar_path
    FROM project_members pm JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ? ORDER BY pm.created_at ASC
  `).all(id);

  // record view if logged-in
  if (req.userId) {
    db.prepare('INSERT INTO view_history (user_id, project_id) VALUES (?, ?)').run(req.userId, id);
  }

  res.json({ project: shapeProject(row), media, members });
});

// POST /api/projects
router.post('/', authRequired, (req, res) => {
  const { title, description, field, tags, visibility, openRoles } = req.body || {};
  if (!title || title.trim().length < 2) return res.status(400).json({ error: 'title required' });
  const result = db.prepare(`
    INSERT INTO projects (author_id, title, description, field, tags_json, visibility, open_roles_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.userId,
    String(title).slice(0, 200),
    String(description || '').slice(0, 20000),
    String(field || '').toLowerCase().slice(0, 40),
    JSON.stringify(Array.isArray(tags) ? tags.slice(0, 20) : []),
    ['public','followers','invite'].includes(visibility) ? visibility : 'public',
    JSON.stringify(Array.isArray(openRoles) ? openRoles.slice(0, 12) : [])
  );
  res.json({ ok: true, id: result.lastInsertRowid });
});

// PUT /api/projects/:id
router.put('/:id', authRequired, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const project = db.prepare('SELECT author_id FROM projects WHERE id = ?').get(id);
  if (!project) return res.status(404).json({ error: 'not found' });
  if (project.author_id !== req.userId) return res.status(403).json({ error: 'forbidden' });
  const { title, description, field, tags, visibility, openRoles } = req.body || {};
  db.prepare(`
    UPDATE projects SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      field = COALESCE(?, field),
      tags_json = COALESCE(?, tags_json),
      visibility = COALESCE(?, visibility),
      open_roles_json = COALESCE(?, open_roles_json),
      updated_at = strftime('%s','now')
    WHERE id = ?
  `).run(
    title !== undefined ? String(title).slice(0, 200) : null,
    description !== undefined ? String(description).slice(0, 20000) : null,
    field !== undefined ? String(field).toLowerCase().slice(0, 40) : null,
    tags !== undefined ? JSON.stringify(tags) : null,
    visibility !== undefined && ['public','followers','invite'].includes(visibility) ? visibility : null,
    openRoles !== undefined ? JSON.stringify(openRoles) : null,
    id
  );
  res.json({ ok: true });
});

// DELETE /api/projects/:id
router.delete('/:id', authRequired, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const project = db.prepare('SELECT author_id FROM projects WHERE id = ?').get(id);
  if (!project) return res.status(404).json({ error: 'not found' });
  if (project.author_id !== req.userId) return res.status(403).json({ error: 'forbidden' });
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  res.json({ ok: true });
});

// POST /api/projects/:id/media
router.post('/:id/media', authRequired, upload.array('files', 10), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const project = db.prepare('SELECT author_id FROM projects WHERE id = ?').get(id);
  if (!project) return res.status(404).json({ error: 'not found' });
  if (project.author_id !== req.userId) return res.status(403).json({ error: 'forbidden' });
  const inserted = [];
  for (let i = 0; i < (req.files || []).length; i++) {
    const f = req.files[i];
    const filepath = '/uploads/' + f.filename;
    const result = db.prepare(
      'INSERT INTO project_media (project_id, path, mime, position) VALUES (?, ?, ?, ?)'
    ).run(id, filepath, f.mimetype, i);
    if (i === 0) {
      db.prepare('UPDATE projects SET cover_path = ?, updated_at = strftime(\'%s\',\'now\') WHERE id = ? AND cover_path = \'\'').run(filepath, id);
    }
    inserted.push({ id: result.lastInsertRowid, path: filepath, mime: f.mimetype });
  }
  res.json({ ok: true, media: inserted });
});

// POST /api/projects/:id/invite
router.post('/:id/invite', authRequired, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const project = db.prepare('SELECT author_id FROM projects WHERE id = ?').get(id);
  if (!project) return res.status(404).json({ error: 'not found' });
  if (project.author_id !== req.userId) return res.status(403).json({ error: 'forbidden' });

  const { handle, role } = req.body || {};
  const target = db.prepare('SELECT id FROM users WHERE handle = ?').get(String(handle || '').toLowerCase());
  if (!target) return res.status(404).json({ error: 'user not found' });
  db.prepare(
    'INSERT OR IGNORE INTO project_members (project_id, user_id, role, status) VALUES (?, ?, ?, \'invited\')'
  ).run(id, target.id, String(role || 'member').slice(0, 60));
  res.json({ ok: true });
});

module.exports = router;
