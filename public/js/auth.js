// Redirect if already logged in
if (getToken()) window.location.href = '/dashboard.html';

function showTab(tab) {
  document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('signup-form').style.display = tab === 'signup' ? 'block' : 'none';
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('login-error').textContent = '';
  document.getElementById('signup-error').textContent = '';
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  btn.textContent = 'Logging in...';
  btn.disabled = true;

  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: {
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value,
      },
    });
    setToken(data.token);
    setUser(data.user);
    window.location.href = '/dashboard.html';
  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    btn.textContent = 'Login';
    btn.disabled = false;
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const btn = document.getElementById('signup-btn');
  const errEl = document.getElementById('signup-error');
  errEl.textContent = '';
  btn.textContent = 'Creating...';
  btn.disabled = true;

  try {
    const data = await api('/auth/signup', {
      method: 'POST',
      body: {
        name: document.getElementById('signup-name').value,
        email: document.getElementById('signup-email').value,
        password: document.getElementById('signup-password').value,
      },
    });
    setToken(data.token);
    setUser(data.user);
    window.location.href = '/dashboard.html';
  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    btn.textContent = 'Create Account';
    btn.disabled = false;
  }
}
