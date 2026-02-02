"use client";

// Interface flexível que aceita qualquer objeto com valores numéricos
export interface LineDataPoint {
  [key: string]: string | number;
}

export interface LineSeries {
  key: string;
  label: string;
  color: string;
}

export interface LineChartProps {
  data: LineDataPoint[];
  lines: LineSeries[];
  xKey: string;
  title?: string;
  height?: string;
  formatValue?: (value: number) => string;
  showLegend?: boolean;
}

export function LineChart({
  data,
  lines,
  xKey,
  title,
  height = "h-48",
  formatValue = (v) => v.toString(),
  showLegend = true,
}: LineChartProps) {
  // Calcular valor máximo para escala
  const allValues = data.flatMap((d) =>
    lines.map((s) => {
      const val = d[s.key];
      return typeof val === "number" ? val : 0;
    })
  );
  const maxValue = Math.max(...allValues, 1);
  const minValue = 0;

  // Calcular pontos para cada série
  const getPoints = (seriesKey: string) => {
    const width = 100 / (data.length - 1 || 1);
    return data.map((point, index) => {
      const x = index * width;
      const rawValue = point[seriesKey];
      const value = typeof rawValue === "number" ? rawValue : 0;
      const y = 100 - ((value - minValue) / (maxValue - minValue)) * 100;
      return { x, y, value, label: String(point[xKey] || "") };
    });
  };

  // Criar path SVG para linha
  const createPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    return points
      .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
      .join(" ");
  };

  // Criar área preenchida
  const createAreaPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    const linePath = createPath(points);
    return `${linePath} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`;
  };

  return (
    <div className={`flex flex-col ${height}`}>
      {title && (
        <h4 className="text-sm font-semibold text-gray-900 mb-2">{title}</h4>
      )}

      {/* Legenda */}
      {showLegend && (
        <div className="flex items-center gap-4 mb-2">
          {lines.map((s) => (
            <div key={s.key} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-xs text-gray-600">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Gráfico */}
      <div className="flex-1 relative min-h-0">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Grid horizontal */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="0.5"
            />
          ))}

          {/* Áreas preenchidas */}
          {lines.map((s) => {
            const points = getPoints(s.key);
            return (
              <path
                key={`area-${s.key}`}
                d={createAreaPath(points)}
                fill={s.color}
                fillOpacity="0.1"
              />
            );
          })}

          {/* Linhas */}
          {lines.map((s) => {
            const points = getPoints(s.key);
            return (
              <path
                key={`line-${s.key}`}
                d={createPath(points)}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* Pontos */}
          {lines.map((s) => {
            const points = getPoints(s.key);
            return points.map((point, i) => (
              <circle
                key={`point-${s.key}-${i}`}
                cx={point.x}
                cy={point.y}
                r="1.5"
                fill={s.color}
                className="hover:r-3 transition-all"
              />
            ));
          })}
        </svg>

        {/* Labels do eixo X */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between transform translate-y-4">
          {data.map((point, index) => (
            <span key={index} className="text-[10px] text-gray-500">
              {String(point[xKey] || "")}
            </span>
          ))}
        </div>
      </div>

      {/* Labels do eixo Y */}
      <div className="flex justify-between text-[10px] text-gray-400 mt-5">
        <span>{formatValue(minValue)}</span>
        <span>{formatValue(maxValue / 2)}</span>
        <span>{formatValue(maxValue)}</span>
      </div>
    </div>
  );
}
