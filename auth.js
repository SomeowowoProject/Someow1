// middleware/auth.js — JWT auth
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function signToken(userId) {
  return jwt.sign({ uid: userId }, SECRET, { expiresIn: '30d' });
}

function authRequired(req, res, next) {
  const token = req.cookies?.token || (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  if (!token) return res.status(401).json({ error: 'auth required' });
  try {
    const payload = jwt.verify(token, SECRET);
    req.userId = payload.uid;
    next();
  } catch (e) {
    res.status(401).json({ error: 'invalid token' });
  }
}

function authOptional(req, res, next) {
  const token = req.cookies?.token || (req.headers.authorization || '').replace(/^Bearer\s+/, '');
  if (!token) { req.userId = null; return next(); }
  try {
    const payload = jwt.verify(token, SECRET);
    req.userId = payload.uid;
  } catch (e) {
    req.userId = null;
  }
  next();
}

module.exports = { signToken, authRequired, authOptional };
