const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { signClientToken, signAdminToken } = require('../utils/jwt');
const { requireClient, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ---- Clientes ----

router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, e-mail e senha sao obrigatorios.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    const existing = await pool.query('SELECT id FROM clients WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Ja existe um cliente cadastrado com este e-mail.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO clients (name, email, password_hash, phone) VALUES ($1,$2,$3,$4)
       RETURNING id, name, email, phone, created_at`,
      [name, email.toLowerCase(), hash, phone || null]
    );

    const client = result.rows[0];
    const token = signClientToken(client);
    res.status(201).json({ client, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar cliente.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'E-mail e senha sao obrigatorios.' });

  try {
    const result = await pool.query('SELECT * FROM clients WHERE email = $1', [email.toLowerCase()]);
    const client = result.rows[0];
    if (!client) return res.status(401).json({ error: 'Credenciais invalidas.' });

    const valid = await bcrypt.compare(password, client.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciais invalidas.' });

    const token = signClientToken(client);
    delete client.password_hash;
    res.json({ client, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao efetuar login.' });
  }
});

router.get('/me', requireClient, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, phone, created_at FROM clients WHERE id = $1', [
      req.client.id
    ]);
    if (!result.rows.length) return res.status(404).json({ error: 'Cliente nao encontrado.' });
    res.json({ client: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar cliente.' });
  }
});

// ---- Admins ----

router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'E-mail e senha sao obrigatorios.' });

  try {
    const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email.toLowerCase()]);
    const admin = result.rows[0];
    if (!admin) return res.status(401).json({ error: 'Credenciais invalidas.' });

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciais invalidas.' });

    const token = signAdminToken(admin);
    delete admin.password_hash;
    res.json({ admin, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao efetuar login.' });
  }
});

router.get('/admin/me', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, created_at FROM admins WHERE id = $1', [
      req.admin.id
    ]);
    if (!result.rows.length) return res.status(404).json({ error: 'Admin nao encontrado.' });
    res.json({ admin: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar admin.' });
  }
});

module.exports = router;
