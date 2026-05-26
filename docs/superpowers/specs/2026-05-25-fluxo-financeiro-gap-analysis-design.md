# Fluxo Financeiro - Gap Analysis e Especificação de Entrega

**Data:** 2026-05-25  
**Fonte:** `checklist_sprints_fluxo_financeiro.md` + código atual em `projet-gopro2`

## 1) Diagnóstico Executivo

O checklist está **majoritariamente pendente** no estado atual do código. Há avanços em `projectCompanyId`, `fieldErrors` e CRUD de desembolso previsto, porém os três pilares centrais ainda não foram entregues no contrato esperado:

1. `GET /projects/{id}/budget-summary` (ausente)
2. `GET /projects/{id}/disbursement-summary` (ausente)
3. `PATCH /expenses/{id}/reclassify` (ausente)

## 2) Evidências Técnicas (estado atual)

### 2.1 Budget Summary (Task 1)

- Não há cliente de API para `budget-summary` em `src/lib/api/endpoints`.
- Não há rota proxy Next para `projects/{id}/budget-summary` em `src/app/api/backend`.
- A tela de rubricas não consome summary dedicado; opera com listagens/CRUD de rubricas e remanejamento.

**Conclusão:** Ausente.

### 2.2 Disbursement Summary (Task 2)

- Tela de desembolso existente: [page.tsx](/c:/Users/gabri/Desktop/Repositórios%20-%20GitHub/gopro_novo/projet-gopro2/src/app/(dashboard)/contratos/[contratoId]/desembolso/page.tsx)
- Essa tela usa `listDisbursementSchedules` e cálculos locais de previsto, sem separação explícita de recebido real por `Income`.
- Não há endpoint cliente `disbursement-summary` em [index.ts](/c:/Users/gabri/Desktop/Repositórios%20-%20GitHub/gopro_novo/projet-gopro2/src/lib/api/endpoints/index.ts).
- `incomes.ts` atual não inclui vínculo `disbursementScheduleId`.

**Conclusão:** Parcial (CRUD previsto existe), porém objetivo principal previsto x recebido não entregue.

### 2.3 Reclassificação de Despesas (Task 3)

- Endpoints de despesas existentes são apenas CRUD em [expenses.ts](/c:/Users/gabri/Desktop/Repositórios%20-%20GitHub/gopro_novo/projet-gopro2/src/lib/api/endpoints/expenses.ts).
- Proxy Next também expõe CRUD em [route.ts](/c:/Users/gabri/Desktop/Repositórios%20-%20GitHub/gopro_novo/projet-gopro2/src/app/api/backend/expenses/[id]/route.ts).
- Não há endpoint dedicado `PATCH /expenses/{id}/reclassify`.
- Em rubricas existe fluxo de **remanejamento de rubrica** (budget transfer), que não substitui reclassificação de despesa.

**Conclusão:** Ausente.

### 2.4 Status intermediário de pagamento

- Enum atual: `ExpensePaymentStatusEnum = 'PAGO' | 'RESERVADO'` em [types.ts](/c:/Users/gabri/Desktop/Repositórios%20-%20GitHub/gopro_novo/projet-gopro2/src/lib/api/types.ts:82).
- Não existe `PAGAMENTO_RECEBIDO` no frontend.

**Conclusão:** Ausente.

## 3) Escopo da Entrega Necessária

### 3.1 Backend/API (contrato obrigatório)

1. Implementar `GET /projects/{id}/budget-summary` com campos:
- `projectId`
- `contractValue`
- `totalBudgetItems`
- `difference`
- `remainingAmount`
- `exceededAmount`
- `isExceeded`
- `plannedPercentage`

2. Implementar `GET /projects/{id}/disbursement-summary` com:
- totais previsto x recebido
- diferença
- contadores de parcelas (`expected`, `received`, `partial`, `pending`)
- lista por parcela com status
- recebimentos não vinculados/excedentes

3. Implementar `PATCH /expenses/{id}/reclassify` com:
- `targetBudgetItemId` obrigatório
- `reason` obrigatório
- validações de projeto/permissão/item ativo
- persistência de histórico/auditoria

4. Evoluir `Income` para vínculo opcional:
- `disbursementScheduleId` opcional
- validação de consistência por projeto

5. Evoluir status de pagamento:
- adicionar `PAGAMENTO_RECEBIDO`
- garantir separação no resumo financeiro

### 3.2 Frontend

1. Rubricas:
- consumir `budget-summary`
- card de contrato x planejado x saldo/excedente x percentual
- alerta visual quando excedido
- refetch pós criar/editar/excluir rubrica

2. Desembolso:
- consumir `disbursement-summary`
- separar visualmente previsto x recebido
- exibir diferença por parcela
- alertas parcial/pendente/excedente
- tratar recebimentos não vinculados

3. Pagamentos:
- incluir status `PAGAMENTO_RECEBIDO` no select/lista/resumo
- garantir que não some em `PAGO`

4. Reclassificação:
- modal dedicado de reclassificação de despesa
- motivo obrigatório
- integração com `fieldErrors`
- bloqueio de fechamento durante submit
- invalidação de cache para pagamentos/rubricas/summaries

## 4) Riscos e Trade-offs

1. **Risco de divergência backend/frontend:** endpoints e DTOs precisam ser congelados antes da integração de tela.
2. **Risco de regressão financeira:** cálculos no frontend devem migrar para fonte oficial dos summaries.
3. **Risco de inconsistência histórica:** reclassificação sem trilha de auditoria inviabiliza rastreabilidade.
4. **Trade-off de entrega:** implementar tudo em um PR grande aumenta risco; fatiar por capability reduz conflito e melhora validação.

## 5) Critério de Go/No-Go

Go apenas quando:
1. endpoints de summary e reclassify estiverem disponíveis e testados;
2. frontend estiver usando esses endpoints como fonte da verdade;
3. build/lint dos módulos afetados passarem;
4. evidências de cenários críticos forem anexadas.

## 6) Adendo de Contrato (2026-05-25)

Para cobrir cenário de **NF emitida sem recebimento efetivo**, foi adicionado status em `Income`:

- `FATURADO`
- `RECEBIDO`
- `CANCELADO`

Impactos de contrato:

- `IncomeRequestDTO` / `IncomeUpdateDTO` / `IncomeResponseDTO` passam a expor `status`.
- `GET /projects/{id}/disbursement-summary` passa a expor também:
  - `totalInvoiced`
  - `differenceInvoicedVsReceived`
  - `unlinkedInvoicedAmount`
  - `installments[].invoicedAmount`

Regra financeira adotada:

- **Caixa real** considera apenas `Income.status = RECEBIDO`.
- `FATURADO` entra em métricas de faturamento, sem inflar saldo de caixa.
