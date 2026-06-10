# GoPro 2.0 — Contexto Principal para Claude Code

> Links: [[arquitetura-front]] | [[arquitetura-back]] | [[dominio-modelo]] | [[estado-atual]] | [[prompts-canonicos]] | [[como-usar]]

## O que é esse projeto
Plataforma de **gestão de contratos** da Innovatis. "Contrato" é a entidade central, englobando dois subtipos: **Projetos** (desenvolvimento sob medida) e **Produtos** (soluções padronizadas). A stack é full-stack separada: front Next.js + back Spring Boot.

## Stack completa
| Camada | Tecnologia |
|--------|-----------|
| Front | Next.js 16, React 19, TypeScript 5, Tailwind 4, shadcn/ui |
| Back | Spring Boot 3.2, Java 17, PostgreSQL, Flyway, JWT (jjwt 0.12.6) |
| Infra | Docker (multi-stage), AWS S3 (documentos), SendGrid (email) |
| ORM front | Prisma (apenas para sessão/BFF) |
| Mapeamento back | MapStruct + Lombok |

## Arquitetura — Fluxo de dados
```
Browser → Next.js App Router
       → middleware.ts (auth JWT via cookie access_token)
       → (dashboard)/ rotas protegidas
       → src/app/api/backend/* (BFF proxy)
       → api_gopro Spring Boot :8081
       → PostgreSQL :5433
```

- O front **nunca** fala direto com o banco.
- O BFF (`/api/backend/*`) é proxy autenticado para o backend Java.
- Auth: cookie `access_token` (JWT) — legacy `token` (base64, só dev).

## Portas e profiles
| Serviço | Porta local |
|---------|------------|
| Front Next.js | 3000 |
| Back Spring Boot | 8081 |
| PostgreSQL | 5433 |

Spring profiles: `dev` (local, seed SQL), `prod` (migrações prod/).

## Módulos do front (rotas)
- `/home` — dashboard com gráficos e mapa
- `/contratos` — listagem, filtros, funil Kanban, pré-projetos
- `/contratos/[id]/*` — tabs: visão geral, rubricas, equipe, metas, desembolso, arquivos, trilha, iniciação
- `/fornecedores/[id]/*` — detalhes, contratos vinculados, rubricas expandíveis
- `/parceiros` — fundações e IFES
- `/recursos-humanos` — equipe e pessoas
- `/admin` — usuários, convites, auditoria
- `/perfil` — notificações, configurações, segurança

## Design System Innovatis
Cores base: `primary: #004225`, `accent: #00B894`, `background: #F5F6F8`
Fonte: Poppins (local, /public/Poppins/)
Componentes UI: shadcn/ui + customizações em `components/ui/`

## Padrões de código — Front
- Componentes locais em `_components/` dentro de cada rota
- Exportações centralizadas via `index.ts`
- API client centralizado em `src/lib/api.ts` (métodos: get, post, put, patch, delete, upload, download)
- Tipos do backend Java em `src/types/api_gopro_java/`
- Sistema de modais por Custom Events: `window.dispatchEvent(new CustomEvent('open-modal', {detail: {modalName}}))`

## Padrões de código — Back
- Controllers enxutos, lógica nos Services
- Interface + Impl para cada Service
- DTOs separados: Request, Response, Update
- Mappers via MapStruct
- Exceções: `BusinessException`, `ResourceNotFoundException`, `ConflictException`
- Migrações Flyway: `core/V{n}__` (compartilhado), `prod/V{n}__`, `dev/V{n}__`

## Regras críticas
1. **Mudanças ponta a ponta**: UI → route handler BFF → controller → service → repo → migration
2. **Nunca editar migration Flyway já aplicada** — sempre criar nova
3. **Retrocompatibilidade de API** — não quebrar contratos sem destaque explícito
4. **Preservar PT-BR** e vocabulário do domínio (contrato, rubrica, desembolso, empenho, liquidação)
5. **Diffs pequenos e cirúrgicos** — sem refatoração ampla por impulso
6. **Nunca expor segredos** — .env, credentials, JWT secret

## O que NÃO fazer
- Não criar abstrações novas sem necessidade clara
- Não hardcode de configuração (usar env vars)
- Não alterar comportamento de auth/RBAC sem destaque
- Não propor deploy "mágico" fora da arquitetura Docker atual
- Não fazer `npm install` de dependência nova sem justificativa
