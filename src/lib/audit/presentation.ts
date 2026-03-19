import { AuditLogResponseDTO, AuditScopeEnum } from "../api/types";
import { getUserErrorMessage } from "../feedback/user-messages";
export {
  resolveAuditDescription,
  resolveAuditOperationKind,
  type AuditOperationKind,
} from "./log-presentation";

export type AuditChange = {
  caminho?: string;
  label?: string;
  de?: unknown;
  deLabel?: unknown;
  para?: unknown;
  paraLabel?: unknown;
  tipo?: string;
};

type AuditBeforeAfter = Record<string, unknown> | Array<unknown> | null;

const scopeLabels: Record<AuditScopeEnum, string> = {
  SYSTEM: "Sistema",
  CONTRACTS: "Contratos",
  USERS: "Usuários",
  PEOPLE_COMPANIES: "Pessoas e empresas",
};

const actionLabels: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /(login|signin|autentic)/i, label: "Entrou no sistema" },
  { pattern: /(logout|signout|saiu)/i, label: "Saiu do sistema" },
  { pattern: /(create|post|criar|criacao|adicion)/i, label: "Criou um registro" },
  { pattern: /(update|patch|put|editar|atualiz|alter)/i, label: "Atualizou um registro" },
  { pattern: /(delete|remov|exclu|cancel)/i, label: "Excluiu um registro" },
  { pattern: /(error|erro|falha|exception)/i, label: "Falha durante operação" },
];

function correctAuditDisplayText(value: string): string {
  return value
    .replace(/\bUsuarios\b/g, "Usuários")
    .replace(/\bUsuario\b/g, "Usuário")
    .replace(/\bGestao\b/g, "Gestão")
    .replace(/\bOperacoes\b/g, "Operações")
    .replace(/\bConfiguracoes\b/g, "Configurações")
    .replace(/\bConfiguracao\b/g, "Configuração")
    .replace(/\bPermissoes\b/g, "Permissões")
    .replace(/\bPermissao\b/g, "Permissão")
    .replace(/\bExclusao\b/g, "Exclusão")
    .replace(/\bEdicao\b/g, "Edição")
    .replace(/\bDescricao\b/g, "Descrição")
    .replace(/\bdescricao\b/g, "descrição")
    .replace(/\bAcoes\b/g, "Ações")
    .replace(/\bacoes\b/g, "ações")
    .replace(/\bAcao\b/g, "Ação")
    .replace(/\bacao\b/g, "ação")
    .replace(/\bNao\b/g, "Não")
    .replace(/\bnao\b/g, "não")
    .replace(/\bSessao\b/g, "Sessão")
    .replace(/\bsessao\b/g, "sessão")
    .replace(/\bAutenticacao\b/g, "Autenticação")
    .replace(/\bautenticacao\b/g, "autenticação")
    .replace(/\binvalidas\b/g, "inválidas")
    .replace(/\bvalido\b/g, "válido")
    .replace(/\badministracao\b/g, "administração")
    .replace(/\bAdministracao\b/g, "Administração")
    .replace(/\bespecifica\b/g, "específica")
    .replace(/\bnegocio\b/g, "negócio")
    .replace(/\btecnico\b/g, "técnico")
    .replace(/\btecnicos\b/g, "técnicos")
    .replace(/\btecnica\b/g, "técnica")
    .replace(/\bCodigo\b/g, "Código")
    .replace(/\bcodigo\b/g, "código")
    .replace(/\bprimario\b/g, "primário")
    .replace(/\bsecundario\b/g, "secundário")
    .replace(/\binicio\b/g, "início")
    .replace(/\btermino\b/g, "término")
    .replace(/\bexecucao\b/g, "execução")
    .replace(/\bOrganizacao\b/g, "Organização")
    .replace(/\borganizacao\b/g, "organização")
    .replace(/\bvinculo\b/g, "vínculo")
    .replace(/\bvinculos\b/g, "vínculos")
    .replace(/\bUltimo\b/g, "Último")
    .replace(/\bultimo\b/g, "último")
    .replace(/\bPagina\b/g, "Página")
    .replace(/\bpagina\b/g, "página")
    .replace(/\bProxima\b/g, "Próxima")
    .replace(/\bproxima\b/g, "próxima")
    .replace(/\bVisao\b/g, "Visão")
    .replace(/\bSeguranca\b/g, "Segurança")
    .replace(/\bSaude\b/g, "Saúde")
    .replace(/\bRapidas\b/g, "Rápidas")
    .replace(/\brapidas\b/g, "rápidas")
    .replace(/\bUltimas\b/g, "Últimas")
    .replace(/\bultimas\b/g, "últimas")
    .replace(/\bExperiencia\b/g, "Experiência")
    .replace(/\bRestricoes\b/g, "Restrições")
    .replace(/\bInvalido\b/g, "Inválido")
    .replace(/\binvalido\b/g, "inválido")
    .replace(/\bClassificacao\b/g, "Classificação")
    .replace(/\bclassificacao\b/g, "classificação");
}

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
  return getUserErrorMessage(error, "Não foi possível carregar a auditoria.");
}

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return "Não informado";
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
  return correctAuditDisplayText(scopeLabels[scope] || scope);
}

export function resolveContext(log: AuditLogResponseDTO): string {
  const pieces = [log.modulo, log.feature, log.aba, log.subsecao]
    .map((value) => (value || "").trim())
    .filter((value) => value.length > 0);
  if (pieces.length > 0) {
    return correctAuditDisplayText(pieces.join(" / "));
  }

  if (log.entityType) {
    return correctAuditDisplayText(log.entityType);
  }

  return "-";
}

export function resolveEntity(log: AuditLogResponseDTO): string {
  const contractCode = (log.contractCode || "").trim();
  const contractName = (log.contractName || "").trim();
  const contractId = log.contractId ?? null;

  let contractLabel: string | null = null;
  if (contractCode && contractName) {
    contractLabel = `Contrato ${contractCode} (${contractName})`;
  } else if (contractCode) {
    contractLabel = `Contrato ${contractCode}`;
  } else if (contractName) {
    contractLabel = `Contrato ${contractName}`;
  } else if (contractId && contractId > 0) {
    contractLabel = `Contrato #${contractId}`;
  }

  if (contractLabel) {
    const entityId = (log.entityId || "").trim();
    if (entityId && String(contractId || "") !== entityId) {
      return correctAuditDisplayText(`${contractLabel} | Registro #${entityId}`);
    }
    return correctAuditDisplayText(contractLabel);
  }

  const pieces = [log.entidadePrincipal, log.entityId]
    .map((value) => (value || "").trim())
    .filter((value) => value.length > 0);
  if (pieces.length > 0) {
    return correctAuditDisplayText(pieces.join(" #"));
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
    return "Ação registrada";
  }

  for (const definition of actionLabels) {
    if (definition.pattern.test(action)) {
      return correctAuditDisplayText(definition.label);
    }
  }

  return correctAuditDisplayText(action);
}

export function resolveSummary(log: AuditLogResponseDTO): string {
  const summary = log.resumo?.trim();
  if (summary) {
    return correctAuditDisplayText(summary);
  }
  return resolveActionLabel(log);
}

export function resolveResultLabel(result?: string | null): string {
  const normalized = (result || "").trim().toUpperCase();
  if (!normalized) {
    return "Não informado";
  }
  if (normalized === "SUCESSO") {
    return "Sucesso";
  }
  if (normalized === "FALHA") {
    return "Falha";
  }
  return correctAuditDisplayText(result || "Não informado");
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
