# GoPro 2 – Especificação para Backend

*Versão inicial – Modelo de dados, documentos e contratos gerais*

## 1. Contexto geral

Objetivo principal do MVP da GoPro 2 (fase financeira):

* Substituir a **planilha analítica** como instrumento principal de controle dos projetos.
* Centralizar, por projeto:

  * cadastro e metadados (status, área/segmento, órgão financiador etc.);
  * rubricas e **itens orçamentários**;
  * previsões de **desembolso/entradas**;
  * **execução financeira** (despesas) por PF/PJ;
  * **remanejamentos** entre rubricas/itens;
  * cadastro de **PF/PJ vinculadas** ao projeto (bolsas, RPA, PJs etc.);
  * anexos/documentos (TED, contrato, TR, NF, relatórios);
  * trilha de **auditoria** (quem fez o quê e quando).

Execução técnica (milestones/tasks) já está modelada, mas é **Fase 2** (não é bloqueadora para o MVP focado em substituir a analítica).

---

## 2. Integração com autenticação (nexus.public.users)

* A GoPro 2 **não terá tabela própria de usuários para login**.
* Toda autenticação e identidade de usuário vem de **`nexus.public.users`** (outro database, mesmo cluster PostgreSQL).

Campos relevantes em `nexus.public.users`:

* `id`
* `email`
* `hash`
* `role`
* `username`
* `created_at`
* `updated_at`
* `name`
* `photo`
* `platforms`
* `cargo`

Em todas as tabelas da GoPro 2, os campos abaixo devem sempre referenciar **`nexus.public.users.id`**:

* `created_by`
* `updated_by`
* `uploaded_by`
* `user_id` (em `audit_log`)

Observações:

* Não haverá foreign key cross-database; a integridade é garantida em código (contrato entre sistemas).
* **Não fazer cache local de usuários** para login/autorização. Apenas referenciar o `id` do Nexus.

---

## 3. Armazenamento de documentos (S3 + metadados no Postgres)

Decisão:

* Arquivos binários **não** serão armazenados em Postgres.
* Postgres guardará apenas **metadados** e a **chave de armazenamento**.

Fluxo padrão para documentos:

1. Usuário faz upload via frontend (Next.js).
2. Backend (Java) recebe o binário, valida tipo/tamanho/extensão.
3. Backend grava o arquivo em **storage externo** (ex.: AWS S3) com chave do tipo:

   * `projects/{project_id}/documents/{uuid}.{ext}`
4. Backend grava somente **metadados** em `gopro.public.documents`:

   * `entity_type`, `entity_id`
   * `document_type`
   * `filename` (nome original)
   * `file_path` (chave S3)
   * `content_type` (mimetype, ex.: `application/pdf`)
   * `filesize`
   * `checksum`
   * `uploaded_at`, `uploaded_by`

Implicações:

* Postgres **não armazena o arquivo** (`bytea`), apenas metadados.
* “Vetorização” (embeddings para IA) será um pipeline separado, caso necessário.
* Compactação, versionamento e políticas de retenção são tratadas na camada de storage (S3) e de aplicação, não no schema relacional.
* Para download, o backend lê `file_path` e gera uma URL de download (assinado ou proxy HTTP).

---

## 4. Convenções gerais do schema GoPro 2

* Banco: **PostgreSQL**.
* PK padrão: `bigint` com `BIGSERIAL` / `IDENTITY`.
* Timestamps padrão:

  * `created_at TIMESTAMP`
  * `updated_at TIMESTAMP`
* Controle de autoria:

  * `created_by BIGINT` (id de `nexus.public.users`)
  * `updated_by BIGINT`
  * `uploaded_by BIGINT`
  * `user_id` em `audit_log`
* Sem soft delete padrão (sem `deleted_at`).
  Se precisar “arquivar”, usar:

  * campo `status` ou
  * entidade de histórico, dependendo do caso.
* Campos de status/tipo com **`SMALLINT` numérico**, com enum mantido no backend.
* Campos textuais de categoria (ex.: tipo de despesa) devem ser tratados como **enum string controlado**, não texto livre.

---

## 5. Modelagem de dados (DBML para diagramas)

Use o conteúdo abaixo diretamente em dbdiagram.io / DBeaver / etc.

```dbml
Project {
  database_type: "PostgreSQL"
}

/**************************************************
 * CADASTROS BASE
 **************************************************/

Table projects {
  id                   bigint [pk, increment]
  name                 varchar(255) [not null]
  code                 varchar(50)
  status               smallint [not null]        // 0=pre-projeto,1=execucao,2=encerrado,3=suspenso
  area_segmento        varchar(255)
  orgao_financiador_id bigint                     // fk organizations (financiador)
  executing_org_id     bigint                     // fk organizations (executor)
  coordinator          varchar(255)
  scope                text
  contract_value       numeric(15,2)
  start_date           date
  end_date             date
  opening_date         date
  execution_location   varchar(255)
  created_at           timestamp
  updated_at           timestamp
  created_by           bigint                     // id em nexus.public.users
  updated_by           bigint
}

Table organizations {
  id          bigint [pk, increment]
  name        varchar(255) [not null]
  cnpj        varchar(18) [unique]
  type        smallint                      // 0=fundacao,1=orgao_publico,2=empresa,3=parceira,4=cliente
  email       varchar(255)
  phone       varchar(50)
  address     text
  zip_code    varchar(20)
  city        varchar(100)
  state       varchar(50)
  notes       text
  created_at  timestamp
  updated_at  timestamp
}

Table people {
  id          bigint [pk, increment]
  full_name   varchar(255) [not null]
  cpf         varchar(14) [unique]
  email       varchar(255)
  phone       varchar(50)
  birth_date  date
  address     text
  zip_code    varchar(20)
  city        varchar(100)
  state       varchar(50)
  notes       text
  created_at  timestamp
  updated_at  timestamp
}

Table documents {
  id              bigint [pk, increment]
  entity_type     varchar(50) [not null]      // projects, expenses, budget_items, etc.
  entity_id       bigint [not null]
  document_type   varchar(50)                 // contrato, TED, TR, nota_fiscal, oficio, etc.
  filename        varchar(255) [not null]     // nome original
  file_path       text [not null]             // caminho ou chave S3
  content_type    varchar(100)                // ex: application/pdf, image/png
  uploaded_at     timestamp
  uploaded_by     bigint                      // id em nexus.public.users
  filesize        int
  checksum        varchar(255)
  notes           text
}

/**************************************************
 * CONTRATACOES PF / PJ POR PROJETO
 **************************************************/

Table project_people {
  id              bigint [pk, increment]
  project_id      bigint [not null]
  person_id       bigint [not null]
  role            varchar(255)               // funcao no projeto
  contract_type   varchar(50)                // bolsa, rpa, clt, etc.
  start_date      date
  end_date        date
  status          smallint                   // 0=pendente,1=ativo,2=encerrado
  base_amount     numeric(15,2)
  notes           text
  created_at      timestamp
  updated_at      timestamp
  created_by      bigint                     // nexus.public.users
  updated_by      bigint
}

Table project_organizations {
  id              bigint [pk, increment]
  project_id      bigint [not null]
  organization_id bigint [not null]
  contract_number varchar(100)
  description     text
  start_date      date
  end_date        date
  status          smallint                   // 0=pendente,1=ativo,2=encerrado
  total_value     numeric(15,2)
  notes           text
  created_at      timestamp
  updated_at      timestamp
  created_by      bigint                     // nexus.public.users
  updated_by      bigint
}

/**************************************************
 * RUBRICAS E ORCAMENTO
 **************************************************/

Table budget_categories {
  id          bigint [pk, increment]
  code        varchar(50) [unique]
  name        varchar(255) [not null, unique]
  description text
  active      boolean [not null, default: true]
  created_at  timestamp
  updated_at  timestamp
}

Table budget_items {
  id              bigint [pk, increment]
  project_id      bigint [not null]
  category_id     bigint [not null]
  description     varchar(255) [not null]
  quantity        int
  unit_cost       numeric(15,2)
  planned_amount  numeric(15,2) [not null]
  executed_amount numeric(15,2) [not null, default: 0]
  notes           text
  created_at      timestamp
  updated_at      timestamp
}

/**************************************************
 * CRONOGRAMA DE DESBOLSO E RECEITAS
 **************************************************/

Table disbursement_schedule {
  id              bigint [pk, increment]
  project_id      bigint [not null]
  expected_month  date [not null]           // sempre ultimo dia do mes (ex: 2025-08-31)
  expected_amount numeric(15,2) [not null]
  status          smallint [not null]       // 0=previsto,1=parcial,2=recebido,3=cancelado
  notes           text
  created_at      timestamp
  updated_at      timestamp
  created_by      bigint                    // nexus.users
  updated_by      bigint
}

Table incomes {
  id              bigint [pk, increment]
  project_id      bigint [not null]
  schedule_id     bigint                    // disbursement_schedule.id (opcional)
  amount          numeric(15,2) [not null]
  received_at     date [not null]
  source          varchar(255)
  invoice_number  varchar(100)
  notes           text
  created_at      timestamp
  updated_at      timestamp
  created_by      bigint                    // nexus.users
  updated_by      bigint
}

/**************************************************
 * EXECUCAO FINANCEIRA E REMANEJAMENTOS
 **************************************************/

Table expenses {
  id                  bigint [pk, increment]
  project_id          bigint [not null]
  budget_item_id      bigint
  category_id         bigint
  expense_date        date [not null]
  amount              numeric(15,2) [not null]
  person_id           bigint                 // PF recebedora
  organization_id     bigint                 // PJ recebedora
  description         varchar(255)
  expense_type        varchar(50)            // diaria, passagem, servico, etc.
  invoice_number      varchar(100)
  invoice_date        date
  document_id         bigint                 // nota fiscal / recibo
  created_at          timestamp
  updated_at          timestamp
  created_by          bigint                 // nexus.users
  updated_by          bigint
}

Table budget_transfers {
  id              bigint [pk, increment]
  project_id      bigint [not null]
  from_item_id    bigint [not null]        // budget_items.id origem
  to_item_id      bigint [not null]        // budget_items.id destino
  amount          numeric(15,2) [not null]
  transfer_date   date [not null]
  reason          text
  document_id     bigint                   // oficio/autorizacao anexado
  created_at      timestamp
  created_by      bigint                   // nexus.users
}

/**************************************************
 * EXECUCAO TECNICA (FASE 2)
 **************************************************/

Table milestones {
  id          bigint [pk, increment]
  project_id  bigint [not null]
  name        varchar(255) [not null]
  description text
  start_date  date
  end_date    date
  created_at  timestamp
  updated_at  timestamp
}

Table tasks {
  id                  bigint [pk, increment]
  project_id          bigint [not null]
  milestone_id        bigint
  description         varchar(255) [not null]
  detail              text
  planned_quantity    int
  executed_quantity   int
  measurement_unit    varchar(50)
  unit_cost           numeric(15,2)
  status              smallint             // 0=nao_iniciada,1=andamento,2=concluida
  start_date          date
  end_date            date
  actual_start_date   date
  actual_end_date     date
  responsible         varchar(255)
  created_at          timestamp
  updated_at          timestamp
}

/**************************************************
 * AUDITORIA
 **************************************************/

Table audit_log {
  id          bigint [pk, increment]
  entity_type varchar(50) [not null]      // nome da tabela: projects, expenses, etc.
  entity_id   bigint [not null]
  action      varchar(20) [not null]      // INSERT, UPDATE, DELETE
  changed_at  timestamp
  user_id     bigint                      // nexus.public.users.id
  changes     jsonb                       // diff ou snapshot
}

/**************************************************
 * RELACIONAMENTOS
 **************************************************/

Ref: projects.orgao_financiador_id > organizations.id
Ref: projects.executing_org_id > organizations.id

Ref: milestones.project_id > projects.id
Ref: tasks.project_id > projects.id
Ref: tasks.milestone_id > milestones.id

Ref: project_people.project_id > projects.id
Ref: project_people.person_id > people.id

Ref: project_organizations.project_id > projects.id
Ref: project_organizations.organization_id > organizations.id

Ref: budget_items.project_id > projects.id
Ref: budget_items.category_id > budget_categories.id

Ref: disbursement_schedule.project_id > projects.id

Ref: incomes.project_id > projects.id
Ref: incomes.schedule_id > disbursement_schedule.id

Ref: expenses.project_id > projects.id
Ref: expenses.budget_item_id > budget_items.id
Ref: expenses.category_id > budget_categories.id
Ref: expenses.person_id > people.id
Ref: expenses.organization_id > organizations.id
Ref: expenses.document_id > documents.id

Ref: budget_transfers.project_id > projects.id
Ref: budget_transfers.from_item_id > budget_items.id
Ref: budget_transfers.to_item_id > budget_items.id
Ref: budget_transfers.document_id > documents.id
```

---

## 6. Glossário funcional (para o backend)

### 6.1. Documentos e anexos (`documents`)

Objetivo: vincular arquivos (em S3) às entidades da GoPro.

* **Arquivos**: ficam em S3 (ou storage equivalente).
* **Postgres**: guarda metadados + caminho do arquivo:

Campos:

* `entity_type` / `entity_id`
  Ligam o documento a uma entidade (ex.: projeto, despesa, item orçamentário).
* `document_type`
  Enum string controlado: `CONTRATO`, `TED`, `TR`, `PLANO_TRABALHO`, `NOTA_FISCAL`, `OFICIO`, `RELATORIO_ENTREGA`, etc.
* `filename`
  Nome original enviado pelo usuário.
* `file_path`
  Chave S3 (ex.: `projects/42/documents/abcd-1234.pdf`).
* `content_type`
  Mimetype: `application/pdf`, `image/png`, etc.
* `filesize`
  Tamanho em bytes.
* `checksum`
  Hash de integridade (MD5/SHA-256).
* `uploaded_by`
  `id` em `nexus.public.users`.

### 6.2. Auditoria (`audit_log`)

Objetivo: trilha de auditoria para entidades críticas:

Entidades sugeridas:

* `projects`
* `budget_items`
* `budget_categories` (mudança de catálogo)
* `disbursement_schedule`
* `incomes`
* `expenses`
* `project_people`
* `project_organizations`
* `budget_transfers`

Campos:

* `entity_type`
  Nome da entidade (string controlada, ex.: `"projects"`, `"expenses"`).
* `entity_id`
  ID da linha afetada.
* `action`
  `INSERT`, `UPDATE`, `DELETE`.
* `user_id`
  `id` de `nexus.public.users`.
* `changes`
  `jsonb`, formato sugerido:
  `{ "before": { ... }, "after": { ... } }`.

### 6.3. Enums numéricos (SMALLINT) – backend deve mapear

Mapear em constantes/enums no código:

* `organizations.type`

  * `0` → `FUNDACAO`
  * `1` → `ORGAO_PUBLICO`
  * `2` → `EMPRESA`
  * `3` → `PARCEIRA`
  * `4` → `CLIENTE`
* `projects.status`

  * `0` → `PRE_PROJETO`
  * `1` → `EM_EXECUCAO`
  * `2` → `ENCERRADO`
  * `3` → `SUSPENSO`
* `project_people.status` / `project_organizations.status`

  * `0` → `PENDENTE`
  * `1` → `ATIVO`
  * `2` → `ENCERRADO`
* `disbursement_schedule.status`

  * `0` → `PREVISTO`
  * `1` → `RECEBIDO_PARCIAL`
  * `2` → `RECEBIDO_TOTAL`
  * `3` → `CANCELADO`
* `tasks.status` (Fase 2)

  * `0` → `NAO_INICIADA`
  * `1` → `EM_ANDAMENTO`
  * `2` → `CONCLUIDA`

### 6.4. Enums string – catálogo controlado (backend)

* `project_people.contract_type`
  Ex.: `BOLSA`, `RPA`, `CLT`, `PJ`.
* `expenses.expense_type`
  Ex.: `DIARIA`, `PASSAGEM`, `SERVICO_TERCEIROS`, `MATERIAL_CONSUMO`, `OUTROS`.
* `documents.document_type`
  Ex.: `CONTRATO`, `TED`, `TR`, `PLANO_TRABALHO`, `NOTA_FISCAL`, `OFICIO`, `RELATORIO_ENTREGA`.
* `documents.entity_type` / `audit_log.entity_type`
  Lista branca com nomes de entidades reais.
* `audit_log.action`
  `INSERT`, `UPDATE`, `DELETE`.

---

## 7. Pontos de atenção para implementação

1. **Migrations**

   * Criar database/schema da GoPro 2.
   * Subir todas as tabelas conforme o DBML.
   * Criar índices para as consultas principais:

     * `projects` por `status`, `orgao_financiador_id`.
     * `expenses` por `project_id`, `category_id`, `person_id`, `organization_id`.
     * `incomes` por `project_id`.
     * `disbursement_schedule` por `project_id`, `expected_month`.

2. **Integração com Nexus**

   * Reutilizar autenticação existente.
   * Sempre preencher `created_by`/`updated_by`/`uploaded_by`/`audit_log.user_id` com `id` de `nexus.public.users`.
   * Não criar tabela `users` local.

3. **Storage de arquivos**

   * Implementar serviço de storage (S3 ou equivalente).
   * Gerar `file_path` determinístico, incluindo `project_id`.
   * Opcional: versionamento e política de retenção em S3.

4. **Camada de auditoria**

   * Implementar camada única de logging de domínio para `audit_log`.
   * Padronizar o formato de `changes`.
   * Considerar “event hooks” por entidade para simplificar.

5. **Fase 2 – Execução técnica**

   * `milestones`/`tasks` podem ser ativadas após estabilização da parte financeira.
   * MVP para substituição da analítica não depende de execução técnica.

---
