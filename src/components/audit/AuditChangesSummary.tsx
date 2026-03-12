"use client";

import { ChevronDown } from "lucide-react";
import {
  parseBeforeAfter,
  type AuditChange,
  type AuditOperationKind,
} from "@/src/lib/audit/presentation";
import {
  buildBusinessAuditDiffs,
  buildBusinessAuditDiffsFromSnapshots,
} from "@/src/lib/audit/change-presentation";

type AuditChangesSummaryProps = {
  changes: AuditChange[];
  operationKind?: AuditOperationKind;
  className?: string;
  title?: string;
  beforeJson?: string | null;
  afterJson?: string | null;
};

function resolveTitle(customTitle?: string): string {
  if (customTitle && customTitle.trim()) {
    return customTitle;
  }
  return "Alterações realizadas";
}

function resolveSubtitle(total: number): string {
  return total === 1 ? "1 campo alterado" : `${total} campos alterados`;
}

function isUsableSnapshotRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const keys = Object.keys(value);
  if (keys.length === 0) {
    return false;
  }

  return !["resource", "path", "method", "actionLabel"].every((key) => key in value);
}

export function AuditChangesSummary({
  changes,
  operationKind = null,
  className = "",
  title,
  beforeJson = null,
  afterJson = null,
}: AuditChangesSummaryProps) {
  const snapshotBefore = parseBeforeAfter(beforeJson);
  const snapshotAfter = parseBeforeAfter(afterJson);
  const initialDiffs = Array.isArray(changes) ? buildBusinessAuditDiffs(changes, { operationKind }) : [];
  const diffs =
    initialDiffs.length > 0
      ? initialDiffs
      : operationKind === "changed" &&
          isUsableSnapshotRecord(snapshotBefore) &&
          isUsableSnapshotRecord(snapshotAfter)
        ? buildBusinessAuditDiffsFromSnapshots(snapshotBefore, snapshotAfter)
        : [];

  if (diffs.length === 0) {
    return null;
  }

  const resolvedTitle = resolveTitle(title);

  return (
    <details
      className={`group rounded-xl border border-zinc-200 bg-white px-4 py-3 ${className}`.trim()}
      aria-label={resolvedTitle}
    >
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              {resolvedTitle}
            </p>
            <p className="text-sm text-zinc-600">{resolveSubtitle(diffs.length)}</p>
          </div>

          <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 transition group-hover:text-emerald-800">
            Ver alterações
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </span>
        </div>
      </summary>

      <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
        {diffs.map((diff) => (
          <article
            key={`${diff.field}-${diff.originalIndex}`}
            className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3"
          >
            <h4 className="text-sm font-semibold text-zinc-900">{diff.label}</h4>

            <dl className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Valor anterior
                </dt>
                <dd className="mt-1 break-words text-sm text-zinc-900">{diff.oldValue}</dd>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                  Valor atual
                </dt>
                <dd className="mt-1 break-words text-sm font-medium text-zinc-900">
                  {diff.newValue}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </details>
  );
}
