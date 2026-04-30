const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('tf_token');
}

function setToken(token) {
  localStorage.setItem('tf_token', token);
}

function setUser(user) {
  localStorage.setItem('tf_user', JSON.stringify(user));
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('tf_user')); } catch { return null; }
}

function logout() {
  localStorage.removeItem('tf_token');
  localStorage.removeItem('tf_user');
  window.location.href = '/';
}

async function api(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function showToast(msg, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = '/';
    return false;
  }
  return true;
}
