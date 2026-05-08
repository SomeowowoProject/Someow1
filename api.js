// public/js/api.js — fetch wrappers
const API = {
  async req(method, url, body, isFormData) {
    const opts = { method, credentials: 'same-origin', headers: {} };
    if (body !== undefined) {
      if (isFormData) {
        opts.body = body;
      } else {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
      }
    }
    const res = await fetch(url, opts);
    let data = null;
    try { data = await res.json(); } catch {}
    if (!res.ok) {
      const err = new Error((data && data.error) || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  },
  get(url) { return this.req('GET', url); },
  post(url, body) { return this.req('POST', url, body); },
  put(url, body) { return this.req('PUT', url, body); },
  del(url) { return this.req('DELETE', url); },
  upload(url, fd) { return this.req('POST', url, fd, true); },

  // ── auth
  signup(payload) { return this.post('/api/auth/signup', payload); },
  login(payload) { return this.post('/api/auth/login', payload); },
  logout() { return this.post('/api/auth/logout', {}); },
  me() { return this.get('/api/auth/me'); },

  // ── users
  listUsers(q) { return this.get('/api/users' + (q ? '?q=' + encodeURIComponent(q) : '')); },
  getUser(handle) { return this.get('/api/users/' + encodeURIComponent(handle)); },
  updateMe(data) { return this.put('/api/users/me/profile', data); },
  uploadAvatar(file) { const fd = new FormData(); fd.append('image', file); return this.upload('/api/users/me/avatar', fd); },
  uploadCover(file) { const fd = new FormData(); fd.append('image', file); return this.upload('/api/users/me/cover', fd); },
  follow(handle) { return this.post('/api/users/' + encodeURIComponent(handle) + '/follow'); },
  unfollow(handle) { return this.del('/api/users/' + encodeURIComponent(handle) + '/follow'); },
  getReviews(handle) { return this.get('/api/users/' + encodeURIComponent(handle) + '/reviews'); },
  postReview(handle, payload) { return this.post('/api/users/' + encodeURIComponent(handle) + '/reviews', payload); },

  // ── projects
  listProjects(params) {
    const qs = new URLSearchParams(params || {}).toString();
    return this.get('/api/projects' + (qs ? '?' + qs : ''));
  },
  getProject(id) { return this.get('/api/projects/' + id); },
  createProject(payload) { return this.post('/api/projects', payload); },
  uploadProjectMedia(id, files) {
    const fd = new FormData();
    for (const f of files) fd.append('files', f);
    return this.upload('/api/projects/' + id + '/media', fd);
  },
  inviteToProject(id, handle, role) { return this.post('/api/projects/' + id + '/invite', { handle, role }); },

  // ── posts
  listPosts(field) { return this.get('/api/posts?field=' + encodeURIComponent(field)); },
  createPost(field, body) { return this.post('/api/posts', { field, body }); }
};
