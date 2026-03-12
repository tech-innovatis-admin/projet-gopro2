import type { AuditChange, AuditOperationKind } from "@/src/lib/audit/presentation";

type AuditLogDetailsProps = {
  changes: AuditChange[];
  operationKind?: AuditOperationKind;
  before: unknown;
  after: unknown;
  technical: unknown;
  ip?: string | null;
  userAgent?: string | null;
  summaryLabel?: string;
  className?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readDetailValue(
  source: Record<string, unknown> | null,
  ...keys: string[]
): string | null {
  if (!source) {
    return null;
  }

  for (const key of keys) {
    const rawValue = source[key];
    if (rawValue === null || rawValue === undefined) {
      continue;
    }

    if (typeof rawValue === "string") {
      const trimmed = rawValue.trim();
      if (trimmed) {
        return trimmed;
      }
      continue;
    }

    if (typeof rawValue === "number" || typeof rawValue === "boolean") {
      return String(rawValue);
    }
  }

  return null;
}

export function AuditLogDetails({
  changes: _changes,
  operationKind: _operationKind = null,
  before,
  after,
  technical,
  ip = null,
  userAgent = null,
  summaryLabel = "Ver detalhes t\u00e9cnicos",
  className = "",
}: AuditLogDetailsProps) {
  void _changes;
  void _operationKind;

  const hasBeforeAfter = before !== null || after !== null;
  const hasTechnical = technical !== null && technical !== undefined;

  if (!hasBeforeAfter && !hasTechnical && !ip && !userAgent) {
    return null;
  }

  const technicalRecord = isRecord(technical) ? technical : null;
  const technicalItems = [
    { label: "M\u00e9todo", value: readDetailValue(technicalRecord, "method", "metodoHttp", "httpMethod") },
    { label: "Endpoint", value: readDetailValue(technicalRecord, "path", "caminho", "endpoint") },
    {
      label: "Status HTTP",
      value: readDetailValue(technicalRecord, "status", "statusCode", "httpStatus"),
    },
    { label: "IP", value: readDetailValue(technicalRecord, "ip") || ip },
    { label: "User-Agent", value: readDetailValue(technicalRecord, "userAgent") || userAgent },
  ].filter((item) => Boolean(item.value));

  return (
    <details className={`rounded-xl border border-zinc-200 bg-white p-3 ${className}`.trim()}>
      <summary className="cursor-pointer list-none text-sm font-medium text-zinc-700">
        {summaryLabel}
      </summary>

      <div className="mt-3 space-y-3 border-t border-zinc-100 pt-3 text-sm text-zinc-700">
        {technicalItems.length > 0 && (
          <dl className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {technicalItems.map((item) => (
              <div key={item.label} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  {item.label}
                </dt>
                <dd className="mt-1 break-all text-sm text-zinc-900">{item.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {hasBeforeAfter && (
          <div className="grid gap-3 lg:grid-cols-2">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Antes
              </p>
              <pre className="max-h-56 overflow-auto rounded-lg bg-zinc-950/[0.04] p-3 text-[11px] text-zinc-700">
                {JSON.stringify(before, null, 2) || "null"}
              </pre>
            </div>

            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Depois
              </p>
              <pre className="max-h-56 overflow-auto rounded-lg bg-zinc-950/[0.04] p-3 text-[11px] text-zinc-700">
                {JSON.stringify(after, null, 2) || "null"}
              </pre>
            </div>
          </div>
        )}

        {hasTechnical && (
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              {"Payload t\u00e9cnico"}
            </p>
            <pre className="max-h-56 overflow-auto rounded-lg bg-zinc-950/[0.04] p-3 text-[11px] text-zinc-700">
              {JSON.stringify(technical, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </details>
  );
}
