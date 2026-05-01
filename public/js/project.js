if (!requireAuth()) throw new Error('Not authenticated');

const user = getUser();
const params = new URLSearchParams(window.location.search);
const projectId = params.get('id');
if (!projectId) window.location.href = '/dashboard.html';

let currentProject = null;
let currentRole = 'MEMBER';
let members = [];

// Sidebar
document.getElementById('sidebar-user').innerHTML = `
  <div class="avatar">${initials(user.name)}</div>
  <div class="info"><div class="name">${user.name}</div><div class="email">${user.email}</div></div>
  <button class="logout-btn" onclick="logout()" title="Logout">⏻</button>
`;

loadProject();

async function loadProject() {
  try {
    const [project, tasks] = await Promise.all([
      api(`/projects/${projectId}`),
      api(`/projects/${projectId}/tasks`),
    ]);

    currentProject = project;
    currentRole = project.currentUserRole;
    members = project.members || [];

    renderHeader(project);
    renderKanban(tasks);
    renderMembers(project.members);
    populateAssignees(project.members);

    // Show admin features
    if (currentRole === 'ADMIN') {
      document.getElementById('members-section').style.display = 'block';
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderHeader(p) {
  const adminBtns = currentRole === 'ADMIN'
    ? `<button class="btn btn-secondary btn-sm" onclick="openEditProject()">✏️ Edit</button>`
    : '';

  document.getElementById('project-header').innerHTML = `
    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
      <h1 class="page-title" style="margin-bottom:0">${esc(p.name)}</h1>
      <span class="role-badge ${currentRole === 'ADMIN' ? 'role-admin' : 'role-member'}" style="font-size:.75rem">${currentRole}</span>
      ${adminBtns}
    </div>
    ${p.description ? `<p style="color:var(--text-dim);font-size:.88rem;margin-top:.4rem">${esc(p.description)}</p>` : ''}
  `;
  document.title = `TeamTrack — ${p.name}`;
}

function renderKanban(tasks) {
  const cols = { TODO: [], IN_PROGRESS: [], DONE: [] };
  tasks.forEach(t => cols[t.status].push(t));

  document.getElementById('count-todo').textContent = cols.TODO.length;
  document.getElementById('count-progress').textContent = cols.IN_PROGRESS.length;
  document.getElementById('count-done').textContent = cols.DONE.length;

  document.getElementById('col-todo-tasks').innerHTML = renderTaskCards(cols.TODO, 'TODO');
  document.getElementById('col-progress-tasks').innerHTML = renderTaskCards(cols.IN_PROGRESS, 'IN_PROGRESS');
  document.getElementById('col-done-tasks').innerHTML = renderTaskCards(cols.DONE, 'DONE');
}

function renderTaskCards(tasks, currentStatus) {
  if (!tasks.length) return `<div class="empty-state" style="padding:1.5rem"><p style="font-size:.8rem">No tasks</p></div>`;

  return tasks.map(t => {
    const overdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE';
    const canEdit = currentRole === 'ADMIN' || t.assigneeId === user.id;

    // Status change buttons
    const statusOptions = ['TODO', 'IN_PROGRESS', 'DONE'].filter(s => s !== currentStatus);
    const statusBtns = canEdit ? `
      <div class="status-btns" style="margin-top:.5rem">
        ${statusOptions.map(s => `<button onclick="changeStatus('${t.id}','${s}')">${statusLabel(s)}</button>`).join('')}
      </div>
    ` : '';

    const deleteBtnHtml = currentRole === 'ADMIN' ? `<button class="btn btn-danger btn-sm" style="padding:.2rem .5rem;font-size:.65rem" onclick="deleteTask('${t.id}')">✕</button>` : '';
    const editBtnHtml = canEdit ? `<button class="btn btn-secondary btn-sm" style="padding:.2rem .5rem;font-size:.65rem" onclick='openEditTask(${JSON.stringify(t).replace(/'/g, "\\'")})'>✎</button>` : '';

    return `
      <div class="task-card" ${canEdit ? `draggable="true" ondragstart="handleDragStart(event, '${t.id}')" ondragend="handleDragEnd(event)"` : ''}>
        <div style="display:flex;justify-content:space-between;align-items:start;gap:.4rem">
          <div class="task-title">${esc(t.title)}</div>
          <div style="display:flex;gap:.2rem;flex-shrink:0">${editBtnHtml}${deleteBtnHtml}</div>
        </div>
        ${t.description ? `<div class="task-desc">${esc(t.description)}</div>` : ''}
        <div class="task-meta">
          <span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span>
          ${overdue ? '<span class="badge badge-overdue">OVERDUE</span>' : ''}
          ${t.dueDate ? `<span style="font-size:.7rem;color:var(--text-dim)">${new Date(t.dueDate).toLocaleDateString()}</span>` : ''}
          ${t.assignee ? `<span class="assignee" title="${esc(t.assignee.name)}">${initials(t.assignee.name)}</span>` : ''}
        </div>
        ${statusBtns}
      </div>
    `;
  }).join('');
}

// Drag and Drop Logic
let draggedTaskId = null;

function handleDragStart(e, id) {
  draggedTaskId = id;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => e.target.style.opacity = '0.4', 0); // Visual feedback
}

function handleDragEnd(e) {
  e.target.style.opacity = '1';
}

function handleDragOver(e) {
  e.preventDefault(); // Necessary to allow dropping
  e.dataTransfer.dropEffect = 'move';
}

async function handleDrop(e, newStatus) {
  e.preventDefault();
  if (!draggedTaskId) return;
  
  const taskId = draggedTaskId;
  draggedTaskId = null;
  
  // Instantly trigger the status change (the API call handles the reload)
  await changeStatus(taskId, newStatus);
}

function statusLabel(s) {
  return { TODO: '📋 To Do', IN_PROGRESS: '🔄 Progress', DONE: '✅ Done' }[s] || s;
}

function renderMembers(mbrs) {
  const list = document.getElementById('members-list');
  list.innerHTML = mbrs.map(m => `
    <div class="member-row">
      <div class="avatar">${initials(m.user.name)}</div>
      <div class="info"><div class="name">${esc(m.user.name)}</div><div class="email">${esc(m.user.email)}</div></div>
      <span class="role-badge ${m.role === 'ADMIN' ? 'role-admin' : 'role-member'}">${m.role}</span>
      ${currentRole === 'ADMIN' && m.userId !== user.id ? `
        <button class="btn btn-secondary btn-sm" onclick="toggleRole('${m.userId}','${m.role}')">${m.role === 'ADMIN' ? '↓ Member' : '↑ Admin'}</button>
        <button class="btn btn-danger btn-sm" onclick="removeMember('${m.userId}')">Remove</button>
      ` : ''}
    </div>
  `).join('');
}

function populateAssignees(mbrs) {
  const sel = document.getElementById('task-assignee');
  sel.innerHTML = '<option value="">Unassigned</option>' +
    mbrs.map(m => `<option value="${m.userId}">${esc(m.user.name)}</option>`).join('');
}

// Task actions
async function saveTask(e) {
  e.preventDefault();
  const editId = document.getElementById('task-edit-id').value;
  const body = {
    title: document.getElementById('task-title').value,
    description: document.getElementById('task-desc').value,
    priority: document.getElementById('task-priority').value,
    assigneeId: document.getElementById('task-assignee').value || null,
    dueDate: document.getElementById('task-due').value || null,
  };

  try {
    if (editId) {
      await api(`/projects/${projectId}/tasks/${editId}`, { method: 'PUT', body });
      showToast('Task updated!');
    } else {
      await api(`/projects/${projectId}/tasks`, { method: 'POST', body });
      showToast('Task created!');
    }
    closeModal('task-modal');
    resetTaskForm();
    loadProject();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function changeStatus(taskId, status) {
  try {
    await api(`/projects/${projectId}/tasks/${taskId}`, { method: 'PUT', body: { status } });
    loadProject();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteTask(taskId) {
  if (!confirm('Delete this task?')) return;
  try {
    await api(`/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' });
    showToast('Task deleted');
    loadProject();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openEditTask(t) {
  document.getElementById('task-modal-title').textContent = 'Edit Task';
  document.getElementById('task-edit-id').value = t.id;
  document.getElementById('task-title').value = t.title;
  document.getElementById('task-desc').value = t.description || '';
  document.getElementById('task-priority').value = t.priority;
  document.getElementById('task-assignee').value = t.assigneeId || '';
  document.getElementById('task-due').value = t.dueDate ? t.dueDate.split('T')[0] : '';
  openModal('task-modal');
}

function resetTaskForm() {
  document.getElementById('task-modal-title').textContent = 'Add Task';
  document.getElementById('task-edit-id').value = '';
  document.getElementById('task-title').value = '';
  document.getElementById('task-desc').value = '';
  document.getElementById('task-priority').value = 'MEDIUM';
  document.getElementById('task-assignee').value = '';
  document.getElementById('task-due').value = '';
}

// Member actions
async function addMember(e) {
  e.preventDefault();
  try {
    await api(`/projects/${projectId}/members`, {
      method: 'POST',
      body: {
        email: document.getElementById('member-email').value,
        role: document.getElementById('member-role').value,
      },
    });
    closeModal('member-modal');
    document.getElementById('member-email').value = '';
    showToast('Member added!');
    loadProject();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function toggleRole(userId, currentRole) {
  const newRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
  try {
    await api(`/projects/${projectId}/members/${userId}`, { method: 'PUT', body: { role: newRole } });
    showToast('Role updated');
    loadProject();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function removeMember(userId) {
  if (!confirm('Remove this member?')) return;
  try {
    await api(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' });
    showToast('Member removed');
    loadProject();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Project edit/delete
function openEditProject() {
  document.getElementById('edit-proj-name').value = currentProject.name;
  document.getElementById('edit-proj-desc').value = currentProject.description || '';
  openModal('edit-project-modal');
}

async function updateProject(e) {
  e.preventDefault();
  try {
    await api(`/projects/${projectId}`, {
      method: 'PUT',
      body: {
        name: document.getElementById('edit-proj-name').value,
        description: document.getElementById('edit-proj-desc').value,
      },
    });
    closeModal('edit-project-modal');
    showToast('Project updated!');
    loadProject();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteProject() {
  if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
  try {
    await api(`/projects/${projectId}`, { method: 'DELETE' });
    showToast('Project deleted');
    window.location.href = '/dashboard.html';
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
