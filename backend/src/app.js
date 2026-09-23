const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const productsRoutes = require('./routes/products.routes');
const interactionsRoutes = require('./routes/interactions.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map((s) => s.trim());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'eletrohub-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/interactions', interactionsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Rota nao encontrada: ${req.method} ${req.path}` });
});

// Erros do Postgres que sao culpa da requisicao (nao do servidor) viram 4xx.
const PG_ERRORS = {
  '22P02': [400, 'Identificador ou valor em formato invalido.'],
  '23503': [400, 'Registro relacionado nao encontrado.'],
  '23505': [409, 'Registro duplicado.'],
  '23514': [400, 'Valor fora das regras permitidas.']
};

// Express reconhece o middleware de erro pela assinatura com 4 parametros.
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON invalido no corpo da requisicao.' });
  }
  const known = PG_ERRORS[err.code];
  if (known) return res.status(known[0]).json({ error: known[1] });

  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

module.exports = app;
