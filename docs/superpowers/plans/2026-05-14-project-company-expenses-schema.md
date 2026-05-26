# Project Company Expenses Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar as migrations que adicionam `expenses.project_company_id`, FK e índices para empresa contratada, mantendo compatibilidade com dados legados.

**Architecture:** A mudança é restrita ao schema Flyway. Não altera entidades, DTOs, services, mappers nem frontend nesta subtask. `organization_id` permanece como legado e `project_company_id` entra nullable para permitir rollout sem quebra.

**Tech Stack:** PostgreSQL 16, Flyway, Spring Boot, Maven Wrapper, PowerShell no Windows.

---

## Files

- Create: `api_gopro/src/main/resources/db/migration/core/V137__add_project_company_to_expenses.sql`
- Create: `api_gopro/src/main/resources/db/migration/prod/V049__add_project_company_to_expenses.sql`
- Validate only: `api_gopro/src/main/resources/db/migration/core/V135__add_budget_item_beneficiary_fields.sql`
- Validate only: `api_gopro/src/main/resources/db/migration/prod/V047__add_budget_item_beneficiary_fields.sql`

## Task 1: Criar Migration Core

**Files:**
- Create: `api_gopro/src/main/resources/db/migration/core/V137__add_project_company_to_expenses.sql`

- [ ] **Step 1: Criar o arquivo da migration core**

Criar `api_gopro/src/main/resources/db/migration/core/V137__add_project_company_to_expenses.sql` com:

```sql
-- Adds the official project-company link for contracted-company payments.
-- Existing organization_id data is legacy and intentionally not backfilled here.

ALTER TABLE IF EXISTS expenses
    ADD COLUMN IF NOT EXISTS project_company_id bigint;

ALTER TABLE IF EXISTS budget_items
    ADD COLUMN IF NOT EXISTS project_company_id bigint;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_expenses_project_company_id'
    ) THEN
        ALTER TABLE expenses
            ADD CONSTRAINT fk_expenses_project_company_id
                FOREIGN KEY (project_company_id) REFERENCES project_company (id);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_budget_items_project_company_id'
    ) THEN
        ALTER TABLE budget_items
            ADD CONSTRAINT fk_budget_items_project_company_id
                FOREIGN KEY (project_company_id) REFERENCES project_company (id);
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_expenses_project_company_id
    ON expenses (project_company_id);

CREATE INDEX IF NOT EXISTS idx_budget_items_project_company_id
    ON budget_items (project_company_id);
```

- [ ] **Step 2: Conferir que não há backfill automático**

Run:

```powershell
Select-String -LiteralPath "api_gopro\src\main\resources\db\migration\core\V137__add_project_company_to_expenses.sql" -Pattern "UPDATE|INSERT|organization_id"
```

Expected:

```text
Somente o comentário pode citar organization_id. Não deve haver UPDATE nem INSERT.
```

## Task 2: Criar Migration Prod

**Files:**
- Create: `api_gopro/src/main/resources/db/migration/prod/V049__add_project_company_to_expenses.sql`

- [ ] **Step 1: Criar o arquivo da migration prod**

Criar `api_gopro/src/main/resources/db/migration/prod/V049__add_project_company_to_expenses.sql` com o mesmo conteúdo da migration core:

```sql
-- Adds the official project-company link for contracted-company payments.
-- Existing organization_id data is legacy and intentionally not backfilled here.

ALTER TABLE IF EXISTS expenses
    ADD COLUMN IF NOT EXISTS project_company_id bigint;

ALTER TABLE IF EXISTS budget_items
    ADD COLUMN IF NOT EXISTS project_company_id bigint;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_expenses_project_company_id'
    ) THEN
        ALTER TABLE expenses
            ADD CONSTRAINT fk_expenses_project_company_id
                FOREIGN KEY (project_company_id) REFERENCES project_company (id);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_budget_items_project_company_id'
    ) THEN
        ALTER TABLE budget_items
            ADD CONSTRAINT fk_budget_items_project_company_id
                FOREIGN KEY (project_company_id) REFERENCES project_company (id);
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_expenses_project_company_id
    ON expenses (project_company_id);

CREATE INDEX IF NOT EXISTS idx_budget_items_project_company_id
    ON budget_items (project_company_id);
```

- [ ] **Step 2: Conferir equivalência entre core e prod**

Run:

```powershell
Compare-Object `
  (Get-Content -LiteralPath "api_gopro\src\main\resources\db\migration\core\V137__add_project_company_to_expenses.sql") `
  (Get-Content -LiteralPath "api_gopro\src\main\resources\db\migration\prod\V049__add_project_company_to_expenses.sql")
```

Expected:

```text
Sem saída.
```

## Task 3: Validar Flyway Localmente

**Files:**
- Validate: `api_gopro/pom.xml`
- Validate: `api_gopro/src/main/resources/application*.properties`

- [ ] **Step 1: Rodar backend com Flyway**

Run:

```powershell
cd api_gopro
.\mvnw.cmd spring-boot:run
```

Expected:

```text
Successfully validated
Migrating schema "public" to version "137 - add project company to expenses"
Schema "public" is up to date. No migration necessary.
Started ApiDaGoproApplication
```

Se o ambiente local já estiver em outra sequência de versão, o número esperado deve seguir a próxima versão ainda não aplicada da pasta configurada pelo perfil ativo.

- [ ] **Step 2: Conferir colunas**

Run no banco local:

```sql
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('expenses', 'budget_items')
  AND column_name = 'project_company_id'
ORDER BY table_name;
```

Expected:

```text
budget_items | project_company_id | bigint | YES
expenses     | project_company_id | bigint | YES
```

- [ ] **Step 3: Conferir constraints**

Run no banco local:

```sql
SELECT conname
FROM pg_constraint
WHERE conname IN (
    'fk_expenses_project_company_id',
    'fk_budget_items_project_company_id'
)
ORDER BY conname;
```

Expected:

```text
fk_budget_items_project_company_id
fk_expenses_project_company_id
```

- [ ] **Step 4: Conferir índices**

Run no banco local:

```sql
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
      'idx_expenses_project_company_id',
      'idx_budget_items_project_company_id'
  )
ORDER BY indexname;
```

Expected:

```text
idx_budget_items_project_company_id
idx_expenses_project_company_id
```

## Task 4: Validar Integridade Referencial

**Files:**
- Validate only: banco local PostgreSQL

- [ ] **Step 1: Encontrar uma despesa existente**

Run no banco local:

```sql
SELECT id
FROM expenses
WHERE is_active = true
ORDER BY id
LIMIT 1;
```

Expected:

```text
Retorna um id numérico de despesa.
```

- [ ] **Step 2: Testar FK inválida dentro de transação com rollback**

Substituir `<expense_id>` pelo id retornado no passo anterior.

Run no banco local:

```sql
BEGIN;

UPDATE expenses
SET project_company_id = -1
WHERE id = <expense_id>;

ROLLBACK;
```

Expected:

```text
ERROR: insert or update on table "expenses" violates foreign key constraint "fk_expenses_project_company_id"
```

- [ ] **Step 3: Confirmar que registros legados continuam válidos**

Run no banco local:

```sql
SELECT COUNT(*) AS expenses_without_project_company
FROM expenses
WHERE project_company_id IS NULL;
```

Expected:

```text
Retorna zero ou mais registros. A query deve executar sem erro.
```

## Task 5: Documentar Legado e Rollback no PR

**Files:**
- No file change required if the PR body is used.

- [ ] **Step 1: Usar este texto no PR**

```markdown
### Legado e compatibilidade

Esta mudança adiciona `expenses.project_company_id` como referência oficial para pagamentos de empresas contratadas vinculadas ao projeto por `project_company(id)`.

`expenses.organization_id` permanece no schema por compatibilidade, mas não deve ser usado como vínculo principal de empresa contratada nas próximas integrações.

Não foi feito backfill automático de `organization_id` para `project_company_id`, porque não há regra confiável para inferir o vínculo correto sem risco de associar pagamentos à empresa errada.

### Rollback

Rollback manual seguro antes de uso efetivo pela aplicação:

```sql
DROP INDEX IF EXISTS idx_expenses_project_company_id;
DROP INDEX IF EXISTS idx_budget_items_project_company_id;

ALTER TABLE IF EXISTS expenses
    DROP CONSTRAINT IF EXISTS fk_expenses_project_company_id;

ALTER TABLE IF EXISTS expenses
    DROP COLUMN IF EXISTS project_company_id;
```

`budget_items.project_company_id` não é removido no rollback desta subtask porque já pertence à migration anterior de beneficiários de rubrica.
```

## Task 6: Commit Da Subtask

**Files:**
- Add: `api_gopro/src/main/resources/db/migration/core/V137__add_project_company_to_expenses.sql`
- Add: `api_gopro/src/main/resources/db/migration/prod/V049__add_project_company_to_expenses.sql`

- [ ] **Step 1: Revisar diff**

Run:

```powershell
git -C api_gopro diff -- api_gopro/src/main/resources/db/migration/core/V137__add_project_company_to_expenses.sql api_gopro/src/main/resources/db/migration/prod/V049__add_project_company_to_expenses.sql
```

Expected:

```text
Mostra somente as duas migrations novas.
```

- [ ] **Step 2: Commit**

Run:

```powershell
git -C api_gopro add src/main/resources/db/migration/core/V137__add_project_company_to_expenses.sql src/main/resources/db/migration/prod/V049__add_project_company_to_expenses.sql
git -C api_gopro commit -m "feat: add project company link to expenses schema"
```

Expected:

```text
[feature/rubrica-beneficiario <hash>] feat: add project company link to expenses schema
```

## Self-Review

- Spec coverage: todas as exigências da Subtask 1 estão cobertas por migrations, validação de constraints, índices e nota de legado/rollback.
- Placeholder scan: sem marcadores pendentes ou instruções vagas.
- Type consistency: nomes usados são `project_company_id`, `fk_expenses_project_company_id`, `idx_expenses_project_company_id`, `idx_budget_items_project_company_id`.
