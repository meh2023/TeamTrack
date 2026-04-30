const express = require('express');
const prisma = require('../config/db');
const auth = require('../middleware/auth');
const { requireProjectRole } = require('../middleware/rbac');

const router = express.Router();

// GET /api/projects — list user's projects
router.get('/', auth, async (req, res) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.userId },
      include: {
        project: {
          include: {
            _count: { select: { tasks: true, members: true } },
            tasks: { select: { status: true } },
          },
        },
      },
    });

    const projects = memberships.map((m) => ({
      ...m.project,
      role: m.role,
      taskCount: m.project._count.tasks,
      memberCount: m.project._count.members,
      taskStats: {
        todo: m.project.tasks.filter((t) => t.status === 'TODO').length,
        inProgress: m.project.tasks.filter((t) => t.status === 'IN_PROGRESS').length,
        done: m.project.tasks.filter((t) => t.status === 'DONE').length,
      },
      tasks: undefined,
      _count: undefined,
    }));

    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects — create project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const project = await prisma.project.create({
      data: {
        name,
        description: description || '',
        ownerId: req.userId,
        members: {
          create: { userId: req.userId, role: 'ADMIN' },
        },
      },
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/projects/:id — get project details
router.get('/:id', auth, requireProjectRole(), async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { tasks: true } },
      },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    res.json({ ...project, currentUserRole: req.membership.role });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/projects/:id — update project (Admin only)
router.put('/:id', auth, requireProjectRole('ADMIN'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(description !== undefined && { description }) },
    });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id — delete project (Admin only)
router.delete('/:id', auth, requireProjectRole('ADMIN'), async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
