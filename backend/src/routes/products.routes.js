const express = require('express');
const pool = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');
const { fetchAiInsights } = require('../utils/ai');

const router = express.Router();

const BASE_SELECT = `
  SELECT p.*, COALESCE(r.avg_rating, 0) AS avg_rating, COALESCE(r.ratings_count, 0) AS ratings_count
  FROM products p
  LEFT JOIN product_ratings r ON r.product_id = p.id
`;

// Listagem com busca/filtros: ?q=&category=&destaque=true&sort=recentes|avaliados
router.get('/', async (req, res) => {
  const { q, category, destaque, sort } = req.query;
  const conditions = [];
  const params = [];

  if (q) {
    params.push(`%${q.toLowerCase()}%`);
    conditions.push(`(LOWER(p.name) LIKE $${params.length} OR LOWER(p.brand) LIKE $${params.length} OR LOWER(p.category) LIKE $${params.length})`);
  }
  if (category) {
    params.push(category);
    conditions.push(`p.category = $${params.length}`);
  }
  if (destaque === 'true') {
    conditions.push('p.destaque = true');
  }

  let orderBy = 'p.created_at DESC';
  if (sort === 'avaliados') orderBy = 'avg_rating DESC, ratings_count DESC';
  if (sort === 'recentes') orderBy = 'p.created_at DESC';
  if (sort === 'preco_asc') orderBy = 'p.price ASC';
  if (sort === 'preco_desc') orderBy = 'p.price DESC';

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const result = await pool.query(`${BASE_SELECT} ${where} ORDER BY ${orderBy}`, params);
    res.json({ products: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar produtos.' });
  }
});

router.get('/categories', async (_req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT category FROM products ORDER BY category');
    res.json({ categories: result.rows.map((r) => r.category) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar categorias.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`${BASE_SELECT} WHERE p.id = $1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Produto nao encontrado.' });
    res.json({ product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar produto.' });
  }
});

// Dados adicionais obtidos via consulta a IA (com cache de 7 dias no banco)
router.get('/:id/ai-insights', async (req, res) => {
  try {
    const productRes = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    const product = productRes.rows[0];
    if (!product) return res.status(404).json({ error: 'Produto nao encontrado.' });

    const isFresh =
      product.ai_summary &&
      product.ai_updated_at &&
      Date.now() - new Date(product.ai_updated_at).getTime() < 7 * 24 * 60 * 60 * 1000;

    if (isFresh && req.query.force !== 'true') {
      return res.json({ insights: product.ai_summary, cached: true });
    }

    const insights = await fetchAiInsights(product);
    await pool.query('UPDATE products SET ai_summary = $1, ai_updated_at = now() WHERE id = $2', [
      insights,
      product.id
    ]);
    res.json({ insights, cached: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao consultar dados de IA.' });
  }
});

// ---- Rotas administrativas ----

router.post('/', requireAdmin, async (req, res) => {
  const { name, brand, category, description, price, stock_quantity, image_url, specs, destaque } = req.body;
  if (!name || !category || price === undefined) {
    return res.status(400).json({ error: 'Nome, categoria e preco sao obrigatorios.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (name, brand, category, description, price, stock_quantity, image_url, specs, destaque)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, brand || null, category, description || null, price, stock_quantity || 0, image_url || null, specs || {}, !!destaque]
    );
    res.status(201).json({ product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar produto.' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { name, brand, category, description, price, stock_quantity, image_url, specs, destaque } = req.body;
  try {
    const result = await pool.query(
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
      [name, brand || null, category, description || null, price, stock_quantity, image_url || null, specs, destaque, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Produto nao encontrado.' });
    res.json({ product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar produto.' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Produto nao encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir produto.' });
  }
});

module.exports = router;
