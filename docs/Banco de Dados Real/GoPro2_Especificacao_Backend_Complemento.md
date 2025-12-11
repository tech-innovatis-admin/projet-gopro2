# GoPro 2 – Complemento da Especificação para Backend

*Regras de negócio financeiras, consultas prioritárias e pontos de atenção*

## 1. Objetivo deste complemento

Este documento complementa o **GoPro2_Especificacao_Backend.md**, detalhando:

* Regras de cálculo de saldos por rubrica/item e efeito de remanejamentos.
* Semântica de despesas (`expenses`) no MVP.
* Ordem de grandeza dos dados e implicações de performance.
* Conjunto mínimo de consultas de negócio que precisam ser bem suportadas.
* Visão geral de autorização/roles para orientar a API.

A modelagem de dados **não muda**, apenas fica mais bem especificada em termos de comportamento.

---

## 2. Regras de cálculo financeiras

### 2.1. Estrutura conceitual

* **`budget_categories`**: glossário único de rubricas.
* **`budget_items`**: “linha” orçamentária do projeto (vincula um projeto a uma rubrica, com valor planejado).
* **`disbursement_schedule`**: previsão de desembolsos/entradas (cronograma do financiador).
* **`incomes`**: entradas efetivamente recebidas.
* **`expenses`**: execução financeira (desembolso efetivo para PF/PJ, NF, RPA, etc.).
* **`budget_transfers`**: remanejamentos de valor entre itens orçamentários do mesmo projeto.

### 2.2. Valores principais em `budget_items`

Campos relevantes:

* `planned_amount`

  * Valor autorizado/planejado originalmente para aquele item.
  * Não é alterado diretamente em remanejamentos; estes são registrados em `budget_transfers`.

* `executed_amount`

  * Valor efetivamente executado (somado) para o item.
  * Deve refletir a soma de todas as `expenses.amount` vinculadas ao item.

Regra:

* Para um item `i`:

  * `executed_amount(i)` = soma de `expenses.amount` onde `expenses.budget_item_id = i.id`.

### 2.3. Efeito dos remanejamentos (`budget_transfers`)

Cada registro em `budget_transfers` indica:

* `project_id`: projeto ao qual o remanejamento pertence.
* `from_item_id`: item de **origem** do recurso.
* `to_item_id`: item de **destino**.
* `amount`: valor remanejado.
* `document_id`: documento que autoriza o remanejamento (ofício, despacho etc.).

Conceitos para consultas:

* **Transferência saída** (de um item):
  `outgoing_transfers(i)` = soma de `amount` onde `from_item_id = i.id`.

* **Transferência entrada** (para um item):
  `incoming_transfers(i)` = soma de `amount` onde `to_item_id = i.id`.

* **Orçamento ajustado** do item (após remanejamentos):

```text
adjusted_planned(i) = planned_amount(i)
                      + incoming_transfers(i)
                      - outgoing_transfers(i)
```

* **Saldo disponível** do item:

```text
available_balance(i) = adjusted_planned(i) - executed_amount(i)
```

Essas fórmulas podem ser implementadas:

* via views SQL;
* via consultas com agregações;
* ou via materialized views se for necessário otimizar.

### 2.4. Atualização de `executed_amount`

Opção adotada:

* **`executed_amount` será mantido como coluna denormalizada de conveniência**.

Regras:

* Sempre que uma `expense` for:

  * criada, atualizada ou removida,
  * o backend deve recalcular o `executed_amount` do(s) item(ns) afetado(s).
* Para evitar erros silenciosos:

  * em operações de backfill/migração, deve existir um comando de “recalcular todos os `executed_amount`” a partir de `expenses`.

Motivações:

* Simplificar consultas de saldo e dashboards (não depender de agregações pesadas a cada request).
* Manter o comportamento explícito no backend (sem triggers mágicos no banco).

---

## 3. Semântica de despesas (`expenses`) no MVP

Para a **Fase 1 (MVP)**, adotaremos a seguinte simplificação:

* Cada registro em `expenses` representa um **valor efetivamente executado/pago ou liquidado**, não apenas planejado.
* Não haverá campo `status` em `expenses` no MVP.

Implicações:

* Todo valor em `expenses.amount` entra direto no cálculo de `executed_amount`.
* Situações como “empenhado, mas ainda não pago” ou “previsto” são representadas:

  * no nível de **orçamento** (`budget_items`) e
  * no nível de **cronograma de entradas** (`disbursement_schedule`).

Evolução futura (quando/SE necessário):

* Adicionar um campo `status` em `expenses` (ex.: `PREVISTO`, `EM_PROCESSAMENTO`, `PAGO`).
* Ajustar as consultas para considerar apenas `status = PAGO` em `executed_amount`.

Por ora, esta complexidade fica fora do escopo do MVP.

---

## 4. Volume esperado e performance

Estimativa de ordem de grandeza (para orientar índices e design):

* **Projetos**: dezenas a poucas centenas ao longo do tempo.
* **Itens orçamentários (`budget_items`)**: dezenas a poucas centenas por projeto.
* **Despesas (`expenses`)**: potencialmente **milhares por projeto** em casos robustos.
* **Entradas (`incomes`)**: dezenas a centenas por projeto.
* **PF/PJ vinculadas (`project_people` / `project_organizations`)**: dezenas por projeto.

Implicações:

* Necessário criar índices em:

  * `projects(status, orgao_financiador_id)`
  * `budget_items(project_id, category_id)`
  * `expenses(project_id)`
  * `expenses(budget_item_id)`
  * `expenses(category_id)`
  * `expenses(person_id)`
  * `expenses(organization_id)`
  * `disbursement_schedule(project_id, expected_month)`
  * `incomes(project_id, received_at)`

* Para consultas agregadas (saldo por rubrica), considerar:

  * views que agregam por `project_id` + `category_id`;
  * ou endpoints com SQL bem específico (sem ORM “cego”).

---

## 5. Consultas de negócio prioritárias

A modelagem foi pensada para suportar bem pelo menos as consultas abaixo.
Essas consultas devem ser guias para a criação de endpoints e índices.

### 5.1. Consulta de execução (visão tipo “Consulta da Execução”)

Filtros típicos combináveis:

* `project_id` (obrigatório na maioria dos casos);
* tipo de despesa (`expenses.expense_type`);
* pessoa física (`person_id`) ou jurídica (`organization_id`);
* período (`expense_date` entre data_inicial e data_final);
* rubrica/categoria (`category_id`) ou item específico (`budget_item_id`).

Saída desejada (exemplo):

* Lista de despesas com:

  * projeto, rubrica, item, PF/PJ, valor, data, tipo, número de NF, link para documento.
* Totais agregados:

  * total por rubrica, total por PF/PJ, total geral no período filtrado.

### 5.2. Consulta de saldos por rubrica

Para um `project_id`, retornar:

* Para cada `budget_category` participante:

  * `planned_amount` (soma dos `planned_amount` dos itens da rubrica);
  * `adjusted_planned` (considerando `budget_transfers`);
  * `executed_amount` (soma de `executed_amount` dos itens da rubrica);
  * `available_balance` = `adjusted_planned - executed_amount`.

Usar:

* `budget_items`, `budget_categories`, `budget_transfers`, `expenses`.

### 5.3. Consulta de PJs contratadas (“Consulta de Contratações PJ”)

Filtros:

* `organization_id` (empresa específica);
* opcionalmente `project_id` ou período.

Saída:

* Projetos em que a PJ aparece (`project_organizations`).
* Despesas executadas para essa PJ (`expenses.organization_id`).
* Valores por projeto, por rubrica, totais.

### 5.4. Consulta de PF contratadas / histórico da pessoa

Filtros:

* `person_id` ou CPF.

Saída:

* Lista de projetos em que a pessoa foi vinculada (`project_people`).
* Valores recebidos por projeto (via `expenses.person_id`).
* Histórico de pagamentos (datas, valores, tipo de despesa).

### 5.5. Resumo de projeto (visão “capa”)

Dado um `project_id`, retornar:

* Cabeçalho: nome, código, órgão financiador, executor, área/segmento, período, status.
* Entradas:

  * total previsto no cronograma (`SUM(disbursement_schedule.expected_amount)`);
  * total recebido (`SUM(incomes.amount)`);
* Orçamento:

  * totais por rubrica (planejado vs executado vs saldo);
* Execução:

  * número de PF e PJ vinculadas;
  * principais tipos de despesa;
* Links:

  * documentos principais associados ao projeto (TED, contrato, TR, plano de trabalho).

---

## 6. Autorização / perfis (visão de alto nível)

A implementação detalhada de RBAC ficará a cargo do backend + produto, mas recomenda-se partir de algo nessa linha:

### 6.1. Perfis básicos sugeridos

* **Execução (Operacional)**

  * Pode:

    * cadastrar/editar `project_people` e `project_organizations` para projetos em que atua;
    * lançar `expenses` (dentro de limites definidos);
    * anexar documentos operacionais (relatórios, NFs, comprovantes);
  * Não pode:

    * alterar `planned_amount` nem criar `budget_transfers` sem autorização.

* **Gestão/Coordenação de Projetos**

  * Pode:

    * criar/editar `projects`;
    * editar `budget_items` e iniciar `budget_transfers` (remanejamentos);
    * encerrar projeto, mudar status de `projects.status`;
    * ver visão consolidada de entradas/saídas.

* **Financeiro/Compras**

  * Pode:

    * registrar `incomes`, ajustar `disbursement_schedule.status`;
    * validar e eventualmente bloquear/atualizar `expenses`;
    * anexar documentos fiscais (NF, recibos).

* **Admin (TI/Plataforma)**

  * Acesso técnico e manutenção, sem papel direto na operação dos projetos.

Como `role` já existe em `nexus.public.users`, a GoPro 2 deve mapear esses papéis às roles do Nexus, ou derivar perfis específicos para plataforma.

---

## 7. Observações finais para o backend

1. **Modelagem**

   * Não há alterações estruturais adicionais em relação ao primeiro .md; apenas foram definidas regras de **cálculo** e **uso** das colunas já existentes.

2. **Implementação incremental**

   * Priorizar primeiras rotas:

     * CRUD de `projects`, `budget_categories`, `budget_items`, `disbursement_schedule`, `incomes`, `expenses`.
   * Em seguida:

     * `project_people`, `project_organizations`, `documents`, `budget_transfers`.
   * Auditoria (`audit_log`) pode ser ligada assim que a API estabilizar.

3. **Consistência de dados**

   * Garantir que toda operação CRUD relevante invoque:

     * atualização de `executed_amount` (quando houver mudança em `expenses`);
     * registro em `audit_log`.

4. **Documentação da API**

   * Recomendado expor a semântica de cada campo (como acima) em OpenAPI/Swagger, para o time de frontend trabalhar com segurança.

---
