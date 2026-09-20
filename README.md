# EletroHub — Loja de Eletrônicos

Sistema full-stack (Back-end + Front-end) de uma loja de eletrônicos, com área do cliente e área
administrativa. Veja [CLAUDE.md](CLAUDE.md) para o mapeamento completo da arquitetura e decisões
do projeto.

## Stack

- **Backend:** Node.js + Express + PostgreSQL (`pg`), JWT, bcrypt
- **Frontend:** React + Vite + Tailwind CSS + React Router + Recharts
- **Banco:** PostgreSQL (Neon)
- **IA:** Anthropic API (Claude) para dados adicionais dos produtos

## Rodando localmente

### 1. Banco de dados

Você precisa de uma connection string PostgreSQL. Pode ser local ou o Neon (recomendado, veja
"Deploy" abaixo).

### 2. Backend

```bash
cd backend
cp .env.example .env
```

Edite `.env` e preencha pelo menos `DATABASE_URL`. Depois:

```bash
npm install
npm run db:migrate   # cria as tabelas
npm run db:seed      # popula com produtos e contas de teste
npm run dev           # http://localhost:4000
```

Contas criadas pelo seed:
- Admin: `admin@eletrohub.com` / `admin123`
- Cliente: `cliente@teste.com` / `cliente123`

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:4000/api
npm install
npm run dev              # http://localhost:5173
```

## Deploy na nuvem

### Banco de dados — Neon (PostgreSQL)

1. Crie uma conta gratuita em [neon.tech](https://neon.tech).
2. Crie um projeto e copie a **connection string** (formato
   `postgresql://usuario:senha@ep-xxx.aws.neon.tech/neondb?sslmode=require`).
3. Use essa string como `DATABASE_URL` tanto localmente quanto no Render.

### Backend — Render

1. Crie uma conta em [render.com](https://render.com) e conecte o repositório Git do projeto.
2. Crie um **Web Service** apontando para a pasta `backend/` (o arquivo `backend/render.yaml`
   já traz a configuração de build/start; você também pode configurar manualmente):
   - Build command: `npm install`
   - Start command: `npm start`
3. Configure as variáveis de ambiente no painel do Render (mesmas do `.env.example`):
   `DATABASE_URL`, `PGSSL=true`, `JWT_CLIENT_SECRET`, `JWT_ADMIN_SECRET`, `FRONTEND_URL`
   (URL do Vercel, definida no passo seguinte), `ANTHROPIC_API_KEY` (opcional).
4. Após o deploy, rode as migrações apontando para o banco do Render/Neon:
   ```bash
   DATABASE_URL="sua-connection-string" npm run db:migrate --prefix backend
   DATABASE_URL="sua-connection-string" npm run db:seed --prefix backend
   ```
5. Anote a URL pública do backend (ex: `https://eletrohub-backend.onrender.com`).

### Frontend — Vercel

1. Crie uma conta em [vercel.com](https://vercel.com) e importe o repositório.
2. Configure o projeto com **root directory** = `frontend/`.
3. Defina a variável de ambiente `VITE_API_URL` apontando para a URL do backend no Render
   (ex: `https://eletrohub-backend.onrender.com/api`).
4. Deploy. Depois de pronto, volte no Render e atualize `FRONTEND_URL` com a URL do Vercel para
   o CORS funcionar corretamente.

## Estrutura do projeto

Veja a seção "Estrutura de pastas" em [CLAUDE.md](CLAUDE.md).

## Requisitos atendidos

Veja a tabela "Requisitos do enunciado → onde foram implementados" em [CLAUDE.md](CLAUDE.md).
