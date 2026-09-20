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
- **Banco de dados:** PostgreSQL. Local/teste ainda não validado (sem Postgres/Docker na máquina
  no momento da criação) — ver seção "Estado atual / pendências".
- **IA (requisito 3):** integração real com a **Anthropic API (Claude)** já implementada em
  [backend/src/utils/ai.js](backend/src/utils/ai.js). Sem `ANTHROPIC_API_KEY` configurada, o
  endpoint responde de forma graciosa avisando que a integração está pronta mas sem credencial —
  o front-end já indica claramente a origem dos dados ("Dados obtidos por consulta à IA").
  Usuário optou por **não fornecer a key agora**; ela deve ser adicionada no `.env` do backend
  quando disponível.
- **Deploy (decidido pelo usuário):** Render (backend) + Vercel (frontend) + Neon (Postgres),
  seguindo a sugestão do enunciado. Não uso ferramentas de MCP diretas para Render/Neon nesta
  sessão (não disponíveis) — o usuário faz esses passos manualmente nos respectivos painéis.
  Tenho ferramentas diretas de Vercel MCP disponíveis, então posso ajudar a fazer o deploy do
  frontend por lá quando chegarmos nessa etapa (pedir confirmação antes de qualquer deploy real).

## Estrutura de pastas

```
backend/
  src/
    db/          schema.sql (DDL), pool.js (conexão pg), migrate.js, seed.js
    middleware/  auth.js (requireClient, requireAdmin, optionalClient)
    routes/      auth.routes.js, products.routes.js, interactions.routes.js, dashboard.routes.js
    utils/       jwt.js, ai.js (integração Anthropic), email.js (nodemailer com fallback simulado)
    app.js, server.js
  render.yaml    config de deploy no Render
  .env.example

frontend/
  src/
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

## Requisitos do enunciado → onde foram implementados

1. Dados da tabela principal na página do cliente (destaques, últimos, melhor avaliados) →
   [frontend/src/pages/Home.jsx](frontend/src/pages/Home.jsx)
2. Pesquisa/filtro + botão "ver destaques" → `SearchBar.jsx` + `GET /api/products?q=&category=&destaque=true&sort=`
3. Dados via IA exibidos na página principal, com indicação da origem →
   `AIBadge.jsx` + `GET /api/products/:id/ai-insights` (cache de 7 dias em `ai_summary`)
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
12. Deploy na nuvem → pendente (ver abaixo)

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
npm run db:seed           # popula com produtos/admin/cliente de exemplo
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
- [ ] Deploy real no Render (backend), Vercel (frontend) — Neon já está pronto e em uso. O usuário
      faz os passos manuais no Render; posso ajudar a finalizar o deploy do frontend no Vercel
      usando as ferramentas de MCP diretas que tenho aqui, pedindo confirmação antes de qualquer
      publicação real. Ver `README.md` para o passo a passo.
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
  visuais. Manter a paleta Tailwind `brand` (azul) já definida em `frontend/tailwind.config.js`.
  Isso está satisfeito atualmente — não sofisticar o design a menos que o usuário peça.
- Deploy target é explicitamente **Render + Vercel + Neon** (não Supabase), mesmo tendo ferramentas
  de Supabase disponíveis nesta sessão — não trocar sem confirmar com o usuário.
- IA: manter a integração real com Anthropic (não trocar de provedor) a menos que o usuário peça.
