// public/js/community.js — community feed per field
let currentCommunity = null;

async function openCommunity(field) {
  currentCommunity = field;
  go('s-community');
  document.getElementById('c-icon').textContent = fieldIcon(field);
  document.getElementById('c-name').textContent = fieldLabel(field);
  document.getElementById('c-desc').textContent = FIELD_DESCS[field] || '';
  document.getElementById('c-about-text').textContent = FIELD_DESCS[field] || '';

  // member count placeholder (could be a real count via API later)
  document.getElementById('c-members').textContent = '';

  // current user avatar in compose box
  if (STATE.currentUser) setAvatarEl(document.getElementById('c-feed-av'), STATE.currentUser);

  await loadPosts();
}

async function loadPosts() {
  const c = document.getElementById('c-posts');
  c.innerHTML = '';
  try {
    const r = await API.listPosts(currentCommunity);
    if ((r.posts || []).length === 0) {
      c.innerHTML = '<div class="empty-state">No posts yet. Be the first.</div>';
      return;
    }
    c.innerHTML = r.posts.map(renderPost).join('');
  } catch (e) {
    c.innerHTML = '<div class="empty-state">Failed to load.</div>';
  }
}

function renderPost(p) {
  const av = p.author_avatar
    ? `style="background-image:url('${p.author_avatar}')"`
    : '';
  const init = p.author_avatar ? '' : initials(p.author_name);
  return `
    <div class="post">
      <div class="feed-av" ${av} onclick="openProfile('${escapeHtml(p.author_handle)}')" style="cursor:pointer;">${init}</div>
      <div class="post-body">
        <div class="post-header">
          <span class="post-name" onclick="openProfile('${escapeHtml(p.author_handle)}')" style="cursor:pointer;">${escapeHtml(p.author_name)}</span>
          <span class="post-handle">@${escapeHtml(p.author_handle)}</span>
          <span class="post-time">· ${timeAgo(p.created_at)}</span>
        </div>
        <div class="post-text">${escapeHtml(p.body)}</div>
      </div>
    </div>`;
}

async function submitPost() {
  if (!STATE.currentUser) return go('s-auth');
  const body = document.getElementById('c-post-body').value.trim();
  if (!body) return showToast('Write something first');
  try {
    await API.createPost(currentCommunity, body);
    document.getElementById('c-post-body').value = '';
    await loadPosts();
    showToast('Posted');
  } catch (e) { showToast(e.message); }
}
