import { type AuditChange, type AuditOperationKind } from "@/src/lib/audit/presentation";
import {
  type AuditChangeTone,
  sortAuditChangesForPresentation,
} from "@/src/lib/audit/change-presentation";

type AuditChangesTableProps = {
  changes: AuditChange[];
  operationKind?: AuditOperationKind;
  showTechnical?: boolean;
};

function resolveToneTextClass(tone: AuditChangeTone): string {
  switch (tone) {
    case "emerald":
      return "text-emerald-700";
    case "rose":
      return "text-rose-700";
    case "amber":
      return "text-amber-700";
    default:
      return "text-zinc-700";
  }
}

export function AuditChangesTable({
  changes,
  operationKind = null,
  showTechnical = true,
}: AuditChangesTableProps) {
  if (!Array.isArray(changes) || changes.length === 0) {
    return null;
  }

  const items = sortAuditChangesForPresentation(changes, { operationKind });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-zinc-600">
            <th className="py-2 pr-3">Campo</th>
            <th className="py-2 pr-3">Detalhamento</th>
            <th className="py-2 pr-3">Tipo</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={`${item.label}-${item.originalIndex}`} className="border-b border-zinc-100 align-top">
              <td className="py-2 pr-3 font-medium text-zinc-900">{item.label}</td>
              <td className="py-2 pr-3 text-zinc-800">
                <div className="space-y-2">
                  {item.sections.map((section, sectionIndex) => (
                    <div key={`${item.label}-${item.originalIndex}-${section.key}-${sectionIndex}`}>
                      <p className="font-medium text-zinc-600">{section.title}</p>
                      <p className="mt-0.5 text-zinc-800">{section.text}</p>
                      {showTechnical && section.technicalText && (
                        <p className="mt-0.5 text-[11px] text-zinc-500">
                          Rastreabilidade técnica: {section.technicalText}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </td>
              <td className={`py-2 pr-3 font-medium ${resolveToneTextClass(item.tone)}`}>{item.kindLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
