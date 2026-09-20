const express = require('express');
const pool = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', requireAdmin, async (_req, res) => {
  try {
    const [products, clients, interactions, byType, byStatus, byCategory, last30days, topRated] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM products'),
      pool.query('SELECT COUNT(*)::int AS count FROM clients'),
      pool.query('SELECT COUNT(*)::int AS count FROM interactions'),
      pool.query('SELECT type, COUNT(*)::int AS count FROM interactions GROUP BY type ORDER BY type'),
      pool.query('SELECT status, COUNT(*)::int AS count FROM interactions GROUP BY status ORDER BY status'),
      pool.query('SELECT category, COUNT(*)::int AS count FROM products GROUP BY category ORDER BY count DESC'),
      pool.query(`
        SELECT to_char(created_at, 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
        FROM interactions
        WHERE created_at > now() - interval '30 days'
        GROUP BY day ORDER BY day
      `),
      pool.query(`
        SELECT p.name, r.avg_rating, r.ratings_count
        FROM product_ratings r JOIN products p ON p.id = r.product_id
        ORDER BY r.avg_rating DESC, r.ratings_count DESC LIMIT 5
      `)
    ]);

    res.json({
      totals: {
        products: products.rows[0].count,
        clients: clients.rows[0].count,
        interactions: interactions.rows[0].count
      },
      interactionsByType: byType.rows,
      interactionsByStatus: byStatus.rows,
      productsByCategory: byCategory.rows,
      interactionsLast30Days: last30days.rows,
      topRatedProducts: topRated.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar dados do dashboard.' });
  }
});

module.exports = router;
