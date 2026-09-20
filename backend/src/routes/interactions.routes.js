const express = require('express');
const pool = require('../db/pool');
const { requireClient, requireAdmin } = require('../middleware/auth');
const { sendInteractionEmail } = require('../utils/email');

const router = express.Router();

const FULL_SELECT = `
  SELECT i.*, p.name AS product_name, p.image_url AS product_image, c.name AS client_name, c.email AS client_email
  FROM interactions i
  JOIN products p ON p.id = i.product_id
  JOIN clients c ON c.id = i.client_id
`;

// Cliente cria uma interacao: proposta, avaliacao, agendamento ou reserva
router.post('/', requireClient, async (req, res) => {
  const { product_id, type, message, rating, proposed_price, scheduled_at } = req.body;
  const validTypes = ['proposta', 'avaliacao', 'agendamento', 'reserva'];
  if (!product_id || !validTypes.includes(type)) {
    return res.status(400).json({ error: 'product_id e type (proposta|avaliacao|agendamento|reserva) sao obrigatorios.' });
  }
  if (type === 'avaliacao' && (!rating || rating < 1 || rating > 5)) {
    return res.status(400).json({ error: 'Avaliacoes exigem uma nota de 1 a 5.' });
  }

  try {
    const product = await pool.query('SELECT id FROM products WHERE id = $1', [product_id]);
    if (!product.rows.length) return res.status(404).json({ error: 'Produto nao encontrado.' });

    const result = await pool.query(
      `INSERT INTO interactions (product_id, client_id, type, message, rating, proposed_price, scheduled_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [product_id, req.client.id, type, message || null, rating || null, proposed_price || null, scheduled_at || null]
    );
    res.status(201).json({ interaction: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar interacao.' });
  }
});

// Cliente logado ve suas proprias interacoes e respostas
router.get('/mine', requireClient, async (req, res) => {
  try {
    const result = await pool.query(`${FULL_SELECT} WHERE i.client_id = $1 ORDER BY i.created_at DESC`, [
      req.client.id
    ]);
    res.json({ interactions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar interacoes.' });
  }
});

// ---- Administracao ----

router.get('/', requireAdmin, async (req, res) => {
  const { status, type } = req.query;
  const conditions = [];
  const params = [];
  if (status) {
    params.push(status);
    conditions.push(`i.status = $${params.length}`);
  }
  if (type) {
    params.push(type);
    conditions.push(`i.type = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(`${FULL_SELECT} ${where} ORDER BY i.created_at DESC`, params);
    res.json({ interactions: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar interacoes.' });
  }
});

router.put('/:id/respond', requireAdmin, async (req, res) => {
  const { admin_response, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE interactions SET admin_response = $1, status = COALESCE($2, 'respondido'),
         responded_by = $3, responded_at = now()
       WHERE id = $4 RETURNING *`,
      [admin_response || null, status || null, req.admin.id, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Interacao nao encontrada.' });
    res.json({ interaction: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao responder interacao.' });
  }
});

router.put('/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  const validStatus = ['pendente', 'respondido', 'confirmado', 'cancelado'];
  if (!validStatus.includes(status)) return res.status(400).json({ error: 'Status invalido.' });

  try {
    const result = await pool.query('UPDATE interactions SET status = $1 WHERE id = $2 RETURNING *', [
      status,
      req.params.id
    ]);
    if (!result.rows.length) return res.status(404).json({ error: 'Interacao nao encontrada.' });
    res.json({ interaction: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar status.' });
  }
});

router.post('/:id/send-email', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`${FULL_SELECT} WHERE i.id = $1`, [req.params.id]);
    const interaction = result.rows[0];
    if (!interaction) return res.status(404).json({ error: 'Interacao nao encontrada.' });

    const emailResult = await sendInteractionEmail({
      to: interaction.client_email,
      subject: `EletroHub - atualizacao sobre ${interaction.product_name}`,
      text: interaction.admin_response || 'Sua interacao foi atualizada. Acesse o site para mais detalhes.'
    });

    res.json({ ok: true, ...emailResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao enviar e-mail.' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM interactions WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Interacao nao encontrada.' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir interacao.' });
  }
});

module.exports = router;
