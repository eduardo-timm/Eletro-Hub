# EletroHub — Loja de Eletrônicos (projeto acadêmico)

Sistema full-stack de loja de eletrônicos, construído a partir do modelo de exemplo (loja de
carros) do enunciado da disciplina. Este arquivo mapeia toda a arquitetura, decisões e comandos
para que qualquer conversa futura com o Claude Code retome o projeto sem precisar redescobrir nada.

## Visão geral

- **Domínio escolhido:** loja de eletrônicos (notebooks, smartphones, TVs, áudio, wearables etc.)
- **Tabela principal:** `products` (equivalente aos "carros" do exemplo)
- **Interações dos clientes com os produtos:** `interactions` — 4 tipos: `proposta`, `avaliacao`
  (nota 1-5 + comentário), `agendamento` (visita/avaliação) e `reserva`.
- **4 tabelas relacionadas:** `products`, `clients`, `admins`, `interactions` (todas com FKs entre si).

## Stack técnica (decidida com o usuário em 2026-09-20)

- **Backend:** Node.js + Express, sem ORM (SQL puro via `pg`), autenticação JWT separada para
  clientes e admins, bcrypt para senhas.
- **Frontend:** React + Vite + Tailwind CSS (visual propositalmente simples, sem design system
  pesado — o usuário pediu algo "básico porém bonito"). React Router para rotas, Recharts para
  os gráficos do dashboard admin, Axios para chamadas HTTP.
- **Banco de dados:** PostgreSQL no Neon. Não há Postgres/Docker na máquina local, então o
  backend local também aponta para o banco Neon **de produção** — testes locais que gravam dados
  (criar produto, interação etc.) aparecem no site publicado. Prefira testes de leitura ou
  idempotentes.
- **IA (requisito 3):** integração real com a **Anthropic API (Claude)** já implementada em
  [backend/src/utils/ai.js](backend/src/utils/ai.js). Sem `ANTHROPIC_API_KEY` configurada, o
  endpoint responde de forma graciosa avisando que a integração está pronta mas sem credencial —
  o front-end já indica claramente a origem dos dados ("Dados obtidos por consulta à IA").
  Usuário optou por **não fornecer a key agora**; ela deve ser adicionada no `.env` do backend
  quando disponível.
- **Deploy (decidido pelo usuário):** Render (backend) + Vercel (frontend) + Neon (Postgres),
  seguindo a sugestão do enunciado. **Já em produção (2026-09-20):**
  - Frontend: https://eletrohub.vercel.app (Vercel, projeto `eletrohub`, conectado ao GitHub
    `eduardo-timm/Eletro-Hub`, root directory `frontend`, deploy automático a cada push em `main`)
  - Backend: https://eletro-hub.onrender.com (Render, root directory `backend`; plano free — hiberna
    após inatividade, primeira requisição após um tempo parado pode demorar ~30s para "acordar")
  - Banco: Neon (região sa-east-1), connection string em `backend/.env` (local) e nas env vars do
    Render (produção)
  - Repositório: https://github.com/eduardo-timm/Eletro-Hub (branch `main`)
  - Fluxo de deploy usado: push no GitHub → Render faz redeploy automático do backend (Web Service
    conectado ao repo) → para o frontend, deploy no Vercel é disparado manualmente via MCP
    (`create_deployment` com `gitSource`) ou automaticamente se o Vercel também estiver com
    auto-deploy habilitado no dashboard para pushes em `main`.

## Estrutura de pastas

```
backend/
  src/
    db/          schema.sql (DDL), pool.js (conexão pg), migrate.js, seed.js
    middleware/  auth.js (requireClient, requireAdmin — gerados por requireRole)
    routes/      auth.routes.js, products.routes.js, interactions.routes.js, dashboard.routes.js
    utils/       jwt.js, ai.js (integração Anthropic), email.js (nodemailer com fallback simulado),
                 asyncHandler.js (repassa erros de handlers async ao middleware de erro)
    app.js       monta rotas + middleware central de erro (mapeia códigos do Postgres para 4xx)
    server.js
  render.yaml    config de deploy no Render
  .env.example

frontend/
  src/
    App.jsx                     rotas aninhadas: PublicLayout e AdminLayout com <Outlet />;
                                 AdminDashboard carregado via React.lazy (isola o Recharts)
    constants.js                rótulos de tipo/status de interação (espelham os CHECKs do schema)
    utils/format.js             formatPrice, formatDateTime
    api/client.js               instância axios + helpers withClientAuth()/withAdminAuth()
    context/                    ClientAuthContext, AdminAuthContext (localStorage)
    components/                 Navbar, ProductCard, RatingStars, SearchBar, AIBadge,
                                 ProtectedRoute, AdminRoute, AdminSidebar
    pages/                      Home, ProductDetail, Login, Register, MyInteractions
    pages/admin/                AdminLogin, AdminDashboard, AdminProducts, AdminProductForm,
                                 AdminInteractions
  vercel.json    rewrite para SPA
  .env.example

.claude/launch.json   configs para `preview_start` (frontend porta 5173, backend porta 4000)
```

## Modelo de dados (backend/src/db/schema.sql)

- `clients (id UUID pk, name, email unique, password_hash, phone, created_at)`
- `admins (id UUID pk, name, email unique, password_hash, role, created_at)`
- `products (id UUID pk, name, brand, category, description, price, stock_quantity, image_url,
  specs jsonb, destaque bool, ai_summary jsonb, ai_updated_at, created_at, updated_at)`
- `interactions (id UUID pk, product_id fk, client_id fk, type, message, rating, proposed_price,
  scheduled_at, status, admin_response, responded_by fk admins, responded_at, created_at)`
- View `product_ratings`: média e contagem de avaliações por produto (usada em listagens e no
  dashboard de "melhor avaliados").
- Índice único parcial `uniq_review_per_client (product_id, client_id) WHERE type = 'avaliacao'`:
  cada cliente avalia um produto só uma vez (propostas/agendamentos/reservas seguem ilimitados).
  O backend traduz a violação em 409 "Voce ja avaliou este produto." e o `ProductDetail.jsx`
  esconde o formulário de avaliação para quem já avaliou. Já aplicado no Neon em 2026-09-22.

## Requisitos do enunciado → onde foram implementados

1. Dados da tabela principal na página do cliente (destaques, últimos, melhor avaliados) →
   [frontend/src/pages/Home.jsx](frontend/src/pages/Home.jsx)
2. Pesquisa/filtro + botão "ver destaques" → `SearchBar.jsx` + `GET /api/products?q=&category=&destaque=true&sort=`
3. Dados via IA exibidos na página principal, com indicação da origem →
   `AIBadge.jsx` + `GET /api/products/:id/ai-insights` (cache de 7 dias em `ai_summary`; só
   respostas reais da IA são cacheadas — o aviso "não configurada" e erros nunca entram no cache)
4. Login/Cadastro de clientes → `POST /api/auth/register`, `POST /api/auth/login`
5. Manter conectado com UUID no LocalStorage → `ClientAuthContext.jsx` salva `clientId` +
   `clientToken`; ao carregar, recupera o id e valida via `GET /api/auth/me`
6. Detalhe do produto com interação bloqueada se não logado →
   [frontend/src/pages/ProductDetail.jsx](frontend/src/pages/ProductDetail.jsx)
7. Cliente logado vê suas interações e respostas → `MyInteractions.jsx` + `GET /api/interactions/mine`
8. Área restrita para admins → `/admin/login`, `AdminRoute.jsx`, JWT separado (`JWT_ADMIN_SECRET`)
9. Dashboard com gráficos (Recharts) → `AdminDashboard.jsx` + `GET /api/dashboard/overview`
   (totais, interações por tipo/status, produtos por categoria, série dos últimos 30 dias, top 5
   avaliados)
10. Listagem/cadastro de produtos → `AdminProducts.jsx`, `AdminProductForm.jsx` + rotas
    `POST/PUT/DELETE /api/products`
11. Listagem de interações com responder/enviar e-mail/confirmar/excluir →
    `AdminInteractions.jsx` + `PUT /api/interactions/:id/respond`, `/status`,
    `POST /:id/send-email`, `DELETE /:id`
12. Deploy na nuvem → concluído (Render + Vercel + Neon, ver seção "Stack técnica")

## Contas de teste (criadas pelo `npm run db:seed`)

- Admin: `admin@eletrohub.com` / `admin123`
- Cliente: `cliente@teste.com` / `cliente123`

## Como rodar localmente

```bash
# 1. Backend
cd backend
cp .env.example .env      # editar DATABASE_URL com a connection string do Postgres
npm install
npm run db:migrate        # cria as tabelas
npm run db:seed           # popula com produtos/admin/cliente de exemplo (idempotente)
npm run dev                # http://localhost:4000

# 2. Frontend (em outro terminal)
cd frontend
cp .env.example .env      # VITE_API_URL=http://localhost:4000/api
npm install
npm run dev                # http://localhost:5173
```

Dentro do Claude Code, os dois servidores já estão configurados em `.claude/launch.json`
(`preview_start` com `name: "frontend"` ou `name: "backend"`).

## Estado atual / pendências (atualizar a cada sessão)

- [x] Backend implementado (rotas, auth, IA, e-mail simulado) — sintaxe verificada com `node --check`.
- [x] Frontend implementado e renderizando corretamente.
- [x] **Banco de dados Neon criado e validado (2026-09-20).** Usuário criou o projeto em neon.tech
      e forneceu a connection string, que está salva em `backend/.env` (`DATABASE_URL`, região
      sa-east-1, pooler). `npm run db:migrate` e `npm run db:seed` já foram executados com sucesso.
- [x] **Teste ponta a ponta completo realizado via Browser pane em 2026-09-20**, cobrindo:
      cadastro/login de cliente com UUID salvo em LocalStorage, listagem/filtro/categoria/destaques
      na Home, badge de dados de IA (modo "não configurada", como esperado sem API key), detalhe de
      produto com interação bloqueada/liberada conforme login, envio de avaliação (nota+comentário)
      refletindo média em tempo real, página "Minhas interações", login admin, dashboard com os 4
      gráficos (Recharts) populados com dados reais, resposta de interação pelo admin (muda status
      para "respondido"), envio de e-mail simulado (sem SMTP configurado), e cadastro de novo
      produto pela área admin. Tudo funcionou sem erros.
- [x] **Deploy completo em produção (2026-09-20).** Render (backend) + Vercel (frontend) + Neon
      (banco) publicados e testados via Browser pane em produção: home com produtos/destaques/IA,
      login admin, dashboard com gráficos com dados reais. Ver seção "Deploy" acima para as URLs.
- [x] **Refatoração (2026-09-22)**: backend sem try/catch repetido (asyncHandler + middleware
      central de erro), auth deduplicado, cache da IA corrigido, `?force=true` público removido do
      endpoint de IA (evitava gasto de créditos por terceiros), seed idempotente; frontend com
      tratamento de erro/retry nas telas, constantes e formatadores compartilhados, rotas aninhadas,
      dashboard lazy-loaded (bundle principal 667 KB → 252 KB). Testado localmente contra o Neon.
- [ ] `ANTHROPIC_API_KEY` não configurada — usuário decidiu deixar para depois. A integração está
      pronta e funcional assim que a key for adicionada ao `.env` do backend (local) e às env vars
      do serviço no Render (produção). Testado e confirmado que o fallback funciona corretamente.
- [ ] SMTP não configurado — "enviar e-mail" do admin funciona mas fica em modo simulado (loga no
      console do backend) até que `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` sejam preenchidos. Testado e
      confirmado que o modo simulado funciona corretamente.

## Credenciais e segredos já gerados (não regenerar sem necessidade)

- `backend/.env` contém a `DATABASE_URL` real do Neon (projeto do usuário) e dois segredos JWT
  aleatórios já gerados (`JWT_CLIENT_SECRET`, `JWT_ADMIN_SECRET`). Esse arquivo está no
  `.gitignore` — nunca commitar. Ao configurar o deploy no Render, copiar esses mesmos valores
  (ou gerar novos) para as env vars do serviço lá.

## Preferências e decisões do usuário (não perguntar de novo)

- Layout deve ser **simples e básico, mas bonito** — evitar telas complexas ou muitos componentes
  visuais. Não sofisticar o design a menos que o usuário peça.
- **Tema monocromático (pedido do usuário em 2026-09-22):** só preto, branco e cinzas — nenhuma
  cor de destaque (nem para erro/sucesso/status). Detalhes:
  - Fundo da página cinza médio (`bg-neutral-300` no `body`, em `frontend/src/index.css`); cards
    brancos por cima. Textos direto sobre o fundo usam `neutral-600/700` (400/500 ficam ilegíveis).
  - Navbar e sidebar admin pretas, com o componente `Logo.jsx` (sem emoji).
  - Paleta `brand` em `tailwind.config.js` é uma escala de cinza/preto; use a família `neutral`
    (não `slate`, que é azulado).
  - Erros usam a classe `.text-error` (peso + borda lateral preta) em vez de vermelho; status de
    interação se diferenciam por contorno/preenchimento/risco (`constants.js`); gráficos em cinzas.
  - Emojis coloridos foram trocados por símbolos monocromáticos (★, "IA"). Fotos dos produtos
    continuam coloridas (são conteúdo, não tema).
- Deploy target é explicitamente **Render + Vercel + Neon** (não Supabase), mesmo tendo ferramentas
  de Supabase disponíveis nesta sessão — não trocar sem confirmar com o usuário.
- IA: manter a integração real com Anthropic (não trocar de provedor) a menos que o usuário peça.
