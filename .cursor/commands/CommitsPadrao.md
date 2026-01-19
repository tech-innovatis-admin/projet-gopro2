# Manual de Padronização de Commits

## 1. Objetivo e Princípios

### Objetivos

- Histórico legível e auditável
- Facilitar code review (PRs mais claros)
- Habilitar automações (changelog, versionamento, deploy)
- Reduzir ruído (commits pequenos, coesos e reversíveis)

### Princípios

- **1 commit = 1 intenção coesa**
- Mensagem curta, específica, sem "trabalhos em progresso"
- Preferir imperativo ("add", "fix", "remove") e evitar "feito", "ajustado"
- Quando houver impacto relevante: descrever o porquê no corpo

---

## 2. Formato Padrão

### Template

```
<type>(<scope>): <subject>

[body]

[footer(s)]
```

### Regras

| Campo | Descrição |
|-------|-----------|
| **type** | Obrigatório, minúsculo |
| **scope** | Recomendado (módulo/domínio); curto e consistente |
| **subject** | Obrigatório, até ~72 caracteres, sem ponto final |
| **body** | Opcional, explica motivação/decisões/alternativas |
| **footer** | Opcional, para breaking changes e referências (ticket, incident, etc) |

### Exemplo

```
feat(payments): add idempotency key to charge endpoint

Prevents double-charging when the gateway retries requests.

Refs: PAY-2143
```

---

## 3. Tipos Oficiais

### Mudança de Produto/Código

| Tipo | Descrição |
|------|-----------|
| `feat` | Nova funcionalidade (visível ao usuário/sistema) |
| `fix` | Correção de bug |
| `perf` | Melhoria de performance |
| `refactor` | Refatoração sem mudança de comportamento (sem bug fix/feat) |
| `revert` | Reverte commit anterior (o próprio Git gera bem isso) |

### Qualidade, Manutenção e Engenharia

| Tipo | Descrição |
|------|-----------|
| `test` | Adicionar/ajustar testes |
| `build` | Build system, dependências, tooling (npm, pip, gradle, bazel etc) |
| `ci` | Pipeline (GitHub Actions, Jenkins, etc) |
| `chore` | Tarefas operacionais/manutenção que não entram como feature/fix (ex.: ajustes menores, scripts, housekeeping) |
| `deps` | Somente atualização de dependências (quando a empresa prefere rastrear separado) |

### Documentação e UX

| Tipo | Descrição |
|------|-----------|
| `docs` | Documentação (README, ADR, runbook, docstring relevante) |
| `style` | Formatação/lint/estilo (sem mudança lógica). Use com parcimônia |
| `ui` | Mudanças estritamente de UI/UX (opcional; só use se fizer sentido no seu contexto) |

### Observabilidade e Operação

| Tipo | Descrição |
|------|-----------|
| `ops` | Mudanças operacionais (infra, config, deploy) se não houver repo separado |
| `sec` | Correções/mitigações de segurança |

> **Nota:** Se você quiser ser mais rígido e automatizar release, mantenha o conjunto menor (ex.: `feat`/`fix`/`perf`/`refactor`/`test`/`docs`/`build`/`ci`/`chore`/`revert`). Os demais são extensões.

---

## 4. Scopes (Padrão Corporativo)

Use scope para indicar onde a mudança ocorre.

### Por Domínio/Módulo

```
auth, payments, billing, pricing, users, catalog, search
```

### Por Camada

```
api, web, mobile, worker, db, infra, sdk
```

### Por Preocupação Transversal

```
observability, logging, metrics, security, compliance
```

### Boas Práticas

- Defina uma lista oficial curta por repo
- Evite scope "genérico" (misc, stuff)
- Não use escopo para ticket. Ticket vai no footer

---

## 5. Assunto (Subject): Padrões e Anti-padrões

### ✅ Faça

Use verbos no imperativo:
- `add`, `remove`, `update`, `fix`, `prevent`, `enable`, `disable`, `rename`

Seja específico: o que muda e onde.

### ❌ Evite

- "ajustes", "melhorias", "update", "fix bug" genérico
- "WIP", "temp", "test", "trying"

### Exemplos

**❌ Ruim:**
```
fix: bug
```

**✅ Bom:**
```
fix(auth): prevent token refresh race condition
```

---

## 6. Body: Quando Usar e O Que Escrever

### Use o corpo quando:

- O porquê não é óbvio
- Houve trade-off arquitetural
- Mudança afeta comportamento, compatibilidade, migração

### Estrutura Recomendada

1. **Contexto** (problema)
2. **Decisão** (o que foi feito)
3. **Consequências** (impacto/risco/migração)

### Exemplo

```
refactor(search): consolidate query builder into a single module

Reduces duplication across API and worker.
No behavior change intended; validated with regression tests.

Refs: SRCH-882
```

---

## 7. Footers (Tickets, Breaking Changes, Incident)

### Referência de Ticket

Padronize um formato:

```
Refs: ABC-1234
```

ou

```
Closes: ABC-1234
```

(se quiser fechar automaticamente no tracker)

### Breaking Change (quando quebra compatibilidade)

Use `!` após o type/scope e/ou footer `BREAKING CHANGE: ...`

**Exemplo:**

```
feat(api)!: rename /v1/orders endpoint to /v2/orders

BREAKING CHANGE: clients must migrate to /v2/orders.
Refs: ORD-3101
```

### Incident / Hotfix

```
Incident: INC-7781
Hotfix: HF-2026-01-19
```

---

## 8. Catálogo de Exemplos (por Situação)

### Features

```
feat(catalog): add bulk import endpoint
feat(web): enable feature flag for new checkout
```

### Fixes

```
fix(payments): handle gateway timeout with retry backoff
fix(db): correct migration ordering for invoices table
```

### Refactor

```
refactor(auth): extract jwt validation into middleware
refactor(worker): simplify retry policy configuration
```

### Performance

```
perf(search): cache normalized filters to reduce query time
perf(api): reduce payload size by trimming unused fields
```

### Tests

```
test(payments): add coverage for partial refund scenarios
test(api): add contract tests for pagination
```

### Docs

```
docs(runbook): add rollback procedure for payments deploy
docs(adr): document decision on outbox pattern
```

### CI / Build

```
ci: add lint job to PR checks
build: pin node to 20.x for reproducible builds
```

### Dependências

```
deps: bump fastapi from 0.110 to 0.111
deps(security): update openssl to patched version
```

### Chore / Manutenção

```
chore(repo): standardize editorconfig and line endings
chore(logging): align log levels across services
```

### Revert

```
revert: feat(payments): add idempotency key to charge endpoint
```

### Segurança

```
sec(auth): mitigate token replay by rotating signing key
sec: mask sensitive fields in logs
```

### Operação/Infra (se aplicável no mesmo repo)

```
ops(infra): add redis instance for session cache
ops(deploy): switch rollout strategy to blue/green
```

---

## 9. Política de Granularidade e Qualidade

### Tamanho do Commit

- **Ideal:** até ~200 linhas líquidas por commit (heurística)
- Separar em commits: preparação (refactor), mudança (feat/fix), testes/docs

### Ordem Recomendada em um PR

1. `refactor(...)` - preparação, sem mudar comportamento
2. `feat(...)` ou `fix(...)` - mudança principal
3. `test(...)` - testes
4. `docs(...)` - documentação (se necessário)
5. `chore(...)` - tarefas auxiliares (separado, se possível)

---

## 10. Convenções para Branches e PRs

### Branches

```
feature/ABC-1234-short-description
fix/ABC-2345-null-pointer-on-login
chore/ABC-3456-update-ci
```

### Título de PR

- Pode espelhar commit principal: `feat(payments): add idempotency key...`
- Sempre com ticket no título: `ABC-1234 feat(payments): ...` (se o time exigir)

---

## 11. Checklist Rápido (Antes de Commitar)

- [ ] O commit tem uma intenção única?
- [ ] O type está correto?
- [ ] O scope representa bem o módulo?
- [ ] O subject está específico e no imperativo?
- [ ] Existe ticket no footer quando aplicável?
- [ ] Se for breaking, está marcado com `!` e/ou `BREAKING CHANGE`?
- [ ] Testes e docs estão endereçados (no commit ou no PR)?

---

## 12. Template Pronto

```bash
type(scope): subject

Context:
- What problem does this solve?

Change:
- What was done?

Impact/Risk:
- Any side effects, migrations, or risks?

Refs: ABC-1234
```

---

## Referências

Este manual segue as convenções do [Conventional Commits](https://www.conventionalcommits.org/) e boas práticas de versionamento semântico.
