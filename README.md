# GoPro Frontend (Next.js)

Frontend da plataforma GoPro.

## Requisitos
- Node.js 20+
- npm

## Variaveis de ambiente
Crie `./.env.local` com base em `./.env.local.example`.

## Executando localmente
1. Instale dependencias:

```bash
npm install
```

2. Suba o projeto:

```bash
npm run dev
```

3. Acesse:
- `http://localhost:3000` (ou a porta livre mostrada no terminal)

## Integracao com backend local
- O frontend usa o BFF em `/api/backend`.
- O BFF encaminha para `API_BASE_URL` (Spring Boot).
- Em dev, se `API_BASE_URL` nao estiver definida, o BFF usa `http://localhost:8080` como fallback.
- Fluxo principal validado:
  - `GET /api/backend/projects`
  - `POST /api/backend/projects`
  - `GET /api/backend/partners`
  - `GET /api/backend/public-agencies`
  - `GET /api/backend/peoples`

## Observacoes
- Autenticacao no frontend foi removida (sem middleware de login).
- O frontend nao acessa banco de dados diretamente; toda leitura/escrita passa pelo backend.
