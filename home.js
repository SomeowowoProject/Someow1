// public/js/home.js — home grid, search, infinite scroll
let homeOffset = 0;
const PAGE_SIZE = 9;
let homeLoading = false;
let homeExhausted = false;
let scrollObserver = null;

function buildSidebarFields() {
  const c = document.getElementById('sidebar-fields');
  if (!c) return;
  c.innerHTML = FIELDS.map(f => `
    <div class="sb-item" onclick="openCommunity('${f.key}')"><span>${f.icon}</span><span>${f.label}</span></div>
  `).join('');
}

function buildChipStrip() {
  const strip = document.getElementById('cat-strip');
  if (!strip) return;
  const fieldPills = FIELDS.map(f => `<div class="cat-pill" data-key="${f.key}" onclick="filterField(this,'${f.key}')">${f.label}</div>`).join('');
  strip.innerHTML = `
    <div class="cat-pill active" data-key="all" onclick="filterField(this,'all')">All</div>
    ${fieldPills}
    <div class="cat-pill" data-key="recent" onclick="filterField(this,'recent')">Recently uploaded</div>
    <div class="cat-pill" data-key="viewed" onclick="filterField(this,'viewed')">Viewed</div>
    <div class="cat-pill" data-key="recommended" onclick="filterField(this,'recommended')">For you</div>
  `;
}

function cardHTML(p) {
  const tagsHTML = (p.tags || []).slice(0, 3).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  const init = initials(p.authorName || '?');
  const cover = p.coverPath ? `style="background-image:url('${p.coverPath}')"` : '';
  return `
    <div class="card-container" onclick="openProject(${p.id})">
      <div class="card" id="card-${p.id}">
        <div class="card-face card-front" ${cover}>
          ${p.coverPath ? '' : '<div class="card-thumb"><span class="card-thumb-initials">' + init + '</span></div>'}
        </div>
        <div class="card-face card-back">
          <div class="card-back-title">${escapeHtml(p.title)}</div>
          <div class="card-back-desc">${escapeHtml((p.description || '').slice(0, 200))}</div>
          <div class="card-back-meta">${escapeHtml(p.authorName)} · ${escapeHtml(p.field)}</div>
          <div class="card-back-tags">${tagsHTML}</div>
          <div class="card-actions">
            <span style="font-size:0.75rem;color:var(--text-secondary);">${timeAgo(p.createdAt)}</span>
            <button class="open-btn" onclick="event.stopPropagation();openProject(${p.id})">Open →</button>
          </div>
        </div>
      </div>
      <div class="front-text-wrapper has-text">
        <div class="front-text-inner">
          <div class="front-text">
            <div class="front-title">${escapeHtml(p.title)}</div>
            <div class="front-description">${escapeHtml(p.authorName)} · ${escapeHtml(fieldLabel(p.field))}</div>
          </div>
        </div>
      </div>
    </div>`;
}

function appendCards(projects) {
  const grid = document.getElementById('home-grid');
  const tmp = document.createElement('div');
  tmp.innerHTML = projects.map(cardHTML).join('');
  while (tmp.firstChild) grid.appendChild(tmp.firstChild);
}

function buildQueryForCurrent(extra) {
  const q = Object.assign({ limit: PAGE_SIZE, offset: homeOffset }, extra || {});
  const k = STATE.currentField;
  if (k === 'all') {
    /* none */
  } else if (k === 'recent') {
    q.sort = 'recent';
  } else if (k === 'viewed') {
    q.viewed = '1';
  } else if (k === 'recommended') {
    q.sort = 'recommended';
  } else {
    q.field = k;
  }
  return q;
}

async function loadHome(reset) {
  if (reset) {
    homeOffset = 0;
    homeExhausted = false;
    document.getElementById('home-grid').innerHTML = '';
  }
  if (homeLoading || homeExhausted) return;
  homeLoading = true;
  const sentinel = document.getElementById('scroll-sentinel');
  sentinel.textContent = 'Loading…';
  try {
    const r = await API.listProjects(buildQueryForCurrent());
    const list = r.projects || [];
    appendCards(list);
    homeOffset += list.length;
    if (list.length < PAGE_SIZE) homeExhausted = true;
    sentinel.textContent = homeExhausted ? '' : '';
  } catch (e) {
    sentinel.textContent = 'Failed to load.';
  } finally {
    homeLoading = false;
  }
}

function filterField(el, key) {
  document.querySelectorAll('#cat-strip .cat-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  STATE.currentField = key;
  const labels = { all: 'Recommended for you', recent: 'Recently uploaded', viewed: 'Viewed', recommended: 'For you' };
  document.getElementById('grid-lbl').textContent = labels[key] || fieldLabel(key);
  loadHome(true);
  go('s-home');
}

async function doSearch() {
  const q = (document.getElementById('search-q').value || '').trim();
  document.getElementById('home-grid').innerHTML = '';
  homeExhausted = true; // disable pagination during search
  document.getElementById('grid-lbl').textContent = q ? `Results for "${q}"` : 'Recommended for you';
  if (!q) { homeExhausted = false; return loadHome(true); }
  go('s-home');
  try {
    const r = await API.listProjects({ q, limit: 50 });
    appendCards(r.projects || []);
    if ((r.projects || []).length === 0) {
      document.getElementById('home-grid').innerHTML = '<div class="empty-state">No projects match your search.</div>';
    }
  } catch (e) { showToast('Search failed'); }
}

function setupHomeScroll() {
  const sentinel = document.getElementById('scroll-sentinel');
  if (!sentinel) return;
  if (scrollObserver) scrollObserver.disconnect();
  scrollObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) loadHome(false);
  }, { rootMargin: '200px' });
  scrollObserver.observe(sentinel);
}
