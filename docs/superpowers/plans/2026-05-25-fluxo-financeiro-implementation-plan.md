# Fluxo Financeiro (Tasks 1-4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** entregar os summaries financeiros, reclassificação segura de despesas e validação ponta a ponta do fluxo financeiro com backend como fonte da verdade.

**Architecture:** padronizar contrato financeiro no backend Java (summaries + reclassificação + vínculo opcional de recebimento), expor via proxy Next (`src/app/api/backend`) e consumir no frontend por endpoints tipados em `src/lib/api/endpoints`, removendo cálculo crítico duplicado de tela. A entrega será fatiada por capability para reduzir risco de regressão e conflito de merge.

**Tech Stack:** Java/Spring (API), Next.js App Router, TypeScript, React, API proxy interno, testes backend/frontend existentes.

---

## Estrutura de Arquivos (planejado)

**Backend (repo Java, fora deste worktree frontend):**
- Create: `projects/.../dto/BudgetSummaryResponseDTO.java`
- Create: `projects/.../dto/DisbursementSummaryResponseDTO.java`
- Create: `projects/.../dto/ExpenseReclassifyRequestDTO.java`
- Modify: controller/service/repository de `Project`, `Income`, `Expense`
- Create: entidade/tabela de histórico de reclassificação (ou trilha de auditoria equivalente)
- Test: testes unitários e integração de summaries/reclassify

**Frontend (este repo):**
- Create: `projet-gopro2/src/lib/api/endpoints/project-financial-summaries.ts`
- Modify: `projet-gopro2/src/lib/api/endpoints/index.ts`
- Modify: `projet-gopro2/src/lib/api/endpoints/incomes.ts`
- Modify: `projet-gopro2/src/lib/api/endpoints/expenses.ts`
- Modify: `projet-gopro2/src/lib/api/types.ts`
- Create/Modify rotas proxy em `projet-gopro2/src/app/api/backend/projects/[id]/...`
- Modify: `projet-gopro2/src/app/(dashboard)/contratos/[contratoId]/rubricas/page.tsx`
- Modify: `projet-gopro2/src/app/(dashboard)/contratos/[contratoId]/desembolso/page.tsx`
- Modify: `projet-gopro2/src/app/(dashboard)/contratos/[contratoId]/pagamentos/page.tsx`
- Create: `projet-gopro2/src/app/(dashboard)/contratos/[contratoId]/pagamentos/_components/ExpenseReclassifyModal.tsx`
- Modify docs operacionais e de contrato em `projet-gopro2/docs/`

## Execução com Subagentes

### Task 1: Contratos de API e tipos compartilhados

**Owner (subagente worker):** API-Contract Worker  
**Escopo:** somente tipos/endpoints/proxy do frontend (sem alterar UI).

- [ ] Mapear DTO final de `budget-summary`, `disbursement-summary` e `reclassify`.
- [ ] Atualizar `types.ts` com novos tipos (`BudgetSummary`, `DisbursementSummary`, `ExpensePaymentStatusEnum` com `PAGAMENTO_RECEBIDO`, campos opcionais de `Income`).
- [ ] Criar endpoints em `project-financial-summaries.ts` e exportar em `index.ts`.
- [ ] Adicionar `reclassifyExpense(...)` em `expenses.ts`.
- [ ] Evoluir `incomes.ts` para payload com `disbursementScheduleId` opcional.
- [ ] Criar/ajustar rotas proxy Next para os novos endpoints de projeto e reclassificação.
- [ ] Rodar `npm run lint` e `npm run build` no frontend.

### Task 2: Backend summaries e validações de vínculo (time backend)

**Owner (subagente worker no repo Java):** Backend-Summary Worker  
**Escopo:** somente backend Java.

- [ ] Implementar `GET /projects/{id}/budget-summary` com null-safe e regras de itens ativos.
- [ ] Implementar `GET /projects/{id}/disbursement-summary` consolidando previsto x recebido.
- [ ] Implementar vínculo opcional `Income.disbursementScheduleId` + validação de projeto.
- [ ] Garantir erros padronizados com `fieldErrors.disbursementScheduleId` quando vínculo inválido.
- [ ] Cobrir cenários de parcial/pendente/recebida/excedente/não vinculada.
- [ ] Executar testes unitários e de integração do módulo financeiro.

### Task 3: Reclassificação segura de despesas (backend + frontend)

**Owner A (subagente worker backend):** Backend-Reclassify Worker  
**Owner B (subagente worker frontend):** Frontend-Reclassify Worker

- [ ] Backend: implementar `PATCH /expenses/{id}/reclassify` com `targetBudgetItemId` e `reason` obrigatórios.
- [ ] Backend: validar mesma origem de projeto, item destino ativo e permissão.
- [ ] Backend: persistir histórico auditável com origem, destino, usuário, data/hora e motivo.
- [ ] Frontend: criar modal dedicado `ExpenseReclassifyModal.tsx`.
- [ ] Frontend: bloquear fechamento durante submit e renderizar `fieldErrors` inline.
- [ ] Frontend: integrar endpoint `reclassifyExpense` e invalidar dados de rubricas/pagamentos/summaries.
- [ ] Rodar lint/build frontend + testes backend/frontend relevantes.

### Task 4: UI de Budget Summary em rubricas

**Owner (subagente worker):** Frontend-BudgetSummary Worker

- [ ] Consumir `getProjectBudgetSummary(projectId)` em `rubricas/page.tsx`.

---

## Atualização Operacional (2026-05-25)

- [x] Adicionadas migrações equivalentes de produção no backend Java para evitar drift entre trilhas:
  - `db/migration/prod/V053__add_income_disbursement_link_and_expense_reclassification_history.sql`
  - `db/migration/prod/V054__add_income_status.sql`
- [x] Mantida compatibilidade com profile `prod` (`spring.flyway.locations=classpath:db/migration/prod`), sem depender de scripts `core` em produção.
- [x] Regra de consistência do valor-base de beneficiário aplicada no backend:
  - em criação/edição de item de rubrica, `contracted_amount` passa a espelhar `planned_amount`.
  - migrações de alinhamento adicionadas:
    - `db/migration/core/V143__align_beneficiary_base_with_budget_item.sql`
    - `db/migration/prod/V055__align_beneficiary_base_with_budget_item.sql`
- [x] Regra de exclusividade de recebedor por projeto aplicada no backend:
  - se uma pessoa já recebe no projeto como `project_people`, ela não pode receber via empresa da qual é responsável no mesmo projeto.
  - se uma empresa está vinculada ao projeto com responsável, esse responsável não pode receber como pessoa no mesmo projeto.
  - validação aplicada nos fluxos de item de rubrica/beneficiário e criação/edição de despesas.
- [ ] Renderizar card com `contractValue`, `totalBudgetItems`, `difference`, `remainingAmount`, `exceededAmount`, `plannedPercentage`.
- [ ] Exibir alerta visual para `isExceeded = true`.
- [ ] Revalidar summary após criar/editar/excluir rubrica e após remanejamentos que afetem total.
- [ ] Remover cálculo duplicado sensível de negócio da tela quando aplicável.
- [ ] Rodar lint/build do módulo frontend.

### Task 5: UI de disbursement summary e previsto x recebido

**Owner (subagente worker):** Frontend-Disbursement Worker

- [ ] Consumir `getProjectDisbursementSummary(projectId)` em `desembolso/page.tsx`.
- [ ] Separar explicitamente painel “Previsto” x “Recebido”.
- [ ] Exibir status por parcela (`PENDENTE`, `PARCIAL`, `RECEBIDA`, `EXCEDIDA`) e diferença.
- [ ] Exibir recebimentos não vinculados e alertas de inconsistência.
- [ ] Não sobrescrever valores/datas previstas ao registrar recebimento real.
- [ ] Rodar lint/build do módulo frontend.

### Task 6: Status `PAGAMENTO_RECEBIDO` e resumo financeiro

**Owner (subagente worker):** Frontend-PaymentStatus Worker

- [ ] Atualizar enums e opções de status em `pagamentos/page.tsx`.
- [ ] Mostrar badge/label para `PAGAMENTO_RECEBIDO`.
- [ ] Ajustar agregações: `PAGAMENTO_RECEBIDO` não soma em `PAGO`.
- [ ] Exibir bucket separado para valor recebido intermediário.
- [ ] Validar compatibilidade com payload de backend.
- [ ] Rodar lint/build do módulo frontend.

### Task 7: Validação ponta a ponta e evidências da Task 4

**Owner (subagente worker):** E2E-Validation Worker

- [ ] Executar roteiro da demo no ambiente de homologação.
- [ ] Registrar evidências dos cenários exigidos no checklist (prints/vídeo curto).
- [ ] Abrir lista de bugs: críticos (bloqueiam release) e não bloqueantes (documentados).
- [ ] Confirmar critérios de pronto: build/lint/testes dos módulos afetados.
- [ ] Atualizar checklist e links de PR/release.

## Sequência recomendada

- [ ] Ordem: Task 1 -> Task 2 -> Task 3 -> Task 4 -> Task 5 -> Task 6 -> Task 7.
- [ ] Gate obrigatório entre tasks: contrato backend aprovado antes de integração frontend.
- [ ] Cada task fecha com revisão de conformidade de spec + revisão de qualidade.

## Validação mínima por etapa

- [ ] Frontend: `npm run lint` e `npm run build` em `projet-gopro2`.
- [ ] Backend: build e testes do módulo financeiro.
- [ ] Integração: smoke manual de rubricas, pagamentos e desembolso no mesmo contrato.

## Riscos e mitigação

- [ ] Risco de quebra de contrato API: mitigar com DTO versionado/documentado e mocks de contrato.
- [ ] Risco de inconsistência de cache: mitigar com invalidação explícita pós mutações.
- [ ] Risco de regressão em cálculo financeiro: mitigar com testes de cenário (saldo, fechado, excedido, parcial).

## Definição de pronto consolidada

- [ ] Endpoints `budget-summary`, `disbursement-summary`, `reclassify` em produção.
- [ ] Frontend usa endpoint como fonte da verdade para summaries.
- [ ] Reclassificação com auditoria e segurança funcional.
- [ ] `PAGAMENTO_RECEBIDO` suportado ponta a ponta.
- [ ] Evidências anexadas e checklist atualizado.

## Addendum: Income Status (2026-05-25)

Scope extension approved to support NF emitted before cash receipt:

- Extend `Income` with `status` (`FATURADO`, `RECEBIDO`, `CANCELADO`).
- Keep `RECEBIDO` as source-of-truth for cash (`totalReceived`, project balances).
- Add invoicing visibility in disbursement summary:
  - `totalInvoiced`
  - `differenceInvoicedVsReceived`
  - `unlinkedInvoicedAmount`
  - `installments[].invoicedAmount`
- Frontend parcelas form/table in pagamentos updated to create/edit/view income status.
