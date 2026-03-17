import { type ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { type AuditLogResponseDTO, type AuditScopeEnum } from "@/src/lib/api/types";
import {
  type AuditChange,
  formatDateTime,
  parseChanges,
  resolveActorEmail,
  resolveAuditDescription,
  resolveAuditOperationKind,
  resolveActorName,
  resolveContext,
  resolveEntity,
  resolveEventDate,
  resolveResultClass,
  resolveResultLabel,
  resolveScopeLabel,
  resolveSummary,
} from "@/src/lib/audit/presentation";
import { AuditChangesSummary } from "@/src/components/audit/AuditChangesSummary";

type AuditLogCardAccent = {
  label?: string;
  icon?: LucideIcon;
  barClassName?: string;
  borderClassName?: string;
  iconClassName?: string;
  backgroundClassName?: string;
};

type AuditLogCardProps = {
  log: AuditLogResponseDTO;
  changesOverride?: AuditChange[] | null;
  actorNamesById?: Record<number, string>;
  actorRoleLabel?: string | null;
  entityTextOverride?: string | null;
  secondaryEntityText?: string | null;
  scopeFallback?: AuditScopeEnum | null;
  showScopeBadge?: boolean;
  accent?: AuditLogCardAccent | null;
  headerActions?: ReactNode;
  extraSummaryContent?: ReactNode;
  detailsContent?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function AuditLogCard({
  log,
  changesOverride = null,
  actorNamesById = {},
  actorRoleLabel = null,
  entityTextOverride = null,
  secondaryEntityText = null,
  scopeFallback = null,
  showScopeBadge = false,
  accent = null,
  headerActions = null,
  extraSummaryContent = null,
  detailsContent: _detailsContent = null,
  children: _children = null,
  className = "",
}: AuditLogCardProps) {
  void _children;
  void _detailsContent;

  const AccentIcon = accent?.icon;
  const changes = Array.isArray(changesOverride) ? changesOverride : parseChanges(log.alteracoesJson);
  const actorName = resolveActorName(log, actorNamesById);
  const actorEmail = resolveActorEmail(log);
  const context = resolveContext(log);
  const entity = entityTextOverride?.trim() || resolveEntity(log);
  const operationKind = resolveAuditOperationKind(log);
  const description = resolveAuditDescription(log);
  const secondaryText =
    secondaryEntityText && secondaryEntityText.trim() && secondaryEntityText !== entity
      ? secondaryEntityText
      : null;
  const showDescription = Boolean(description) && operationKind !== "added" && operationKind !== "changed";
  const showExtraSummaryContent = Boolean(extraSummaryContent);
  const showContextDetails =
    Boolean(actorName) ||
    Boolean(actorEmail) ||
    Boolean(actorRoleLabel) ||
    entity !== "-" ||
    Boolean(secondaryText) ||
    (context !== "-" && operationKind === null);
  const detailSubtitle =
    operationKind === "changed" || showExtraSummaryContent
      ? "Responsável, registro afetado e atualizações"
      : "Responsável e registro afetado";

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 shadow-sm",
        accent?.borderClassName,
        accent?.backgroundClassName,
        className
      )}
    >
      {accent?.barClassName && (
        <div
          className={cn("pointer-events-none absolute inset-x-0 top-0 h-1", accent.barClassName)}
        />
      )}

      <div className="space-y-4">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {AccentIcon && (
                <span
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700",
                    accent?.iconClassName
                  )}
                >
                  <AccentIcon className="h-4 w-4" />
                </span>
              )}

              {accent?.label && (
                <span className="inline-flex rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                  {accent.label}
                </span>
              )}

              {showScopeBadge && (
                <span className="inline-flex rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                  {resolveScopeLabel(log.tipoAuditoria || scopeFallback)}
                </span>
              )}

              <span
                className={cn(
                  "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                  resolveResultClass(log.resultado)
                )}
              >
                {resolveResultLabel(log.resultado)}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-semibold text-zinc-900">{resolveSummary(log)}</h3>

              {secondaryEntityText && secondaryEntityText.trim() && (
                <p className="text-sm font-medium text-zinc-600">{secondaryEntityText}</p>
              )}

              {showDescription && <p className="text-sm text-zinc-600">{description}</p>}
            </div>
          </div>

          <div className="shrink-0 space-y-2 text-sm text-zinc-600 lg:text-right">
            {headerActions ? <div className="flex justify-start lg:justify-end">{headerActions}</div> : null}
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Data e hora
            </p>
            <p className="font-medium text-zinc-800">{formatDateTime(resolveEventDate(log))}</p>
          </div>
        </header>

        {showContextDetails && (
          <details className="group rounded-xl border border-zinc-200 bg-white px-4 py-3">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    Detalhamento
                  </p>
                  <p className="text-sm text-zinc-600">{detailSubtitle}</p>
                </div>

                <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 transition group-hover:text-emerald-800">
                  Ver detalhamento
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                </span>
              </div>
            </summary>

            <div className="mt-4 space-y-4 border-t border-zinc-100 pt-4">
              <dl className="grid gap-3 text-sm md:grid-cols-2">
                <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 px-3 py-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    Responsável
                  </dt>
                  <dd className="mt-1 font-medium text-zinc-900">{actorName}</dd>
                  {actorEmail && <dd className="text-xs text-zinc-600">{actorEmail}</dd>}
                  {actorRoleLabel && <dd className="text-xs text-zinc-600">Perfil: {actorRoleLabel}</dd>}
                </div>

                <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 px-3 py-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    Registro afetado
                  </dt>
                  <dd className="mt-1 break-words text-zinc-900">{entity}</dd>
                  {secondaryText && <dd className="text-xs text-zinc-600">{secondaryText}</dd>}
                  {context !== "-" && operationKind === null && (
                    <dd className="text-xs text-zinc-600">{context}</dd>
                  )}
                </div>
              </dl>

              <AuditChangesSummary
                changes={changes}
                operationKind={operationKind}
                title="Atualizações realizadas"
                beforeJson={log.beforeJson}
                afterJson={log.afterJson}
              />

              {showExtraSummaryContent ? extraSummaryContent : null}
            </div>
          </details>
        )}

        {/* Detalhes técnicos temporariamente desativados nesta versão da auditoria. */}
      </div>
    </article>
  );
}
