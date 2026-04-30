const prisma = require('../config/db');

// Middleware factory: checks that the user is a member of the project
// and optionally requires a specific role
function requireProjectRole(...allowedRoles) {
  return async (req, res, next) => {
    const projectId = req.params.projectId || req.params.id;
    if (!projectId) return res.status(400).json({ error: 'Project ID required' });

    try {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: req.userId } },
      });

      if (!membership) {
        return res.status(403).json({ error: 'Not a member of this project' });
      }

      req.membership = membership;

      if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  };
}

module.exports = { requireProjectRole };
