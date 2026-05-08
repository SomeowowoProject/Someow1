// middleware/upload.js — multer file upload
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_MB = parseInt(process.env.MAX_UPLOAD_MB || '20', 10);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 8);
    const id = crypto.randomBytes(10).toString('hex');
    cb(null, `${Date.now()}-${id}${ext}`);
  }
});

const allowedMimes = new Set([
  'image/jpeg','image/png','image/webp','image/gif','image/svg+xml',
  'video/mp4','video/webm',
  'application/pdf'
]);

const upload = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (!allowedMimes.has(file.mimetype)) {
      return cb(new Error('unsupported file type'));
    }
    cb(null, true);
  }
});

module.exports = upload;
