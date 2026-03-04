import { AuditLogResponseDTO, AuditScopeEnum, HttpError } from "@/src/lib/api/types";

export type AuditChange = {
  caminho?: string;
  de?: unknown;
  para?: unknown;
  tipo?: string;
};

type AuditBeforeAfter = Record<string, unknown> | Array<unknown> | null;

const scopeLabels: Record<AuditScopeEnum, string> = {
  SYSTEM: "Sistema",
  CONTRACTS: "Contratos",
  USERS: "Usuarios",
  PEOPLE_COMPANIES: "Pessoas e empresas",
};

const actionLabels: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /(login|signin|autentic)/i, label: "Entrou no sistema" },
  { pattern: /(logout|signout|saiu)/i, label: "Saiu do sistema" },
  { pattern: /(create|post|criar|criacao|adicion)/i, label: "Criou um registro" },
  { pattern: /(update|patch|put|editar|atualiz|alter)/i, label: "Atualizou um registro" },
  { pattern: /(delete|remov|exclu|cancel)/i, label: "Excluiu um registro" },
  { pattern: /(error|erro|falha|exception)/i, label: "Falha durante operacao" },
];

export function parseJsonValue<T>(value: string | null | undefined): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function parseBeforeAfter(value: string | null | undefined): AuditBeforeAfter {
  return parseJsonValue<AuditBeforeAfter>(value);
}

export function parseChanges(value: string | null | undefined): AuditChange[] {
  const parsed = parseJsonValue<AuditChange[]>(value);
  return Array.isArray(parsed) ? parsed : [];
}

export function parseTechnical(value: string | null | undefined): Record<string, unknown> | null {
  return parseJsonValue<Record<string, unknown>>(value);
}

export function parseContractId(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Erro inesperado.";
}

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function formatUnknown(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "string") {
    return value.trim() || "-";
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

export function resolveEventDate(log: AuditLogResponseDTO): string {
  return log.dataHora || log.createdAt;
}

export function resolveActorId(log: AuditLogResponseDTO): number | null {
  return log.usuarioResponsavelId ?? log.actorUserId ?? null;
}

export function resolveActorName(
  log: AuditLogResponseDTO,
  actorNamesById: Record<number, string>
): string {
  const byPayload = log.usuarioResponsavelNome?.trim();
  if (byPayload) {
    return byPayload;
  }

  const actorId = resolveActorId(log);
  if (actorId && actorNamesById[actorId]) {
    return actorNamesById[actorId];
  }

  const byMail = log.usuarioResponsavelEmail?.trim() || log.actorEmail?.trim();
  if (byMail) {
    return byMail;
  }

  return "Sistema";
}

export function resolveActorEmail(log: AuditLogResponseDTO): string | null {
  const email = log.usuarioResponsavelEmail || log.actorEmail;
  if (!email) {
    return null;
  }
  const trimmed = email.trim();
  return trimmed || null;
}

export function resolveScopeLabel(scope?: AuditScopeEnum | null): string {
  if (!scope) {
    return "-";
  }
  return scopeLabels[scope] || scope;
}

export function resolveContext(log: AuditLogResponseDTO): string {
  const pieces = [log.modulo, log.feature, log.aba, log.subsecao]
    .map((value) => (value || "").trim())
    .filter((value) => value.length > 0);
  if (pieces.length > 0) {
    return pieces.join(" / ");
  }

  if (log.entityType) {
    return log.entityType;
  }

  return "-";
}

export function resolveEntity(log: AuditLogResponseDTO): string {
  const pieces = [log.entidadePrincipal, log.entityId]
    .map((value) => (value || "").trim())
    .filter((value) => value.length > 0);
  if (pieces.length > 0) {
    return pieces.join(" #");
  }
  return "-";
}

function normalizeAction(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed || null;
}

export function resolveActionLabel(log: AuditLogResponseDTO): string {
  const action = normalizeAction(log.action);
  if (!action) {
    return "Acao registrada";
  }

  for (const definition of actionLabels) {
    if (definition.pattern.test(action)) {
      return definition.label;
    }
  }

  return action;
}

export function resolveSummary(log: AuditLogResponseDTO): string {
  const summary = log.resumo?.trim();
  if (summary) {
    return summary;
  }
  return resolveActionLabel(log);
}

export function resolveResultLabel(result?: string | null): string {
  const normalized = (result || "").trim().toUpperCase();
  if (!normalized) {
    return "Nao informado";
  }
  if (normalized === "SUCESSO") {
    return "Sucesso";
  }
  if (normalized === "FALHA") {
    return "Falha";
  }
  return result || "Nao informado";
}

export function resolveResultClass(result?: string | null): string {
  const normalized = (result || "").trim().toUpperCase();
  if (normalized === "SUCESSO") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (normalized === "FALHA") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}

