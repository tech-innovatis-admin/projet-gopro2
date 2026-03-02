"use client";

export interface CategoryChartItem {
  name: string;
  quantidade: number;
  percentual: number;
  valor: number;
}

interface CategoryPieChartProps {
  data: CategoryChartItem[];
  isLoading?: boolean;
}

const COLORS = {
  primary: "#004225",
  secondary: "#00B894",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export function CategoryPieChart({ data, isLoading = false }: CategoryPieChartProps) {
  const total = data.reduce((acc, item) => acc + item.quantidade, 0);
  const totalValue = data.reduce((acc, item) => acc + item.valor, 0);

  return (
    <div className="h-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-zinc-900">Contratos por Categoria</h3>
        <span className="text-sm text-zinc-500">{total} contratos</span>
      </div>

      {isLoading ? (
        <div className="h-40 flex items-center justify-center text-sm text-zinc-500">
          Carregando categorias...
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 mb-6 pt-4 border-t border-zinc-100">
          {data.map((item, index) => (
            <div
              key={item.name}
              className={`space-y-2 ${index > 0 ? "pt-4" : ""} ${
                index < data.length - 1 ? "pb-4" : ""
              }`}
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: index === 0 ? COLORS.primary : COLORS.secondary }}
                  />
                  <span className="font-medium text-zinc-700">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500">{item.quantidade} contratos</span>
                  <span className="font-semibold text-zinc-900">{item.percentual.toFixed(2)}%</span>
                </div>
              </div>
              <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${item.percentual}%`,
                    backgroundColor: index === 0 ? COLORS.primary : COLORS.secondary,
                  }}
                />
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-500">
                  Valor total:{" "}
                  <span className="font-medium text-zinc-700">{formatCurrency(item.valor)}</span>
                </span>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="py-10 text-center text-sm text-zinc-500">
              Nenhum dado de categoria para os filtros atuais.
            </div>
          )}
        </div>
      )}

      <div className="pt-4 border-t border-zinc-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">Valor total dos contratos</span>
          <span className="text-lg font-bold" style={{ color: COLORS.primary }}>
            {formatCurrency(totalValue)}
          </span>
        </div>
      </div>
    </div>
  );
}
