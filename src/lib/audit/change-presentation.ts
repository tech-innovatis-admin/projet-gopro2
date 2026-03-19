import type { AuditChange, AuditOperationKind } from "@/src/lib/audit/presentation";

export type AuditChangeKind = "added" | "removed" | "changed" | "recorded";
export type AuditChangeTone = "emerald" | "rose" | "amber" | "zinc";

export type PresentedAuditChangeSection = {
  key: "before" | "after" | "single";
  title: string;
  text: string;
  technicalText: string | null;
};

export type PresentedAuditChange = {
  label: string;
  kind: AuditChangeKind;
  kindLabel: string;
  tone: AuditChangeTone;
  beforeText: string;
  afterText: string;
  technicalBeforeText: string | null;
  technicalAfterText: string | null;
  technicalText: string | null;
  sections: PresentedAuditChangeSection[];
  showComparisonArrow: boolean;
  priority: number;
  originalIndex: number;
  change: AuditChange;
};

export type BusinessAuditFieldDiff = {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
  originalIndex: number;
  change: AuditChange;
};

type BuildAuditChangesViewOptions = {
  expanded?: boolean;
  limit?: number;
  operationKind?: AuditOperationKind;
};

type PresentationOptions = {
  operationKind?: AuditOperationKind;
};

type ResolvedDisplayValue = {
  text: string | null;
  technicalText: string | null;
};

const EMPTY_BUSINESS_VALUE = "Não informado";

const EMPTY_LINK_VALUE = "Sem v\u00EDnculo";
const EMPTY_GOAL_LINK_VALUE = "Sem v\u00EDnculo com metas";
const EMPTY_FINANCIAL_VALUE = "Sem valor financeiro";
const EMPTY_NOTES_VALUE = "Sem observa\u00E7\u00F5es";

const CURRENCY_FIELD_TOKENS = [
  "amount",
  "budget",
  "cost",
  "custo",
  "montante",
  "preco",
  "price",
  "saldo",
  "total",
  "unitcost",
  "unitprice",
  "valor",
];

const DATE_FIELD_TOKENS = [
  "competencia",
  "conclusao",
  "createdat",
  "data",
  "date",
  "deadline",
  "inicio",
  "termino",
  "updatedat",
  "vencimento",
];

const DATE_TIME_FIELD_TOKENS = [
  "createdat",
  "datahora",
  "datetime",
  "timestamp",
  "updatedat",
];

const NUMERIC_FIELD_TOKENS = [
  ...CURRENCY_FIELD_TOKENS,
  "number",
  "numero",
  "percent",
  "porcent",
  "quantity",
  "quantidade",
];

const HIGH_PRIORITY_TOKENS = [
  "status",
  "parceiro",
  "cliente",
  "coordenador",
  "empresa",
  "pessoa",
  "organizacao",
  "arquivo",
  "documento",
  "rubrica",
  "meta",
  "etapa",
  "fase",
  "receita",
  "despesa",
  "contrato",
  "projeto",
  "tipo",
  "unidade",
  "valor",
  "quantidade",
  "data",
];

const LOW_PRIORITY_TOKENS = [
  "descricao",
  "observa",
  "motivo",
  "categoria",
  "fonte",
  "nota",
  "email",
  "telefone",
];

const TECHNICAL_TOKENS = [
  "uuid",
  "sha",
  "bucket",
  "s3",
  "ip",
  "useragent",
  "correlacao",
  "metodoh",
  "path",
  "entity",
  "legacy",
];

const SNAPSHOT_METADATA_TOKENS = [
  "id",
  "createdat",
  "updatedat",
  "createdby",
  "updatedby",
  "auditid",
  "correlacaoid",
];

const CHANGE_LABEL_OVERRIDES: Record<string, string> = {
  amount: "Valor",
  budgetcategory: "Rubrica",
  budgetcategoryid: "Rubrica",
  budgetitem: "Item de rubrica",
  budgetitemid: "Item de rubrica",
  budgettransferid: "Remanejamento",
  category: "Rubrica",
  categoryid: "Rubrica",
  city: "Cidade",
  company: "Empresa vinculada",
  companyid: "Empresa vinculada",
  contractvalue: "Valor do contrato",
  coordinator: "Coordenador",
  coordinatorid: "Coordenador",
  cordinator: "Coordenador",
  cordinatorid: "Coordenador",
  disbursementdate: "Data do desembolso",
  documentid: "Documento",
  documentname: "Nome do arquivo",
  expense: "Despesa",
  expensedate: "Data da despesa",
  expenseid: "Despesa",
  file: "Arquivo",
  filename: "Nome do arquivo",
  nomedoarquivo: "Nome do arquivo",
  financialamount: "Valor financeiro da meta",
  goalid: "Meta",
  hasfinancialvalue: "Meta com valor financeiro",
  income: "Receita",
  incomedate: "Data da receita",
  incomeid: "Receita",
  organization: "Empresa vinculada",
  organizationid: "Empresa vinculada",
  ownerid: "Registro relacionado",
  ownertype: "Tipo de vínculo",
  person: "Pessoa vinculada",
  personid: "Pessoa vinculada",
  phaseid: "Fase",
  plannedamount: "Valor planejado",
  plannedvalue: "Valor planejado",
  primaryclient: "Cliente primário",
  primaryclientid: "Cliente primário",
  primarypartner: "Parceiro primário",
  primarypartnerid: "Parceiro primário",
  projectgovif: "Unidade GOV/IF",
  projectstatus: "Status do projeto",
  projecttype: "Tipo do projeto",
  nomedarubrica: "Nome da rúbrica",
  quantity: "Quantidade",
  secondaryclient: "Cliente secundário",
  secondaryclientid: "Cliente secundário",
  secondarypartner: "Parceiro secundário",
  secondarypartnerid: "Parceiro secundário",
  stageid: "Etapa",
  state: "Estado",
  status: "Status",
  type: "Tipo",
  unitcost: "Custo unitário",
  unitprice: "Preço unitário",
  valorplanejado: "Valor planejado",
  valorunitario: "Custo unitário",
  areasegmento: "Área/segmento",
  codigodoprojeto: "Código do projeto",
  clientesecundario: "Cliente secundário",
  clienteprimario: "Cliente primário",
  datadeconclusao: "Data de conclusão",
  datadeinicio: "Data de início",
  datadetermino: "Data de término",
  descricao: "Descrição",
  descricaodadespesa: "Descrição da despesa",
  descricaodaetapa: "Descrição da etapa",
  descricaodafase: "Descrição da fase",
  descricaodameta: "Descrição da meta",
  descricaodarubrica: "Descrição da rubrica",
  descricaodoitem: "Descrição do item",
  numero: "Número",
  numerodareceita: "Número da receita",
  numerodanota: "Número da nota",
  numerodaetapa: "Número da etapa",
  numerodafase: "Número da fase",
  numerodameta: "Número da meta",
  observacoes: "Observações",
  organizacao: "Organização",
  parceiroprimario: "Parceiro primário",
  parceirosecundario: "Parceiro secundário",
  titulodaetapa: "Título da etapa",
  titulodafase: "Título da fase",
  titulodameta: "Título da meta",
  tipodevinculo: "Tipo de vínculo",
  vinculoinstitucional: "Vínculo institucional",
  cargahoraria: "Carga horária",
  localdeexecucao: "Local de execução",
  metasvinculadas: "Metas vinculadas",
  observacoesemetasvinculadas: "Observa\u00E7\u00F5es e metas vinculadas",
};

function correctAuditLabelText(value: string): string {
  return value
    .replace(/\bCodigo\b/g, "Código")
    .replace(/\bcodigo\b/g, "código")
    .replace(/\bDescricao\b/g, "Descrição")
    .replace(/\bdescricao\b/g, "descrição")
    .replace(/\bNao\b/g, "Não")
    .replace(/\bnao\b/g, "não")
    .replace(/\bUltimo\b/g, "Último")
    .replace(/\bultimo\b/g, "último")
    .replace(/\bprimario\b/g, "primário")
    .replace(/\bsecundario\b/g, "secundário")
    .replace(/\binicio\b/g, "início")
    .replace(/\btermino\b/g, "término")
    .replace(/\bconclusao\b/g, "conclusão")
    .replace(/\bexecucao\b/g, "execução")
    .replace(/\bOrganizacao\b/g, "Organização")
    .replace(/\borganizacao\b/g, "organização")
    .replace(/\bvinculo\b/g, "vínculo")
    .replace(/\bObservacoes\b/g, "Observações")
    .replace(/\bobservacoes\b/g, "observações")
    .replace(/\bNumero\b/g, "Número")
    .replace(/\bnumero\b/g, "número")
    .replace(/\bTitulo\b/g, "Título")
    .replace(/\btitulo\b/g, "título")
    .replace(/\bArea\b/g, "Área")
    .replace(/\barea\b/g, "área")
    .replace(/\btecnico\b/g, "técnico")
    .replace(/\btecnicos\b/g, "técnicos")
    .replace(/\bhoraria\b/g, "horária");
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function stringify(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }
  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getExplicitFriendlyValue(change: AuditChange, side: "before" | "after"): unknown {
  return side === "before" ? change.deLabel : change.paraLabel;
}

function getTechnicalValue(change: AuditChange, side: "before" | "after"): unknown {
  return side === "before" ? change.de : change.para;
}

function stripArrayIndexes(value: string): string {
  return value.replace(/\[\d+\]/g, "");
}

function extractLastSegment(value: string): string {
  const segments = stripArrayIndexes(value)
    .split(/[./[\]]+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return value.trim();
  }
  return segments[segments.length - 1];
}

function getRawLabelCandidates(change: AuditChange): string[] {
  const rawCandidates = [change.label, change.caminho]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .flatMap((value) => [value.trim(), extractLastSegment(value.trim())]);

  return Array.from(
    new Set(
      rawCandidates
        .map((value) => normalizeText(value))
        .filter((value) => value.length > 0)
    )
  );
}

function pickRawLabelSource(change: AuditChange): string | null {
  const directLabel = typeof change.label === "string" ? change.label.trim() : "";
  if (directLabel) {
    return directLabel;
  }

  const path = typeof change.caminho === "string" ? change.caminho.trim() : "";
  if (path) {
    return extractLastSegment(path);
  }

  return null;
}

function sentenceCase(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function humanizeTechnicalLabel(value: string | null): string {
  if (!value) {
    return "Campo";
  }

  const cleaned = stripArrayIndexes(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "Campo";
  }

  const parts = cleaned.split(" ").filter((part) => part.length > 0);
  if (parts.length > 1 && /^id$/i.test(parts[parts.length - 1])) {
    parts.pop();
  }

  const result = parts.join(" ").trim();
  return result ? sentenceCase(result) : "Campo";
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function looksLikeIdentifier(value: string): boolean {
  return (
    /^\d+$/.test(value) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function isIdentifierField(change: AuditChange): boolean {
  const candidates = getRawLabelCandidates(change);
  return candidates.some((candidate) => candidate.endsWith("id"));
}

function isLinkField(change: AuditChange): boolean {
  const candidates = getRawLabelCandidates(change);
  return candidates.some((candidate) =>
    [
      "company",
      "companyid",
      "empresa",
      "empresavinculada",
      "organization",
      "organizationid",
      "organizacao",
      "organizacaovinculada",
      "person",
      "personid",
      "pessoa",
      "pessoavinculada",
    ].includes(candidate)
  );
}

function isGoalLinkField(change: AuditChange): boolean {
  const candidates = getRawLabelCandidates(change);
  return candidates.some((candidate) =>
    [
      "metasvinculadas",
      "goalid",
    ].includes(candidate)
  );
}

function isFinancialValueField(change: AuditChange): boolean {
  const candidates = getRawLabelCandidates(change);
  return candidates.includes("financialamount");
}

function isNotesField(change: AuditChange): boolean {
  const candidates = getRawLabelCandidates(change);
  return candidates.some((candidate) =>
    ["observacoes", "observacoesemetasvinculadas", "notes"].includes(candidate)
  );
}

function resolveEmptyFieldText(change: AuditChange, fallback: string): string {
  if (isLinkField(change)) {
    return EMPTY_LINK_VALUE;
  }
  if (isGoalLinkField(change)) {
    return EMPTY_GOAL_LINK_VALUE;
  }
  if (isFinancialValueField(change)) {
    return EMPTY_FINANCIAL_VALUE;
  }
  if (isNotesField(change)) {
    return EMPTY_NOTES_VALUE;
  }
  return fallback;
}

function businessTextAlreadyContainsId(businessText: string, technicalText: string): boolean {
  const pattern = new RegExp(`\\bID\\s*${escapeRegExp(technicalText)}\\b`, "i");
  return pattern.test(businessText);
}

function formatTextWithIdentifier(businessText: string, technicalText: string): string {
  if (businessTextAlreadyContainsId(businessText, technicalText)) {
    return businessText;
  }
  return `${businessText} (ID ${technicalText})`;
}

function resolveDisplayedValue(change: AuditChange, side: "before" | "after"): ResolvedDisplayValue {
  const friendlyText = stringify(getExplicitFriendlyValue(change, side));
  const technicalText = stringify(getTechnicalValue(change, side));
  const idField = isIdentifierField(change);

  if (friendlyText) {
    if (technicalText && technicalText !== friendlyText && idField && looksLikeIdentifier(technicalText)) {
      return {
        text: formatTextWithIdentifier(friendlyText, technicalText),
        technicalText: null,
      };
    }

    return {
      text: friendlyText,
      technicalText: technicalText && technicalText !== friendlyText ? technicalText : null,
    };
  }

  if (!technicalText) {
    return { text: null, technicalText: null };
  }

  if (idField && looksLikeIdentifier(technicalText)) {
    return { text: `ID ${technicalText}`, technicalText: null };
  }

  return { text: technicalText, technicalText: null };
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeBusinessComparison(value: string): string {
  return collapseWhitespace(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function parseNumericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const raw = value.trim();
  if (!raw) {
    return null;
  }

  const direct = Number(raw);
  if (Number.isFinite(direct)) {
    return direct;
  }

  const sanitized = raw.replace(/[^\d,.-]/g, "");
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

function shouldFormatAsCurrency(change: AuditChange): boolean {
  const candidates = getRawLabelCandidates(change);
  return candidates.some((candidate) =>
    CURRENCY_FIELD_TOKENS.some((token) => candidate.includes(token))
  );
}

function shouldFormatAsDate(change: AuditChange): boolean {
  const candidates = getRawLabelCandidates(change);
  return candidates.some((candidate) =>
    DATE_FIELD_TOKENS.some((token) => candidate.includes(token))
  );
}

function shouldFormatAsDateTime(change: AuditChange): boolean {
  const candidates = getRawLabelCandidates(change);
  return candidates.some((candidate) =>
    DATE_TIME_FIELD_TOKENS.some((token) => candidate.includes(token))
  );
}

function shouldFormatNumericValue(change: AuditChange): boolean {
  const candidates = getRawLabelCandidates(change);
  return candidates.some((candidate) =>
    NUMERIC_FIELD_TOKENS.some((token) => candidate.includes(token))
  );
}

function formatNumberForBusiness(value: number, change: AuditChange): string {
  if (shouldFormatAsCurrency(change)) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
      .format(value)
      .replace(/\u00a0/g, " ");
  }

  const hasFraction = !Number.isInteger(value);
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(value);
}

function parseDateValue(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsed = new Date(`${trimmed}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(trimmed)) {
    const normalized = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function formatDateForBusiness(value: string, change: AuditChange): string | null {
  const parsed = parseDateValue(value);
  if (!parsed) {
    return null;
  }

  const includeTime =
    shouldFormatAsDateTime(change) || /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(value.trim());

  return new Intl.DateTimeFormat("pt-BR", includeTime
    ? {
        dateStyle: "short",
        timeStyle: "short",
      }
    : {
        dateStyle: "short",
      }
  ).format(parsed);
}

function formatStructuredValueForBusiness(value: unknown): string | null {
  if (Array.isArray(value)) {
    const parts = value
      .map((entry) => formatSimpleBusinessValue(entry))
      .filter((entry): entry is string => Boolean(entry));
    return parts.length > 0 ? parts.join(", ") : null;
  }

  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return null;
}

function formatSimpleBusinessValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }

  if (typeof value === "string") {
    const trimmed = collapseWhitespace(value);
    return trimmed || null;
  }

  return formatStructuredValueForBusiness(value);
}

function resolveBusinessRawValue(change: AuditChange, side: "before" | "after"): unknown {
  const friendlyValue = getExplicitFriendlyValue(change, side);
  if (friendlyValue !== null && friendlyValue !== undefined) {
    if (typeof friendlyValue !== "string" || collapseWhitespace(friendlyValue)) {
      return friendlyValue;
    }
  }

  return getTechnicalValue(change, side);
}

function formatBusinessValue(change: AuditChange, side: "before" | "after"): string {
  const rawValue = resolveBusinessRawValue(change, side);
  const hasFriendlyValue =
    getExplicitFriendlyValue(change, side) !== null &&
    getExplicitFriendlyValue(change, side) !== undefined &&
    (typeof getExplicitFriendlyValue(change, side) !== "string" ||
      collapseWhitespace(String(getExplicitFriendlyValue(change, side))));

  if (rawValue === null || rawValue === undefined) {
    return resolveEmptyFieldText(change, EMPTY_BUSINESS_VALUE);
  }

  if (typeof rawValue === "boolean") {
    return rawValue ? "Sim" : "Não";
  }

  if (typeof rawValue === "number") {
    if (!hasFriendlyValue && isIdentifierField(change)) {
      return `ID ${rawValue}`;
    }
    return formatNumberForBusiness(rawValue, change);
  }

  if (typeof rawValue === "string") {
    const trimmed = collapseWhitespace(rawValue);
    if (!trimmed) {
      return resolveEmptyFieldText(change, EMPTY_BUSINESS_VALUE);
    }

    if (shouldFormatAsDate(change)) {
      const formattedDate = formatDateForBusiness(trimmed, change);
      if (formattedDate) {
        return formattedDate;
      }
    }

    const numericValue = parseNumericValue(trimmed);
    if (numericValue !== null) {
      if (!hasFriendlyValue && isIdentifierField(change) && looksLikeIdentifier(trimmed)) {
        return `ID ${trimmed}`;
      }
      if (shouldFormatNumericValue(change)) {
        return formatNumberForBusiness(numericValue, change);
      }
      return trimmed;
    }

    return trimmed;
  }

  const structured = formatStructuredValueForBusiness(rawValue);
  if (structured) {
    return structured;
  }

  return resolveEmptyFieldText(change, EMPTY_BUSINESS_VALUE);
}

function hasMeaningfulBusinessDiff(change: AuditChange): boolean {
  const oldValue = formatBusinessValue(change, "before");
  const newValue = formatBusinessValue(change, "after");
  return normalizeBusinessComparison(oldValue) !== normalizeBusinessComparison(newValue);
}

function shouldIgnoreSnapshotField(field: string): boolean {
  const normalized = normalizeText(field);
  if (!normalized) {
    return true;
  }

  return SNAPSHOT_METADATA_TOKENS.includes(normalized);
}

function resolveBusinessFieldKey(change: AuditChange, originalIndex: number): string {
  const path = typeof change.caminho === "string" ? collapseWhitespace(change.caminho) : "";
  if (path) {
    return path;
  }

  const label = typeof change.label === "string" ? collapseWhitespace(change.label) : "";
  if (label) {
    return label;
  }

  return `campo_${originalIndex}`;
}

export function resolveAuditChangeLabel(change: AuditChange): string {
  const candidates = getRawLabelCandidates(change);
  for (const candidate of candidates) {
    const mapped = CHANGE_LABEL_OVERRIDES[candidate];
    if (mapped) {
      return correctAuditLabelText(mapped);
    }
  }

  return correctAuditLabelText(humanizeTechnicalLabel(pickRawLabelSource(change)));
}

function resolveAuditChangeKindFromDelta(change: AuditChange): AuditChangeKind {
  const normalizedType = normalizeText(change.tipo || "");
  if (
    normalizedType.includes("adicionado") ||
    normalizedType.includes("incluido") ||
    normalizedType.includes("created") ||
    normalizedType.includes("added") ||
    normalizedType.includes("definido")
  ) {
    return "added";
  }
  if (
    normalizedType.includes("removido") ||
    normalizedType.includes("excluido") ||
    normalizedType.includes("deleted") ||
    normalizedType.includes("removed")
  ) {
    return "removed";
  }
  if (
    normalizedType.includes("editado") ||
    normalizedType.includes("alterado") ||
    normalizedType.includes("atualizado") ||
    normalizedType.includes("updated") ||
    normalizedType.includes("changed")
  ) {
    return "changed";
  }

  const before = resolveDisplayedValue(change, "before");
  const after = resolveDisplayedValue(change, "after");
  if (!before.text && after.text) {
    return "added";
  }
  if (before.text && !after.text) {
    return "removed";
  }
  if (before.text || after.text) {
    return "changed";
  }
  return "recorded";
}

export function resolveAuditChangeKind(
  change: AuditChange,
  options: PresentationOptions = {}
): AuditChangeKind {
  if (options.operationKind) {
    return options.operationKind;
  }
  return resolveAuditChangeKindFromDelta(change);
}

function resolveKindLabel(kind: AuditChangeKind): string {
  switch (kind) {
    case "added":
      return "Definido";
    case "removed":
      return "Removido";
    case "changed":
      return "Alterado";
    default:
      return "Registrado";
  }
}

function resolveKindTone(kind: AuditChangeKind): AuditChangeTone {
  switch (kind) {
    case "added":
      return "emerald";
    case "removed":
      return "rose";
    case "changed":
      return "amber";
    default:
      return "zinc";
  }
}

function resolveTechnicalText(change: AuditChange): string | null {
  const before = resolveDisplayedValue(change, "before");
  const after = resolveDisplayedValue(change, "after");

  if (!before.technicalText && !after.technicalText) {
    return null;
  }
  if (before.technicalText && after.technicalText) {
    return `${before.technicalText} -> ${after.technicalText}`;
  }
  return after.technicalText || before.technicalText || null;
}

function buildSections(change: AuditChange, kind: AuditChangeKind): PresentedAuditChangeSection[] {
  const before = resolveDisplayedValue(change, "before");
  const after = resolveDisplayedValue(change, "after");
  const emptyText = resolveEmptyFieldText(change, "Sem valor");

  switch (kind) {
    case "added":
      return [
        {
          key: "single",
          title: "Valor definido",
          text: after.text || emptyText,
          technicalText: after.technicalText,
        },
      ];
    case "removed":
      return [
        {
          key: "single",
          title: "Último valor",
          text: before.text || emptyText,
          technicalText: before.technicalText,
        },
      ];
    case "changed":
      return [
        {
          key: "before",
          title: "Valor anterior",
          text: before.text || emptyText,
          technicalText: before.technicalText,
        },
        {
          key: "after",
          title: "Novo valor",
          text: after.text || emptyText,
          technicalText: after.technicalText,
        },
      ];
    default: {
      const singleText = after.text || before.text || emptyText;
      const singleTechnical = after.technicalText || before.technicalText || null;

      return [
        {
          key: "single",
          title: "Valor registrado",
          text: singleText,
          technicalText: singleTechnical,
        },
      ];
    }
  }
}

export function resolveAuditChangePriority(change: AuditChange): number {
  const normalized = normalizeText(resolveAuditChangeLabel(change));

  if (HIGH_PRIORITY_TOKENS.some((token) => normalized.includes(token))) {
    return 0;
  }
  if (LOW_PRIORITY_TOKENS.some((token) => normalized.includes(token))) {
    return 2;
  }
  if (TECHNICAL_TOKENS.some((token) => normalized.includes(token))) {
    return 4;
  }
  return 1;
}

function resolveKindOrder(kind: AuditChangeKind): number {
  switch (kind) {
    case "changed":
      return 0;
    case "added":
      return 1;
    case "removed":
      return 2;
    default:
      return 3;
  }
}

export function presentAuditChange(
  change: AuditChange,
  originalIndex: number,
  options: PresentationOptions = {}
): PresentedAuditChange {
  const kind = resolveAuditChangeKind(change, options);
  const before = resolveDisplayedValue(change, "before");
  const after = resolveDisplayedValue(change, "after");
  const sections = buildSections(change, kind);
  const emptyText = resolveEmptyFieldText(change, "Sem valor");

  return {
    label: resolveAuditChangeLabel(change),
    kind,
    kindLabel: resolveKindLabel(kind),
    tone: resolveKindTone(kind),
    beforeText: kind === "added" ? emptyText : before.text || emptyText,
    afterText:
      kind === "removed"
        ? "Removido"
        : after.text || emptyText,
    technicalBeforeText: before.technicalText,
    technicalAfterText: after.technicalText,
    technicalText: resolveTechnicalText(change),
    sections,
    showComparisonArrow: kind === "changed" && sections.length === 2,
    priority: resolveAuditChangePriority(change),
    originalIndex,
    change,
  };
}

export function sortAuditChangesForPresentation(
  changes: AuditChange[],
  options: PresentationOptions = {}
): PresentedAuditChange[] {
  return changes
    .map((change, index) => presentAuditChange(change, index, options))
    .sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }
      const kindOrderDiff = resolveKindOrder(left.kind) - resolveKindOrder(right.kind);
      if (kindOrderDiff !== 0) {
        return kindOrderDiff;
      }
      return left.originalIndex - right.originalIndex;
    });
}

export function buildBusinessAuditDiffs(
  changes: AuditChange[],
  options: PresentationOptions = {}
): BusinessAuditFieldDiff[] {
  return sortAuditChangesForPresentation(changes, options)
    .filter((item) => {
      if (!hasMeaningfulBusinessDiff(item.change)) {
        return false;
      }

      if (item.kind === "changed") {
        return true;
      }

      return options.operationKind === "changed";
    })
    .map((item) => ({
      field: resolveBusinessFieldKey(item.change, item.originalIndex),
      label: item.label,
      oldValue: formatBusinessValue(item.change, "before"),
      newValue: formatBusinessValue(item.change, "after"),
      originalIndex: item.originalIndex,
      change: item.change,
    }));
}

export function buildBusinessAuditDiffsFromSnapshots(
  beforeSnapshot: Record<string, unknown> | null,
  afterSnapshot: Record<string, unknown> | null
): BusinessAuditFieldDiff[] {
  if (!beforeSnapshot || !afterSnapshot) {
    return [];
  }

  const keys = Array.from(
    new Set([...Object.keys(beforeSnapshot), ...Object.keys(afterSnapshot)])
  ).filter((key) => !shouldIgnoreSnapshotField(key));

  const changes = keys.map<AuditChange>((key) => ({
    caminho: key,
    label: key,
    de: beforeSnapshot[key],
    para: afterSnapshot[key],
    tipo: "Editado",
  }));

  return buildBusinessAuditDiffs(changes, { operationKind: "changed" });
}

export function buildAuditChangesView(
  changes: AuditChange[],
  options: BuildAuditChangesViewOptions = {}
) {
  const { expanded = false, limit = 4, operationKind = null } = options;
  const items = sortAuditChangesForPresentation(changes, { operationKind });
  const safeLimit = Math.max(1, limit);
  const visibleItems = expanded ? items : items.slice(0, safeLimit);

  return {
    items,
    visibleItems,
    total: items.length,
    hiddenCount: Math.max(0, items.length - visibleItems.length),
    hasTechnicalDetails: items.some(
      (item) =>
        Boolean(item.technicalText) ||
        item.sections.some((section) => Boolean(section.technicalText))
    ),
  };
}
