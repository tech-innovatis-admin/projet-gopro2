# Subtask 1 - Schema para empresa contratada em pagamentos

## Objetivo

Criar a base de banco para que pagamentos (`expenses`) possam referenciar a empresa contratada pelo vínculo oficial do projeto (`project_company.id`), sem continuar usando `organization_id` como identificador principal de empresa no fluxo financeiro.

## Estado Atual Validado

- `budget_items.project_company_id` já existe em `core/V135__add_budget_item_beneficiary_fields.sql` e `prod/V047__add_budget_item_beneficiary_fields.sql`.
- `budget_items.project_company_id` já possui FK para `project_company(id)`.
- Não foi encontrado índice específico para `budget_items(project_company_id)`.
- `expenses.project_company_id` ainda não existe.
- `expenses.organization_id` ainda existe e deve permanecer por compatibilidade nesta etapa.

## Escopo Desta Subtask

- Criar migration versionada nova para `core` e `prod`.
- Adicionar `expenses.project_company_id BIGINT NULL`.
- Garantir `budget_items.project_company_id BIGINT NULL` de forma idempotente.
- Criar FK de `expenses.project_company_id` para `project_company(id)`.
- Garantir FK de `budget_items.project_company_id` para `project_company(id)`.
- Criar índice para `expenses(project_company_id)`.
- Criar índice para `budget_items(project_company_id)`.
- Documentar que não há backfill automático de `organization_id` para `project_company_id`.

## Fora de Escopo

- Alterar entidade `Expense`.
- Alterar DTOs Java.
- Alterar DTOs TypeScript.
- Alterar services, mappers ou controllers.
- Alterar telas de pagamentos ou rubricas.
- Migrar dados legados automaticamente.

## Decisões Técnicas

- As novas colunas devem aceitar `NULL` para preservar registros legados.
- A migration deve ser idempotente sempre que possível com `IF NOT EXISTS` e checagem de constraints por `pg_constraint`.
- A FK de `expenses.project_company_id` garante que IDs inexistentes sejam rejeitados pelo banco.
- A validação de "pertence ao mesmo projeto" fica para subtask posterior de backend/service, porque esta subtask é exclusiva de schema.
- `organization_id` permanece como legado/deprecado, sem remoção e sem tentativa automática de conversão.

## Compatibilidade e Legado

Registros existentes em `expenses` permanecem válidos porque `project_company_id` será nullable. Registros antigos que usam `organization_id` não serão reclassificados nesta migration, pois não há regra confiável para inferir `project_company.id` a partir de `organization_id`.

## Rollback

Rollback manual seguro antes de uso em produção:

```sql
DROP INDEX IF EXISTS idx_expenses_project_company_id;
DROP INDEX IF EXISTS idx_budget_items_project_company_id;

ALTER TABLE IF EXISTS expenses
    DROP CONSTRAINT IF EXISTS fk_expenses_project_company_id;

ALTER TABLE IF EXISTS expenses
    DROP COLUMN IF EXISTS project_company_id;
```

`budget_items.project_company_id` não deve ser removido por esta subtask porque já pertence a uma migration anterior de beneficiários de rubrica.

## Critérios de Aceitação

- `expenses.project_company_id` existe.
- `budget_items.project_company_id` existe.
- Ambas as colunas permitem `NULL`.
- FK de `expenses.project_company_id` aponta para `project_company(id)`.
- FK de `budget_items.project_company_id` aponta para `project_company(id)`.
- Índice `idx_expenses_project_company_id` existe.
- Índice `idx_budget_items_project_company_id` existe.
- Migration roda limpa em ambiente local.
- `UPDATE expenses SET project_company_id = -1 WHERE id = <id_existente>` falha por constraint.
- Backend sobe após Flyway aplicar a migration.
