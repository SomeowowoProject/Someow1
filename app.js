// public/js/app.js — bootstrap

// ── Invite modal ────────────────────────────────────────
function openInvite() {
  document.getElementById('invite-modal').classList.add('open');
  document.getElementById('invite-search').value = '';
  document.getElementById('modal-list').innerHTML = '';
  setTimeout(() => document.getElementById('invite-search').focus(), 50);
}
function closeInvite() {
  document.getElementById('invite-modal').classList.remove('open');
}
async function searchInviteUsers() {
  const q = document.getElementById('invite-search').value.trim();
  if (!q) { document.getElementById('modal-list').innerHTML = ''; return; }
  try {
    const r = await API.listUsers(q);
    const list = document.getElementById('modal-list');
    list.innerHTML = (r.users || []).slice(0, 10).map(u => `
      <div class="modal-result">
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="author-av" ${u.avatarPath ? `style="background-image:url('${u.avatarPath}')"` : ''}>${u.avatarPath ? '' : initials(u.name)}</div>
          <div>
            <div style="font-size:0.85rem;font-weight:500;">${escapeHtml(u.name)}</div>
            <div style="font-size:0.75rem;color:var(--text-secondary);">@${escapeHtml(u.handle)}</div>
          </div>
        </div>
        <button class="btn-secondary" style="font-size:0.75rem;padding:4px 12px;" onclick="sendInvite('${escapeHtml(u.handle)}')">Invite</button>
      </div>
    `).join('');
  } catch (e) { showToast(e.message); }
}

async function sendInvite(handle) {
  const project = STATE.viewedProject && STATE.viewedProject.project;
  if (!project) { showToast('Open a project first'); return; }
  const role = document.getElementById('invite-modal').dataset.role || 'member';
  try {
    await API.inviteToProject(project.id, handle, role);
    showToast('Invite sent to @' + handle);
    closeInvite();
  } catch (e) { showToast(e.message); }
}

// ── Boot ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Restore theme
  let savedTheme = 'light';
  try { savedTheme = localStorage.getItem('dakdori-theme') || 'light'; } catch {}
  document.documentElement.setAttribute('data-theme', savedTheme);
  syncThemeLabel();

  // Build sidebar + chip strip + compose select
  buildSidebarFields();
  buildChipStrip();
  buildComposeFieldSelect();

  // Chip-strip scroll listener
  const strip = document.getElementById('cat-strip');
  if (strip) {
    strip.addEventListener('scroll', updateCatFade);
    setTimeout(updateCatFade, 50);
  }

  // Modal background click — close
  document.getElementById('invite-modal').addEventListener('click', e => {
    if (e.target.id === 'invite-modal') closeInvite();
  });
  document.getElementById('location-modal').addEventListener('click', e => {
    if (e.target.id === 'location-modal') closeLocationPicker();
  });

  // Escape — close any open modal
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (document.getElementById('invite-modal').classList.contains('open')) closeInvite();
    if (document.getElementById('location-modal').classList.contains('open')) closeLocationPicker();
  });

  // Card flip via double-click (toggle)
  document.body.addEventListener('dblclick', e => {
    const card = e.target.closest('.card');
    if (card) card.classList.toggle('flip');
  });

  // Try to restore session
  try {
    const r = await API.me();
    STATE.currentUser = r.user;
    await refreshNavAvatar();
    go('s-home');
    await loadHome(true);
    setupHomeScroll();
  } catch {
    go('s-auth');
  }
});
