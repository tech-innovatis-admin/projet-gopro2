import type {
  AuditLogResponseDTO,
  BudgetCategoryResponseDTO,
  BudgetItemResponseDTO,
} from "../api/types";
import type { AuditChange } from "./presentation";

export type BudgetItemReferencePresentation = {
  id: number;
  label: string;
  description: string;
  categoryId: number | null;
  categoryLabel: string | null;
  plannedAmount: number | null;
  transferLabel: string;
};

export type BudgetTransferReference = {
  fromItemId: number | null;
  toItemId: number | null;
  amount: number | null;
};

export type BudgetTransferBusinessSummary = {
  sourceLabel: string;
  destinationLabel: string;
  sourceInitialTotal: string;
  destinationInitialTotal: string;
  transferredAmount: string;
  sourceFinalTotal: string;
  destinationFinalTotal: string;
};

type BudgetReferenceCatalog = {
  categoryLabelsById?: Record<number, string>;
  itemLabelsById?: Record<number, string>;
  itemPresentationsById?: Record<number, BudgetItemReferencePresentation>;
};

type BudgetReferenceIds = {
  categoryIds: Set<number>;
  itemIds: Set<number>;
};

type BudgetResourceKind = "budget-categories" | "budget-items" | "budget-transfers" | null;
type RecordValue = Record<string, unknown>;
const FROM_ITEM_KEYS = ["fromItemId", "fromItem", "itemOrigemId"] as const;
const TO_ITEM_KEYS = ["toItemId", "toItem", "itemDestinoId"] as const;
const AMOUNT_KEYS = ["amount", "valor", "transferAmount", "valorRemanejado"] as const;

function normalizeToken(value: string | null | undefined): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function parseNumericId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const direct = Number(trimmed);
  if (Number.isFinite(direct)) {
    return direct;
  }

  const sanitized = trimmed.replace(/[^\d,.-]/g, "");
  if (!sanitized) {
    return null;
  }

  const lastComma = sanitized.lastIndexOf(",");
  const lastDot = sanitized.lastIndexOf(".");
  let normalized = sanitized;

  if (lastComma > lastDot) {
    normalized = sanitized.replace(/\./g, "").replace(",", ".");
  } else if (lastComma >= 0 && lastDot < 0) {
    normalized = sanitized.replace(",", ".");
  } else if (lastComma >= 0) {
    normalized = sanitized.replace(/,/g, "");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseJsonValue<T>(value: string | null | undefined): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function parseBeforeAfter(value: string | null | undefined): RecordValue | null {
  return asRecord(parseJsonValue<Record<string, unknown>>(value));
}

function parseTechnical(value: string | null | undefined): RecordValue | null {
  return asRecord(parseJsonValue<Record<string, unknown>>(value));
}

function parseChanges(value: string | null | undefined): AuditChange[] {
  const parsed = parseJsonValue<AuditChange[]>(value);
  return Array.isArray(parsed) ? parsed : [];
}

function asRecord(value: unknown): RecordValue | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as RecordValue;
}

function getTrimmedString(source: RecordValue | null, keys: readonly string[]): string | null {
  if (!source) {
    return null;
  }

  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function getNumericValue(source: RecordValue | null, keys: readonly string[]): number | null {
  if (!source) {
    return null;
  }

  for (const key of keys) {
    const parsed = parseNumber(source[key]);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

function getReferenceId(
  source: RecordValue | null,
  keys: readonly string[],
  contractId: number | null
): number | null {
  if (!source) {
    return null;
  }

  for (const key of keys) {
    const parsed = parseNumericId(source[key]);
    if (parsed !== null && parsed !== contractId) {
      return parsed;
    }
  }

  return null;
}

function getNonContractEntityId(log: Pick<AuditLogResponseDTO, "entityId" | "contractId">): number | null {
  const entityId = parseNumericId(log.entityId);
  if (entityId === null) {
    return null;
  }

  return entityId === (log.contractId ?? null) ? null : entityId;
}

function formatCurrencyBRL(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Não informado";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
    .format(value)
    .replace(/\u00a0/g, " ");
}

function getReferenceCandidates(change: AuditChange): string[] {
  return [
    typeof change.caminho === "string" ? change.caminho : "",
    typeof change.label === "string" ? change.label : "",
  ]
    .map((value) => normalizeToken(value))
    .filter((value) => value.length > 0);
}

function isBudgetCategoryReference(change: AuditChange): boolean {
  return getReferenceCandidates(change).some(
    (candidate) =>
      candidate === "rubrica" ||
      candidate === "rubricas" ||
      candidate.includes("budgetcategory")
  );
}

function isBudgetItemReference(change: AuditChange): boolean {
  return getReferenceCandidates(change).some(
    (candidate) =>
      candidate === "itemderubrica" ||
      candidate.includes("budgetitem") ||
      candidate === "itemdeorigem" ||
      candidate === "itemdedestino" ||
      candidate === "fromitem" ||
      candidate === "toitem"
  );
}

function applyReferenceLabel(
  change: AuditChange,
  side: "before" | "after",
  labelsById: Record<number, string> | undefined
): unknown {
  const rawValue = side === "before" ? change.de : change.para;
  const id = parseNumericId(rawValue);
  if (!id || !labelsById?.[id]) {
    return side === "before" ? change.deLabel : change.paraLabel;
  }
  return labelsById[id];
}

function resolveBudgetResourceKind(
  log: Pick<
    AuditLogResponseDTO,
    "entityType" | "subsecao" | "feature" | "resumo" | "descricao"
  >,
  technical: RecordValue | null
): BudgetResourceKind {
  const candidates = [
    typeof technical?.resource === "string" ? technical.resource : "",
    log.entityType,
    log.subsecao,
    log.feature,
    log.resumo,
    log.descricao,
  ]
    .map((value) => normalizeToken(value))
    .filter((value) => value.length > 0);

  if (candidates.some((candidate) => candidate.includes("budgettransfer") || candidate.includes("remanej"))) {
    return "budget-transfers";
  }

  if (
    candidates.some(
      (candidate) => candidate.includes("budgetitem") || candidate.includes("itemderubrica")
    )
  ) {
    return "budget-items";
  }

  if (candidates.some((candidate) => candidate.includes("budgetcategor") || candidate.includes("rubrica"))) {
    return "budget-categories";
  }

  return null;
}

function getChangeCandidates(change: AuditChange): string[] {
  return [
    typeof change.caminho === "string" ? change.caminho : "",
    typeof change.label === "string" ? change.label : "",
  ]
    .map((value) => normalizeToken(value))
    .filter((value) => value.length > 0);
}

function getNumericValueFromChanges(changes: AuditChange[], tokens: readonly string[]): number | null {
  for (const change of changes) {
    const matched = getChangeCandidates(change).some((candidate) =>
      tokens.some((token) => candidate.includes(token))
    );
    if (!matched) {
      continue;
    }

    const parsed = parseNumericId(change.para) ?? parseNumericId(change.de);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

function getDecimalValueFromChanges(changes: AuditChange[], tokens: readonly string[]): number | null {
  for (const change of changes) {
    const matched = getChangeCandidates(change).some((candidate) =>
      tokens.some((token) => candidate.includes(token))
    );
    if (!matched) {
      continue;
    }

    const parsed = parseNumber(change.para) ?? parseNumber(change.de);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

function buildBudgetItemTransferLabel(description: string, categoryLabel: string | null): string {
  return categoryLabel ? `${categoryLabel} \u2022 ${description}` : description;
}

function calculateTransferFinalAmount(
  initialAmount: number | null,
  amount: number | null,
  direction: "source" | "destination"
): number | null {
  if (initialAmount === null || amount === null) {
    return null;
  }

  const factor = direction === "source" ? -1 : 1;
  return Number((initialAmount + amount * factor).toFixed(2));
}

function resolveBudgetItemPresentation(
  itemId: number | null,
  catalog: BudgetReferenceCatalog
): BudgetItemReferencePresentation | null {
  if (itemId === null) {
    return null;
  }

  const detailed = catalog.itemPresentationsById?.[itemId];
  if (detailed) {
    return detailed;
  }

  const label = catalog.itemLabelsById?.[itemId];
  if (!label) {
    return null;
  }

  return {
    id: itemId,
    label,
    description: label,
    categoryId: null,
    categoryLabel: null,
    plannedAmount: null,
    transferLabel: label,
  };
}

function buildBudgetCategoryLabelFromSnapshot(snapshot: RecordValue | null): string | null {
  const name = getTrimmedString(snapshot, ["name"]);
  if (!name) {
    return null;
  }

  const code = getTrimmedString(snapshot, ["code"]);
  return code ? `${code} - ${name}` : name;
}

function buildBudgetItemLabelFromSnapshot(snapshot: RecordValue | null): string | null {
  const description = getTrimmedString(snapshot, ["description", "name"]);
  if (!description) {
    return null;
  }

  const plannedAmount = getNumericValue(snapshot, ["plannedAmount", "planned_amount", "amount"]);
  if (plannedAmount === null) {
    return description;
  }

  return `${description} \u2022 Valor total: ${formatCurrencyBRL(plannedAmount)}`;
}

function getBudgetCategoryId(
  log: Pick<AuditLogResponseDTO, "entityId" | "contractId">,
  before: RecordValue | null,
  after: RecordValue | null,
  changes: AuditChange[]
): number | null {
  return (
    getReferenceId(after, ["id", "categoryId"], log.contractId ?? null) ??
    getReferenceId(before, ["id", "categoryId"], log.contractId ?? null) ??
    getNonContractEntityId(log) ??
    getNumericValueFromChanges(changes, ["budgetcategory", "rubrica", "categoryid"])
  );
}

function getBudgetItemId(
  log: Pick<AuditLogResponseDTO, "entityId" | "contractId">,
  before: RecordValue | null,
  after: RecordValue | null,
  changes: AuditChange[]
): number | null {
  return (
    getReferenceId(after, ["id", "budgetItemId", "itemId"], log.contractId ?? null) ??
    getReferenceId(before, ["id", "budgetItemId", "itemId"], log.contractId ?? null) ??
    getNonContractEntityId(log) ??
    getNumericValueFromChanges(changes, ["budgetitem", "itemderubrica", "itemid"])
  );
}

function resolveBudgetCategoryEntityLabel(
  log: Pick<AuditLogResponseDTO, "entityId" | "contractId">,
  before: RecordValue | null,
  after: RecordValue | null,
  changes: AuditChange[],
  catalog: BudgetReferenceCatalog
): string | null {
  const categoryId = getBudgetCategoryId(log, before, after, changes);
  if (categoryId !== null && catalog.categoryLabelsById?.[categoryId]) {
    return catalog.categoryLabelsById[categoryId];
  }

  return buildBudgetCategoryLabelFromSnapshot(after) ?? buildBudgetCategoryLabelFromSnapshot(before);
}

function resolveBudgetItemEntityLabel(
  log: Pick<AuditLogResponseDTO, "entityId" | "contractId">,
  before: RecordValue | null,
  after: RecordValue | null,
  changes: AuditChange[],
  catalog: BudgetReferenceCatalog
): string | null {
  const itemId = getBudgetItemId(log, before, after, changes);
  if (itemId !== null && catalog.itemLabelsById?.[itemId]) {
    return catalog.itemLabelsById[itemId];
  }

  return buildBudgetItemLabelFromSnapshot(after) ?? buildBudgetItemLabelFromSnapshot(before);
}

function resolveTransferEntityLabel(
  log: Pick<AuditLogResponseDTO, "contractId">,
  before: RecordValue | null,
  after: RecordValue | null,
  technical: RecordValue | null,
  changes: AuditChange[],
  catalog: BudgetReferenceCatalog
): string | null {
  const contractId = log.contractId ?? null;
  const fromItemId =
    getReferenceId(after, FROM_ITEM_KEYS, contractId) ??
    getReferenceId(before, FROM_ITEM_KEYS, contractId) ??
    getReferenceId(technical, FROM_ITEM_KEYS, contractId) ??
    getNumericValueFromChanges(changes, ["fromitemid", "fromitem", "itemorigemid", "origem"]);

  const toItemId =
    getReferenceId(after, TO_ITEM_KEYS, contractId) ??
    getReferenceId(before, TO_ITEM_KEYS, contractId) ??
    getReferenceId(technical, TO_ITEM_KEYS, contractId) ??
    getNumericValueFromChanges(changes, ["toitemid", "toitem", "itemdestinoid", "destino"]);

  const fromLabel =
    resolveBudgetItemPresentation(fromItemId, catalog)?.label ||
    (fromItemId !== null ? `Item #${fromItemId}` : null);
  const toLabel =
    resolveBudgetItemPresentation(toItemId, catalog)?.label ||
    (toItemId !== null ? `Item #${toItemId}` : null);

  if (fromLabel && toLabel) {
    return `Origem: ${fromLabel} | Destino: ${toLabel}`;
  }
  if (fromLabel) {
    return `Origem: ${fromLabel}`;
  }
  if (toLabel) {
    return `Destino: ${toLabel}`;
  }

  return null;
}

export function buildBudgetCategoryReferenceLabel(
  category: Pick<BudgetCategoryResponseDTO, "id" | "code" | "name">
): string {
  const name = category.name?.trim() || `Rubrica #${category.id}`;
  const code = category.code?.trim();
  return code ? `${code} - ${name}` : name;
}

export function buildBudgetItemReferencePresentation(
  item: Pick<BudgetItemResponseDTO, "id" | "categoryId" | "description" | "plannedAmount">,
  categoryLabel: string | null = null
): BudgetItemReferencePresentation {
  const description = item.description?.trim() || `Item #${item.id}`;

  return {
    id: item.id,
    label: `${description} \u2022 Valor total: ${formatCurrencyBRL(item.plannedAmount)}`,
    description,
    categoryId: item.categoryId ?? null,
    categoryLabel,
    plannedAmount: typeof item.plannedAmount === "number" ? item.plannedAmount : null,
    transferLabel: buildBudgetItemTransferLabel(description, categoryLabel),
  };
}

export function buildBudgetItemReferenceLabel(
  item: Pick<BudgetItemResponseDTO, "id" | "description" | "plannedAmount">
): string {
  return buildBudgetItemReferencePresentation(item).label;
}

export function collectBudgetReferenceIdsFromChanges(changes: AuditChange[]): BudgetReferenceIds {
  const ids: BudgetReferenceIds = {
    categoryIds: new Set<number>(),
    itemIds: new Set<number>(),
  };

  for (const change of changes) {
    const target = isBudgetCategoryReference(change)
      ? ids.categoryIds
      : isBudgetItemReference(change)
        ? ids.itemIds
        : null;

    if (!target) {
      continue;
    }

    const beforeId = parseNumericId(change.de);
    const afterId = parseNumericId(change.para);

    if (beforeId) {
      target.add(beforeId);
    }
    if (afterId) {
      target.add(afterId);
    }
  }

  return ids;
}

export function enhanceBudgetReferenceChanges(
  changes: AuditChange[],
  catalog: BudgetReferenceCatalog
): AuditChange[] {
  return changes.map((change) => {
    if (isBudgetCategoryReference(change)) {
      return {
        ...change,
        deLabel: applyReferenceLabel(change, "before", catalog.categoryLabelsById),
        paraLabel: applyReferenceLabel(change, "after", catalog.categoryLabelsById),
      };
    }

    if (isBudgetItemReference(change)) {
      return {
        ...change,
        deLabel: applyReferenceLabel(change, "before", catalog.itemLabelsById),
        paraLabel: applyReferenceLabel(change, "after", catalog.itemLabelsById),
      };
    }

    return change;
  });
}

export function resolveBudgetTransferReference(
  log: Pick<
    AuditLogResponseDTO,
    | "beforeJson"
    | "afterJson"
    | "detalhesTecnicosJson"
    | "alteracoesJson"
    | "entityType"
    | "subsecao"
    | "feature"
    | "resumo"
    | "descricao"
  >
): BudgetTransferReference | null {
  const before = asRecord(parseBeforeAfter(log.beforeJson));
  const after = asRecord(parseBeforeAfter(log.afterJson));
  const technical = asRecord(parseTechnical(log.detalhesTecnicosJson));
  const changes = parseChanges(log.alteracoesJson);

  if (resolveBudgetResourceKind(log, technical) !== "budget-transfers") {
    return null;
  }

  const fromItemId =
    getReferenceId(after, FROM_ITEM_KEYS, null) ??
    getReferenceId(before, FROM_ITEM_KEYS, null) ??
    getReferenceId(technical, FROM_ITEM_KEYS, null) ??
    getNumericValueFromChanges(changes, ["fromitemid", "fromitem", "itemorigemid", "origem"]);

  const toItemId =
    getReferenceId(after, TO_ITEM_KEYS, null) ??
    getReferenceId(before, TO_ITEM_KEYS, null) ??
    getReferenceId(technical, TO_ITEM_KEYS, null) ??
    getNumericValueFromChanges(changes, ["toitemid", "toitem", "itemdestinoid", "destino"]);

  const amount =
    getNumericValue(after, AMOUNT_KEYS) ??
    getNumericValue(before, AMOUNT_KEYS) ??
    getNumericValue(technical, AMOUNT_KEYS) ??
    getDecimalValueFromChanges(changes, ["amount", "valor", "transferamount", "valorremanejado"]);

  if (fromItemId === null && toItemId === null && amount === null) {
    return null;
  }

  return { fromItemId, toItemId, amount };
}

export function buildBudgetTransferBusinessSummary(
  log: Pick<
    AuditLogResponseDTO,
    | "beforeJson"
    | "afterJson"
    | "detalhesTecnicosJson"
    | "alteracoesJson"
    | "entityType"
    | "subsecao"
    | "feature"
    | "resumo"
    | "descricao"
  >,
  catalog: BudgetReferenceCatalog
): BudgetTransferBusinessSummary | null {
  const transfer = resolveBudgetTransferReference(log);
  if (!transfer) {
    return null;
  }

  const sourceItem = resolveBudgetItemPresentation(transfer.fromItemId, catalog);
  const destinationItem = resolveBudgetItemPresentation(transfer.toItemId, catalog);
  const sourceInitialAmount = sourceItem?.plannedAmount ?? null;
  const destinationInitialAmount = destinationItem?.plannedAmount ?? null;

  return {
    sourceLabel:
      sourceItem?.transferLabel ||
      (transfer.fromItemId !== null ? `Item #${transfer.fromItemId}` : "NÃ£o informado"),
    destinationLabel:
      destinationItem?.transferLabel ||
      (transfer.toItemId !== null ? `Item #${transfer.toItemId}` : "NÃ£o informado"),
    sourceInitialTotal: formatCurrencyBRL(sourceInitialAmount),
    destinationInitialTotal: formatCurrencyBRL(destinationInitialAmount),
    transferredAmount: formatCurrencyBRL(transfer.amount),
    sourceFinalTotal: formatCurrencyBRL(
      calculateTransferFinalAmount(sourceInitialAmount, transfer.amount, "source")
    ),
    destinationFinalTotal: formatCurrencyBRL(
      calculateTransferFinalAmount(destinationInitialAmount, transfer.amount, "destination")
    ),
  };
}

export function resolveBudgetReferenceEntityLabel(
  log: Pick<
    AuditLogResponseDTO,
    | "entityId"
    | "entityType"
    | "contractId"
    | "beforeJson"
    | "afterJson"
    | "detalhesTecnicosJson"
    | "alteracoesJson"
    | "subsecao"
    | "feature"
    | "resumo"
    | "descricao"
  >,
  catalog: BudgetReferenceCatalog
): string | null {
  const before = asRecord(parseBeforeAfter(log.beforeJson));
  const after = asRecord(parseBeforeAfter(log.afterJson));
  const technical = asRecord(parseTechnical(log.detalhesTecnicosJson));
  const changes = parseChanges(log.alteracoesJson);

  switch (resolveBudgetResourceKind(log, technical)) {
    case "budget-categories":
      return resolveBudgetCategoryEntityLabel(log, before, after, changes, catalog);
    case "budget-items":
      return resolveBudgetItemEntityLabel(log, before, after, changes, catalog);
    case "budget-transfers":
      return resolveTransferEntityLabel(log, before, after, technical, changes, catalog);
    default:
      return null;
  }
}
