const jwt = require('jsonwebtoken');

function requireClient(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token de cliente ausente.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_CLIENT_SECRET);
    if (payload.role !== 'client') throw new Error('role invalida');
    req.client = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token de cliente invalido ou expirado.' });
  }
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token de admin ausente.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_ADMIN_SECRET);
    if (payload.role !== 'admin') throw new Error('role invalida');
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token de admin invalido ou expirado.' });
  }
}

// Preenche req.client quando o token existe, mas nao bloqueia a rota
// caso o cliente nao esteja logado (usado na pagina de detalhes do produto).
function optionalClient(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_CLIENT_SECRET);
    if (payload.role === 'client') req.client = payload;
  } catch {
    // ignora token invalido em rota opcional
  }
  next();
}

module.exports = { requireClient, requireAdmin, optionalClient };
