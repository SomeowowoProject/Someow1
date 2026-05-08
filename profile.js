// public/js/profile.js — profile read/edit
let profileEditMode = false;
let profileVisitorView = false;
let profileSnapshot = null;
let viewedHandle = null;

async function goMyProfile() {
  if (!STATE.currentUser) return go('s-auth');
  await openProfile(STATE.currentUser.handle);
}

async function openProfile(handle) {
  viewedHandle = handle;
  go('s-profile');
  document.body.classList.remove('profile-edit');
  profileEditMode = false;
  profileVisitorView = false;
  try {
    const r = await API.getUser(handle);
    STATE.viewedProfile = r;
    renderProfile(r);
  } catch (e) {
    showToast('Failed to load profile');
  }
}

function renderProfile(r) {
  const u = r.user;
  document.querySelector('[data-field="name"]').textContent = u.name;
  document.querySelector('[data-field="handle"]').textContent = '@' + u.handle;
  document.querySelector('[data-field="headline"]').textContent = u.headline || '';
  document.querySelector('[data-field="location"]').textContent = u.location || '—';
  document.querySelector('[data-field="availability"]').textContent = u.availability || '—';
  document.querySelector('[data-field="website"]').textContent = u.website || '—';

  const av = document.getElementById('profile-av-large');
  const init = initials(u.name);
  document.getElementById('prof-av-init').textContent = init;
  if (u.avatarPath) { av.style.backgroundImage = `url('${u.avatarPath}')`; document.getElementById('prof-av-init').style.display='none'; }
  else { av.style.backgroundImage = ''; document.getElementById('prof-av-init').style.display=''; }

  const cover = document.getElementById('profile-cover');
  cover.style.backgroundImage = u.coverPath ? `url('${u.coverPath}')` : '';

  document.getElementById('stat-projects').textContent = r.stats.projects;
  document.getElementById('stat-followers').textContent = r.stats.followers;
  document.getElementById('stat-following').textContent = r.stats.following;
  document.getElementById('stat-collabs').textContent = r.stats.collaborations;

  // bio
  document.querySelector('[data-field="bio"]').textContent = u.bio || 'No bio yet.';

  // about-grid
  const ab = document.getElementById('about-grid');
  ab.innerHTML = '';
  const stockBlocks = [
    ['Pronouns', u.pronouns],
    ['Languages', u.languages],
    ['Available for', u.availableFor],
    ['Rates', u.rates],
    ['Education', u.educationShort],
    ['Based in', u.locationFull]
  ];
  stockBlocks.forEach(([label, val]) => {
    if (!val) return;
    ab.appendChild(makeAboutBlock(label, val));
  });
  (u.customAbout || []).forEach(({ label, value }) => {
    ab.appendChild(makeAboutBlock(label, value));
  });

  // skills, tools
  document.getElementById('skills-grid').innerHTML = (u.skills || []).map(makeTagChip).join('');
  document.getElementById('tools-grid').innerHTML = (u.tools || []).map(makeTagChip).join('');

  // experience, education
  document.getElementById('exp-list').innerHTML = (u.experience || []).map(makeExperienceItem).join('');
  document.getElementById('edu-list').innerHTML = (u.education || []).map(makeExperienceItem).join('');

  // projects
  loadProfileProjects(u.handle);

  // reviews
  loadReviews(u.handle);

  // mode buttons
  const isMe = r.isMe;
  document.getElementById('profile-edit-btn').style.display = isMe ? 'inline-block' : 'none';
  document.getElementById('profile-preview-btn').style.display = isMe ? 'inline-block' : 'none';
  document.getElementById('profile-follow-btn').style.display = isMe ? 'none' : 'inline-block';
  document.getElementById('profile-invite-btn').style.display = isMe ? 'none' : 'inline-block';
  document.getElementById('profile-follow-btn').textContent = r.isFollowing ? 'Unfollow' : 'Follow';
  document.getElementById('profile-mode-badge').textContent = isMe ? 'My profile · read mode' : '@' + u.handle;
  document.getElementById('review-write-area').style.display = isMe ? 'none' : 'block';

  // tag click handlers (link to community)
  document.querySelectorAll('#tab-about .tag-chip').forEach(el => {
    el.onclick = (e) => {
      if (profileEditMode) return;
      if (e.target.classList && e.target.classList.contains('tag-x')) return;
      // Skill/tool tags don't have direct field mapping—open Design as default
      openCommunity('design');
    };
  });
}

function makeAboutBlock(label, value) {
  const div = document.createElement('div');
  div.className = 'about-block';
  div.innerHTML = `
    <span class="item-x" onclick="this.parentElement.remove()">×</span>
    <div class="about-block-label" contenteditable="false">${escapeHtml(label)}</div>
    <div class="about-block-value" contenteditable="false">${escapeHtml(value)}</div>
  `;
  return div;
}

function makeTagChip(label) {
  return `<span class="tag-chip">${escapeHtml(label)}<span class="tag-x" onclick="this.parentElement.remove()">×</span></span>`;
}

function makeExperienceItem(item) {
  return `
    <div class="experience-item">
      <span class="item-x" onclick="this.parentElement.remove()">×</span>
      <div class="experience-period" contenteditable="false">${escapeHtml(item.period || '')}</div>
      <div class="experience-detail">
        <div class="experience-role" contenteditable="false">${escapeHtml(item.role || '')}</div>
        <div class="experience-org" contenteditable="false">${escapeHtml(item.org || '')}</div>
        <div class="experience-desc" contenteditable="false">${escapeHtml(item.desc || '')}</div>
      </div>
    </div>`;
}

async function loadProfileProjects(handle) {
  const grid = document.getElementById('profile-grid');
  grid.innerHTML = '';
  try {
    const r = await API.listProjects({ author: handle, limit: 24 });
    if ((r.projects || []).length === 0) {
      grid.innerHTML = '<div class="empty-state">No projects yet.</div>';
    } else {
      grid.innerHTML = r.projects.map(cardHTML).join('');
    }
  } catch (e) { grid.innerHTML = '<div class="empty-state">Failed to load projects.</div>'; }
}

async function loadReviews(handle) {
  const list = document.getElementById('review-list');
  list.innerHTML = '';
  try {
    const r = await API.getReviews(handle);
    if ((r.reviews || []).length === 0) {
      list.innerHTML = '<div class="empty-state">No reviews yet.</div>';
      return;
    }
    list.innerHTML = r.reviews.map(rv => {
      const av = rv.author_avatar ? `style="background-image:url('${rv.author_avatar}')"` : '';
      const init = initials(rv.author_name);
      return `
        <div class="review-item">
          <div class="review-header">
            <div class="review-av" ${av}>${rv.author_avatar ? '' : init}</div>
            <div>
              <div class="review-author">${escapeHtml(rv.author_name)}</div>
              <div class="review-meta">@${escapeHtml(rv.author_handle)}${rv.meta ? ' · ' + escapeHtml(rv.meta) : ''}</div>
            </div>
          </div>
          <div class="review-text">${escapeHtml(rv.body)}</div>
        </div>`;
    }).join('');
  } catch (e) { list.innerHTML = '<div class="empty-state">Failed to load reviews.</div>'; }
}

async function submitReview() {
  const body = document.getElementById('review-body').value.trim();
  const meta = document.getElementById('review-meta').value.trim();
  if (body.length < 5) return showToast('Review too short');
  try {
    await API.postReview(viewedHandle, { body, meta });
    document.getElementById('review-body').value = '';
    document.getElementById('review-meta').value = '';
    await loadReviews(viewedHandle);
    showToast('Review posted');
  } catch (e) { showToast(e.message); }
}

async function toggleFollow() {
  if (!STATE.currentUser) return go('s-auth');
  const btn = document.getElementById('profile-follow-btn');
  const isFollowing = btn.textContent === 'Unfollow';
  try {
    if (isFollowing) await API.unfollow(viewedHandle);
    else await API.follow(viewedHandle);
    btn.textContent = isFollowing ? 'Follow' : 'Unfollow';
    const sf = document.getElementById('stat-followers');
    sf.textContent = parseInt(sf.textContent || '0', 10) + (isFollowing ? -1 : 1);
  } catch (e) { showToast(e.message); }
}

function openInviteFromProfile() {
  if (!STATE.currentUser) return go('s-auth');
  // pre-fill invite modal target — for now just open the user invite picker
  openInvite();
}

// ── Edit / save / cancel ──
function snapshotProfile() {
  return {
    name: document.querySelector('[data-field="name"]').innerHTML,
    headline: document.querySelector('[data-field="headline"]').innerHTML,
    location: document.querySelector('[data-field="location"]').innerHTML,
    availability: document.querySelector('[data-field="availability"]').innerHTML,
    website: document.querySelector('[data-field="website"]').innerHTML,
    bio: document.querySelector('[data-field="bio"]').innerHTML,
    aboutGrid: document.getElementById('about-grid').innerHTML,
    skillsGrid: document.getElementById('skills-grid').innerHTML,
    toolsGrid: document.getElementById('tools-grid').innerHTML,
    expList: document.getElementById('exp-list').innerHTML,
    eduList: document.getElementById('edu-list').innerHTML
  };
}
function restoreProfile(s) {
  if (!s) return;
  document.querySelector('[data-field="name"]').innerHTML = s.name;
  document.querySelector('[data-field="headline"]').innerHTML = s.headline;
  document.querySelector('[data-field="location"]').innerHTML = s.location;
  document.querySelector('[data-field="availability"]').innerHTML = s.availability;
  document.querySelector('[data-field="website"]').innerHTML = s.website;
  document.querySelector('[data-field="bio"]').innerHTML = s.bio;
  document.getElementById('about-grid').innerHTML = s.aboutGrid;
  document.getElementById('skills-grid').innerHTML = s.skillsGrid;
  document.getElementById('tools-grid').innerHTML = s.toolsGrid;
  document.getElementById('exp-list').innerHTML = s.expList;
  document.getElementById('edu-list').innerHTML = s.eduList;
}

function toggleProfileEdit(on) {
  profileEditMode = on;
  profileVisitorView = false;
  if (on) profileSnapshot = snapshotProfile();
  document.body.classList.toggle('profile-edit', on);
  document.querySelectorAll('#s-profile [data-field]').forEach(el => el.setAttribute('contenteditable', on ? 'true' : 'false'));
  document.querySelectorAll('#s-profile .about-block-value, #s-profile .about-block-label, #s-profile .experience-period, #s-profile .experience-role, #s-profile .experience-org, #s-profile .experience-desc').forEach(el => el.setAttribute('contenteditable', on ? 'true' : 'false'));
  document.getElementById('profile-actions-read').style.display = on ? 'none' : 'flex';
  document.getElementById('profile-actions-edit').style.display = on ? 'flex' : 'none';
  updateProfileBadge();
}

function toggleProfileView() {
  profileVisitorView = !profileVisitorView;
  const backBtn = document.getElementById('profile-back-btn');
  if (profileVisitorView) {
    document.body.classList.remove('profile-edit');
    document.querySelectorAll('#s-profile [contenteditable]').forEach(el => el.setAttribute('contenteditable', 'false'));
    document.getElementById('profile-actions-read').style.display = 'none';
    document.getElementById('profile-actions-edit').style.display = 'none';
    if (backBtn) backBtn.textContent = '← Exit preview';
  } else {
    if (backBtn) backBtn.textContent = '← Back';
    if (profileEditMode) toggleProfileEdit(true);
    else toggleProfileEdit(false);
  }
  updateProfileBadge();
}

function profileBackButton() {
  if (profileVisitorView) toggleProfileView();
  else go('s-home');
}

function updateProfileBadge() {
  const b = document.getElementById('profile-mode-badge');
  if (!b) return;
  if (profileVisitorView) b.textContent = 'Visitor preview';
  else if (profileEditMode) b.textContent = 'My profile · edit mode';
  else b.textContent = STATE.viewedProfile && STATE.viewedProfile.isMe ? 'My profile · read mode' : '@' + (viewedHandle || '');
}

function switchProfileTab(el, id) {
  document.querySelectorAll('#s-profile .p-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Add helpers ──
function addTag(gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const span = document.createElement('span');
  span.className = 'tag-chip';
  span.innerHTML = '<span contenteditable="true" style="outline:none;min-width:40px;">New tag</span> <span class="tag-x" onclick="this.parentElement.remove()">×</span>';
  grid.appendChild(span);
  const editable = span.querySelector('[contenteditable]');
  editable.focus();
  const range = document.createRange(); range.selectNodeContents(editable);
  const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
}

function addAboutField() {
  const grid = document.getElementById('about-grid');
  if (!grid) return;
  const block = document.createElement('div');
  block.className = 'about-block';
  block.innerHTML = `<span class="item-x" onclick="this.parentElement.remove()">×</span><div class="about-block-label" contenteditable="true" style="outline:none;">New field</div><div class="about-block-value" contenteditable="true">Click to edit value</div>`;
  grid.appendChild(block);
  const label = block.querySelector('.about-block-label');
  label.focus();
  const range = document.createRange(); range.selectNodeContents(label);
  const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
}

function addExperience(listId) {
  const list = document.getElementById(listId);
  if (!list) return;
  const item = document.createElement('div');
  item.className = 'experience-item';
  item.innerHTML = `
    <span class="item-x" onclick="this.parentElement.remove()">×</span>
    <div class="experience-period" contenteditable="true">2025 — present</div>
    <div class="experience-detail">
      <div class="experience-role" contenteditable="true">Role / title</div>
      <div class="experience-org" contenteditable="true">Organization</div>
      <div class="experience-desc" contenteditable="true">Brief description.</div>
    </div>`;
  list.insertBefore(item, list.firstChild);
  item.querySelector('.experience-role').focus();
}

// ── Save profile to backend ──
function collectProfile() {
  const t = (sel) => (document.querySelector(sel)?.textContent || '').trim();
  const skills = [...document.querySelectorAll('#skills-grid .tag-chip')].map(el => el.firstChild.textContent ? el.firstChild.textContent.trim() : el.textContent.replace('×','').trim());
  const tools = [...document.querySelectorAll('#tools-grid .tag-chip')].map(el => el.firstChild.textContent ? el.firstChild.textContent.trim() : el.textContent.replace('×','').trim());
  const customAbout = [];
  document.querySelectorAll('#about-grid .about-block').forEach(b => {
    const label = b.querySelector('.about-block-label')?.textContent.trim();
    const value = b.querySelector('.about-block-value')?.textContent.trim();
    if (label && value) customAbout.push({ label, value });
  });
  const experience = [...document.querySelectorAll('#exp-list .experience-item')].map(el => ({
    period: el.querySelector('.experience-period')?.textContent.trim() || '',
    role: el.querySelector('.experience-role')?.textContent.trim() || '',
    org: el.querySelector('.experience-org')?.textContent.trim() || '',
    desc: el.querySelector('.experience-desc')?.textContent.trim() || ''
  }));
  const education = [...document.querySelectorAll('#edu-list .experience-item')].map(el => ({
    period: el.querySelector('.experience-period')?.textContent.trim() || '',
    role: el.querySelector('.experience-role')?.textContent.trim() || '',
    org: el.querySelector('.experience-org')?.textContent.trim() || '',
    desc: el.querySelector('.experience-desc')?.textContent.trim() || ''
  }));
  return {
    name: t('[data-field="name"]'),
    headline: t('[data-field="headline"]'),
    location: t('[data-field="location"]'),
    availability: t('[data-field="availability"]'),
    website: t('[data-field="website"]'),
    bio: t('[data-field="bio"]'),
    skills, tools, customAbout, experience, education
  };
}

async function saveProfile() {
  try {
    const data = collectProfile();
    await API.updateMe(data);
    profileSnapshot = null;
    toggleProfileEdit(false);
    showToast('Profile saved');
  } catch (e) { showToast(e.message); }
}

function cancelProfile() {
  restoreProfile(profileSnapshot);
  profileSnapshot = null;
  toggleProfileEdit(false);
}

async function uploadAvatar(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  try {
    const r = await API.uploadAvatar(file);
    document.getElementById('profile-av-large').style.backgroundImage = `url('${r.path}')`;
    document.getElementById('prof-av-init').style.display = 'none';
    if (STATE.currentUser) STATE.currentUser.avatarPath = r.path;
    refreshNavAvatar();
    showToast('Avatar updated');
  } catch (e) { showToast(e.message); }
}

async function uploadCover(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  try {
    const r = await API.uploadCover(file);
    document.getElementById('profile-cover').style.backgroundImage = `url('${r.path}')`;
    showToast('Cover updated');
  } catch (e) { showToast(e.message); }
}
