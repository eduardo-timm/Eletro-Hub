const express = require('express');
const pool = require('../db/pool');
const asyncHandler = require('../utils/asyncHandler');
const { requireAdmin } = require('../middleware/auth');
const { generateDescription } = require('../utils/ai');

const router = express.Router();

const BASE_SELECT = `
  SELECT p.*, COALESCE(r.avg_rating, 0) AS avg_rating, COALESCE(r.ratings_count, 0) AS ratings_count
  FROM products p
  LEFT JOIN product_ratings r ON r.product_id = p.id
`;

// Whitelist: o valor de ?sort= nunca e interpolado direto no SQL.
const SORTS = {
  recentes: 'p.created_at DESC',
  avaliados: 'avg_rating DESC, ratings_count DESC',
  preco_asc: 'p.price ASC',
  preco_desc: 'p.price DESC'
};

// Listagem com busca/filtros: ?q=&category=&destaque=true&sort=recentes|avaliados|preco_asc|preco_desc
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { q, category, destaque, sort } = req.query;
    const conditions = [];
    const params = [];

    if (q) {
      params.push(`%${String(q).toLowerCase()}%`);
      const i = params.length;
      conditions.push(`(LOWER(p.name) LIKE $${i} OR LOWER(p.brand) LIKE $${i} OR LOWER(p.category) LIKE $${i})`);
    }
    if (category) {
      params.push(category);
      conditions.push(`p.category = $${params.length}`);
    }
    if (destaque === 'true') {
      conditions.push('p.destaque = true');
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = SORTS[sort] || SORTS.recentes;
    const { rows } = await pool.query(`${BASE_SELECT} ${where} ORDER BY ${orderBy}`, params);
    res.json({ products: rows });
  })
);

router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query('SELECT DISTINCT category FROM products ORDER BY category');
    res.json({ categories: rows.map((r) => r.category) });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(`${BASE_SELECT} WHERE p.id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Produto nao encontrado.' });
    res.json({ product: rows[0] });
  })
);

// ---- Rotas administrativas ----

// Gera uma descricao do produto via IA (Gemini) para o admin revisar antes de salvar.
// Fica restrita ao admin para que terceiros nao consumam a cota da API.
router.post(
  '/ai-description',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { name, brand, category, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Informe o nome do produto para gerar a descricao.' });
    const text = await generateDescription({ name, brand, category, description });
    res.json({ description: text, source: 'Google Gemini API' });
  })
);

router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { name, brand, category, description, price, stock_quantity, image_url, specs, destaque } = req.body;
    if (!name || !category || price === undefined || price === '') {
      return res.status(400).json({ error: 'Nome, categoria e preco sao obrigatorios.' });
    }

    // Sem descricao informada, tenta gerar uma com a IA; se a IA falhar, o produto e criado sem ela.
    let finalDescription = description;
    if (!finalDescription) {
      finalDescription = await generateDescription({ name, brand, category }).catch((err) => {
        console.error('Falha ao gerar descricao com IA:', err.message);
        return null;
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO products (name, brand, category, description, price, stock_quantity, image_url, specs, destaque)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        name,
        brand || null,
        category,
        finalDescription || null,
        price,
        stock_quantity || 0,
        image_url || null,
        specs || {},
        !!destaque
      ]
    );
    res.status(201).json({ product: rows[0] });
  })
);

router.put(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { name, brand, category, description, price, stock_quantity, image_url, specs, destaque } = req.body;
    const { rows } = await pool.query(
      `UPDATE products SET
         name = COALESCE($1, name),
         brand = $2,
         category = COALESCE($3, category),
         description = $4,
         price = COALESCE($5, price),
         stock_quantity = COALESCE($6, stock_quantity),
         image_url = $7,
         specs = COALESCE($8, specs),
         destaque = COALESCE($9, destaque),
         updated_at = now()
       WHERE id = $10 RETURNING *`,
      [
        name,
        brand || null,
        category,
        description || null,
        price,
        stock_quantity,
        image_url || null,
        specs,
        destaque,
        req.params.id
      ]
    );
    if (!rows.length) return res.status(404).json({ error: 'Produto nao encontrado.' });
    res.json({ product: rows[0] });
  })
);

router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Produto nao encontrado.' });
    res.json({ ok: true });
  })
);

module.exports = router;
