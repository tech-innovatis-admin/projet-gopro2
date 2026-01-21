# Estrutura Atualizada do Banco de Dados - GoPro 2.0

*Documentação completa da estrutura de dados atualizada do sistema GoPro 2.0*

**Última atualização:** Janeiro 2025  
**Versão do Schema:** 2.0

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Tabelas Principais](#tabelas-principais)
3. [Tabelas de Relacionamento](#tabelas-de-relacionamento)
4. [Tabelas de Configuração](#tabelas-de-configuração)
5. [Tabelas de Auditoria](#tabelas-de-auditoria)
6. [Enums e Códigos](#enums-e-códigos)
7. [Relacionamentos](#relacionamentos)
8. [Regras de Negócio](#regras-de-negócio)

---

## 🎯 Visão Geral

O banco de dados GoPro 2.0 é projetado para gerenciar projetos, contratos, execução financeira e execução técnica. O sistema utiliza PostgreSQL e integra-se com o sistema Nexus para autenticação de usuários.

### Características Principais

- **Integração com Nexus**: Usuários são gerenciados externamente (`nexus.public.users`)
- **Armazenamento de Documentos**: Metadados no Postgres, arquivos em S3
- **Auditoria Completa**: Trilha de auditoria para todas as operações críticas
- **Cálculos Automáticos**: Valores calculados automaticamente (saldos, totais)

---

## 📊 Tabelas Principais

### 1. `projects` - Projetos

Tabela central do sistema. Armazena informações sobre projetos e contratos.

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária (auto-incremento) |
| `name` | `varchar(255)` | Nome do projeto (obrigatório) |
| `code` | `varchar(50)` | Código único do projeto |
| `status` | `smallint` | Status do projeto (ver enums) |
| `area_segmento` | `varchar(255)` | Área/segmento do projeto |
| `orgao_financiador_id` | `bigint` | FK para `organizations` (financiador) |
| `executing_org_id` | `bigint` | FK para `organizations` (executor/parceiro) |
| `coordinator` | `varchar(255)` | Nome do coordenador |
| `gov_if` | `smallint` | Tipo: 0=Gov, 1=IF |
| `project_type` | `smallint` | Tipo: 0=PROJETO, 1=PRODUTO |
| `contract_value` | `numeric(15,2)` | Valor do contrato |
| `valor_empenhado` | `numeric(25,2)` | Valor empenhado |
| `valor_liquidado` | `numeric(25,2)` | Valor liquidado |
| `valor_pago` | `numeric(25,2)` | Valor pago |
| `start_date` | `date` | Data de início |
| `end_date` | `date` | Data de término |
| `opening_date` | `date` | Data de abertura |
| `execution_location` | `varchar(255)` | Local de execução |
| `total_received` | `numeric(25,2)` | Total recebido (calculado: SUM(incomes.amount)) |
| `total_expenses` | `numeric(25,2)` | Total de despesas (calculado: SUM(expenses.amount)) |
| `saldo` | `numeric(25,2)` | Saldo (calculado: total_received - total_expenses) |
| `created_at` | `timestamp` | Data de criação |
| `updated_at` | `timestamp` | Data de atualização |
| `created_by` | `bigint` | FK para `nexus.public.users` |
| `updated_by` | `bigint` | FK para `nexus.public.users` |

#### Observações Importantes

- `total_received`, `total_expenses` e `saldo` são calculados automaticamente
- `gov_if` e `project_type` são campos numéricos (não strings)
- Todos os valores monetários usam `numeric` com precisão adequada

---

### 2. `organizations` - Organizações

Armazena informações sobre organizações (financiadores, parceiros, fornecedores).

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `name` | `varchar(255)` | Razão social (obrigatório) |
| `trade_name` | `varchar(255)` | Nome fantasia |
| `cnpj` | `varchar(18)` | CNPJ (único) |
| `type` | `smallint` | Tipo de organização (ver enums) |
| `email` | `varchar(255)` | E-mail de contato |
| `phone` | `varchar(50)` | Telefone |
| `address` | `text` | Endereço completo |
| `contact_person` | `varchar(255)` | Pessoa de contato |
| `zip_code` | `varchar(20)` | CEP |
| `city` | `varchar(100)` | Cidade |
| `state` | `varchar(50)` | Estado |
| `notes` | `text` | Observações |
| `is_active` | `smallint` | Status: 0=INATIVO, 1=ATIVO |
| `created_at` | `timestamp` | Data de criação |
| `updated_at` | `timestamp` | Data de atualização |
| `created_by` | `bigint` | FK para `nexus.public.users` |
| `updated_by` | `bigint` | FK para `nexus.public.users` |

#### Novos Campos Adicionados

- `trade_name`: Nome fantasia da organização
- `contact_person`: Pessoa responsável pelo contato
- `is_active`: Controle de ativação/desativação
- `created_by` e `updated_by`: Trilha de auditoria

---

### 3. `people` - Pessoas Físicas

Cadastro de pessoas físicas vinculadas aos projetos.

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `full_name` | `varchar(255)` | Nome completo (obrigatório) |
| `cpf` | `varchar(14)` | CPF (único) |
| `email` | `varchar(255)` | E-mail |
| `phone` | `varchar(50)` | Telefone |
| `avatar_url` | `varchar(500)` | URL da foto/avatar |
| `birth_date` | `date` | Data de nascimento |
| `address` | `text` | Endereço |
| `zip_code` | `varchar(20)` | CEP |
| `city` | `varchar(100)` | Cidade |
| `state` | `varchar(50)` | Estado |
| `notes` | `text` | Observações |
| `created_at` | `timestamp` | Data de criação |
| `updated_at` | `timestamp` | Data de atualização |
| `created_by` | `bigint` | FK para `nexus.public.users` |
| `updated_by` | `bigint` | FK para `nexus.public.users` |

#### Novo Campo Adicionado

- `avatar_url`: URL para foto/avatar da pessoa

---

### 4. `documents` - Documentos

Metadados de documentos vinculados a projetos e outras entidades.

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `project_id` | `bigint` | FK para `projects` (obrigatório) |
| `entity_type` | `varchar(50)` | Tipo da entidade (projects, expenses, etc.) |
| `entity_id` | `bigint` | ID da entidade relacionada |
| `document_type` | `varchar(50)` | Tipo do documento (contrato, TED, TR, etc.) |
| `filename` | `varchar(255)` | Nome original do arquivo |
| `file_path` | `text` | Caminho/chave S3 |
| `content_type` | `varchar(100)` | MIME type (ex: application/pdf) |
| `filesize` | `int` | Tamanho do arquivo em bytes |
| `checksum` | `varchar(255)` | Checksum do arquivo |
| `notes` | `text` | Observações |
| `created_at` | `timestamp` | Data de criação |
| `created_by` | `bigint` | FK para `nexus.public.users` |
| `updated_at` | `timestamp` | Data de atualização |
| `updated_by` | `bigint` | FK para `nexus.public.users` |

#### Observações Importantes

- Arquivos são armazenados em S3, não no Postgres
- `file_path` contém a chave S3 para acesso ao arquivo
- `project_id` é obrigatório (todos os documentos pertencem a um projeto)

---

## 🔗 Tabelas de Relacionamento

### 5. `project_people` - Pessoas Vinculadas a Projetos

Relaciona pessoas físicas com projetos (bolsistas, RPAs, etc.).

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `project_id` | `bigint` | FK para `projects` |
| `person_id` | `bigint` | FK para `people` |
| `role` | `varchar(255)` | Função no projeto |
| `workload_hours` | `numeric(5,2)` | Carga horária |
| `institutional_link` | `varchar(255)` | Vínculo institucional |
| `contract_type` | `varchar(50)` | Tipo de contrato (bolsa, rpa, clt, etc.) |
| `start_date` | `date` | Data de início |
| `end_date` | `date` | Data de término |
| `status` | `smallint` | Status: 0=pendente, 1=ativo, 2=encerrado |
| `base_amount` | `numeric(15,2)` | Valor base |
| `notes` | `text` | Observações |
| `created_at` | `timestamp` | Data de criação |
| `updated_at` | `timestamp` | Data de atualização |
| `created_by` | `bigint` | FK para `nexus.public.users` |
| `updated_by` | `bigint` | FK para `nexus.public.users` |

#### Novos Campos Adicionados

- `workload_hours`: Carga horária da pessoa no projeto
- `institutional_link`: Vínculo institucional

---

### 6. `project_organizations` - Organizações Vinculadas a Projetos

Relaciona organizações (fornecedores) com projetos.

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `project_id` | `bigint` | FK para `projects` |
| `organization_id` | `bigint` | FK para `organizations` |
| `contract_number` | `varchar(100)` | Número do contrato |
| `description` | `text` | Descrição |
| `start_date` | `date` | Data de início |
| `end_date` | `date` | Data de término |
| `status` | `smallint` | Status: 0=pendente, 1=ativo, 2=encerrado |
| `total_value` | `numeric(15,2)` | Valor total do contrato |
| `notes` | `text` | Observações |
| `is_incubated` | `boolean` | true=incubada, false=independente |
| `service_type` | `varchar(255)` | Tipo de serviço prestado |
| `created_at` | `timestamp` | Data de criação |
| `updated_at` | `timestamp` | Data de atualização |
| `created_by` | `bigint` | FK para `nexus.public.users` |
| `updated_by` | `bigint` | FK para `nexus.public.users` |

#### Novos Campos Adicionados

- `is_incubated`: Indica se a organização é incubada
- `service_type`: Tipo de serviço prestado

---

### 7. `project_organization_budget_links` - Vínculo Organização-Rubrica

Vincula organizações do projeto a itens específicos de rubricas.

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `project_org_id` | `bigint` | FK para `project_organizations` |
| `category_id` | `bigint` | FK para `budget_categories` |
| `budget_item_id` | `bigint` | FK para `budget_items` |
| `created_at` | `timestamp` | Data de criação |
| `created_by` | `bigint` | FK para `nexus.public.users` |

#### Observação

Esta tabela permite vincular uma organização específica a rubricas/itens orçamentários do projeto.

---

## 💰 Tabelas Financeiras

### 8. `budget_categories` - Categorias Orçamentárias (Rubricas)

Glossário único de rubricas disponíveis no sistema.

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `code` | `varchar(50)` | Código único da rubrica |
| `name` | `varchar(255)` | Nome da rubrica (único) |
| `description` | `text` | Descrição |
| `active` | `boolean` | Ativa/Inativa |
| `created_at` | `timestamp` | Data de criação |
| `created_by` | `bigint` | FK para `nexus.public.users` |
| `updated_at` | `timestamp` | Data de atualização |
| `updated_by` | `bigint` | FK para `nexus.public.users` |

---

### 9. `budget_items` - Itens Orçamentários

Linhas orçamentárias de cada projeto (vincula projeto a rubrica com valores).

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `project_id` | `bigint` | FK para `projects` |
| `category_id` | `bigint` | FK para `budget_categories` |
| `description` | `varchar(255)` | Descrição do item |
| `quantity` | `int` | Quantidade |
| `months` | `int` | Quantidade de meses |
| `unit_cost` | `numeric(15,2)` | Custo unitário |
| `planned_amount` | `numeric(15,2)` | Valor planejado |
| `executed_amount` | `numeric(15,2)` | Valor executado (calculado) |
| `goal_id` | `bigint` | FK para `goals` (meta vinculada) |
| `notes` | `text` | Observações |
| `created_at` | `timestamp` | Data de criação |
| `updated_at` | `timestamp` | Data de atualização |
| `created_by` | `bigint` | FK para `nexus.public.users` |
| `updated_by` | `bigint` | FK para `nexus.public.users` |

#### Novos Campos Adicionados

- `months`: Quantidade de meses
- `goal_id`: Vinculação com metas do projeto
- `created_by` e `updated_by`: Trilha de auditoria

#### Regras de Negócio

- `executed_amount` = SUM(`expenses.amount`) onde `expenses.budget_item_id = id`
- `planned_amount` não é alterado por remanejamentos (estes são registrados em `budget_transfers`)

---

### 10. `disbursement_schedule` - Cronograma de Desembolso

Previsão de desembolsos/entradas do financiador.

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `project_id` | `bigint` | FK para `projects` |
| `numero` | `int` | Número sequencial |
| `expected_month` | `date` | Mês esperado (sempre último dia do mês) |
| `expected_amount` | `numeric(15,2)` | Valor esperado |
| `status` | `smallint` | Status: 0=previsto, 1=parcial, 2=recebido, 3=cancelado |
| `notes` | `text` | Observações |
| `created_at` | `timestamp` | Data de criação |
| `updated_at` | `timestamp` | Data de atualização |
| `created_by` | `bigint` | FK para `nexus.public.users` |
| `updated_by` | `bigint` | FK para `nexus.public.users` |

#### Observação Importante

- `expected_month` sempre deve ser o último dia do mês (ex: 2025-08-31)

---

### 11. `incomes` - Receitas/Entradas

Entradas efetivamente recebidas pelo projeto.

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `project_id` | `bigint` | FK para `projects` |
| `numero` | `int` | Número sequencial |
| `schedule_id` | `bigint` | FK para `disbursement_schedule` (opcional) |
| `amount` | `numeric(15,2)` | Valor recebido |
| `received_at` | `date` | Data de recebimento |
| `source` | `varchar(255)` | Origem do recurso |
| `invoice_number` | `varchar(100)` | Número da nota fiscal |
| `notes` | `text` | Observações |
| `created_at` | `timestamp` | Data de criação |
| `updated_at` | `timestamp` | Data de atualização |
| `created_by` | `bigint` | FK para `nexus.public.users` |
| `updated_by` | `bigint` | FK para `nexus.public.users` |

#### Regras de Negócio

- `projects.total_received` = SUM(`incomes.amount`) onde `incomes.project_id = projects.id`

---

### 12. `expenses` - Despesas

Execução financeira (desembolso efetivo para PF/PJ).

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `project_id` | `bigint` | FK para `projects` |
| `budget_item_id` | `bigint` | FK para `budget_items` |
| `category_id` | `bigint` | FK para `budget_categories` |
| `income_id` | `bigint` | FK para `incomes` (parcela que financiou) |
| `expense_date` | `date` | Data da despesa |
| `quantity` | `int` | Quantidade |
| `amount` | `numeric(15,2)` | Valor da despesa |
| `person_id` | `bigint` | FK para `project_people.person_id` (PF recebedora vinculada ao projeto) |
| `organization_id` | `bigint` | FK para `organizations` (PJ recebedora) |
| `description` | `varchar(255)` | Descrição |
| `invoice_number` | `varchar(100)` | Número da nota fiscal |
| `invoice_date` | `date` | Data da nota fiscal |
| `document_id` | `bigint` | FK para `documents` (nota fiscal/recibo) |
| `created_at` | `timestamp` | Data de criação |
| `updated_at` | `timestamp` | Data de atualização |
| `created_by` | `bigint` | FK para `nexus.public.users` |
| `updated_by` | `bigint` | FK para `nexus.public.users` |

#### Regras de Negócio Importantes

- **Obrigatório**: `person_id` OU `organization_id` deve ser preenchido (não ambos)
- `person_id` referencia `project_people.person_id` (pessoa vinculada ao projeto), não `people.id` diretamente
- `income_id` é obrigatório (toda despesa deve estar vinculada a uma entrada)
- `projects.total_expenses` = SUM(`expenses.amount`) onde `expenses.project_id = projects.id`
- `budget_items.executed_amount` = SUM(`expenses.amount`) onde `expenses.budget_item_id = budget_items.id`

---

### 13. `budget_transfers` - Remanejamentos

Transferências de valor entre itens orçamentários do mesmo projeto.

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `project_id` | `bigint` | FK para `projects` |
| `from_item_id` | `bigint` | FK para `budget_items` (origem) |
| `to_item_id` | `bigint` | FK para `budget_items` (destino) |
| `amount` | `numeric(15,2)` | Valor transferido |
| `transfer_date` | `date` | Data da transferência |
| `status` | `smallint` | Status: 0=PENDENTE, 1=APROVADO, 2=REJEITADO |
| `reason` | `text` | Motivo do remanejamento |
| `document_id` | `bigint` | FK para `documents` (ofício/autorização) |
| `created_at` | `timestamp` | Data de criação |
| `created_by` | `bigint` | FK para `nexus.public.users` |
| `updated_at` | `timestamp` | Data de atualização |
| `updated_by` | `bigint` | FK para `nexus.public.users` |
| `approved_at` | `timestamp` | Data de aprovação |
| `approved_by` | `bigint` | FK para `nexus.public.users` (aprovador) |

#### Novos Campos Adicionados

- `status`: Controle de aprovação do remanejamento
- `updated_at` e `updated_by`: Trilha de atualizações
- `approved_at` e `approved_by`: Controle de aprovação

---

## 🎯 Tabelas de Execução Técnica

### 14. `goals` - Metas

Metas do projeto (nível superior da hierarquia).

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `project_id` | `bigint` | FK para `projects` |
| `numero` | `int` | Número sequencial da meta |
| `titulo` | `varchar(255)` | Título da meta |
| `descricao` | `text` | Descrição |
| `data_inicio` | `date` | Data de início |
| `data_fim` | `date` | Data de término |
| `created_at` | `timestamp` | Data de criação |
| `updated_at` | `timestamp` | Data de atualização |
| `created_by` | `bigint` | FK para `nexus.public.users` |
| `updated_by` | `bigint` | FK para `nexus.public.users` |

---

### 15. `stages` - Etapas

Etapas dentro de uma meta.

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `project_id` | `bigint` | FK para `projects` |
| `goal_id` | `bigint` | FK para `goals` |
| `numero` | `int` | Número sequencial da etapa |
| `titulo` | `varchar(255)` | Título da etapa |
| `descricao` | `text` | Descrição |
| `data_inicio` | `date` | Data de início |
| `data_fim` | `date` | Data de término |
| `created_at` | `timestamp` | Data de criação |
| `updated_at` | `timestamp` | Data de atualização |
| `created_by` | `bigint` | FK para `nexus.public.users` |
| `updated_by` | `bigint` | FK para `nexus.public.users` |

---

### 16. `phases` - Fases

Fases dentro de uma etapa.

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `project_id` | `bigint` | FK para `projects` |
| `goal_id` | `bigint` | FK para `goals` |
| `stage_id` | `bigint` | FK para `stages` |
| `numero` | `int` | Número sequencial da fase |
| `titulo` | `varchar(255)` | Título da fase |
| `descricao` | `text` | Descrição |
| `data_inicio` | `date` | Data de início |
| `data_fim` | `date` | Data de término |
| `created_at` | `timestamp` | Data de criação |
| `updated_at` | `timestamp` | Data de atualização |
| `created_by` | `bigint` | FK para `nexus.public.users` |
| `updated_by` | `bigint` | FK para `nexus.public.users` |

#### Hierarquia

```
Project
  └── Goal (Meta)
      └── Stage (Etapa)
          └── Phase (Fase)
```

---

### 17. `milestones` - Marcos

Marcos do projeto (Fase 2 - Execução Técnica).

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `project_id` | `bigint` | FK para `projects` |
| `name` | `varchar(255)` | Nome do marco |
| `responsible` | `varchar(255)` | Responsável |
| `status` | `smallint` | Status (0-100) |
| `percentage` | `int` | Percentual de execução (0-100) |
| `phase` | `varchar(255)` | Fase do marco |
| `description` | `text` | Descrição |
| `observations` | `text` | Observações |
| `planned_date` | `date` | Data planejada |
| `actual_date` | `date` | Data realizada |
| `created_at` | `timestamp` | Data de criação |
| `updated_at` | `timestamp` | Data de atualização |
| `created_by` | `bigint` | FK para `nexus.public.users` |
| `updated_by` | `bigint` | FK para `nexus.public.users` |

---

### 18. `tasks` - Tarefas

Tarefas do projeto (Fase 2 - Execução Técnica).

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `project_id` | `bigint` | FK para `projects` |
| `milestone_id` | `bigint` | FK para `milestones` |
| `description` | `varchar(255)` | Descrição |
| `detail` | `text` | Detalhamento |
| `planned_quantity` | `int` | Quantidade planejada |
| `executed_quantity` | `int` | Quantidade executada |
| `measurement_unit` | `varchar(50)` | Unidade de medida |
| `unit_cost` | `numeric(15,2)` | Custo unitário |
| `status` | `smallint` | Status: 0=não_iniciada, 1=andamento, 2=concluída |
| `start_date` | `date` | Data de início |
| `end_date` | `date` | Data de término |
| `actual_start_date` | `date` | Data de início real |
| `actual_end_date` | `date` | Data de término real |
| `responsible` | `varchar(255)` | Responsável |
| `created_at` | `timestamp` | Data de criação |
| `updated_at` | `timestamp` | Data de atualização |
| `created_by` | `bigint` | FK para `nexus.public.users` |
| `updated_by` | `bigint` | FK para `nexus.public.users` |

---

## 📋 Tabelas de Configuração

### 19. `organization_categories_master` - Categorias de Organizações

Catálogo de categorias disponíveis para organizações.

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `code` | `varchar(50)` | Código único (ex: CONSULTORIA, TECNOLOGIA) |
| `name` | `varchar(255)` | Nome amigável |
| `description` | `text` | Descrição |
| `active` | `boolean` | Ativa/Inativa |
| `created_at` | `timestamp` | Data de criação |
| `updated_at` | `timestamp` | Data de atualização |

---

### 20. `organization_services_master` - Serviços de Organizações

Catálogo de serviços oferecidos por organizações.

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `code` | `varchar(50)` | Código único (ex: DESENVOLVIMENTO_SOFTWARE) |
| `name` | `varchar(255)` | Nome amigável |
| `description` | `text` | Descrição |
| `active` | `boolean` | Ativa/Inativa |
| `created_at` | `timestamp` | Data de criação |
| `updated_at` | `timestamp` | Data de atualização |

---

### 21. `organization_categories` - Vínculo Organização-Categoria

Vincula organizações a categorias.

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `organization_id` | `bigint` | FK para `organizations` |
| `category_id` | `bigint` | FK para `organization_categories_master` |
| `created_at` | `timestamp` | Data de criação |
| `created_by` | `bigint` | FK para `nexus.public.users` |

---

### 22. `organization_services` - Vínculo Organização-Serviço

Vincula organizações a serviços oferecidos.

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `organization_id` | `bigint` | FK para `organizations` |
| `service_id` | `bigint` | FK para `organization_services_master` |
| `created_at` | `timestamp` | Data de criação |
| `created_by` | `bigint` | FK para `nexus.public.users` |

---

## 📝 Tabelas de Trilha de Contratos

### 23. `contract_initiation_stages` - Etapas de Iniciação

Etapas do processo de iniciação de contratos.

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `name` | `varchar(255)` | Nome da etapa |
| `description` | `text` | Descrição |
| `order` | `integer` | Ordem (único) |
| `is_final` | `boolean` | É etapa final? |
| `is_active` | `boolean` | Ativa/Inativa |
| `sla_days` | `integer` | SLA em dias |
| `created_at` | `timestamp` | Data de criação |
| `updated_at` | `timestamp` | Data de atualização |
| `created_by` | `bigint` | FK para `nexus.public.users` |
| `updated_by` | `bigint` | FK para `nexus.public.users` |

---

### 24. `contract_initiation_activities` - Atividades de Iniciação

Atividades dentro das etapas de iniciação.

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `project_id` | `bigint` | FK para `projects` |
| `stage_id` | `bigint` | FK para `contract_initiation_stages` |
| `title` | `varchar(255)` | Título da atividade |
| `description` | `text` | Descrição |
| `activity_type` | `varchar(50)` | Tipo da atividade |
| `status` | `varchar(20)` | Status |
| `due_at` | `timestamp` | Data de vencimento |
| `completed_at` | `timestamp` | Data de conclusão |
| `owner_user_id` | `bigint` | FK para `nexus.public.users` (responsável) |
| `created_by` | `bigint` | FK para `nexus.public.users` |
| `created_at` | `timestamp` | Data de criação |
| `updated_at` | `timestamp` | Data de atualização |

---

### 25. `contract_initiation_stage_history` - Histórico de Etapas

Histórico de movimentação entre etapas.

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `project_id` | `bigint` | FK para `projects` |
| `from_stage_id` | `bigint` | FK para `contract_initiation_stages` (origem) |
| `to_stage_id` | `bigint` | FK para `contract_initiation_stages` (destino) |
| `moved_at` | `timestamp` | Data da movimentação |
| `moved_by_user_id` | `bigint` | FK para `nexus.public.users` (quem moveu) |
| `days_in_previous_stage` | `integer` | Dias na etapa anterior |
| `created_at` | `timestamp` | Data de criação |

---

### 26. `contract_evaluations` - Avaliações de Contratos

Avaliações de contratos vinculados a fornecedores.

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `project_org_id` | `bigint` | FK para `project_organizations` |
| `budget_item_id` | `bigint` | FK para `budget_items` (opcional) |
| `category_id` | `bigint` | FK para `budget_categories` (opcional) |
| `rating` | `smallint` | Nota (1-5) |
| `comment` | `text` | Comentário da avaliação |
| `evaluated_by` | `bigint` | FK para `nexus.public.users` |
| `evaluated_at` | `timestamp` | Data da avaliação |
| `created_at` | `timestamp` | Data de criação |
| `updated_at` | `timestamp` | Data de atualização |

---

## 🔍 Tabelas de Auditoria

### 27. `audit_log` - Log de Auditoria

Trilha de auditoria para todas as operações críticas.

#### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `bigint` | Chave primária |
| `entity_type` | `varchar(50)` | Tipo da entidade (projects, expenses, etc.) |
| `entity_id` | `bigint` | ID da entidade |
| `action` | `varchar(20)` | Ação: INSERT, UPDATE, DELETE |
| `changed_at` | `timestamp` | Data da mudança |
| `user_id` | `bigint` | FK para `nexus.public.users` |
| `changes` | `jsonb` | Diff ou snapshot das mudanças |

---

## 📊 Enums e Códigos

### Enums Numéricos (SMALLINT)

#### `projects.status`
- `0` = PRE_PROJETO
- `1` = EM_EXECUCAO
- `2` = ENCERRADO
- `3` = SUSPENSO

#### `projects.gov_if`
- `0` = Gov
- `1` = IF

#### `projects.project_type`
- `0` = PROJETO
- `1` = PRODUTO

#### `organizations.type`
- `0` = FUNDACAO
- `1` = ORGAO_PUBLICO
- `2` = EMPRESA
- `3` = PARCEIRA
- `4` = CLIENTE

#### `organizations.is_active`
- `0` = INATIVO
- `1` = ATIVO

#### `project_people.status` / `project_organizations.status`
- `0` = PENDENTE
- `1` = ATIVO
- `2` = ENCERRADO

#### `disbursement_schedule.status`
- `0` = PREVISTO
- `1` = RECEBIDO_PARCIAL
- `2` = RECEBIDO_TOTAL
- `3` = CANCELADO

#### `budget_transfers.status`
- `0` = PENDENTE
- `1` = APROVADO
- `2` = REJEITADO

#### `tasks.status`
- `0` = NAO_INICIADA
- `1` = EM_ANDAMENTO
- `2` = CONCLUIDA

---

## 🔗 Relacionamentos Principais

### Hierarquia de Projetos

```
projects
  ├── organizations (orgao_financiador_id, executing_org_id)
  ├── project_people
  │   └── people
  ├── project_organizations
  │   └── organizations
  │       └── organization_categories
  │       └── organization_services
  ├── budget_items
  │   └── budget_categories
  │   └── goals
  ├── disbursement_schedule
  │   └── incomes
  ├── expenses
  │   ├── budget_items
  │   ├── project_people (via person_id)
  │   ├── organizations
  │   └── incomes
  ├── budget_transfers
  │   └── budget_items (from/to)
  ├── goals
  │   └── stages
  │       └── phases
  ├── milestones
  ├── tasks
  │   └── milestones
  └── documents
```

---

## ⚙️ Regras de Negócio Importantes

### 1. Cálculos Automáticos

#### Projeto
- `total_received` = SUM(`incomes.amount`) WHERE `incomes.project_id = projects.id`
- `total_expenses` = SUM(`expenses.amount`) WHERE `expenses.project_id = projects.id`
- `saldo` = `total_received` - `total_expenses`

#### Item Orçamentário
- `executed_amount` = SUM(`expenses.amount`) WHERE `expenses.budget_item_id = budget_items.id`

### 2. Validações Obrigatórias

#### Expenses
- `person_id` OU `organization_id` deve ser preenchido (não ambos)
- `income_id` é obrigatório

#### Documents
- `project_id` é obrigatório
- Arquivos são armazenados em S3, não no Postgres

#### Budget Transfers
- `from_item_id` e `to_item_id` devem pertencer ao mesmo projeto
- Status deve ser controlado (PENDENTE → APROVADO/REJEITADO)

### 3. Integridade Referencial

- Todas as referências a `nexus.public.users` são mantidas em código (sem FK cross-database)
- Foreign keys são aplicadas apenas dentro do mesmo database

### 4. Timestamps e Auditoria

- Todas as tabelas principais possuem `created_at`, `updated_at`, `created_by`, `updated_by`
- `audit_log` registra todas as mudanças críticas em formato JSONB

---

## 📝 Notas de Migração

### Campos Novos Adicionados

#### `projects`
- `gov_if` (smallint)
- `project_type` (smallint)
- `valor_empenhado`, `valor_liquidado`, `valor_pago` (numeric)
- `total_received`, `total_expenses`, `saldo` (calculados)

#### `organizations`
- `trade_name` (varchar)
- `contact_person` (varchar)
- `is_active` (smallint)
- `created_by`, `updated_by` (bigint)

#### `people`
- `avatar_url` (varchar)

#### `budget_items`
- `months` (int)
- `goal_id` (bigint)
- `created_by`, `updated_by` (bigint)

#### `budget_transfers`
- `status` (smallint)
- `updated_at`, `updated_by` (timestamp, bigint)
- `approved_at`, `approved_by` (timestamp, bigint)

---

## 🔐 Segurança e Permissões

### Autenticação
- Usuários são gerenciados pelo sistema Nexus
- Apenas `id` do usuário é armazenado (sem cache local)

### Auditoria
- Todas as operações críticas são registradas em `audit_log`
- Campos `created_by`, `updated_by` rastreiam autoria

---

## 📚 Referências

- [Especificação Backend Original](./GoPro2_Especificacao_Backend%20(1).md)
- [Complemento da Especificação](./GoPro2_Especificacao_Backend_Complemento%20(1).md)
- [Documentação do Projeto](../README.md)

---

**Última atualização:** Janeiro 2025  
**Mantido por:** Equipe GoPro 2.0
