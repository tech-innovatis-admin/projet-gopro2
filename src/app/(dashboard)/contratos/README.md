# Modulo de Contratos

## Aba de Empresas do Contrato

A aba `empresas` do contrato trabalha com `companies` e `project-companies`.

### Fluxo atual

- o modal `Nova Empresa` agora permite vincular uma pessoa responsavel opcional;
- o vinculo usa uma pessoa ja cadastrada ou permite cadastrar uma nova no proprio modal;
- o modal `Vincular Empresa Existente` agora permite pesquisar por nome fantasia, razao social e CNPJ;
- quando o CNPJ ja existe, o fluxo retorna mensagem clara informando que a empresa ja esta cadastrada.

### Contrato consumido

- `POST /api/backend/companies`
- `PUT /api/backend/companies/:id`
  - aceitam `responsiblePersonId` opcional.
- `GET /api/backend/project-companies/detailed`
  - retorna os dados resumidos da pessoa responsavel da empresa vinculada.

### Observacao

Essa preparacao deixa o vinculo entre empresa e pessoa responsavel disponivel para regras futuras de conflito dentro do contrato/projeto.

## Aba de Rubricas do Contrato

No cadastro de item de rubrica, o front agora permite vincular beneficiario no mesmo fluxo de criacao:

- tipo de beneficiario: `person` (vinculo de `project-people`) ou `company` (vinculo de `project-companies`);
- referencia do vinculo no projeto;
- checkbox `Item de rúbrica sem vínculo` que desabilita visualmente/funcionalmente os dropdowns de vinculo;
- acao para vincular pessoa/empresa ja existente no projeto;
- acao para vincular pessoa/empresa existente no sistema (criando `project-people`/`project-companies`);
- acao para cadastro rapido de pessoa/empresa e vinculo automatico ao projeto;
- apos criar o `budget-item`, o front chama `PUT /api/backend/budget-item/:id/beneficiary` com `contractedAmount` igual ao valor planejado do item.

### Contrato consumido

- `POST /api/backend/budget-item`
- `PUT /api/backend/budget-item/:id/beneficiary`
- `GET /api/backend/project-people/detailed?projectId=:id`
- `GET /api/backend/project-companies/detailed?projectId=:id`

## Cards Financeiros por Beneficiario

As abas `equipe-tecnica` e `empresas` agora exibem resumo financeiro por beneficiario vinculado no projeto:

- valor final da rubrica: `plannedAmount + remanejamentos de entrada - remanejamentos de saida`;
- valor pago: soma de `expenses.amount` ativos com `paymentStatus = PAGO` para os `budget_items` daquele beneficiario;
- falta pagar: `valor final - valor pago`.

### Contrato consumido

- `GET /api/backend/budget-item?projectId=:id`
- `GET /api/backend/budget-transfers?projectId=:id`
- `GET /api/backend/expenses?projectId=:id`
