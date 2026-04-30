const express = require('express');
const prisma = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard — aggregated stats for current user
router.get('/', auth, async (req, res) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.userId },
      select: { projectId: true },
    });
    const projectIds = memberships.map((m) => m.projectId);

    const [totalProjects, allTasks, myTasks] = await Promise.all([
      projectIds.length,
      prisma.task.findMany({
        where: { projectId: { in: projectIds } },
        select: { status: true, dueDate: true },
      }),
      prisma.task.findMany({
        where: { assigneeId: req.userId },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const now = new Date();
    const stats = {
      totalProjects,
      totalTasks: allTasks.length,
      todo: allTasks.filter((t) => t.status === 'TODO').length,
      inProgress: allTasks.filter((t) => t.status === 'IN_PROGRESS').length,
      done: allTasks.filter((t) => t.status === 'DONE').length,
      overdue: allTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE').length,
    };

    res.json({ stats, recentTasks: myTasks });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
