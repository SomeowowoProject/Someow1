// public/js/compose.js — new project compose
function previewComposeFiles(ev) {
  const files = [...(ev.target.files || [])];
  STATE.composeFiles = files;
  const c = document.getElementById('cmp-thumbs');
  c.innerHTML = '';
  files.forEach(f => {
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      const div = document.createElement('div');
      div.className = 'upload-thumb';
      div.style.backgroundImage = `url('${url}')`;
      c.appendChild(div);
    } else {
      const div = document.createElement('div');
      div.className = 'upload-thumb';
      div.style.display = 'inline-flex';
      div.style.alignItems = 'center';
      div.style.justifyContent = 'center';
      div.style.fontSize = '0.7rem';
      div.style.color = 'var(--text-secondary)';
      div.textContent = f.type.split('/')[0];
      c.appendChild(div);
    }
  });
}

function addComposeTag(ev) {
  if (ev.key !== 'Enter') return;
  ev.preventDefault();
  const inp = document.getElementById('cmp-tag-input');
  const v = inp.value.trim();
  if (!v) return;
  if (STATE.composeTags.includes(v)) { inp.value = ''; return; }
  STATE.composeTags.push(v);
  inp.value = '';
  document.getElementById('cmp-tags').innerHTML = STATE.composeTags.map((t, i) =>
    `<span class="tag-chip">${escapeHtml(t)}<span class="tag-x" onclick="removeComposeTag(${i})">×</span></span>`
  ).join('');
}
function removeComposeTag(i) {
  STATE.composeTags.splice(i, 1);
  document.getElementById('cmp-tags').innerHTML = STATE.composeTags.map((t, i2) =>
    `<span class="tag-chip">${escapeHtml(t)}<span class="tag-x" onclick="removeComposeTag(${i2})">×</span></span>`
  ).join('');
}

function addComposeRole(ev) {
  if (ev.key !== 'Enter') return;
  ev.preventDefault();
  const inp = document.getElementById('cmp-role-input');
  const v = inp.value.trim();
  if (!v) return;
  STATE.composeRoles.push(v);
  inp.value = '';
  renderComposeRoles();
}
function renderComposeRoles() {
  document.getElementById('cmp-roles').innerHTML = STATE.composeRoles.map((r, i) =>
    `<div class="role-row">+ ${escapeHtml(r)}<span class="role-x" onclick="removeComposeRole(${i})">×</span></div>`
  ).join('');
}
function removeComposeRole(i) {
  STATE.composeRoles.splice(i, 1);
  renderComposeRoles();
}

function discardCompose() {
  document.getElementById('cmp-title').value = '';
  document.getElementById('cmp-body').value = '';
  document.getElementById('cmp-files').value = '';
  document.getElementById('cmp-thumbs').innerHTML = '';
  document.getElementById('cmp-tags').innerHTML = '';
  document.getElementById('cmp-roles').innerHTML = '';
  STATE.composeFiles = [];
  STATE.composeTags = [];
  STATE.composeRoles = [];
  go('s-home');
}

async function publishProject() {
  if (!STATE.currentUser) return go('s-auth');
  const title = document.getElementById('cmp-title').value.trim();
  const description = document.getElementById('cmp-body').value;
  const field = document.getElementById('cmp-field').value;
  const visibility = document.getElementById('cmp-visibility').value;
  if (title.length < 2) return showToast('Title is required');
  if (!field) return showToast('Pick a field');
  try {
    const r = await API.createProject({
      title, description, field, visibility,
      tags: STATE.composeTags, openRoles: STATE.composeRoles
    });
    if (STATE.composeFiles.length > 0) {
      try { await API.uploadProjectMedia(r.id, STATE.composeFiles); } catch (e) { showToast('Media upload failed'); }
    }
    showToast('Published');
    discardCompose();
    openProject(r.id);
  } catch (e) { showToast(e.message); }
}

function buildComposeFieldSelect() {
  const sel = document.getElementById('cmp-field');
  if (!sel) return;
  sel.innerHTML = '<option value="">Select field…</option>' + FIELDS.map(f => `<option value="${f.key}">${f.label}</option>`).join('');
}
