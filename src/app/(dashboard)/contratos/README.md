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
