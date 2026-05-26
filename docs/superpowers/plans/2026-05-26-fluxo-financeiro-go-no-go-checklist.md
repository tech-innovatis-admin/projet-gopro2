# Fluxo Financeiro - Go/No-Go de Release

Data: 2026-05-26  
Escopo: rubricas, pagamentos, desembolso, summaries e reclassificação de despesas.

## 1. Backend (obrigatório)

- [ ] `GET /projects/{id}/budget-summary` responde 200 no contrato de teste.
- [ ] `GET /projects/{id}/disbursement-summary` responde 200 no contrato de teste.
- [ ] `PATCH /expenses/{id}/reclassify` aplica reclassificação e grava histórico.
- [ ] Regra de exclusividade (pessoa x responsável de empresa) bloqueia conflito com mensagem clara.
- [ ] Migrações `prod` e `core` sem divergência para o escopo financeiro.
- [ ] Build e testes do módulo financeiro executados e sem falha. *(falhou em 2026-05-26)*

## 2. Frontend (obrigatório)

- [ ] Rubricas consome `budget-summary` como fonte de verdade.
- [ ] Desembolso consome `disbursement-summary` como fonte de verdade.
- [ ] Pagamentos suporta `PAGAMENTO_RECEBIDO` sem contaminar bucket de `PAGO`.
- [ ] Modal de reclassificação funciona com validações e feedback de erro.
- [ ] Modal de conflito crítico abre para conflito de beneficiário.
- [x] Lint e build do frontend executados e sem erro fatal. *(lint com warnings legados)*

## 3. Smoke funcional (obrigatório)

- [x] Criar/editar/excluir item em rubrica e validar atualização dos cards.
- [x] Registrar recebimento `RECEBIDO` e `FATURADO` e validar impacto em resumo financeiro.
- [x] Criar pagamento `RESERVADO`, `PAGO` e validar agregações.
- [x] Reclassificar despesa entre itens da mesma rubrica/projeto.
- [x] Tentar cenário proibido (pessoa já responsável por empresa) e validar bloqueio.

## 4. Evidências (obrigatório para GO)

- [x] Prints/vídeo anexados (com data/hora visível).
- [x] Lista de bugs aberta com severidade (bloqueante vs não bloqueante).
- [ ] Plano de rollback documentado (DB + app).

## 5. Decisão

- [ ] **GO** (todos os obrigatórios acima concluídos)
- [x] **NO-GO** (há pendência bloqueante)

Responsável da decisão: ____________________  
Data/hora: ____________________

### Bloqueios para GO (2026-05-26)

1. Falha em `mvn test -DskipITs` no backend:
   - `ApiDaGoproApplicationTests.contextLoads` sem conexão PostgreSQL local.
   - Falhas em `BudgetItemBeneficiaryServiceImplTest` por expectativa antiga vs regra nova.
2. Checklist de rollback ainda não formalizado neste documento.
