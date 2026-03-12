import type { BudgetTransferBusinessSummary } from "@/src/lib/audit/budget-reference-presentation";

type BudgetTransferSummaryProps = {
  summary: BudgetTransferBusinessSummary;
};

export function BudgetTransferSummary({ summary }: BudgetTransferSummaryProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700">
      <div className="space-y-2">
        <p>
          <span className="font-semibold text-zinc-900">Origem:</span> {summary.sourceLabel}, que tinha
          valor total de {summary.sourceInitialTotal}.
        </p>
        <p>
          <span className="font-semibold text-zinc-900">Destino:</span> {summary.destinationLabel},
          que tinha valor total de {summary.destinationInitialTotal}.
        </p>
      </div>

      <div className="mt-3 grid gap-3 border-t border-zinc-100 pt-3 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Valor remanejado
          </p>
          <p className="mt-1 font-medium text-zinc-900">{summary.transferredAmount}</p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Valores finais
          </p>
          <p className="mt-1 text-zinc-900">
            <span className="font-medium">Origem:</span> {summary.sourceFinalTotal}
          </p>
          <p className="text-zinc-900">
            <span className="font-medium">Destino:</span> {summary.destinationFinalTotal}
          </p>
        </div>
      </div>
    </div>
  );
}
