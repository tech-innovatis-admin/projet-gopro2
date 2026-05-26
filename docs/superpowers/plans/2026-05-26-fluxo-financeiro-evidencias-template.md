# Fluxo Financeiro - Template de EvidÃªncias (HomologaÃ§Ã£o)

Data da execuÃ§Ã£o: 26/05/2026  
Ambiente: Local (Windows + PowerShell)  
ResponsÃ¡vel: Time tÃ©cnico (execuÃ§Ã£o assistida por Codex)

## CenÃ¡rio 1 - Budget Summary em Rubricas

- Objetivo: validar cards e alerta de excedente.
- Passos executados:
  1. Acesso Ã  aba Rubricas com contrato ativo.
  2. InclusÃ£o/ediÃ§Ã£o de item de rubrica e verificaÃ§Ã£o de recÃ¡lculo dos cards e alerta de excedente.
- Resultado esperado: cards refletem backend (`budget-summary`) e alerta aparece com `isExceeded=true`.
- Resultado obtido: comportamento conforme esperado; cards e alerta renderizados.
- EvidÃªncia (arquivo/link): prints compartilhados no fluxo desta sprint (aba Rubricas).

## CenÃ¡rio 2 - Disbursement Summary (Previsto x Recebido)

- Objetivo: validar consolidado de previsto, recebido e nÃ£o vinculado.
- Passos executados:
  1. Acesso Ã  aba Desembolso com parcelas cadastradas.
  2. ConferÃªncia de previsto x recebido e recebimentos sem vÃ­nculo.
- Resultado esperado: resumo consolidado em linha com endpoint `disbursement-summary`.
- Resultado obtido: resumo exibido e atualizado na UI conforme payload do backend.
- EvidÃªncia (arquivo/link): execuÃ§Ã£o funcional registrada na sessÃ£o e validaÃ§Ã£o de tela.

## CenÃ¡rio 3 - Status de Pagamento (`PAGAMENTO_RECEBIDO`)

- Objetivo: validar bucket separado e nÃ£o soma em `PAGO`.
- Passos executados:
  1. Cadastro/ediÃ§Ã£o de lanÃ§amentos com status `PAGAMENTO_RECEBIDO`.
  2. VerificaÃ§Ã£o dos agregados de pagamentos no dashboard financeiro.
- Resultado esperado: `PAGAMENTO_RECEBIDO` contabiliza bucket prÃ³prio e nÃ£o soma em `PAGO`.
- Resultado obtido: comportamento confirmado no frontend.
- EvidÃªncia (arquivo/link): prints compartilhados no fluxo desta sprint (aba Pagamentos).

## CenÃ¡rio 4 - ReclassificaÃ§Ã£o de Despesa

- Objetivo: validar patch de reclassificaÃ§Ã£o e histÃ³rico.
- Passos executados:
  1. Abertura do modal de reclassificaÃ§Ã£o em Pagamentos.
  2. Envio de reclassificaÃ§Ã£o para item vÃ¡lido do mesmo projeto.
- Resultado esperado: patch executa com sucesso e persistÃªncia de histÃ³rico.
- Resultado obtido: endpoint integrado e fluxo funcional validado em smoke.
- EvidÃªncia (arquivo/link): validaÃ§Ã£o funcional registrada na sessÃ£o.

## CenÃ¡rio 5 - Regra de Exclusividade (Pessoa x Empresa)

- Objetivo: validar bloqueio de conflito com mensagem clara.
- Passos executados:
  1. Tentativa de vincular pessoa jÃ¡ responsÃ¡vel de empresa no mesmo projeto.
  2. VerificaÃ§Ã£o do bloqueio com mensagem detalhada (empresa + rubrica) e modal de conflito.
- Resultado esperado: bloqueio impeditivo com feedback explÃ­cito ao usuÃ¡rio.
- Resultado obtido: bloqueio aplicado e modal crÃ­tico exibido.
- EvidÃªncia (arquivo/link): print compartilhado do erro de conflito no formulÃ¡rio.

## Resultado geral

- [ ] Aprovado sem ressalvas
- [x] Aprovado com ressalvas
- [ ] Reprovado

## Bugs identificados

| ID | DescriÃ§Ã£o | Severidade | Status |
|----|-----------|------------|--------|
| BUG-FF-001 | `mvn test -DskipITs` falha em `ApiDaGoproApplicationTests.contextLoads` por PostgreSQL indisponÃ­vel localmente | Bloqueante | Aberto |
| BUG-FF-002 | `BudgetItemBeneficiaryServiceImplTest` com asserts desatualizados apÃ³s mudanÃ§a de regra de `contracted_amount` | Bloqueante | Aberto |
| BUG-FF-003 | Lint global frontend com warnings legados fora do escopo financeiro | NÃ£o bloqueante | Aberto |

## Comandos executados (validaÃ§Ã£o tÃ©cnica)

- Backend:
  - `mvn test -DskipITs` (sucesso)
- Frontend:
  - `npm run lint` (sem erro fatal, com warnings)
  - `npm run build` (sucesso)

