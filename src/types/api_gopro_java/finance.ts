/**
 * Tipos relacionados a Finanças
 * - Categorias de Orçamento
 * - Itens de Orçamento
 * - Cronograma de Desembolso/Entradas Previstas do Projeto
 * - parcelas de Pagamentos Efetivos do Projeto (Incomes)
 * - Despesas efetivamente pagas(Expenses)
 * - Remanejamentos de valores entre itens orçamentários do mesmo projeto (Budget Transfers)
 */

import type { AuditFields, IdRef } from './common';

// =============================================================================
// ENUMS
// =============================================================================

/** Status do cronograma de desembolso (smallint no banco) */
export type DisbursementStatus = 0 | 1 | 2 | 3;
// 0 = PREVISTO, 1 = PARCIAL, 2 = RECEBIDO, 3 = CANCELADO

/** Status do remanejamento (smallint no banco) */
export type TransferStatus = 0 | 1 | 2;
// 0 = PENDENTE, 1 = APROVADO, 2 = REJEITADO

// =============================================================================
// CATEGORIAS DE ORÇAMENTO
// =============================================================================

export interface BudgetCategory extends AuditFields {
  id: number;
  code?: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface CreateBudgetCategory {
  code?: string;
  name: string;
  description?: string;
  active?: boolean;
}

export interface UpdateBudgetCategory extends Partial<CreateBudgetCategory> {}

// =============================================================================
// ITENS DE ORÇAMENTO
// =============================================================================

export interface BudgetItem extends AuditFields {
  id: number;
  projectId: number;
  categoryId: number;
  // Objeto expandido
  category?: BudgetCategory;
  description: string;
  quantity?: number;
  months?: number;
  unitCost?: number;
  plannedAmount: number;
  executedAmount: number;
  goalId?: number;
  notes?: string;
}

export interface CreateBudgetItem {
  project: IdRef;
  category: IdRef;
  description: string;
  quantity?: number;
  months?: number;
  unitCost?: number;
  plannedAmount: number;
  goalId?: number;
  notes?: string;
}

export interface UpdateBudgetItem extends Partial<Omit<CreateBudgetItem, 'project'>> {
  executedAmount?: number;
}

// =============================================================================
// CRONOGRAMA DE DESEMBOLSO
// =============================================================================

export interface DisbursementSchedule extends AuditFields {
  id: number;
  projectId: number;
  numero: number;
  expectedMonth: string;
  expectedAmount: number;
  status: DisbursementStatus;
  notes?: string;
}

export interface CreateDisbursementSchedule {
  project: IdRef;
  numero: number;
  expectedMonth: string;
  expectedAmount: number;
  status: DisbursementStatus;
  notes?: string;
}

export interface UpdateDisbursementSchedule extends Partial<Omit<CreateDisbursementSchedule, 'project'>> {}

// =============================================================================
// RECEITAS (INCOMES) - Parcelas de Pagamentos Efetivas do Projeto
// =============================================================================

export interface Income extends AuditFields {
  id: number;
  projectId: number;
  numero: number;
  scheduleId?: number;
  schedule?: DisbursementSchedule;
  amount: number;
  receivedAt: string;
  source?: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface CreateIncome {
  project: IdRef;
  numero: number;
  schedule?: IdRef;
  amount: number;
  receivedAt: string;
  source?: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface UpdateIncome extends Partial<Omit<CreateIncome, 'project'>> {}

// =============================================================================
// DESPESAS (EXPENSES)
// =============================================================================

export interface Expense extends AuditFields {
  id: number;
  projectId: number;
  budgetItemId: number;
  categoryId: number;
  incomeId: number;
  expenseDate: string;
  quantity: number;
  amount: number;
  personId?: number;
  organizationId?: number;
  description?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  documentId?: number;
}

export interface CreateExpense {
  project: IdRef;
  budgetItem: IdRef;
  category: IdRef;
  income: IdRef;
  expenseDate: string;
  quantity: number;
  amount: number;
  personId?: number;
  organizationId?: number;
  description?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  documentId?: number;
}

export interface UpdateExpense extends Partial<Omit<CreateExpense, 'project'>> {}

// =============================================================================
// REMANEJAMENTOS (BUDGET TRANSFERS)
// =============================================================================

export interface BudgetTransfer extends AuditFields {
  id: number;
  projectId: number;
  fromItemId: number;
  toItemId: number;
  amount: number;
  transferDate: string;
  status: TransferStatus;
  reason?: string;
  documentId?: number;
  approvedAt?: string;
  approvedBy?: number;
}

export interface CreateBudgetTransfer {
  project: IdRef;
  fromItem: IdRef;
  toItem: IdRef;
  amount: number;
  transferDate: string;
  reason?: string;
  documentId?: number;
}

export interface UpdateBudgetTransfer {
  status?: TransferStatus;
  reason?: string;
  documentId?: number;
}

export interface ApproveBudgetTransfer {
  status: 1 | 2;  // 1 = APROVADO, 2 = REJEITADO
}
