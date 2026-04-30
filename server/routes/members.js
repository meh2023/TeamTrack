const express = require('express');
const prisma = require('../config/db');
const auth = require('../middleware/auth');
const { requireProjectRole } = require('../middleware/rbac');

const router = express.Router({ mergeParams: true });

// GET /api/projects/:id/members
router.get('/', auth, requireProjectRole(), async (req, res) => {
  try {
    const members = await prisma.projectMember.findMany({
      where: { projectId: req.params.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects/:id/members — add member by email (Admin only)
router.post('/', auth, requireProjectRole('ADMIN'), async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found with that email' });

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: req.params.id, userId: user.id } },
    });
    if (existing) return res.status(409).json({ error: 'User is already a member' });

    const member = await prisma.projectMember.create({
      data: {
        projectId: req.params.id,
        userId: user.id,
        role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/projects/:id/members/:userId — change role (Admin only)
router.put('/:userId', auth, requireProjectRole('ADMIN'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['ADMIN', 'MEMBER'].includes(role)) {
      return res.status(400).json({ error: 'Valid role (ADMIN/MEMBER) required' });
    }

    const member = await prisma.projectMember.update({
      where: {
        projectId_userId: { projectId: req.params.id, userId: req.params.userId },
      },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.json(member);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id/members/:userId — remove member (Admin only)
router.delete('/:userId', auth, requireProjectRole('ADMIN'), async (req, res) => {
  try {
    if (req.params.userId === req.userId) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId: req.params.id, userId: req.params.userId },
      },
    });

    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
