"use client";

interface StackedBarData {
  label: string;
  segments: {
    value: number;
    color: string;
    label: string;
  }[];
}

interface StackedBarChartProps {
  data: StackedBarData[];
  title?: string;
  showLegend?: boolean;
  showPercentage?: boolean;
  height?: string;
}

export function StackedBarChart({
  data,
  title,
  showLegend = true,
  showPercentage = true,
  height = "h-full",
}: StackedBarChartProps) {
  // Pegar todas as legendas únicas
  const legendItems = data[0]?.segments.map((s) => ({
    label: s.label,
    color: s.color,
  })) || [];

  return (
    <div className={`flex flex-col ${height}`}>
      {title && (
        <h4 className="text-sm font-semibold text-gray-900 mb-2">{title}</h4>
      )}

      {showLegend && (
        <div className="flex items-center gap-3 mb-2">
          {legendItems.map((item, i) => (
            <div key={i} className="flex items-center gap-1">
              <div
                className="w-2.5 h-2.5 rounded"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2">
        {data.map((item, index) => {
          const total = item.segments.reduce((sum, s) => sum + s.value, 0);

          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-700">{item.label}</span>
                {showPercentage && (
                  <span className="text-xs text-gray-500">{total}</span>
                )}
              </div>
              <div className="h-5 bg-gray-100 rounded-full overflow-hidden flex">
                {item.segments.map((segment, segIndex) => {
                  const percentage = total > 0 ? (segment.value / total) * 100 : 0;
                  return (
                    <div
                      key={segIndex}
                      className="h-full transition-all duration-300 flex items-center justify-center"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: segment.color,
                      }}
                      title={`${segment.label}: ${segment.value} (${percentage.toFixed(1)}%)`}
                    >
                      {percentage > 10 && (
                        <span className="text-[10px] text-white font-medium">
                          {percentage.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Gráfico de barras agrupadas
interface GroupedBarData {
  label: string;
  values: {
    key: string;
    value: number;
    color: string;
  }[];
}

interface GroupedBarChartProps {
  data: GroupedBarData[];
  title?: string;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
  height?: string;
}

export function GroupedBarChart({
  data,
  title,
  showLegend = true,
  formatValue = (v) => v.toString(),
  height = "h-full",
}: GroupedBarChartProps) {
  const maxValue = Math.max(...data.flatMap((d) => d.values.map((v) => v.value)), 1);
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
                className="w-2.5 h-2.5 rounded"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-600">{item.key}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3">
        {data.map((item, index) => (
          <div key={index}>
            <span className="text-xs text-gray-700 mb-1 block">{item.label}</span>
            <div className="space-y-1">
              {item.values.map((val, i) => {
                const percentage = (val.value / maxValue) * 100;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: val.color,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-16 text-right">
                      {formatValue(val.value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Gráfico de Waterfall/Cascata
interface WaterfallData {
  label: string;
  value: number;
  type: "start" | "add" | "subtract" | "total";
}

interface WaterfallChartProps {
  data: WaterfallData[];
  title?: string;
  formatValue?: (value: number) => string;
  height?: string;
}

export function WaterfallChart({
  data,
  title,
  formatValue = (v) => v.toString(),
  height = "h-full",
}: WaterfallChartProps) {
  // Calcular posições
  let runningTotal = 0;
  const processedData = data.map((item) => {
    let start = runningTotal;
    let end = runningTotal;

    if (item.type === "start") {
      end = item.value;
      runningTotal = item.value;
    } else if (item.type === "add") {
      end = runningTotal + item.value;
      runningTotal = end;
    } else if (item.type === "subtract") {
      end = runningTotal - item.value;
      runningTotal = end;
    } else {
      start = 0;
      end = runningTotal;
    }

    return { ...item, start, end };
  });

  const maxValue = Math.max(...processedData.map((d) => Math.max(d.start, d.end)));

  const getColor = (type: string) => {
    switch (type) {
      case "start":
        return "bg-gray-500";
      case "add":
        return "bg-green-500";
      case "subtract":
        return "bg-red-500";
      case "total":
        return "bg-blue-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className={`flex flex-col ${height}`}>
      {title && (
        <h4 className="text-sm font-semibold text-gray-900 mb-2">{title}</h4>
      )}

      <div className="flex-1 flex items-end gap-2 overflow-x-auto pb-4">
        {processedData.map((item, index) => {
          const barHeight = (Math.abs(item.end - item.start) / maxValue) * 100;
          const bottom = (Math.min(item.start, item.end) / maxValue) * 100;

          return (
            <div key={index} className="flex-1 flex flex-col items-center min-w-[40px]">
              <span className="text-xs text-gray-600 mb-1">
                {formatValue(item.value)}
              </span>
              <div className="relative w-full h-32">
                <div
                  className={`absolute w-full ${getColor(item.type)} rounded-t`}
                  style={{
                    height: `${barHeight}%`,
                    bottom: `${bottom}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-500 mt-1 text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
