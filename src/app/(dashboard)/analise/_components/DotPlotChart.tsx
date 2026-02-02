"use client";

interface DotPlotData {
  label: string;
  values: {
    key: string;
    value: number;
    color: string;
  }[];
}

interface DotPlotChartProps {
  data: DotPlotData[];
  title?: string;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
  height?: string;
}

export function DotPlotChart({
  data,
  title,
  showLegend = true,
  formatValue = (v) => v.toString(),
  height = "h-full",
}: DotPlotChartProps) {
  const allValues = data.flatMap((d) => d.values.map((v) => v.value));
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue || 1;

  const legendItems = data[0]?.values.map((v) => ({
    key: v.key,
    color: v.color,
  })) || [];

  return (
    <div className={`flex flex-col ${height}`}>
      {title && (
        <h4 className="text-sm font-semibold text-gray-900 mb-2">{title}</h4>
      )}

      {showLegend && (
        <div className="flex items-center gap-3 mb-2">
          {legendItems.map((item) => (
            <div key={item.key} className="flex items-center gap-1">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-600">{item.key}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-xs text-gray-700 w-24 truncate">{item.label}</span>
            <div className="flex-1 relative h-6 bg-gray-100 rounded">
              {/* Linha de conexão entre pontos */}
              {item.values.length > 1 && (
                <div
                  className="absolute top-1/2 h-0.5 bg-gray-300 -translate-y-1/2"
                  style={{
                    left: `${((Math.min(...item.values.map(v => v.value)) - minValue) / range) * 100}%`,
                    width: `${((Math.max(...item.values.map(v => v.value)) - Math.min(...item.values.map(v => v.value))) / range) * 100}%`,
                  }}
                />
              )}
              {/* Pontos */}
              {item.values.map((val, i) => {
                const position = ((val.value - minValue) / range) * 100;
                return (
                  <div
                    key={i}
                    className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${position}%`,
                      backgroundColor: val.color,
                    }}
                    title={`${val.key}: ${formatValue(val.value)}`}
                  />
                );
              })}
            </div>
            <div className="flex gap-1 w-28">
              {item.values.map((val, i) => (
                <span
                  key={i}
                  className="text-xs"
                  style={{ color: val.color }}
                >
                  {formatValue(val.value)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Escala */}
      <div className="flex justify-between text-[10px] text-gray-400 mt-2 ml-28">
        <span>{formatValue(minValue)}</span>
        <span>{formatValue((minValue + maxValue) / 2)}</span>
        <span>{formatValue(maxValue)}</span>
      </div>
    </div>
  );
}

// Componente de comparação SLA (barras duplas)
interface SLAComparisonData {
  label: string;
  sla: number;
  actual: number;
  isViolated: boolean;
}

interface SLAComparisonChartProps {
  data: SLAComparisonData[];
  title?: string;
  height?: string;
}

export function SLAComparisonChart({
  data,
  title,
  height = "h-full",
}: SLAComparisonChartProps) {
  const maxValue = Math.max(...data.flatMap((d) => [d.sla, d.actual]), 1);

  // Ordenar por maior violação
  const sortedData = [...data].sort((a, b) => {
    const violationA = a.actual - a.sla;
    const violationB = b.actual - b.sla;
    return violationB - violationA;
  });

  return (
    <div className={`flex flex-col ${height}`}>
      {title && (
        <h4 className="text-sm font-semibold text-gray-900 mb-2">{title}</h4>
      )}

      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-gray-400" />
          <span className="text-xs text-gray-600">SLA</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-green-500" />
          <span className="text-xs text-gray-600">Real (ok)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-red-500" />
          <span className="text-xs text-gray-600">Real (violado)</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {sortedData.map((item, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-700">{item.label}</span>
              <span className={`text-xs font-medium ${item.isViolated ? "text-red-600" : "text-green-600"}`}>
                {item.actual}d / {item.sla}d
              </span>
            </div>
            <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
              {/* SLA line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-gray-600 z-10"
                style={{ left: `${(item.sla / maxValue) * 100}%` }}
              />
              {/* Actual bar */}
              <div
                className={`h-full rounded-full ${item.isViolated ? "bg-red-500" : "bg-green-500"}`}
                style={{ width: `${(item.actual / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
