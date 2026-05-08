// public/js/project.js — project detail
async function openProject(id) {
  go('s-detail');
  try {
    const r = await API.getProject(id);
    STATE.viewedProject = r;
    renderProject(r);
  } catch (e) { showToast(e.message); }
}

function renderProject(r) {
  const p = r.project;
  document.getElementById('d-title').textContent = p.title;
  document.getElementById('d-author').textContent = p.authorName;
  document.getElementById('d-field').textContent = fieldLabel(p.field);
  document.getElementById('d-time').textContent = timeAgo(p.createdAt);
  document.getElementById('d-desc').textContent = p.description || '';
  document.getElementById('d-tags').innerHTML = (p.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');

  const v = document.getElementById('d-visual');
  if (p.coverPath) {
    v.style.backgroundImage = `url('${p.coverPath}')`;
    v.textContent = '';
  } else {
    v.style.backgroundImage = '';
    v.textContent = 'No media uploaded';
  }

  // Author block
  document.getElementById('d-anm').textContent = p.authorName;
  document.getElementById('d-arole').textContent = '@' + p.authorHandle;
  document.getElementById('d-abio').textContent = '';
  const avEl = document.getElementById('d-av');
  if (p.authorAvatar) { avEl.style.backgroundImage = `url('${p.authorAvatar}')`; avEl.textContent = ''; }
  else { avEl.style.backgroundImage = ''; avEl.textContent = initials(p.authorName); }
  document.getElementById('d-author-block').onclick = () => openProfile(p.authorHandle);

  // Roles + members
  const slotsEl = document.getElementById('d-slots');
  const lead = `<div class="team-slot"><div class="author-av">${initials(p.authorName)}</div> ${escapeHtml(p.authorName)} (lead)</div>`;
  const memberSlots = (r.members || []).map(m => `
    <div class="team-slot"><div class="author-av">${m.avatar_path ? '' : initials(m.name)}</div>${escapeHtml(m.name)} · ${escapeHtml(m.role)}</div>
  `).join('');
  const openRoles = (p.openRoles || []).map(role => `
    <div class="team-slot open" onclick="openInviteForRole('${escapeHtml(role)}')">+ ${escapeHtml(role)}</div>
  `).join('');
  slotsEl.innerHTML = lead + memberSlots + openRoles;

  // Related
  loadRelated(p.field, p.id);
}

async function loadRelated(field, excludeId) {
  const c = document.getElementById('d-related');
  c.innerHTML = '';
  try {
    const r = await API.listProjects({ field, limit: 6 });
    const list = (r.projects || []).filter(p => p.id !== excludeId).slice(0, 4);
    if (list.length === 0) { c.innerHTML = '<div class="empty-state" style="padding:1rem 0;">Nothing related yet.</div>'; return; }
    c.innerHTML = list.map(p => `
      <div class="related-item" onclick="openProject(${p.id})">
        <div class="related-thumb" ${p.coverPath ? `style="background-image:url('${p.coverPath}')"` : ''}>${p.coverPath ? '' : initials(p.authorName)}</div>
        <div><div class="related-title">${escapeHtml(p.title)}</div><div class="related-author-name">${escapeHtml(p.authorName)}</div></div>
      </div>
    `).join('');
  } catch (e) { c.innerHTML = ''; }
}

function openInviteForRole(role) {
  if (!STATE.currentUser) return go('s-auth');
  document.getElementById('invite-modal').dataset.role = role;
  openInvite();
}
