"use client";

export interface BarData {
  label: string;
  value: number;
  maxValue?: number;
  color?: string; // Pode ser hex (#22C55E) ou variant (success, warning, etc)
  secondary?: string; // Valor secundário já formatado
  onClick?: () => void;
}

export interface HorizontalBarChartProps {
  data: BarData[];
  title?: string;
  showValues?: boolean;
  formatValue?: (value: number) => string;
  maxItems?: number;
  height?: string;
  valueLabel?: string;
}

const variantColors: Record<string, { bar: string; bg: string }> = {
  default: { bar: "#6B7280", bg: "#E5E7EB" },
  success: { bar: "#22C55E", bg: "#DCFCE7" },
  warning: { bar: "#F59E0B", bg: "#FEF3C7" },
  danger: { bar: "#EF4444", bg: "#FEE2E2" },
  info: { bar: "#3B82F6", bg: "#DBEAFE" },
};

function getColors(color?: string): { bar: string; bg: string } {
  if (!color) return variantColors.default;
  if (variantColors[color]) return variantColors[color];
  // Se for hex color, usar diretamente
  if (color.startsWith("#")) {
    return { bar: color, bg: `${color}20` }; // 20 = 12% opacity
  }
  return variantColors.default;
}

export function HorizontalBarChart({
  data,
  title,
  showValues = true,
  formatValue = (v) => v.toString(),
  maxItems = 10,
  height = "h-full",
  valueLabel,
}: HorizontalBarChartProps) {
  const displayData = data.slice(0, maxItems);
  const maxValue = Math.max(...displayData.map((d) => d.value), 1);

  return (
    <div className={`flex flex-col ${height}`}>
      {title && (
        <h4 className="text-sm font-semibold text-gray-900 mb-2">{title}</h4>
      )}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {displayData.map((item, index) => {
          const percentage = (item.value / (item.maxValue || maxValue)) * 100;
          const colors = getColors(item.color);

          return (
            <div
              key={index}
              className={`group ${item.onClick ? "cursor-pointer" : ""}`}
              onClick={item.onClick}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-700 truncate max-w-[50%] group-hover:text-gray-900">
                  {item.label}
                </span>
                <div className="flex items-center gap-2">
                  {item.secondary && (
                    <span className="text-xs text-gray-400">{item.secondary}</span>
                  )}
                  {showValues && (
                    <span className="text-xs font-medium text-gray-900">
                      {formatValue(item.value)} {valueLabel || ""}
                    </span>
                  )}
                </div>
              </div>
              <div 
                className="h-4 rounded-full overflow-hidden"
                style={{ backgroundColor: colors.bg }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300 group-hover:opacity-80"
                  style={{ 
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: colors.bar,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
