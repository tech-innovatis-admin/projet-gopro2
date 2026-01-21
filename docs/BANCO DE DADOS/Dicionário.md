# Dicionário de Dados – GoPro 2 (Resumo)

## 1. `projects` – Projetos

- `id`: identificador único do projeto.  
- `name`: nome do projeto.  
- `code`: código interno / código do órgão financiador.  
- `status`: estágio do projeto  
  - 0 = PRE_PROJETO  
  - 1 = EM_EXECUCAO  
  - 2 = ENCERRADO  
  - 3 = SUSPENSO  
- `area_segmento`: área ou segmento temático do projeto.  
- `orgao_financiador_id`: FK para `organizations` que representa o órgão financiador.  
- `executing_org_id`: FK para `organizations` que representa a instituição executora.  
- `coordinator`: nome do coordenador do projeto.  
- `scope`: escopo / objeto do projeto (descrição resumida).  
- `contract_value`: valor total contratado do projeto.  
- `start_date`: data de início da vigência/execução.  
- `end_date`: data de término da vigência/execução.  
- `opening_date`: data de abertura/cadastro do projeto.  
- `execution_location`: local de execução (cidade/estado ou descrição livre).  
- `created_at` / `updated_at`: data/hora de criação e última atualização do registro.  
- `created_by` / `updated_by`: id do usuário (em `nexus.public.users`) que criou/atualizou.  

---

## 2. `organizations` – Organizações (PFJ)

- `id`: identificador único da organização.  
- `name`: nome da organização (razão social / nome fantasia).  
- `cnpj`: CNPJ da organização (único).  
- `type`: tipo da organização  
  - 0 = FUNDAÇÃO  
  - 1 = ORGAO_PUBLICO  
  - 2 = EMPRESA  
  - 3 = PARCEIRA  
  - 4 = CLIENTE  
- `email`: e-mail de contato principal.  
- `phone`: telefone de contato principal.  
- `address`: endereço completo (campo livre).  
- `zip_code`: CEP.  
- `city`: cidade.  
- `state`: estado (UF ou nome).  
- `notes`: observações gerais.  
- `created_at` / `updated_at`: data/hora de criação e última atualização.  

---

## 3. `people` – Pessoas físicas

- `id`: identificador único da pessoa.  
- `full_name`: nome completo.  
- `cpf`: CPF (único).  
- `email`: e-mail de contato.  
- `phone`: telefone de contato.  
- `birth_date`: data de nascimento.  
- `address`: endereço completo.  
- `zip_code`: CEP.  
- `city`: cidade.  
- `state`: estado (UF ou nome).  
- `notes`: observações gerais.  
- `created_at` / `updated_at`: data/hora de criação e última atualização.  

---

## 4. `documents` – Metadados de arquivos

- `id`: identificador único do documento (metadado).  
- `entity_type`: nome da entidade à qual o arquivo está ligado (ex.: `projects`, `expenses`, `budget_items`).  
- `entity_id`: id do registro na tabela indicada em `entity_type`.  
- `document_type`: tipo lógico do documento (contrato, TED, TR, `nota_fiscal`, ofício etc.).  
- `filename`: nome original do arquivo enviado.  
- `file_path`: caminho ou chave no storage (ex.: chave S3).  
- `content_type`: tipo MIME do arquivo (ex.: `application/pdf`, `image/png`).  
- `uploaded_at`: data/hora do upload.  
- `uploaded_by`: id do usuário (Nexus) que fez o upload.  
- `filesize`: tamanho do arquivo em bytes.  
- `checksum`: hash para integridade (MD5/SHA ou similar).  
- `notes`: observações sobre o documento.  

---

## 5. `project_people` – Pessoas vinculadas a projetos

- `id`: identificador único do vínculo pessoa–projeto.  
- `project_id`: FK para `projects` (projeto ao qual a pessoa está vinculada).  
- `person_id`: FK para `people` (pessoa vinculada).  
- `role`: função da pessoa no projeto (ex.: bolsista, analista, coordenador etc.).  
- `contract_type`: tipo de vínculo/contrato (ex.: BOLSA, RPA, CLT, PJ – catálogo controlado).  
- `start_date`: data de início do vínculo no projeto.  
- `end_date`: data de fim do vínculo no projeto.  
- `status`: status do vínculo  
  - 0 = PENDENTE  
  - 1 = ATIVO  
  - 2 = ENCERRADO  
- `base_amount`: valor base de remuneração/contrato neste vínculo.  
- `notes`: observações sobre a contratação/vínculo.  
- `created_at` / `updated_at`: data/hora de criação e última atualização.  
- `created_by` / `updated_by`: id do usuário (Nexus) que criou/atualizou o vínculo.  

---

## 6. `project_organizations` – Organizações vinculadas a projetos

- `id`: identificador único do vínculo organização–projeto.  
- `project_id`: FK para `projects`.  
- `organization_id`: FK para `organizations`.  
- `contract_number`: número do contrato/convênio/termo com a organização.  
- `description`: descrição do objeto do contrato ou relação com o projeto.  
- `start_date`: data de início da vigência com a organização naquele projeto.  
- `end_date`: data de término da vigência.  
- `status`: status do vínculo  
  - 0 = PENDENTE  
  - 1 = ATIVO  
  - 2 = ENCERRADO  
- `total_value`: valor total contratado com a organização naquele projeto.  
- `notes`: observações sobre a contratação.  
- `created_at` / `updated_at`: data/hora de criação e última atualização.  
- `created_by` / `updated_by`: id do usuário (Nexus) que criou/atualizou o vínculo.  

---

## 7. `budget_categories` – Rubricas orçamentárias

- `id`: identificador único da rubrica.  
- `code`: código da rubrica (único).  
- `name`: nome da rubrica (único).  
- `description`: descrição detalhada da rubrica.  
- `active`: indica se a rubrica está ativa para uso (`true`/`false`).  
- `created_at` / `updated_at`: data/hora de criação e última atualização.  

---

## 8. `budget_items` – Itens orçamentários do projeto

- `id`: identificador único do item orçamentário.  
- `project_id`: FK para `projects` (projeto ao qual o item pertence).  
- `category_id`: FK para `budget_categories` (rubrica do item).  
- `description`: descrição do item orçamentário.  
- `quantity`: quantidade planejada (quando aplicável).  
- `unit_cost`: custo unitário planejado.  
- `planned_amount`: valor total planejado/orçado para o item (base original, antes de remanejamentos).  
- `executed_amount`: valor total já executado (soma das despesas `expenses` vinculadas ao item).  
- `notes`: observações sobre o item.  
- `created_at` / `updated_at`: data/hora de criação e última atualização.  

---

## 9. `disbursement_schedule` – Cronograma de desembolso/entradas previstas

- `id`: identificador único do registro do cronograma.  
- `project_id`: FK para `projects`.  
- `expected_month`: data representando o mês previsto (sempre o último dia do mês, ex.: `2025-08-31`).  
- `expected_amount`: valor previsto de entrada/desembolso naquele mês.  
- `status`: status do recebimento previsto  
  - 0 = PREVISTO  
  - 1 = RECEBIDO_PARCIAL  
  - 2 = RECEBIDO_TOTAL  
  - 3 = CANCELADO  
- `notes`: observações sobre a parcela.  
- `created_at` / `updated_at`: data/hora de criação e última atualização.  
- `created_by` / `updated_by`: id do usuário (Nexus) que criou/atualizou.  

---

## 10. `incomes` – Entradas financeiras (receitas)

- `id`: identificador único da entrada.  
- `project_id`: FK para `projects`.  
- `schedule_id`: FK opcional para `disbursement_schedule.id` (ligação com a previsão).  
- `amount`: valor efetivamente recebido.  
- `received_at`: data em que o recurso foi recebido.  
- `source`: texto livre com a fonte/pagador (ex.: nome do órgão, conta de origem).  
- `invoice_number`: número de documento associado (nota, TED, recibo, etc.).  
- `notes`: observações sobre a entrada.  
- `created_at` / `updated_at`: data/hora de criação e última atualização.  
- `created_by` / `updated_by`: id do usuário (Nexus) que criou/atualizou.  

---

## 11. `expenses` – Despesas / execução financeira

- `id`: identificador único da despesa.  
- `project_id`: FK para `projects` (projeto ao qual a despesa pertence).  
- `budget_item_id`: FK opcional para `budget_items` (item orçamentário associado à despesa).  
- `category_id`: FK opcional para `budget_categories` (rubrica da despesa, quando não há item).  
- `expense_date`: data da despesa (emissão ou competência, conforme regra definida).  
- `amount`: valor da despesa.  
- `person_id`: FK opcional para `people` (pessoa física recebedora).  
- `organization_id`: FK opcional para `organizations` (pessoa jurídica recebedora).  
- `description`: descrição da despesa.  
- `expense_type`: tipo de despesa (diária, passagem, serviço, material, etc. – catálogo controlado).  
- `invoice_number`: número da nota fiscal/recibo/documento.  
- `invoice_date`: data da nota fiscal/recibo.  
- `document_id`: FK opcional para `documents` (arquivo da nota/recibo anexado).  
- `created_at` / `updated_at`: data/hora de criação e última atualização.  
- `created_by` / `updated_by`: id do usuário (Nexus) que criou/atualizou.  

---

## 12. `budget_transfers` – Remanejamentos entre itens orçamentários

- `id`: identificador único do remanejamento.  
- `project_id`: FK para `projects`.  
- `from_item_id`: FK para `budget_items` (item de origem dos recursos).  
- `to_item_id`: FK para `budget_items` (item de destino dos recursos).  
- `amount`: valor remanejado do item origem para o item destino.  
- `transfer_date`: data do remanejamento.  
- `reason`: justificativa do remanejamento.  
- `document_id`: FK opcional para `documents` (ofício/autorização anexado).  
- `created_at`: data/hora de criação do registro.  
- `created_by`: id do usuário (Nexus) que registrou o remanejamento.  

---

## 13. `milestones` – Marcos do projeto (execução técnica)

- `id`: identificador único do marco.  
- `project_id`: FK para `projects`.  
- `name`: nome do marco.  
- `description`: descrição do marco.  
- `start_date`: data de início planejada do marco.  
- `end_date`: data de término planejada do marco.  
- `created_at` / `updated_at`: data/hora de criação e última atualização.  

---

## 14. `tasks` – Tarefas do projeto (execução técnica)

- `id`: identificador único da tarefa.  
- `project_id`: FK para `projects`.  
- `milestone_id`: FK opcional para `milestones` (marco ao qual a tarefa pertence).  
- `description`: descrição resumida da tarefa.  
- `detail`: detalhamento da tarefa (campo de texto).  
- `planned_quantity`: quantidade planejada (ex.: número de horas, unidades, entregas).  
- `executed_quantity`: quantidade executada até o momento.  
- `measurement_unit`: unidade de medida da quantidade (ex.: h, un, relatório).  
- `unit_cost`: custo unitário estimado da tarefa (quando aplicável).  
- `status`: status da tarefa  
  - 0 = NAO_INICIADA  
  - 1 = EM_ANDAMENTO  
  - 2 = CONCLUIDA  
- `start_date`: data de início planejada.  
- `end_date`: data de fim planejada.  
- `actual_start_date`: data de início real.  
- `actual_end_date`: data de término real.  
- `responsible`: pessoa responsável (nome livre, não FK).  
- `created_at` / `updated_at`: data/hora de criação e última atualização.  

---

## 15. `audit_log` – Auditoria

- `id`: identificador único do evento de auditoria.  
- `entity_type`: nome da entidade/tabela impactada (ex.: `projects`, `budget_items`, `expenses`).  
- `entity_id`: id do registro afetado na tabela `entity_type`.  
- `action`: tipo de operação executada (`INSERT`, `UPDATE`, `DELETE`).  
- `changed_at`: data/hora em que a mudança ocorreu.  
- `user_id`: id do usuário (em `nexus.public.users`) que realizou a operação.  
- `changes`: conteúdo JSON com o diff ou snapshot das alterações (antes/depois).  
