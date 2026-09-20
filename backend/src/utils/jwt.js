const jwt = require('jsonwebtoken');

function signClientToken(client) {
  return jwt.sign({ id: client.id, email: client.email, role: 'client' }, process.env.JWT_CLIENT_SECRET, {
    expiresIn: '30d'
  });
}

function signAdminToken(admin) {
  return jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, process.env.JWT_ADMIN_SECRET, {
    expiresIn: '7d'
  });
}

module.exports = { signClientToken, signAdminToken };
