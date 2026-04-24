# 🔐 Documentação de Autenticação - GoPro 2.0

Este documento explica como funciona o sistema de autenticação do GoPro 2.0, quais páginas e endpoints estão protegidos, e identifica possíveis problemas de segurança.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Fluxo de Autenticação](#fluxo-de-autenticação)
3. [Middleware de Autenticação](#middleware-de-autenticação)
4. [Páginas Protegidas](#páginas-protegidas)
5. [Endpoints de API](#endpoints-de-api)
6. [Análise de Segurança](#análise-de-segurança)
7. [Recomendações](#recomendações)

---

## 🎯 Visão Geral

O GoPro 2.0 utiliza um sistema de autenticação baseado em **JWT (JSON Web Tokens)** com suporte temporário a tokens legacy (base64) apenas em desenvolvimento. A autenticação é gerenciada pelo **middleware do Next.js** que intercepta todas as requisições antes de chegarem às rotas.

### Componentes Principais

- **`middleware.ts`**: Intercepta todas as requisições e valida autenticação
- **`lib/jwt.ts`**: Geração e validação de tokens JWT
- **`app/api/auth/*`**: Endpoints de autenticação (login, logout, me)
- **`app/api/backend/*`**: Endpoints protegidos que fazem proxy para API Java

---

## 🔄 Fluxo de Autenticação

### 1. Login

```
Usuário → POST /api/auth/login
         ↓
    Valida credenciais (mock atual)
         ↓
    Gera token base64 (legacy) ou JWT
         ↓
    Define cookie httpOnly: 'token' ou 'access_token'
         ↓
    Retorna dados do usuário
```

**Arquivo**: `src/app/api/auth/login/route.ts`

**Status Atual**: 
- ⚠️ **Usando token base64 legacy** (`token` cookie)
- ⚠️ **Não está usando JWT** (`access_token` cookie)
- ⚠️ **Mock de autenticação** (não conecta ao banco de dados)

### 2. Validação no Middleware

```
Requisição → middleware.ts
           ↓
    Verifica cookies/headers:
      - access_token (JWT) [PREFERIDO]
      - Authorization: Bearer <JWT>
      - token (base64 legacy) [DEV ONLY]
           ↓
    Valida token:
      - JWT: Verifica assinatura, tipo 'access', email
      - Legacy: Verifica expiração
           ↓
    Define isAuthenticated
```

**Arquivo**: `src/middleware.ts` (linhas 33-97)

### 3. Proteção de Rotas

```
isAuthenticated = false
         ↓
    É rota de API? (/api/*)
         ├─ SIM → Retorna 401 JSON
         └─ NÃO → Redireciona para /login
```

**Comportamento Correto**: ✅
- APIs retornam `401 Unauthorized` (não redirecionam)
- Páginas redirecionam para `/login`

---

## 🛡️ Middleware de Autenticação

### Localização
`src/middleware.ts`

### Rotas Públicas (Não Requerem Autenticação)

```typescript
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password'
];
```

**Todas as rotas que começam com esses prefixos são públicas.**

### Rotas de API Públicas

```typescript
const isAuthApi = pathname.startsWith('/api/auth');
```

**Endpoints públicos**:
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Verificar autenticação atual

⚠️ **ATENÇÃO**: `/api/auth/me` é público, mas retorna informações do usuário se autenticado. Isso é aceitável pois não expõe dados sensíveis sem autenticação.

### Matcher do Middleware

O middleware é executado para **todas as rotas**, exceto:

- `_next/static/*` (arquivos estáticos)
- `_next/image/*` (otimização de imagens)
- `favicon.ico`
- Arquivos de imagem (`.svg`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.ico`)

**Configuração**: `src/middleware.ts` (linhas 100-111)

---

## 📄 Páginas Protegidas

Todas as páginas dentro de `src/app/(dashboard)/` são **protegidas por padrão**.

### Páginas Principais Protegidas

| Rota | Descrição | Status |
|------|-----------|--------|
| `/` | Redireciona para `/home` | 🔒 Protegida |
| `/home` | Dashboard principal | 🔒 Protegida |
| `/contratos` | Listagem de contratos | 🔒 Protegida |
| `/contratos/[id]` | Detalhes do contrato | 🔒 Protegida |
| `/contratos/[id]/editar` | Edição do contrato | 🔒 Protegida |
| `/contratos/[id]/rubricas` | Rubricas do contrato | 🔒 Protegida |
| `/contratos/[id]/equipe-tecnica` | Equipe técnica | 🔒 Protegida |
| `/contratos/[id]/trilha` | Trilha de iniciação | 🔒 Protegida |
| `/contratos/funil` | Funil de contratos | 🔒 Protegida |
| `/contratos/pre-projetos` | Pré-projetos | 🔒 Protegida |
| `/equipe` | Atalho para admin/usuarios | 🔒 Protegida |
| `/fornecedores` | Listagem de fornecedores | 🔒 Protegida |
| `/fornecedores/[id]` | Detalhes do fornecedor | 🔒 Protegida |
| `/parceiros` | Parceiros | 🔒 Protegida |
| `/perfil` | Perfil do usuário | 🔒 Protegida |
| `/perfil/atividades` | Atividades pendentes | 🔒 Protegida |
| `/perfil/configuracoes` | Configurações | 🔒 Protegida |
| `/perfil/seguranca` | Segurança da conta | 🔒 Protegida |
| `/perfil/suporte` | Suporte | 🔒 Protegida |

### Páginas Públicas

| Rota | Descrição | Status |
|------|-----------|--------|
| `/login` | Página de login | 🌐 Pública |
| `/register` | Registro (se implementado) | 🌐 Pública |
| `/forgot-password` | Recuperação de senha (se implementado) | 🌐 Pública |

**Comportamento Especial**:
- Se usuário **autenticado** acessa `/login`, é redirecionado para `/` (linha 90-94 do middleware)

---

## 🔌 Endpoints de API

### Endpoints Públicos (`/api/auth/*`)

| Endpoint | Método | Descrição | Autenticação |
|----------|--------|-----------|--------------|
| `/api/auth/login` | POST | Login do usuário | ❌ Não requer |
| `/api/auth/logout` | POST | Logout do usuário | ⚠️ Não requer (mas deveria) |
| `/api/auth/me` | GET | Verificar autenticação atual | ⚠️ Não requer (mas retorna dados se autenticado) |

### Endpoints Protegidos (`/api/backend/*`)

**Todos os endpoints abaixo requerem autenticação e retornam `401` se não autenticados.**

#### Recursos Principais

| Endpoint | Métodos | Descrição |
|----------|---------|-----------|
| `/api/backend/projects` | GET, POST | Projetos/Contratos |
| `/api/backend/projects/:id` | GET, PUT, DELETE | Detalhes de projeto |
| `/api/backend/organizations` | GET, POST | Organizações |
| `/api/backend/organizations/:id` | GET, PUT, DELETE | Detalhes de organização |
| `/api/backend/peoples` | GET, POST | Pessoas |
| `/api/backend/peoples/:id` | GET, PUT, DELETE | Detalhes de pessoa |
| `/api/backend/documents` | GET, POST | Documentos |
| `/api/backend/documents/:id` | GET, PUT, DELETE | Detalhes de documento |

#### Recursos Financeiros

| Endpoint | Métodos | Descrição |
|----------|---------|-----------|
| `/api/backend/budget-categories` | GET, POST | Categorias de orçamento |
| `/api/backend/budget-categories/:id` | GET, PUT, DELETE | Detalhes de categoria |
| `/api/backend/budget-item` | GET, POST | Itens de orçamento |
| `/api/backend/budget-item/:id` | GET, PUT, DELETE | Detalhes de item |
| `/api/backend/disbursement-schedule` | GET, POST | Cronograma de desembolso |
| `/api/backend/disbursement-schedule/:id` | GET, PUT, DELETE | Detalhes de desembolso |
| `/api/backend/income` | GET, POST | Receitas |
| `/api/backend/income/:id` | GET, PUT, DELETE | Detalhes de receita |
| `/api/backend/expenses` | GET, POST | Despesas |
| `/api/backend/expenses/:id` | GET, PUT, DELETE | Detalhes de despesa |
| `/api/backend/budget-transfers` | GET, POST | Transferências de orçamento |
| `/api/backend/budget-transfers/:id` | GET, PUT, DELETE | Detalhes de transferência |

#### Recursos de Execução

| Endpoint | Métodos | Descrição |
|----------|---------|-----------|
| `/api/backend/goals` | GET, POST | Metas |
| `/api/backend/goals/:id` | GET, PUT, DELETE | Detalhes de meta |
| `/api/backend/stages` | GET, POST | Etapas |
| `/api/backend/stages/:id` | GET, PUT, DELETE | Detalhes de etapa |
| `/api/backend/phases` | GET, POST | Fases |
| `/api/backend/phases/:id` | GET, PUT, DELETE | Detalhes de fase |
| `/api/backend/milestones` | GET, POST | Marcos |
| `/api/backend/milestones/:id` | GET, PUT, DELETE | Detalhes de marco |
| `/api/backend/tasks` | GET, POST | Tarefas |
| `/api/backend/tasks/:id` | GET, PUT, DELETE | Detalhes de tarefa |

#### Recursos de Organização

| Endpoint | Métodos | Descrição |
|----------|---------|-----------|
| `/api/backend/organization-categories` | GET, POST | Categorias de organização |
| `/api/backend/organization-categories/:id` | GET, PUT, DELETE | Detalhes de categoria |
| `/api/backend/organization-services` | GET, POST | Serviços de organização |
| `/api/backend/organization-services/:id` | GET, PUT, DELETE | Detalhes de serviço |
| `/api/backend/organization-categories-master` | GET, POST | Categorias master |
| `/api/backend/organization-categories-master/:id` | GET, PUT, DELETE | Detalhes de categoria master |
| `/api/backend/organization-services-master` | GET, POST | Serviços master |
| `/api/backend/organization-services-master/:id` | GET, PUT, DELETE | Detalhes de serviço master |

#### Recursos de Relacionamento

| Endpoint | Métodos | Descrição |
|----------|---------|-----------|
| `/api/backend/project_organization` | GET, POST | Relação projeto-organização |
| `/api/backend/project_organization/:id` | GET, PUT, DELETE | Detalhes de relação |
| `/api/backend/project-people` | GET, POST | Relação projeto-pessoa |
| `/api/backend/project-people/:id` | GET, PUT, DELETE | Detalhes de relação |
| `/api/backend/project-organization-budget-links` | GET, POST | Links de orçamento |
| `/api/backend/project-organization-budget-links/:id` | GET, PUT, DELETE | Detalhes de link |

#### Recursos Especiais

| Endpoint | Métodos | Descrição |
|----------|---------|-----------|
| `/api/backend/audit-log` | GET | Log de auditoria |
| `/api/backend/audit-log/:id` | GET | Detalhes de log |
| `/api/backend/contracts/:id/trail/activities` | GET, POST | Atividades da trilha |
| `/api/backend/contracts/:id/trail/activities/:activityId` | PATCH, PUT | Atualizar atividade |
| `/api/backend/contracts/:id/trail/move` | PATCH, POST | Mover na trilha |
| `/api/backend/contracts/trail/pipeline` | GET | Pipeline da trilha |

**Total**: ~51 endpoints protegidos

---

## 🔍 Análise de Segurança

### ✅ Pontos Positivos

1. **Middleware Centralizado**: Todas as rotas são protegidas por um único middleware
2. **APIs Retornam 401**: Endpoints de API retornam JSON `401` ao invés de redirecionar (correto)
3. **Cookies HttpOnly**: Tokens são armazenados em cookies `httpOnly` (proteção contra XSS)
4. **Cookies Secure em Produção**: Cookies só são enviados via HTTPS em produção
5. **Validação de JWT**: Tokens JWT são validados com assinatura e tipo
6. **Separação de Rotas**: Rotas públicas claramente definidas

### ⚠️ Problemas Identificados

#### 1. Sistema de Autenticação Duplo (Conflito)

**Problema**: Existem dois sistemas de autenticação em uso simultaneamente:

- **JWT** (`access_token` cookie) - Sistema novo/preferido
- **Base64 Legacy** (`token` cookie) - Sistema antigo/compatibilidade DEV

**Localização**: 
- `src/middleware.ts` (linhas 42-60)
- `src/app/api/auth/login/route.ts` (ainda usa base64)

**Risco**: 
- Confusão sobre qual sistema usar
- Possibilidade de bypass se um sistema falhar
- Tokens legacy são menos seguros (sem assinatura criptográfica)

**Status**: ⚠️ **Parcialmente Resolvido** (middleware suporta ambos, mas login ainda usa legacy)

#### 2. Endpoint `/api/auth/logout` Não Requer Autenticação

**Problema**: O endpoint de logout não verifica se o usuário está autenticado antes de limpar cookies.

**Localização**: `src/app/api/auth/logout/route.ts`

**Risco**: 
- Baixo (apenas limpa cookies, não expõe dados)
- Mas pode ser usado para "limpar" cookies de outros usuários em cenários específicos

**Recomendação**: Adicionar verificação de autenticação antes de limpar cookies.

#### 3. Mock de Autenticação em Produção

**Problema**: O endpoint de login usa credenciais mockadas (`admin`/`123`) e não consulta o banco de dados.

**Localização**: `src/app/api/auth/login/route.ts` (linhas 3-11)

**Risco**: 
- ⚠️ **CRÍTICO**: Qualquer um pode fazer login com credenciais conhecidas
- Não há validação real de usuário/senha

**Status**: ⚠️ **Aguardando Implementação Real**

#### 4. Token Legacy Aceito em Produção (Potencial)

**Problema**: O código verifica `NODE_ENV !== 'production'` para aceitar tokens legacy, mas se houver um bug ou configuração incorreta, tokens legacy podem ser aceitos em produção.

**Localização**: `src/middleware.ts` (linha 52)

**Risco**: 
- Médio (depende de configuração)
- Tokens legacy são menos seguros

**Status**: ✅ **Protegido por verificação de ambiente**, mas requer atenção

#### 5. Endpoint `/api/auth/me` Expõe Informações sem Validação Rigorosa

**Problema**: O endpoint `/api/auth/me` é público, mas retorna informações do usuário se um token válido estiver presente. Não há validação adicional além do token.

**Localização**: `src/app/api/auth/me/route.ts`

**Risco**: 
- Baixo (requer token válido)
- Mas pode expor informações se token for comprometido

**Status**: ✅ **Aceitável** (comportamento padrão de endpoints `/me`)

---

## 📊 Resumo de Proteção

### Páginas

| Tipo | Quantidade | Status |
|------|------------|--------|
| Protegidas | ~30+ páginas | ✅ Protegidas |
| Públicas | 3 rotas (`/login`, `/register`, `/forgot-password`) | ✅ Configuradas |

### Endpoints de API

| Tipo | Quantidade | Status |
|------|------------|--------|
| Protegidos (`/api/backend/*`) | ~51 endpoints | ✅ Protegidos (401 se não autenticado) |
| Públicos (`/api/auth/*`) | 3 endpoints | ✅ Públicos (conforme esperado) |

### Endpoints Expostos (Potencial Problema)

| Endpoint | Método | Problema | Severidade |
|----------|--------|----------|------------|
| `/api/auth/logout` | POST | Não requer autenticação | 🟡 Baixa |
| `/api/auth/me` | GET | Público mas retorna dados se autenticado | 🟢 Aceitável |

**Conclusão**: ✅ **Nenhum endpoint crítico está exposto indevidamente.**

---

## 🎯 Recomendações

### Prioridade Alta 🔴

1. **Migrar Login para JWT**
   - Atualizar `src/app/api/auth/login/route.ts` para usar `generateTokenPair()` de `lib/jwt.ts`
   - Usar `createAuthResponse()` para definir cookies `access_token` e `refresh_token`
   - Remover geração de token base64 legacy

2. **Implementar Autenticação Real**
   - Conectar login ao banco de dados (Prisma)
   - Validar senha com hash (bcrypt/argon2)
   - Remover credenciais mockadas

3. **Proteger Endpoint de Logout**
   - Adicionar verificação de autenticação em `src/app/api/auth/logout/route.ts`
   - Limpar ambos os cookies (`access_token` e `token`)

### Prioridade Média 🟡

4. **Remover Suporte a Token Legacy em Produção**
   - Garantir que `NODE_ENV` está configurado corretamente
   - Adicionar logs de alerta se token legacy for usado em produção
   - Planejar remoção completa após migração completa para JWT

5. **Adicionar Rate Limiting**
   - Implementar rate limiting em `/api/auth/login` para prevenir brute force
   - Usar biblioteca como `@upstash/ratelimit` ou similar

6. **Implementar Refresh Token**
   - Usar `refresh_token` para renovar `access_token` automaticamente
   - Criar endpoint `/api/auth/refresh` para renovação

### Prioridade Baixa 🟢

7. **Adicionar Logs de Auditoria**
   - Registrar tentativas de login (sucesso/falha)
   - Registrar acessos a endpoints sensíveis
   - Usar `audit-log` endpoint para armazenar

8. **Melhorar Validação de Tokens**
   - Adicionar verificação de revogação (blacklist)
   - Implementar expiração mais curta para `access_token` (15min atual está bom)
   - Adicionar verificação de IP/user-agent (opcional)

---

## 📝 Notas Técnicas

### Cookies Configurados

**JWT (Novo Sistema)**:
- `access_token`: HttpOnly, Secure (prod), SameSite=Lax, MaxAge=15min
- `refresh_token`: HttpOnly, Secure (prod), SameSite=Lax, MaxAge=7d

**Legacy (Sistema Antigo)**:
- `token`: HttpOnly, Secure (prod), SameSite=Lax, MaxAge=7d

### Validação de Tokens

**JWT**:
- Verifica assinatura com `JWT_SECRET`
- Valida tipo (`access` ou `refresh`)
- Valida presença de `email`
- Usa biblioteca `jose` (Edge-compatible)

**Legacy**:
- Decodifica base64
- Verifica expiração (`exp > Date.now()`)
- Não valida assinatura (menos seguro)

---

## 🔗 Referências

- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Última Atualização**: Janeiro 2026  
**Versão do Documento**: 1.0
