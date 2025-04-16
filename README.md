# Take Home - Sistema de Usuários

## Pré-requisitos

- Node.js 18+ e npm
- Docker e Docker Compose (opcional, mas recomendado)

---

## Rodando com Docker (Recomendado)

1. **Clone o repositório:**

```bash
git clone <url-do-repositorio>
cd take-home
```

2. **Configure variáveis de ambiente:**

- As variáveis principais já estão definidas no `docker-compose.yml`.
- Se necessário, ajuste as secrets (ex: `JWT_ACCESS_SECRET`).

3. **Suba todos os serviços:**

```bash
docker-compose up --build
```

4. **Acesse os serviços:**

- Frontend: http://localhost:4000
- Backend (API): http://localhost:3000
- Redis: localhost:6379
- Postgres: localhost:5432

---

## Rodando sem Docker (manual)

### 1. Banco de Dados e Redis

- Instale e suba o Postgres localmente (usuário, senha e banco devem bater com o `docker-compose.yml` ou `.env`).
- Instale e suba o Redis localmente.

### 2. Backend

```bash
cd backend
npm install
npm run build
npm run start:dev # ou npm run start:prod
```

- O backend estará em http://localhost:3000

### 3. Frontend

```bash
cd frontend
npm install
npm run dev # ou npm run build && npm run start
```

- O frontend estará em http://localhost:4000

### 4. Variáveis de ambiente

- Configure as variáveis de ambiente necessárias em ambos os projetos (`NEXT_PUBLIC_API_URL`, `JWT_ACCESS_SECRET`, etc).
- No frontend, por padrão, a API é esperada em `http://localhost:3000`.

---

## Funcionalidades

- Cadastro, login, edição e exclusão de usuários
- Listagem de usuários
- Proteção de rotas por JWT
- Senhas criptografadas
- Interface moderna com Tailwind CSS

---

## Observações

- O botão "Sair" remove o token JWT do localStorage.
- O usuário logado não aparece na listagem e não pode se autoexcluir.
- Para resetar o banco, basta remover o volume do Postgres no Docker.
