// public/js/auth.js — sign in / sign up
let authMode = 'signin';

function toggleAuthMode() {
  authMode = authMode === 'signin' ? 'signup' : 'signin';
  const isSignup = authMode === 'signup';
  document.getElementById('auth-title').textContent = isSignup ? 'Sign up' : 'Sign in';
  document.getElementById('auth-sub').textContent = isSignup ? 'Build your portfolio. Find collaborators.' : 'Welcome back to Dakdori';
  document.getElementById('auth-name').style.display = isSignup ? 'block' : 'none';
  document.getElementById('auth-handle').style.display = isSignup ? 'block' : 'none';
  document.getElementById('auth-email').style.display = isSignup ? 'block' : 'none';
  document.getElementById('auth-identifier').style.display = isSignup ? 'none' : 'block';
  document.getElementById('auth-submit').textContent = isSignup ? 'Create account' : 'Sign in';
  document.getElementById('auth-toggle-text').textContent = isSignup ? 'Already have an account?' : 'No account?';
  document.getElementById('auth-toggle-link').textContent = isSignup ? 'Sign in' : 'Sign up';
  hideAuthError();
}

function showAuthError(msg) {
  const e = document.getElementById('auth-error');
  e.textContent = msg;
  e.classList.add('show');
}
function hideAuthError() {
  document.getElementById('auth-error').classList.remove('show');
}

async function submitAuth(ev) {
  ev.preventDefault();
  hideAuthError();
  const password = document.getElementById('auth-password').value;
  try {
    if (authMode === 'signup') {
      const name = document.getElementById('auth-name').value.trim();
      const handle = document.getElementById('auth-handle').value.trim();
      const email = document.getElementById('auth-email').value.trim();
      if (!name || !handle || !email || !password) throw new Error('All fields required');
      const r = await API.signup({ name, handle, email, password });
      STATE.currentUser = r.user;
    } else {
      const identifier = document.getElementById('auth-identifier').value.trim();
      if (!identifier || !password) throw new Error('All fields required');
      const r = await API.login({ identifier, password });
      STATE.currentUser = r.user;
    }
    showToast('Welcome, ' + STATE.currentUser.name);
    await afterAuthSuccess();
  } catch (e) {
    showAuthError(e.message || 'Auth failed');
  }
  return false;
}

async function logout() {
  try { await API.logout(); } catch {}
  STATE.currentUser = null;
  go('s-auth');
}

async function afterAuthSuccess() {
  await refreshNavAvatar();
  go('s-home');
  await loadHome();
}

async function refreshNavAvatar() {
  if (!STATE.currentUser) return;
  document.querySelectorAll('.avatar-nav').forEach(el => setAvatarEl(el, STATE.currentUser));
}
