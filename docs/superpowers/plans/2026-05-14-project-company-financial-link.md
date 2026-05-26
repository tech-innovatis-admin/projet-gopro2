# Project Company Financial Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** formalizar `projectCompanyId` como vinculo oficial de empresa contratada em rubricas e pagamentos, substituir o status numerico de `ProjectCompany` por enum explicito e bloquear lancamentos que excedam saldo disponivel.

**Architecture:** o backend passa a usar `ProjectCompany` como referencia financeira da empresa no projeto. `organizationId` permanece legado em `expenses`, mas nao deve ser usado para empresa contratada. A regra de status e saldo fica centralizada em um service de validacao para evitar bypass entre DTO, mapper, rubrica e pagamento.

**Tech Stack:** Java 17+, Spring Boot 3.2, Spring Data JPA/Hibernate, PostgreSQL, Flyway, MapStruct, JUnit/Mockito, Maven Wrapper no Windows.

---

## Decisoes de Implementacao

- `expenses.project_company_id` sera nullable para compatibilidade com registros antigos.
- `budget_items.project_company_id` ja existe em parte do schema, mas a nova migration deve garantir coluna, FK e indice idempotentes.
- `project_company.status` hoje e `Short`; sera migrado para `varchar(30)` e mapeado por `ContractingStatusEnum` com `@Enumerated(EnumType.STRING)`.
- Mapeamento legado sugerido para status numerico:
  - `0` ou `null` -> `EM_CADASTRO`
  - `1` -> `EM_CONTRATACAO`
  - `2` -> `CONTRATADA`
  - `3` -> `EM_EXECUCAO`
  - `4` -> `CONCLUIDA`
  - `5` -> `CANCELADA`
  - outros valores -> `EM_CADASTRO`
- Estados que permitem novos vinculos financeiros: `CONTRATADA`, `EM_EXECUCAO`.
- Estados que nao permitem novos vinculos financeiros: `EM_CADASTRO`, `EM_CONTRATACAO`, `CONCLUIDA`, `CANCELADA`.
- Empresa inativa nunca permite novo vinculo financeiro.
- Saldo disponivel por empresa contratada no projeto:

```text
saldoDisponivel = project_company.total_value
                - soma(budget_items.contracted_amount ativos da empresa no projeto)
                - soma(expenses.amount ativos da empresa no projeto)
```

- Em edicao, o valor atual do proprio registro deve ser excluido da soma para nao bloquear uma atualizacao neutra.
- `organizationId` continua em DTOs/responses apenas por compatibilidade, mas nao e o caminho principal de empresa contratada.

---

## Arquivos Impactados

### Banco / Flyway

- Criar: `api_gopro/src/main/resources/db/migration/core/V137__add_project_company_to_expenses.sql`
- Criar: `api_gopro/src/main/resources/db/migration/prod/V049__add_project_company_to_expenses.sql`
- Criar: `api_gopro/src/main/resources/db/migration/core/V138__formalize_project_company_contracting_status.sql`
- Criar: `api_gopro/src/main/resources/db/migration/prod/V050__formalize_project_company_contracting_status.sql`

### Backend / Modelagem

- Criar: `api_gopro/src/main/java/br/com/gopro/api/enums/ContractingStatusEnum.java`
- Modificar: `api_gopro/src/main/java/br/com/gopro/api/model/ProjectCompany.java`
- Modificar: `api_gopro/src/main/java/br/com/gopro/api/model/Expense.java`

### Backend / DTOs

- Modificar: `api_gopro/src/main/java/br/com/gopro/api/dtos/ExpenseRequestDTO.java`
- Modificar: `api_gopro/src/main/java/br/com/gopro/api/dtos/ExpenseUpdateDTO.java`
- Modificar: `api_gopro/src/main/java/br/com/gopro/api/dtos/ExpenseResponseDTO.java`
- Modificar: `api_gopro/src/main/java/br/com/gopro/api/dtos/ProjectCompanyRequestDTO.java`
- Modificar: `api_gopro/src/main/java/br/com/gopro/api/dtos/ProjectCompanyUpdateDTO.java`
- Modificar: `api_gopro/src/main/java/br/com/gopro/api/dtos/ProjectCompanyResponseDTO.java`
- Modificar: `api_gopro/src/main/java/br/com/gopro/api/dtos/ProjectCompanyDetailedResponseDTO.java`

`BudgetItemRequestDTO`, `BudgetItemUpdateDTO` e `BudgetItemResponseDTO` ja possuem `projectCompanyId`; revisar apenas se compilacao apontar divergencia.

### Backend / Mappers, Repositories e Services

- Modificar: `api_gopro/src/main/java/br/com/gopro/api/mapper/ExpenseMapper.java`
- Modificar: `api_gopro/src/main/java/br/com/gopro/api/mapper/ProjectCompanyMapper.java`
- Modificar: `api_gopro/src/main/java/br/com/gopro/api/repository/ExpenseRepository.java`
- Modificar: `api_gopro/src/main/java/br/com/gopro/api/repository/BudgetItemRepository.java`
- Modificar: `api_gopro/src/main/java/br/com/gopro/api/repository/ProjectCompanyRepository.java`
- Criar: `api_gopro/src/main/java/br/com/gopro/api/service/ProjectCompanyFinancialValidationService.java`
- Criar: `api_gopro/src/main/java/br/com/gopro/api/service/ProjectCompanyFinancialValidationServiceImpl.java`
- Modificar: `api_gopro/src/main/java/br/com/gopro/api/service/ExpenseServiceImpl.java`
- Modificar: `api_gopro/src/main/java/br/com/gopro/api/service/BudgetItemServiceImpl.java`
- Modificar: `api_gopro/src/main/java/br/com/gopro/api/service/BudgetItemBeneficiaryServiceImpl.java`

### Documentacao

- Modificar: `projet-gopro2/docs/Recursos/ESTRUTURA_CONTRATO_ID.md`
- Modificar ou criar no backend, se existir pasta equivalente: documento de depreciacao de `organizationId` no fluxo financeiro de empresa contratada.

---

## Task 1: Migration de `projectCompanyId` em `expenses` e indices

**Files:**
- Create: `api_gopro/src/main/resources/db/migration/core/V137__add_project_company_to_expenses.sql`
- Create: `api_gopro/src/main/resources/db/migration/prod/V049__add_project_company_to_expenses.sql`

- [ ] **Step 1: Criar migration core**

Conteudo:

```sql
-- Adds the official project-company link for contracted-company payments.
-- Existing organization_id data is legacy and intentionally not backfilled here.

ALTER TABLE IF EXISTS expenses
    ADD COLUMN IF NOT EXISTS project_company_id bigint;

ALTER TABLE IF EXISTS budget_items
    ADD COLUMN IF NOT EXISTS project_company_id bigint;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_expenses_project_company_id'
    ) THEN
        ALTER TABLE expenses
            ADD CONSTRAINT fk_expenses_project_company_id
                FOREIGN KEY (project_company_id) REFERENCES project_company (id);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_budget_items_project_company_id'
    ) THEN
        ALTER TABLE budget_items
            ADD CONSTRAINT fk_budget_items_project_company_id
                FOREIGN KEY (project_company_id) REFERENCES project_company (id);
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_expenses_project_company_id
    ON expenses (project_company_id);

CREATE INDEX IF NOT EXISTS idx_budget_items_project_company_id
    ON budget_items (project_company_id);
```

- [ ] **Step 2: Criar migration prod equivalente**

Copiar o mesmo conteudo para `prod/V049__add_project_company_to_expenses.sql`, mantendo a numeracao conforme o historico atual.

- [ ] **Step 3: Validar Flyway local**

Run:

```powershell
cd api_gopro
.\mvnw.cmd -DskipTests spring-boot:run
```

Expected:

```text
Successfully applied 1 migration
Schema "public" is up to date
Started ApiDaGoproApplication
```

- [ ] **Step 4: Testar constraint invalida manualmente**

Run no PostgreSQL local dentro de transacao:

```sql
BEGIN;
UPDATE expenses SET project_company_id = -999999 WHERE id = (SELECT id FROM expenses LIMIT 1);
ROLLBACK;
```

Expected:

```text
ERROR: insert or update on table "expenses" violates foreign key constraint "fk_expenses_project_company_id"
```

- [ ] **Step 5: Commit**

```powershell
git add api_gopro/src/main/resources/db/migration/core/V137__add_project_company_to_expenses.sql api_gopro/src/main/resources/db/migration/prod/V049__add_project_company_to_expenses.sql
git commit -m "feat(db): add project company link to expenses"
```

---

## Task 2: Migration de status explicito em `project_company`

**Files:**
- Create: `api_gopro/src/main/resources/db/migration/core/V138__formalize_project_company_contracting_status.sql`
- Create: `api_gopro/src/main/resources/db/migration/prod/V050__formalize_project_company_contracting_status.sql`

- [ ] **Step 1: Criar migration core**

Conteudo:

```sql
-- Converts project_company.status from numeric legacy codes to explicit enum values.
-- Rollback strategy: convert known enum values back to their legacy numeric codes before downgrading.

ALTER TABLE project_company
    ALTER COLUMN status TYPE varchar(30)
    USING CASE
        WHEN status IS NULL THEN 'EM_CADASTRO'
        WHEN status::text = '0' THEN 'EM_CADASTRO'
        WHEN status::text = '1' THEN 'EM_CONTRATACAO'
        WHEN status::text = '2' THEN 'CONTRATADA'
        WHEN status::text = '3' THEN 'EM_EXECUCAO'
        WHEN status::text = '4' THEN 'CONCLUIDA'
        WHEN status::text = '5' THEN 'CANCELADA'
        WHEN status::text IN (
            'EM_CADASTRO',
            'EM_CONTRATACAO',
            'CONTRATADA',
            'EM_EXECUCAO',
            'CONCLUIDA',
            'CANCELADA'
        ) THEN status::text
        ELSE 'EM_CADASTRO'
    END;

ALTER TABLE project_company
    ALTER COLUMN status SET DEFAULT 'EM_CADASTRO';

UPDATE project_company
SET status = 'EM_CADASTRO'
WHERE status IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_project_company_status'
    ) THEN
        ALTER TABLE project_company
            ADD CONSTRAINT chk_project_company_status
                CHECK (status IN (
                    'EM_CADASTRO',
                    'EM_CONTRATACAO',
                    'CONTRATADA',
                    'EM_EXECUCAO',
                    'CONCLUIDA',
                    'CANCELADA'
                ));
    END IF;
END
$$;
```

- [ ] **Step 2: Criar migration prod equivalente**

Copiar o mesmo conteudo para `prod/V050__formalize_project_company_contracting_status.sql`.

- [ ] **Step 3: Validar schema**

Run:

```powershell
cd api_gopro
.\mvnw.cmd -DskipTests spring-boot:run
```

Expected:

```text
Successfully applied migration
Started ApiDaGoproApplication
```

- [ ] **Step 4: Commit**

```powershell
git add api_gopro/src/main/resources/db/migration/core/V138__formalize_project_company_contracting_status.sql api_gopro/src/main/resources/db/migration/prod/V050__formalize_project_company_contracting_status.sql
git commit -m "feat(db): formalize project company contracting status"
```

---

## Task 3: Enum e DTOs de `ProjectCompany`

**Files:**
- Create: `api_gopro/src/main/java/br/com/gopro/api/enums/ContractingStatusEnum.java`
- Modify: `api_gopro/src/main/java/br/com/gopro/api/model/ProjectCompany.java`
- Modify: `api_gopro/src/main/java/br/com/gopro/api/dtos/ProjectCompanyRequestDTO.java`
- Modify: `api_gopro/src/main/java/br/com/gopro/api/dtos/ProjectCompanyUpdateDTO.java`
- Modify: `api_gopro/src/main/java/br/com/gopro/api/dtos/ProjectCompanyResponseDTO.java`
- Modify: `api_gopro/src/main/java/br/com/gopro/api/dtos/ProjectCompanyDetailedResponseDTO.java`
- Modify: `api_gopro/src/main/java/br/com/gopro/api/repository/ProjectCompanyRepository.java`

- [ ] **Step 1: Criar enum**

```java
package br.com.gopro.api.enums;

public enum ContractingStatusEnum {
    EM_CADASTRO,
    EM_CONTRATACAO,
    CONTRATADA,
    EM_EXECUCAO,
    CONCLUIDA,
    CANCELADA;

    public boolean allowsFinancialLink() {
        return this == CONTRATADA || this == EM_EXECUCAO;
    }
}
```

- [ ] **Step 2: Atualizar entidade**

Trocar em `ProjectCompany`:

```java
@Column(name = "status")
private Short status;
```

por:

```java
@Enumerated(EnumType.STRING)
@Column(name = "status", length = 30, nullable = false)
private ContractingStatusEnum status;
```

- [ ] **Step 3: Atualizar DTOs**

Trocar `Short status` por `ContractingStatusEnum status` nos 4 DTOs de `ProjectCompany`.

- [ ] **Step 4: Ajustar query de detailed response**

Manter `pc.status` no constructor expression do `ProjectCompanyRepository.findDetailedByProjectId`, agora tipado como enum.

- [ ] **Step 5: Aplicar default no service**

Em `ProjectCompanyServiceImpl.createProjectCompany`, antes de salvar:

```java
if (projectCompany.getStatus() == null) {
    projectCompany.setStatus(ContractingStatusEnum.EM_CADASTRO);
}
```

- [ ] **Step 6: Build**

Run:

```powershell
cd api_gopro
.\mvnw.cmd -DskipTests compile
```

Expected:

```text
BUILD SUCCESS
```

- [ ] **Step 7: Commit**

```powershell
git add api_gopro/src/main/java/br/com/gopro/api/enums/ContractingStatusEnum.java api_gopro/src/main/java/br/com/gopro/api/model/ProjectCompany.java api_gopro/src/main/java/br/com/gopro/api/dtos/ProjectCompanyRequestDTO.java api_gopro/src/main/java/br/com/gopro/api/dtos/ProjectCompanyUpdateDTO.java api_gopro/src/main/java/br/com/gopro/api/dtos/ProjectCompanyResponseDTO.java api_gopro/src/main/java/br/com/gopro/api/dtos/ProjectCompanyDetailedResponseDTO.java api_gopro/src/main/java/br/com/gopro/api/repository/ProjectCompanyRepository.java api_gopro/src/main/java/br/com/gopro/api/service/ProjectCompanyServiceImpl.java
git commit -m "feat(project-company): add contracting status enum"
```

---

## Task 4: DTOs e mapeamento de `Expense.projectCompanyId`

**Files:**
- Modify: `api_gopro/src/main/java/br/com/gopro/api/model/Expense.java`
- Modify: `api_gopro/src/main/java/br/com/gopro/api/dtos/ExpenseRequestDTO.java`
- Modify: `api_gopro/src/main/java/br/com/gopro/api/dtos/ExpenseUpdateDTO.java`
- Modify: `api_gopro/src/main/java/br/com/gopro/api/dtos/ExpenseResponseDTO.java`
- Modify: `api_gopro/src/main/java/br/com/gopro/api/mapper/ExpenseMapper.java`
- Modify: `api_gopro/src/main/java/br/com/gopro/api/service/ExpenseServiceImpl.java`

- [ ] **Step 1: Atualizar entidade `Expense`**

Adicionar:

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "project_company_id", foreignKey = @ForeignKey(name = "fk_expenses_project_company_id"))
private ProjectCompany projectCompany;
```

- [ ] **Step 2: Atualizar DTOs**

Adicionar `Long projectCompanyId` nos DTOs de request/update/response, ao lado de `personId` e antes de `organizationId`.

- [ ] **Step 3: Atualizar response mapper**

Adicionar no constructor de `ExpenseResponseDTO`:

```java
expense.getProjectCompany() != null ? expense.getProjectCompany().getId() : null,
```

- [ ] **Step 4: Atualizar service para aplicar link oficial**

Alterar assinatura:

```java
private void applyPaymentLink(Expense expense, Long personId, Long projectCompanyId, Long organizationId)
```

Regra:

```java
if (personId != null) {
    expense.setPerson(peopleRepository.getReferenceById(personId));
    expense.setProjectCompany(null);
    expense.setOrganization(null);
    return;
}
if (projectCompanyId != null) {
    expense.setProjectCompany(projectCompanyRepository.getReferenceById(projectCompanyId));
    expense.setPerson(null);
    expense.setOrganization(null);
    return;
}
if (organizationId != null) {
    expense.setOrganization(organizationRepository.getReferenceById(organizationId));
    expense.setPerson(null);
    expense.setProjectCompany(null);
    return;
}
expense.setPerson(null);
expense.setProjectCompany(null);
expense.setOrganization(null);
```

- [ ] **Step 5: Build**

Run:

```powershell
cd api_gopro
.\mvnw.cmd -DskipTests compile
```

Expected:

```text
BUILD SUCCESS
```

- [ ] **Step 6: Commit**

```powershell
git add api_gopro/src/main/java/br/com/gopro/api/model/Expense.java api_gopro/src/main/java/br/com/gopro/api/dtos/ExpenseRequestDTO.java api_gopro/src/main/java/br/com/gopro/api/dtos/ExpenseUpdateDTO.java api_gopro/src/main/java/br/com/gopro/api/dtos/ExpenseResponseDTO.java api_gopro/src/main/java/br/com/gopro/api/mapper/ExpenseMapper.java api_gopro/src/main/java/br/com/gopro/api/service/ExpenseServiceImpl.java
git commit -m "feat(expenses): expose project company link"
```

---

## Task 5: Service central de validacao financeira de `ProjectCompany`

**Files:**
- Create: `api_gopro/src/main/java/br/com/gopro/api/service/ProjectCompanyFinancialValidationService.java`
- Create: `api_gopro/src/main/java/br/com/gopro/api/service/ProjectCompanyFinancialValidationServiceImpl.java`
- Modify: `api_gopro/src/main/java/br/com/gopro/api/repository/BudgetItemRepository.java`
- Modify: `api_gopro/src/main/java/br/com/gopro/api/repository/ExpenseRepository.java`
- Modify: `api_gopro/src/main/java/br/com/gopro/api/repository/ProjectCompanyRepository.java`

- [ ] **Step 1: Criar interface**

```java
package br.com.gopro.api.service;

import java.math.BigDecimal;

public interface ProjectCompanyFinancialValidationService {
    void validateCanLinkToBudgetItem(Long projectId, Long projectCompanyId, BigDecimal requestedAmount, Long ignoredBudgetItemId);
    void validateCanReceivePayment(Long projectId, Long projectCompanyId, BigDecimal requestedAmount, Long ignoredExpenseId);
}
```

- [ ] **Step 2: Adicionar queries de soma com ignorados**

Em `BudgetItemRepository`:

```java
@Query("""
    select coalesce(sum(i.contractedAmount), 0)
    from BudgetItem i
    where i.category.project.id = :projectId
      and i.projectCompany.id = :projectCompanyId
      and i.isActive = true
      and (:ignoredBudgetItemId is null or i.id <> :ignoredBudgetItemId)
""")
BigDecimal sumContractedAmountByProjectAndProjectCompanyIgnoringItem(
        @Param("projectId") Long projectId,
        @Param("projectCompanyId") Long projectCompanyId,
        @Param("ignoredBudgetItemId") Long ignoredBudgetItemId
);
```

Em `ExpenseRepository`:

```java
@Query("""
    select coalesce(sum(e.amount), 0)
    from Expense e
    where e.project.id = :projectId
      and e.projectCompany.id = :projectCompanyId
      and e.isActive = true
      and (:ignoredExpenseId is null or e.id <> :ignoredExpenseId)
""")
BigDecimal sumAmountByProjectAndProjectCompanyIgnoringExpense(
        @Param("projectId") Long projectId,
        @Param("projectCompanyId") Long projectCompanyId,
        @Param("ignoredExpenseId") Long ignoredExpenseId
);
```

- [ ] **Step 3: Implementar service**

Implementar validacoes:

- `projectCompanyId == null`: nao validar empresa.
- buscar `ProjectCompany` por id; se nao existir, `ResourceNotFoundException("Empresa vinculada ao projeto nao encontrada")`.
- `projectCompany.project.id` deve bater com `projectId`; senao `BusinessException("Empresa contratada nao pertence ao projeto informado")`.
- `isActive != true`: `BusinessException("Empresa contratada inativa nao pode receber novos vinculos financeiros")`.
- `status == null || !status.allowsFinancialLink()`: `BusinessException("Empresa contratada com status " + status + " nao permite novos lancamentos financeiros")`.
- `requestedAmount == null || requestedAmount <= 0`: `BusinessException("Valor do lancamento deve ser maior que zero")`.
- saldo disponivel menor que solicitado: `BusinessException("Saldo insuficiente para a empresa contratada. Saldo disponivel: R$ ...")`.

- [ ] **Step 4: Commit**

```powershell
git add api_gopro/src/main/java/br/com/gopro/api/service/ProjectCompanyFinancialValidationService.java api_gopro/src/main/java/br/com/gopro/api/service/ProjectCompanyFinancialValidationServiceImpl.java api_gopro/src/main/java/br/com/gopro/api/repository/BudgetItemRepository.java api_gopro/src/main/java/br/com/gopro/api/repository/ExpenseRepository.java api_gopro/src/main/java/br/com/gopro/api/repository/ProjectCompanyRepository.java
git commit -m "feat(finance): validate project company status and balance"
```

---

## Task 6: Aplicar validacao em rubricas

**Files:**
- Modify: `api_gopro/src/main/java/br/com/gopro/api/service/BudgetItemServiceImpl.java`
- Modify: `api_gopro/src/main/java/br/com/gopro/api/service/BudgetItemBeneficiaryServiceImpl.java`

- [ ] **Step 1: Validar criacao de item de rubrica**

Em `BudgetItemServiceImpl.createBudgetItem`, depois de resolver categoria/projeto e antes de `save`, chamar:

```java
projectCompanyFinancialValidationService.validateCanLinkToBudgetItem(
        budgetItem.getCategory().getProject().getId(),
        budgetItem.getProjectCompany() != null ? budgetItem.getProjectCompany().getId() : null,
        budgetItem.getContractedAmount() != null ? budgetItem.getContractedAmount() : budgetItem.getPlannedAmount(),
        null
);
```

- [ ] **Step 2: Validar edicao de item de rubrica**

Em `BudgetItemServiceImpl.updateBudgetItemById`, antes de `save`, chamar a mesma validacao usando `budgetItem.getId()` como ignored id.

- [ ] **Step 3: Validar assignBeneficiary para empresa**

Em `BudgetItemBeneficiaryServiceImpl.assignBeneficiary`, quando `beneficiaryType = company`, validar status/saldo antes de salvar:

```java
projectCompanyFinancialValidationService.validateCanLinkToBudgetItem(
        projectId,
        referenceId,
        contractedAmount,
        budgetItemId
);
```

- [ ] **Step 4: Build**

Run:

```powershell
cd api_gopro
.\mvnw.cmd -DskipTests compile
```

Expected:

```text
BUILD SUCCESS
```

- [ ] **Step 5: Commit**

```powershell
git add api_gopro/src/main/java/br/com/gopro/api/service/BudgetItemServiceImpl.java api_gopro/src/main/java/br/com/gopro/api/service/BudgetItemBeneficiaryServiceImpl.java
git commit -m "feat(budget): validate company status and balance"
```

---

## Task 7: Aplicar validacao em pagamentos

**Files:**
- Modify: `api_gopro/src/main/java/br/com/gopro/api/service/ExpenseServiceImpl.java`

- [ ] **Step 1: Validar criacao de pagamento para empresa**

Em `createExpense`, depois de `applyReferencesOnCreate` e antes de `save`, chamar:

```java
projectCompanyFinancialValidationService.validateCanReceivePayment(
        expense.getProject().getId(),
        expense.getProjectCompany() != null ? expense.getProjectCompany().getId() : null,
        expense.getAmount(),
        null
);
```

- [ ] **Step 2: Validar edicao de pagamento para empresa**

Em `updateExpenseById`, depois de `applyReferencesOnUpdate` e antes de `save`, chamar:

```java
projectCompanyFinancialValidationService.validateCanReceivePayment(
        expense.getProject().getId(),
        expense.getProjectCompany() != null ? expense.getProjectCompany().getId() : null,
        expense.getAmount(),
        expense.getId()
);
```

- [ ] **Step 3: Build**

Run:

```powershell
cd api_gopro
.\mvnw.cmd -DskipTests compile
```

Expected:

```text
BUILD SUCCESS
```

- [ ] **Step 4: Commit**

```powershell
git add api_gopro/src/main/java/br/com/gopro/api/service/ExpenseServiceImpl.java
git commit -m "feat(expenses): block company payments over balance"
```

---

## Task 8: Testes backend

**Files:**
- Create or modify: `api_gopro/src/test/java/br/com/gopro/api/service/ProjectCompanyFinancialValidationServiceImplTest.java`
- Modify existing tests for `ExpenseServiceImpl` and `BudgetItemServiceImpl` if they exist.

- [ ] **Step 1: Testar status invalido no DTO**

Run com payload manual:

```json
{
  "projectId": 1,
  "companyId": 1,
  "status": "STATUS_QUE_NAO_EXISTE"
}
```

Expected HTTP:

```text
400 Bad Request
```

- [ ] **Step 2: Testar empresa cancelada**

Criar `ProjectCompany` com `status = CANCELADA` e chamar validacao:

```java
assertThrows(BusinessException.class, () ->
        service.validateCanReceivePayment(projectId, projectCompanyId, BigDecimal.TEN, null)
);
```

- [ ] **Step 3: Testar empresa inativa**

Criar `ProjectCompany` com `isActive = false` e chamar validacao:

```java
assertThrows(BusinessException.class, () ->
        service.validateCanLinkToBudgetItem(projectId, projectCompanyId, BigDecimal.TEN, null)
);
```

- [ ] **Step 4: Testar saldo excedido**

Mockar:

```java
projectCompany.totalValue = BigDecimal.valueOf(100);
budgetItemsSomados = BigDecimal.valueOf(80);
expensesSomados = BigDecimal.TEN;
requestedAmount = BigDecimal.valueOf(20);
```

Expected:

```java
assertThrows(BusinessException.class, () ->
        service.validateCanReceivePayment(projectId, projectCompanyId, BigDecimal.valueOf(20), null)
);
```

- [ ] **Step 5: Testar saldo suficiente**

Mockar:

```java
projectCompany.totalValue = BigDecimal.valueOf(100);
budgetItemsSomados = BigDecimal.valueOf(60);
expensesSomados = BigDecimal.TEN;
requestedAmount = BigDecimal.valueOf(20);
```

Expected: nao lancar excecao.

- [ ] **Step 6: Rodar testes**

Run:

```powershell
cd api_gopro
.\mvnw.cmd test
```

Expected:

```text
BUILD SUCCESS
```

- [ ] **Step 7: Commit**

```powershell
git add api_gopro/src/test/java/br/com/gopro/api/service
git commit -m "test(finance): cover project company validations"
```

---

## Task 9: Documentacao e evidencia

**Files:**
- Modify: `projet-gopro2/docs/Recursos/ESTRUTURA_CONTRATO_ID.md`

- [ ] **Step 1: Documentar contrato**

Adicionar nota:

```markdown
### Empresa contratada em rubricas e pagamentos

`projectCompanyId` e o campo oficial para representar empresa contratada vinculada ao projeto.
`organizationId` em pagamentos permanece legado e nao deve ser usado para novos fluxos de empresa contratada.

Status validos de `ProjectCompany`:

- `EM_CADASTRO`
- `EM_CONTRATACAO`
- `CONTRATADA`
- `EM_EXECUCAO`
- `CONCLUIDA`
- `CANCELADA`

Novos vinculos financeiros sao permitidos apenas para `CONTRATADA` e `EM_EXECUCAO`, desde que a empresa esteja ativa e tenha saldo disponivel.
```

- [ ] **Step 2: Registrar evidencia manual**

Registrar no PR:

```markdown
Validacoes executadas:

- Migration Flyway aplicada localmente.
- `expenses.project_company_id` aceita `null`.
- FK bloqueia `project_company_id` inexistente.
- Backend compila.
- Status invalido retorna 400.
- Empresa `CANCELADA` bloqueia novo pagamento/rubrica.
- Empresa inativa bloqueia novo pagamento/rubrica.
- Saldo excedido retorna erro claro.

Legado:

- `expenses.organization_id` nao foi removido.
- Nao houve backfill automatico para `project_company_id`, porque nao existe regra confiavel para converter organizacao em empresa contratada.
```

- [ ] **Step 3: Commit**

```powershell
git add projet-gopro2/docs/Recursos/ESTRUTURA_CONTRATO_ID.md projet-gopro2/docs/superpowers/plans/2026-05-14-project-company-financial-link.md
git commit -m "docs(finance): document project company financial link"
```

---

## Ordem Recomendada de Execucao

1. Task 1: schema de `projectCompanyId`.
2. Task 2: status enum no banco.
3. Task 3: enum/DTO/model de `ProjectCompany`.
4. Task 4: DTO/entity/mapper de `Expense.projectCompanyId`.
5. Task 5: service central de validacao.
6. Task 6: aplicar validacao em rubricas.
7. Task 7: aplicar validacao em pagamentos.
8. Task 8: testes.
9. Task 9: documentacao.

---

## Validacao Final

Run:

```powershell
cd api_gopro
.\mvnw.cmd test
```

Expected:

```text
BUILD SUCCESS
```

Run:

```powershell
cd api_gopro
.\mvnw.cmd -DskipTests spring-boot:run
```

Expected:

```text
Started ApiDaGoproApplication
```

Se frontend for tocado apenas em documentacao, nao ha necessidade de build frontend nesta etapa. Se algum type TypeScript for ajustado depois, rodar:

```powershell
cd projet-gopro2
npm run lint
npm run build
```

