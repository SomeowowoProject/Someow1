// public/js/ui.js — shared UI helpers
function go(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  window.scrollTo(0, 0);
}

function goAuth() { go('s-auth'); }

function showToast(msg, ms) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), ms || 2500);
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function timeAgo(ts) {
  const s = Math.floor(Date.now() / 1000) - ts;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  if (s < 604800) return Math.floor(s / 86400) + 'd';
  return new Date(ts * 1000).toLocaleDateString();
}

function avatarStyle(path) {
  return path ? `background-image:url('${path}'); background-color:transparent;` : '';
}

function setAvatarEl(el, user) {
  if (!el || !user) return;
  if (user.avatarPath) {
    el.style.backgroundImage = `url('${user.avatarPath}')`;
    el.style.backgroundColor = 'transparent';
    el.textContent = '';
  } else {
    el.style.backgroundImage = '';
    el.textContent = initials(user.name || user.handle || '?');
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const cur = html.getAttribute('data-theme');
  const next = cur === 'light' ? 'dark' : cur === 'dark' ? 'system' : 'light';
  html.setAttribute('data-theme', next);
  syncThemeLabel();
  try { localStorage.setItem('dakdori-theme', next); } catch {}
}
function syncThemeLabel() {
  const cur = document.documentElement.getAttribute('data-theme');
  document.querySelectorAll('.theme-btn').forEach(b => b.textContent = cur);
}

function toggleSB() { const s = document.getElementById('sidebar'); if (s) s.classList.toggle('collapsed'); }

// chip strip scroll
function scrollCats(dir) {
  const strip = document.getElementById('cat-strip');
  if (strip) strip.scrollBy({ left: dir * 140, behavior: 'smooth' });
}
function updateCatFade() {
  const strip = document.getElementById('cat-strip');
  if (!strip) return;
  const atStart = strip.scrollLeft <= 2;
  const atEnd = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 2;
  strip.classList.toggle('at-start', atStart);
  strip.classList.toggle('at-end', atEnd);
  document.getElementById('cat-arr-l').classList.toggle('hidden', atStart);
  document.getElementById('cat-arr-r').classList.toggle('hidden', atEnd);
}
