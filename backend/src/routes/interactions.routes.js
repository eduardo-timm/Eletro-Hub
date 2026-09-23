const express = require('express');
const pool = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');
const { requireClient, requireAdmin } = require('../middleware/auth');
const { sendInteractionEmail } = require('../utils/email');

const router = express.Router();

const VALID_TYPES = ['proposta', 'avaliacao', 'agendamento', 'reserva'];
const VALID_STATUS = ['pendente', 'respondido', 'confirmado', 'cancelado'];

const FULL_SELECT = `
  SELECT i.*, p.name AS product_name, p.image_url AS product_image, c.name AS client_name, c.email AS client_email
  FROM interactions i
  JOIN products p ON p.id = i.product_id
  JOIN clients c ON c.id = i.client_id
`;

// Cliente cria uma interacao: proposta, avaliacao, agendamento ou reserva
router.post(
  '/',
  requireClient,
  asyncHandler(async (req, res) => {
    const { product_id, type, message, rating, proposed_price, scheduled_at } = req.body;
    if (!product_id || !VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: `product_id e type (${VALID_TYPES.join('|')}) sao obrigatorios.` });
    }
    if (type === 'avaliacao' && (!rating || rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Avaliacoes exigem uma nota de 1 a 5.' });
    }

    const product = await pool.query('SELECT id FROM products WHERE id = $1', [product_id]);
    if (!product.rows.length) return res.status(404).json({ error: 'Produto nao encontrado.' });

    try {
      const { rows } = await pool.query(
        `INSERT INTO interactions (product_id, client_id, type, message, rating, proposed_price, scheduled_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [product_id, req.client.id, type, message || null, rating || null, proposed_price || null, scheduled_at || null]
      );
      res.status(201).json({ interaction: rows[0] });
    } catch (err) {
      if (err.code === '23505' && err.constraint === 'uniq_review_per_client') {
        return res.status(409).json({ error: 'Voce ja avaliou este produto.' });
      }
      throw err;
    }
  })
);

// Cliente logado ve suas proprias interacoes e respostas
router.get(
  '/mine',
  requireClient,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(`${FULL_SELECT} WHERE i.client_id = $1 ORDER BY i.created_at DESC`, [
      req.client.id
    ]);
    res.json({ interactions: rows });
  })
);

// ---- Administracao ----

router.get(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
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

    const { rows } = await pool.query(`${FULL_SELECT} ${where} ORDER BY i.created_at DESC`, params);
    res.json({ interactions: rows });
  })
);

router.put(
  '/:id/respond',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { admin_response, status } = req.body;
    if (status && !VALID_STATUS.includes(status)) return res.status(400).json({ error: 'Status invalido.' });

    const { rows } = await pool.query(
      `UPDATE interactions SET admin_response = $1, status = COALESCE($2, 'respondido'),
         responded_by = $3, responded_at = now()
       WHERE id = $4 RETURNING *`,
      [admin_response || null, status || null, req.admin.id, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Interacao nao encontrada.' });
    res.json({ interaction: rows[0] });
  })
);

router.put(
  '/:id/status',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!VALID_STATUS.includes(status)) return res.status(400).json({ error: 'Status invalido.' });

    const { rows } = await pool.query('UPDATE interactions SET status = $1 WHERE id = $2 RETURNING *', [
      status,
      req.params.id
    ]);
    if (!rows.length) return res.status(404).json({ error: 'Interacao nao encontrada.' });
    res.json({ interaction: rows[0] });
  })
);

router.post(
  '/:id/send-email',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(`${FULL_SELECT} WHERE i.id = $1`, [req.params.id]);
    const interaction = rows[0];
    if (!interaction) return res.status(404).json({ error: 'Interacao nao encontrada.' });

    const emailResult = await sendInteractionEmail({
      to: interaction.client_email,
      subject: `EletroHub - atualizacao sobre ${interaction.product_name}`,
      text: interaction.admin_response || 'Sua interacao foi atualizada. Acesse o site para mais detalhes.'
    });

    res.json({ ok: true, ...emailResult });
  })
);

router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query('DELETE FROM interactions WHERE id = $1 RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Interacao nao encontrada.' });
    res.json({ ok: true });
  })
);

module.exports = router;
