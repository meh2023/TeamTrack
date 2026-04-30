if (!requireAuth()) throw new Error('Not authenticated');

const user = getUser();

// Sidebar user info
document.getElementById('sidebar-user').innerHTML = `
  <div class="avatar">${initials(user.name)}</div>
  <div class="info">
    <div class="name">${user.name}</div>
    <div class="email">${user.email}</div>
  </div>
  <button class="logout-btn" onclick="logout()" title="Logout">⏻</button>
`;

document.getElementById('page-title').innerHTML = `Welcome back, <span>${user.name.split(' ')[0]}</span>`;

loadDashboard();

async function loadDashboard() {
  try {
    const [dash, projects] = await Promise.all([
      api('/dashboard'),
      api('/projects'),
    ]);

    renderStats(dash.stats);
    renderProjects(projects);
    renderRecentTasks(dash.recentTasks);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderStats(s) {
  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card"><div class="label">Projects</div><div class="value accent">${s.totalProjects}</div></div>
    <div class="stat-card"><div class="label">Total Tasks</div><div class="value blue">${s.totalTasks}</div></div>
    <div class="stat-card"><div class="label">In Progress</div><div class="value amber">${s.inProgress}</div></div>
    <div class="stat-card"><div class="label">Completed</div><div class="value green">${s.done}</div></div>
    <div class="stat-card"><div class="label">Overdue</div><div class="value red">${s.overdue}</div></div>
  `;
}

function renderProjects(projects) {
  const grid = document.getElementById('projects-grid');
  if (!projects.length) {
    grid.innerHTML = `<div class="empty-state"><div class="icon">📂</div><p>No projects yet. Create your first one!</p></div>`;
    return;
  }

  grid.innerHTML = projects.map(p => {
    const total = p.taskStats.todo + p.taskStats.inProgress + p.taskStats.done;
    const pct = total ? Math.round((p.taskStats.done / total) * 100) : 0;
    return `
      <div class="project-card" onclick="window.location.href='/project.html?id=${p.id}'">
        <h3>${esc(p.name)}</h3>
        <p class="desc">${esc(p.description || 'No description')}</p>
        <div class="meta">
          <span>👥 ${p.memberCount} members</span>
          <span>📋 ${p.taskCount} tasks</span>
          <span class="role-badge ${p.role === 'ADMIN' ? 'role-admin' : 'role-member'}">${p.role}</span>
        </div>
        <div class="progress-bar"><div class="fill" style="width:${pct}%"></div></div>
      </div>
    `;
  }).join('');
}

function renderRecentTasks(tasks) {
  const el = document.getElementById('recent-tasks');
  if (!tasks.length) {
    el.innerHTML = `<div class="empty-state"><div class="icon">✅</div><p>No tasks assigned to you yet.</p></div>`;
    return;
  }

  el.innerHTML = tasks.map(t => {
    const overdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE';
    return `
      <div class="task-card" style="cursor:pointer" onclick="window.location.href='/project.html?id=${t.projectId}'">
        <div class="task-title">${esc(t.title)}</div>
        <div class="task-meta">
          <span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span>
          ${overdue ? '<span class="badge badge-overdue">OVERDUE</span>' : ''}
          ${t.dueDate ? `<span style="font-size:.72rem;color:var(--text-dim)">Due ${new Date(t.dueDate).toLocaleDateString()}</span>` : ''}
          <span style="font-size:.72rem;color:var(--text-dim);margin-left:auto">${t.project?.name || ''}</span>
        </div>
      </div>
    `;
  }).join('');
}

async function createProject(e) {
  e.preventDefault();
  try {
    await api('/projects', {
      method: 'POST',
      body: {
        name: document.getElementById('proj-name').value,
        description: document.getElementById('proj-desc').value,
      },
    });
    closeModal('project-modal');
    showToast('Project created!');
    document.getElementById('proj-name').value = '';
    document.getElementById('proj-desc').value = '';
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
