# Estrutura do BFF/Proxy - API Backend

Este documento explica a estrutura de pastas e arquivos do **Backend for Frontend (BFF)** que faz proxy das requisições do Next.js para a API Java.

## 📋 Visão Geral

O BFF atua como uma camada intermediária entre o frontend (Next.js) e o backend (API Java), oferecendo:

- **Proxy de requisições**: Encaminha requisições HTTP para a API Java
- **Normalização de erros**: Padroniza respostas de erro
- **Autenticação centralizada**: Gerencia tokens e headers de autenticação
- **Transformação de dados**: Adapta formatos entre frontend e backend quando necessário
- **Cache e otimizações**: Pode implementar cache, rate limiting, etc.

## 🏗️ Estrutura de Pastas

```
src/app/api/
├── _shared/                          # Utilitários compartilhados do BFF
│   ├── backend.ts                   # Função principal de proxy para API Java
│   ├── errors.ts                    # Normalização de erros HTTP
│   ├── response.ts                 # Helpers de NextResponse
│   └── types.ts                    # Tipos TypeScript compartilhados
│
└── backend/                         # Proxies para recursos do Swagger
    ├── projects/                   # Projetos
    │   ├── route.ts               # GET, POST /api/backend/projects
    │   └── [id]/
    │       └── route.ts           # GET, PUT, DELETE /api/backend/projects/:id
    │
    ├── organizations/              # Organizações (parceiros, financiadores)
    │   ├── route.ts               # GET, POST /api/backend/organizations
    │   └── [id]/
    │       └── route.ts           # GET, PUT, DELETE /api/backend/organizations/:id
    │
    ├── peoples/                    # Pessoas (equipe técnica, membros)
    │   ├── route.ts               # GET, POST /api/backend/peoples
    │   └── [id]/
    │       └── route.ts           # GET, PUT, DELETE /api/backend/peoples/:id
    │
    ├── budget-categories/         # Categorias orçamentárias
    │   ├── route.ts               # GET, POST /api/backend/budget-categories
    │   └── [id]/
    │       └── route.ts           # GET, PUT, DELETE /api/backend/budget-categories/:id
    │
    ├── budget-item/               # Itens de orçamento (rubricas)
    │   ├── route.ts               # GET, POST /api/backend/budget-item
    │   └── [id]/
    │       └── route.ts           # GET, PUT, DELETE /api/backend/budget-item/:id
    │
    ├── documents/                 # Documentos anexados
    │   ├── route.ts               # GET, POST /api/backend/documents
    │   └── [id]/
    │       └── route.ts           # GET, PUT, DELETE /api/backend/documents/:id
    │
    ├── disbursement-schedule/    # Cronograma de desembolsos
    │   ├── route.ts               # GET, POST /api/backend/disbursement-schedule
    │   └── [id]/
    │       └── route.ts           # GET, PUT, DELETE /api/backend/disbursement-schedule/:id
    │
    ├── project-people/           # Relacionamento Projeto ↔ Pessoa
    │   ├── route.ts              # GET, POST /api/backend/project-people
    │   └── [id]/
    │       └── route.ts          # GET, PUT, DELETE /api/backend/project-people/:id
    │
    ├── project_organization/     # Relacionamento Projeto ↔ Organização
    │   ├── route.ts              # GET, POST /api/backend/project_organization
    │   └── [id]/                 # (mantido underscore conforme Swagger)
    │       └── route.ts          # GET, PUT, DELETE /api/backend/project_organization/:id
    │
    └── income/                   # Receitas/Entradas financeiras
        ├── route.ts              # GET, POST /api/backend/income
        └── [id]/
            └── route.ts          # GET, PUT, DELETE /api/backend/income/:id
```

## 📁 Detalhamento das Pastas

### `_shared/` - Utilitários Compartilhados

Contém código reutilizável para evitar duplicação nos route handlers:

#### `backend.ts`
Função principal para fazer proxy de requisições para a API Java.

**Responsabilidades:**
- Construir URL completa da API Java (`API_BASE_URL + endpoint`)
- Adicionar headers padrão (Content-Type, Accept, Authorization)
- Encaminhar método HTTP (GET, POST, PUT, DELETE, PATCH)
- Repassar query strings e body
- Tratar erros de conexão
- Retornar resposta padronizada

**Exemplo de uso:**
```typescript
import { proxyToJava } from '@/app/api/_shared/backend';

export async function GET(req: NextRequest) {
  return proxyToJava(req, '/api/projects');
}
```

#### `errors.ts`
Normalização de erros HTTP retornados pela API Java.

**Responsabilidades:**
- Converter erros HTTP (4xx, 5xx) em formato padronizado
- Adicionar mensagens de erro amigáveis
- Logging de erros para debug
- Mapear códigos de erro específicos do backend

#### `response.ts`
Helpers para criar respostas NextResponse padronizadas.

**Responsabilidades:**
- Criar respostas JSON com status codes
- Adicionar headers customizados
- Tratar diferentes tipos de conteúdo (JSON, texto, binário)

#### `types.ts`
Tipos TypeScript compartilhados entre os route handlers.

**Tipos comuns:**
- `ApiError`: Formato padrão de erro
- `Paginated<T>`: Resposta paginada
- `ApiResponse<T>`: Resposta genérica da API

### `backend/` - Proxies de Recursos

Cada pasta representa um recurso do Swagger e segue o padrão REST:

#### Convenção de Roteamento

**`<resource>/route.ts`** (sempre presente)
- `GET` → Listagem (com filtros, paginação, ordenação)
- `POST` → Criação de novo recurso

**`<resource>/[id]/route.ts`** (presente em todos os recursos)
- `GET` → Detalhes de um recurso específico
- `PUT` → Atualização completa de um recurso
- `PATCH` → Atualização parcial de um recurso
- `DELETE` → Exclusão de um recurso

**Nota:** Todos os recursos seguem o padrão REST completo, incluindo endpoints individuais por ID.

#### Recursos Disponíveis

##### Recursos Principais
| Recurso | Descrição | Endpoints |
|---------|-----------|-----------|
| **projects** | Projetos/Contratos | `/api/backend/projects` (GET, POST)<br>`/api/backend/projects/:id` (GET, PUT, DELETE) |
| **organizations** | Organizações (parceiros, financiadores) | `/api/backend/organizations` (GET, POST)<br>`/api/backend/organizations/:id` (GET, PUT, DELETE) |
| **peoples** | Pessoas (equipe técnica, membros) | `/api/backend/peoples` (GET, POST)<br>`/api/backend/peoples/:id` (GET, PUT, DELETE) |
| **documents** | Documentos anexados | `/api/backend/documents` (GET, POST)<br>`/api/backend/documents/:id` (GET, PUT, DELETE) |

##### Financeiro
| Recurso | Descrição | Endpoints |
|---------|-----------|-----------|
| **budget-categories** | Categorias orçamentárias | `/api/backend/budget-categories` (GET, POST)<br>`/api/backend/budget-categories/:id` (GET, PUT, DELETE) |
| **budget-item** | Itens de orçamento (rubricas) | `/api/backend/budget-item` (GET, POST)<br>`/api/backend/budget-item/:id` (GET, PUT, DELETE) |
| **disbursement-schedule** | Cronograma de desembolsos | `/api/backend/disbursement-schedule` (GET, POST)<br>`/api/backend/disbursement-schedule/:id` (GET, PUT, DELETE) |
| **income** | Receitas/Entradas financeiras | `/api/backend/income` (GET, POST)<br>`/api/backend/income/:id` (GET, PUT, DELETE) |
| **expenses** | Despesas | `/api/backend/expenses` (GET, POST)<br>`/api/backend/expenses/:id` (GET, PUT, DELETE) |
| **budget-transfers** | Remanejamentos orçamentários | `/api/backend/budget-transfers` (GET, POST)<br>`/api/backend/budget-transfers/:id` (GET, PUT, DELETE) |

##### Relacionamentos
| Recurso | Descrição | Endpoints |
|---------|-----------|-----------|
| **project-people** | Relacionamento Projeto ↔ Pessoa | `/api/backend/project-people` (GET, POST)<br>`/api/backend/project-people/:id` (GET, PUT, DELETE) |
| **project_organization** | Relacionamento Projeto ↔ Organização | `/api/backend/project_organization` (GET, POST)<br>`/api/backend/project_organization/:id` (GET, PUT, DELETE) |
| **project-organization-budget-links** | Vínculo Organização-Rubrica | `/api/backend/project-organization-budget-links` (GET, POST)<br>`/api/backend/project-organization-budget-links/:id` (GET, PUT, DELETE) |

##### Execução Técnica
| Recurso | Descrição | Endpoints |
|---------|-----------|-----------|
| **goals** | Metas do projeto | `/api/backend/goals` (GET, POST)<br>`/api/backend/goals/:id` (GET, PUT, DELETE) |
| **stages** | Etapas das metas | `/api/backend/stages` (GET, POST)<br>`/api/backend/stages/:id` (GET, PUT, DELETE) |
| **phases** | Fases das etapas | `/api/backend/phases` (GET, POST)<br>`/api/backend/phases/:id` (GET, PUT, DELETE) |
| **milestones** | Marcos do projeto | `/api/backend/milestones` (GET, POST)<br>`/api/backend/milestones/:id` (GET, PUT, DELETE) |
| **tasks** | Tarefas do projeto | `/api/backend/tasks` (GET, POST)<br>`/api/backend/tasks/:id` (GET, PUT, DELETE) |

##### Catálogos de Organização
| Recurso | Descrição | Endpoints |
|---------|-----------|-----------|
| **organization-categories-master** | Catálogo de categorias | `/api/backend/organization-categories-master` (GET, POST)<br>`/api/backend/organization-categories-master/:id` (GET, PUT, DELETE) |
| **organization-services-master** | Catálogo de serviços | `/api/backend/organization-services-master` (GET, POST)<br>`/api/backend/organization-services-master/:id` (GET, PUT, DELETE) |
| **organization-categories** | Vínculo Organização-Categoria | `/api/backend/organization-categories` (GET, POST)<br>`/api/backend/organization-categories/:id` (GET, PUT, DELETE) |
| **organization-services** | Vínculo Organização-Serviço | `/api/backend/organization-services` (GET, POST)<br>`/api/backend/organization-services/:id` (GET, PUT, DELETE) |

##### Auditoria
| Recurso | Descrição | Endpoints |
|---------|-----------|-----------|
| **audit-log** | Log de auditoria | `/api/backend/audit-log` (GET)<br>`/api/backend/audit-log/:id` (GET) |

##### Iniciação de Contratos (Placeholders)
| Recurso | Descrição | Endpoints | Status |
|---------|-----------|-----------|--------|
| **contracts/initiation/pipeline** | Pipeline de iniciação | `/api/backend/contracts/initiation/pipeline` (GET) | ⏳ 501 Not Implemented |
| **contracts/[id]/initiation/move** | Mover entre etapas | `/api/backend/contracts/:id/initiation/move` (PATCH/POST) | ⏳ 501 Not Implemented |
| **contracts/[id]/initiation/activities** | Atividades de iniciação | `/api/backend/contracts/:id/initiation/activities` (GET, POST) | ⏳ 501 Not Implemented |
| **contracts/[id]/initiation/activities/[activityId]** | Atividade específica | `/api/backend/contracts/:id/initiation/activities/:activityId` (PATCH, PUT) | ⏳ 501 Not Implemented |

## 🔄 Fluxo de Requisição

```
Frontend (React/Next.js)
    ↓
    fetch('/api/backend/projects')
    ↓
Next.js Route Handler (src/app/api/backend/projects/route.ts)
    ↓
    proxyToJava(req, '/api/projects')
    ↓
_shared/backend.ts
    ↓
    fetch(`${API_BASE_URL}/api/projects`)
    ↓
API Java (http://192.168.10.100:8080)
    ↓
Resposta JSON
    ↓
Next.js Route Handler (normaliza/transforma se necessário)
    ↓
Frontend (recebe dados)
```

## 📝 Padrões de Naming

### Convenções Seguidas

1. **Kebab-case para rotas**: `budget-categories`, `disbursement-schedule`
2. **Underscore quando necessário**: `project_organization` (mantido conforme Swagger)
3. **Plural para recursos**: `projects`, `organizations`, `peoples`
4. **Singular para relacionamentos**: `budget-item` (conforme Swagger)

### Mapeamento Swagger → Next.js

**Nota:** Os paths abaixo seguem o padrão esperado do Swagger. Quando o backend Java atualizar, os paths devem ser ajustados conforme necessário.

| Swagger Path | Next.js Route | Arquivo |
|--------------|---------------|---------|
| `/projects` | `/api/backend/projects` | `backend/projects/route.ts` |
| `/projects/{id}` | `/api/backend/projects/:id` | `backend/projects/[id]/route.ts` |
| `/organizations` | `/api/backend/organizations` | `backend/organizations/route.ts` |
| `/organizations/{id}` | `/api/backend/organizations/:id` | `backend/organizations/[id]/route.ts` |
| `/peoples` | `/api/backend/peoples` | `backend/peoples/route.ts` |
| `/peoples/{id}` | `/api/backend/peoples/:id` | `backend/peoples/[id]/route.ts` |
| `/budget-categories` | `/api/backend/budget-categories` | `backend/budget-categories/route.ts` |
| `/budget-categories/{id}` | `/api/backend/budget-categories/:id` | `backend/budget-categories/[id]/route.ts` |
| `/budget-item` | `/api/backend/budget-item` | `backend/budget-item/route.ts` |
| `/budget-item/{id}` | `/api/backend/budget-item/:id` | `backend/budget-item/[id]/route.ts` |
| `/documents` | `/api/backend/documents` | `backend/documents/route.ts` |
| `/documents/{id}` | `/api/backend/documents/:id` | `backend/documents/[id]/route.ts` |
| `/disbursement-schedule` | `/api/backend/disbursement-schedule` | `backend/disbursement-schedule/route.ts` |
| `/disbursement-schedule/{id}` | `/api/backend/disbursement-schedule/:id` | `backend/disbursement-schedule/[id]/route.ts` |
| `/project-people` | `/api/backend/project-people` | `backend/project-people/route.ts` |
| `/project-people/{id}` | `/api/backend/project-people/:id` | `backend/project-people/[id]/route.ts` |
| `/project_organization` | `/api/backend/project_organization` | `backend/project_organization/route.ts` |
| `/project_organization/{id}` | `/api/backend/project_organization/:id` | `backend/project_organization/[id]/route.ts` |
| `/income` | `/api/backend/income` | `backend/income/route.ts` |
| `/income/{id}` | `/api/backend/income/:id` | `backend/income/[id]/route.ts` |
| `/expenses` | `/api/backend/expenses` | `backend/expenses/route.ts` |
| `/expenses/{id}` | `/api/backend/expenses/:id` | `backend/expenses/[id]/route.ts` |
| `/budget-transfers` | `/api/backend/budget-transfers` | `backend/budget-transfers/route.ts` |
| `/budget-transfers/{id}` | `/api/backend/budget-transfers/:id` | `backend/budget-transfers/[id]/route.ts` |
| `/goals` | `/api/backend/goals` | `backend/goals/route.ts` |
| `/goals/{id}` | `/api/backend/goals/:id` | `backend/goals/[id]/route.ts` |
| `/stages` | `/api/backend/stages` | `backend/stages/route.ts` |
| `/stages/{id}` | `/api/backend/stages/:id` | `backend/stages/[id]/route.ts` |
| `/phases` | `/api/backend/phases` | `backend/phases/route.ts` |
| `/phases/{id}` | `/api/backend/phases/:id` | `backend/phases/[id]/route.ts` |
| `/milestones` | `/api/backend/milestones` | `backend/milestones/route.ts` |
| `/milestones/{id}` | `/api/backend/milestones/:id` | `backend/milestones/[id]/route.ts` |
| `/tasks` | `/api/backend/tasks` | `backend/tasks/route.ts` |
| `/tasks/{id}` | `/api/backend/tasks/:id` | `backend/tasks/[id]/route.ts` |
| `/organization-categories-master` | `/api/backend/organization-categories-master` | `backend/organization-categories-master/route.ts` |
| `/organization-categories-master/{id}` | `/api/backend/organization-categories-master/:id` | `backend/organization-categories-master/[id]/route.ts` |
| `/organization-services-master` | `/api/backend/organization-services-master` | `backend/organization-services-master/route.ts` |
| `/organization-services-master/{id}` | `/api/backend/organization-services-master/:id` | `backend/organization-services-master/[id]/route.ts` |
| `/organization-categories` | `/api/backend/organization-categories` | `backend/organization-categories/route.ts` |
| `/organization-categories/{id}` | `/api/backend/organization-categories/:id` | `backend/organization-categories/[id]/route.ts` |
| `/organization-services` | `/api/backend/organization-services` | `backend/organization-services/route.ts` |
| `/organization-services/{id}` | `/api/backend/organization-services/:id` | `backend/organization-services/[id]/route.ts` |
| `/project-organization-budget-links` | `/api/backend/project-organization-budget-links` | `backend/project-organization-budget-links/route.ts` |
| `/project-organization-budget-links/{id}` | `/api/backend/project-organization-budget-links/:id` | `backend/project-organization-budget-links/[id]/route.ts` |
| `/audit-log` | `/api/backend/audit-log` | `backend/audit-log/route.ts` |
| `/audit-log/{id}` | `/api/backend/audit-log/:id` | `backend/audit-log/[id]/route.ts` |

## 🔐 Autenticação

A autenticação será gerenciada no `_shared/backend.ts`:

```typescript
// Exemplo de como será implementado
const token = req.cookies.get('token')?.value;
if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}
```

**Fluxo:**
1. Frontend faz login → recebe token
2. Token é armazenado em cookie httpOnly
3. Cada requisição ao BFF inclui o cookie automaticamente
4. BFF extrai o token e adiciona no header `Authorization` para a API Java

## 🚀 Implementação dos Route Handlers

### Exemplo Completo: `projects/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { proxyToJava } from '@/app/api/_shared/backend';

// GET /api/backend/projects
export async function GET(req: NextRequest) {
  return proxyToJava(req, '/api/projects');
}

// POST /api/backend/projects
export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyToJava(req, '/api/projects', {
    method: 'POST',
    body,
  });
}
```

### Exemplo Completo: `projects/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { proxyToJava } from '@/app/api/_shared/backend';

// GET /api/backend/projects/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToJava(req, `/api/projects/${id}`);
}

// PUT /api/backend/projects/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  return proxyToJava(req, `/api/projects/${id}`, {
    method: 'PUT',
    body,
  });
}

// DELETE /api/backend/projects/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToJava(req, `/api/projects/${id}`, {
    method: 'DELETE',
  });
}
```

## ⚙️ Variáveis de Ambiente

Configure no `.env.local`:

```env
API_BASE_URL=http://192.168.10.100:8080
```

**Importante:**
- A variável `API_BASE_URL` é usada apenas no servidor (route handlers)
- Não é exposta ao cliente (segurança)
- Reinicie o servidor Next.js após alterar variáveis de ambiente

## 📊 Estrutura de Resposta Padrão

### Sucesso (200 OK)

```json
{
  "id": 1,
  "name": "Projeto Exemplo",
  "status": "EM_ANDAMENTO",
  ...
}
```

### Erro (4xx, 5xx)

```json
{
  "error": "Mensagem de erro amigável",
  "details": "Detalhes técnicos (opcional)",
  "code": "ERROR_CODE"
}
```

## 🔍 Debugging

Para debugar requisições, adicione logs no `_shared/backend.ts`:

```typescript
console.log('🔍 [Proxy] Endpoint:', endpoint);
console.log('🔍 [Proxy] URL completa:', upstreamUrl);
console.log('🔍 [Proxy] Método:', method);
console.log('🔍 [Proxy] Headers:', headers);
```

## ✅ Checklist de Implementação

Para cada recurso, implementar:

- [ ] `route.ts` com GET e POST
- [ ] `[id]/route.ts` com GET, PUT e DELETE
- [ ] Testar listagem (GET)
- [ ] Testar criação (POST)
- [ ] Testar detalhes (GET :id)
- [ ] Testar atualização (PUT :id)
- [ ] Testar exclusão (DELETE :id)
- [ ] Tratar erros HTTP adequadamente
- [ ] Validar dados de entrada (opcional)

## 📚 Referências

- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [REST API Best Practices](https://restfulapi.net/)

## 🎯 Próximos Passos

1. ✅ Estrutura de pastas criada
2. ⏳ Implementar `_shared/backend.ts` com função `proxyToJava()`
3. ⏳ Implementar `_shared/errors.ts` para normalização de erros
4. ⏳ Implementar `_shared/response.ts` com helpers
5. ⏳ Implementar `_shared/types.ts` com tipos compartilhados
6. ⏳ Preencher route handlers de cada recurso
7. ⏳ Configurar autenticação (Bearer token)
8. ⏳ Testar integração com API Java
9. ⏳ Migrar frontend de mocks para chamadas ao BFF

## 📋 Resumo da Estrutura

### Recursos Implementados (27 recursos CRUD + 4 rotas especiais)

#### Recursos Principais (4)
| # | Recurso | Arquivos | Status |
|---|---------|----------|--------|
| 1 | `projects` | `route.ts` + `[id]/route.ts` | ✅ Implementado |
| 2 | `organizations` | `route.ts` + `[id]/route.ts` | ✅ Implementado |
| 3 | `peoples` | `route.ts` + `[id]/route.ts` | ✅ Implementado |
| 4 | `documents` | `route.ts` + `[id]/route.ts` | ✅ Implementado |

#### Financeiro (6)
| # | Recurso | Arquivos | Status |
|---|---------|----------|--------|
| 5 | `budget-categories` | `route.ts` + `[id]/route.ts` | ✅ Implementado |
| 6 | `budget-item` | `route.ts` + `[id]/route.ts` | ✅ Implementado |
| 7 | `disbursement-schedule` | `route.ts` + `[id]/route.ts` | ✅ Implementado |
| 8 | `income` | `route.ts` + `[id]/route.ts` | ✅ Implementado |
| 9 | `expenses` | `route.ts` + `[id]/route.ts` | ✅ Implementado |
| 10 | `budget-transfers` | `route.ts` + `[id]/route.ts` | ✅ Implementado |

#### Relacionamentos (3)
| # | Recurso | Arquivos | Status |
|---|---------|----------|--------|
| 11 | `project-people` | `route.ts` + `[id]/route.ts` | ✅ Implementado |
| 12 | `project_organization` | `route.ts` + `[id]/route.ts` | ✅ Implementado |
| 13 | `project-organization-budget-links` | `route.ts` + `[id]/route.ts` | ✅ Implementado |

#### Execução Técnica (5)
| # | Recurso | Arquivos | Status |
|---|---------|----------|--------|
| 14 | `goals` | `route.ts` + `[id]/route.ts` | ✅ Implementado |
| 15 | `stages` | `route.ts` + `[id]/route.ts` | ✅ Implementado |
| 16 | `phases` | `route.ts` + `[id]/route.ts` | ✅ Implementado |
| 17 | `milestones` | `route.ts` + `[id]/route.ts` | ✅ Implementado |
| 18 | `tasks` | `route.ts` + `[id]/route.ts` | ✅ Implementado |

#### Catálogos de Organização (4)
| # | Recurso | Arquivos | Status |
|---|---------|----------|--------|
| 19 | `organization-categories-master` | `route.ts` + `[id]/route.ts` | ✅ Implementado |
| 20 | `organization-services-master` | `route.ts` + `[id]/route.ts` | ✅ Implementado |
| 21 | `organization-categories` | `route.ts` + `[id]/route.ts` | ✅ Implementado |
| 22 | `organization-services` | `route.ts` + `[id]/route.ts` | ✅ Implementado |

#### Auditoria (1)
| # | Recurso | Arquivos | Status |
|---|---------|----------|--------|
| 23 | `audit-log` | `route.ts` + `[id]/route.ts` | ✅ Implementado (somente leitura) |

#### Iniciação de Contratos (4 rotas especiais)
| # | Recurso | Arquivos | Status |
|---|---------|----------|--------|
| 24 | `contracts/initiation/pipeline` | `route.ts` | ⏳ Placeholder (501) |
| 25 | `contracts/[id]/initiation/move` | `route.ts` | ⏳ Placeholder (501) |
| 26 | `contracts/[id]/initiation/activities` | `route.ts` | ⏳ Placeholder (501) |
| 27 | `contracts/[id]/initiation/activities/[activityId]` | `route.ts` | ⏳ Placeholder (501) |

### Utilitários Compartilhados (4 arquivos)

| Arquivo | Descrição | Status |
|---------|-----------|--------|
| `_shared/backend.ts` | Função de proxy para API Java | ✅ Implementado |
| `_shared/errors.ts` | Normalização de erros | ✅ Implementado |
| `_shared/response.ts` | Helpers de NextResponse | ✅ Implementado |
| `_shared/types.ts` | Tipos TypeScript compartilhados | ✅ Implementado |

**Total:** 27 recursos CRUD × 2 arquivos = 54 route handlers + 4 rotas especiais + 4 utilitários = **62 arquivos**

---

**Última atualização:** Janeiro 2025  
**Mantido por:** Equipe GoPro 2.0
