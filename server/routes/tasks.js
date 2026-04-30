const express = require('express');
const prisma = require('../config/db');
const auth = require('../middleware/auth');
const { requireProjectRole } = require('../middleware/rbac');

const router = express.Router({ mergeParams: true });

// GET /api/projects/:id/tasks
router.get('/', auth, requireProjectRole(), async (req, res) => {
  try {
    const { status, priority, assigneeId } = req.query;
    const where = { projectId: req.params.id };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects/:id/tasks
router.post('/', auth, requireProjectRole(), async (req, res) => {
  try {
    const { title, description, priority, dueDate, assigneeId } = req.body;
    if (!title) return res.status(400).json({ error: 'Task title is required' });

    // If assigning, verify assignee is a member
    if (assigneeId) {
      const isMember = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: req.params.id, userId: assigneeId } },
      });
      if (!isMember) return res.status(400).json({ error: 'Assignee is not a project member' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: req.params.id,
        assigneeId: assigneeId || null,
        creatorId: req.userId,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/projects/:id/tasks/:taskId
router.put('/:taskId', auth, requireProjectRole(), async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.projectId !== req.params.id) return res.status(400).json({ error: 'Task does not belong to this project' });

    // Members can only update tasks assigned to them
    if (req.membership.role === 'MEMBER' && task.assigneeId !== req.userId) {
      return res.status(403).json({ error: 'You can only update tasks assigned to you' });
    }

    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    const updated = await prisma.task.update({
      where: { id: req.params.taskId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id/tasks/:taskId (Admin only)
router.delete('/:taskId', auth, requireProjectRole('ADMIN'), async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.projectId !== req.params.id) return res.status(400).json({ error: 'Task does not belong to this project' });

    await prisma.task.delete({ where: { id: req.params.taskId } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
