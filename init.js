// db/init.js — initialize SQLite schema
require('dotenv').config();
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || './db/dakdori.sqlite';
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  headline TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  location TEXT DEFAULT '',
  location_full TEXT DEFAULT '',
  website TEXT DEFAULT '',
  availability TEXT DEFAULT '',
  avatar_path TEXT DEFAULT '',
  cover_path TEXT DEFAULT '',
  pronouns TEXT DEFAULT '',
  languages TEXT DEFAULT '',
  rates TEXT DEFAULT '',
  education_short TEXT DEFAULT '',
  available_for TEXT DEFAULT '',
  custom_about_json TEXT DEFAULT '[]',
  skills_json TEXT DEFAULT '[]',
  tools_json TEXT DEFAULT '[]',
  experience_json TEXT DEFAULT '[]',
  education_json TEXT DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  field TEXT DEFAULT '',
  tags_json TEXT DEFAULT '[]',
  cover_path TEXT DEFAULT '',
  visibility TEXT DEFAULT 'public',
  open_roles_json TEXT DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_projects_field ON projects(field);
CREATE INDEX IF NOT EXISTS idx_projects_author ON projects(author_id);
CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at DESC);

CREATE TABLE IF NOT EXISTS project_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  mime TEXT DEFAULT '',
  position INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS project_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  status TEXT DEFAULT 'invited',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  PRIMARY KEY (follower_id, followee_id)
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_posts_field ON posts(field, created_at DESC);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  meta TEXT DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_reviews_subject ON reviews(subject_id, created_at DESC);

CREATE TABLE IF NOT EXISTS view_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  viewed_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_view_user ON view_history(user_id, viewed_at DESC);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  expires_at INTEGER NOT NULL
);
`;

db.exec(schema);

// Seed: ensure at least one demo user exists for first boot.
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (userCount === 0) {
  const bcrypt = require('bcrypt');
  const hash = bcrypt.hashSync('demo1234', 10);
  const insert = db.prepare(`
    INSERT INTO users (email, handle, password_hash, name, headline, bio, location, location_full, availability, website, skills_json, tools_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insert.run(
    'demo@dakdori.app', 'demo', hash, 'Demo User',
    'Visual designer · welcome to Dakdori',
    'This is a seeded demo account. Sign up to make your own.',
    'Seoul, KR', 'Seoul, Republic of Korea',
    'Available for collaboration',
    'dakdori.app',
    JSON.stringify(['Brand identity','Editorial design','Typography']),
    JSON.stringify(['Figma','After Effects'])
  );
  console.log('[db] Seeded demo user (email: demo@dakdori.app, password: demo1234)');
}

console.log('[db] Schema ready at', dbPath);
db.close();
