const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');
const { signClientToken, signAdminToken } = require('../utils/jwt');
const { requireClient, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// `table` vem sempre de constante interna ('clients' | 'admins'), nunca da requisicao.
async function findByCredentials(table, email, password) {
  const { rows } = await pool.query(`SELECT * FROM ${table} WHERE email = $1`, [String(email).toLowerCase()]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return null;
  delete user.password_hash;
  return user;
}

// ---- Clientes ----

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha sao obrigatorios.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    const normalizedEmail = String(email).toLowerCase();
    const existing = await pool.query('SELECT id FROM clients WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Ja existe um cliente cadastrado com este e-mail.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO clients (name, email, password_hash, phone) VALUES ($1,$2,$3,$4)
       RETURNING id, name, email, phone, created_at`,
      [name, normalizedEmail, hash, phone || null]
    );

    const client = rows[0];
    res.status(201).json({ client, token: signClientToken(client) });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'E-mail e senha sao obrigatorios.' });

    const client = await findByCredentials('clients', email, password);
    if (!client) return res.status(401).json({ error: 'Credenciais invalidas.' });

    res.json({ client, token: signClientToken(client) });
  })
);

router.get(
  '/me',
  requireClient,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query('SELECT id, name, email, phone, created_at FROM clients WHERE id = $1', [
      req.client.id
    ]);
    if (!rows.length) return res.status(404).json({ error: 'Cliente nao encontrado.' });
    res.json({ client: rows[0] });
  })
);

// ---- Admins ----

router.post(
  '/admin/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'E-mail e senha sao obrigatorios.' });

    const admin = await findByCredentials('admins', email, password);
    if (!admin) return res.status(401).json({ error: 'Credenciais invalidas.' });

    res.json({ admin, token: signAdminToken(admin) });
  })
);

router.get(
  '/admin/me',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query('SELECT id, name, email, role, created_at FROM admins WHERE id = $1', [
      req.admin.id
    ]);
    if (!rows.length) return res.status(404).json({ error: 'Admin nao encontrado.' });
    res.json({ admin: rows[0] });
  })
);

module.exports = router;
