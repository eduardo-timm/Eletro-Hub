const jwt = require('jsonwebtoken');

const ROLES = {
  client: { secretEnv: 'JWT_CLIENT_SECRET', label: 'cliente' },
  admin: { secretEnv: 'JWT_ADMIN_SECRET', label: 'admin' }
};

// Gera um middleware que exige token valido do papel informado e o expoe em req.client / req.admin.
function requireRole(role) {
  const { secretEnv, label } = ROLES[role];

  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: `Token de ${label} ausente.` });

    let payload = null;
    try {
      payload = jwt.verify(token, process.env[secretEnv]);
    } catch {
      payload = null;
    }

    if (!payload || payload.role !== role) {
      return res.status(401).json({ error: `Token de ${label} invalido ou expirado.` });
    }

    req[role] = payload;
    next();
  };
}

module.exports = {
  requireClient: requireRole('client'),
  requireAdmin: requireRole('admin')
};
