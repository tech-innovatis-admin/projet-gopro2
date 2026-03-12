export type AuditOperationKind = "added" | "changed" | "removed" | null;

type AuditLogPresentationLike = {
  action?: string | null;
  resumo?: string | null;
  descricao?: string | null;
};

function correctAuditDescriptionText(value: string): string {
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
    .replace(/\bCodigo\b/g, "Código")
    .replace(/\bcodigo\b/g, "código")
    .replace(/\bprimario\b/g, "primário")
    .replace(/\bsecundario\b/g, "secundário")
    .replace(/\binicio\b/g, "início")
    .replace(/\btermino\b/g, "término")
    .replace(/\bexecucao\b/g, "execução")
    .replace(/\bOrganizacao\b/g, "Organização")
    .replace(/\borganizacao\b/g, "organização")
    .replace(/\bvinculo\b/g, "vínculo");
}

function normalizeAuditText(value?: string | null): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function isLegacyAuditDescription(description: string): boolean {
  const normalized = normalizeAuditText(description);
  return (
    normalized.startsWith("TELA ") ||
    normalized.includes("ALTERACAO REGISTRADA NA ABA") ||
    normalized.includes("CAMPOS ALTERADOS") ||
    normalized.includes("SEM DETALHAMENTO DE CAMPOS ALTERADOS")
  );
}

export function resolveAuditOperationKind(log: AuditLogPresentationLike): AuditOperationKind {
  const candidates = [log.action, log.resumo, log.descricao]
    .map((value) => normalizeAuditText(value))
    .filter((value) => value.length > 0);

  for (const candidate of candidates) {
    if (
      candidate.includes("CRIAR") ||
      candidate.includes("CREATE") ||
      candidate.includes("POST") ||
      candidate.includes("ADICION") ||
      candidate.includes("REGISTR")
    ) {
      return "added";
    }
    if (
      candidate.includes("EXCLUI") ||
      candidate.includes("DELETE") ||
      candidate.includes("REMOV") ||
      candidate.includes("CANCEL")
    ) {
      return "removed";
    }
    if (
      candidate.includes("ATUALIZ") ||
      candidate.includes("UPDATE") ||
      candidate.includes("PATCH") ||
      candidate.includes("PUT") ||
      candidate.includes("ALTER")
    ) {
      return "changed";
    }
  }

  return null;
}

export function resolveAuditDescription(log: AuditLogPresentationLike): string | null {
  const description = log.descricao?.trim();
  if (!description) {
    return null;
  }
  if (isLegacyAuditDescription(description)) {
    return null;
  }
  return correctAuditDescriptionText(description);
}
