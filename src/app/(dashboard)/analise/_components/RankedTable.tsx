"use client";

import { ArrowUpRight } from "lucide-react";

interface Column {
  key: string;
  label: string;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface RankedTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  title?: string;
  maxRows?: number;
  onRowClick?: (row: Record<string, unknown>) => void;
  height?: string;
  showRank?: boolean;
}

export function RankedTable({
  columns,
  data,
  title,
  maxRows = 10,
  onRowClick,
  height = "h-full",
  showRank = true,
}: RankedTableProps) {
  const displayData = data.slice(0, maxRows);

  return (
    <div className={`flex flex-col ${height}`}>
      {title && (
        <h4 className="text-sm font-semibold text-gray-900 mb-2">{title}</h4>
      )}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-50">
            <tr>
              {showRank && (
                <th className="px-2 py-1.5 text-left text-gray-500 font-medium w-8">
                  #
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-2 py-1.5 text-gray-500 font-medium ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left"
                  }`}
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
              {onRowClick && <th className="w-6"></th>}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, index) => (
              <tr
                key={index}
                className={`border-t border-gray-100 ${
                  onRowClick
                    ? "cursor-pointer hover:bg-gray-50 transition-colors"
                    : ""
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {showRank && (
                  <td className="px-2 py-2 text-gray-400 font-medium">
                    {index + 1}
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-2 py-2 ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : "text-left"
                    }`}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] ?? "")}
                  </td>
                ))}
                {onRowClick && (
                  <td className="px-2 py-2">
                    <ArrowUpRight className="h-3 w-3 text-gray-400" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Componente auxiliar para renderizar barras inline em células
export function InlineBar({
  value,
  maxValue,
  color = "default",
  showValue = true,
  formatValue = (v: number) => `${v}%`,
}: {
  value: number;
  maxValue: number;
  color?: "default" | "success" | "warning" | "danger";
  showValue?: boolean;
  formatValue?: (v: number) => string;
}) {
  const percentage = Math.min((value / maxValue) * 100, 100);

  const colorClasses = {
    default: "bg-gray-500",
    success: "bg-green-500",
    warning: "bg-orange-500",
    danger: "bg-red-500",
  };

  const bgClasses = {
    default: "bg-gray-200",
    success: "bg-green-200",
    warning: "bg-orange-200",
    danger: "bg-red-200",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 h-2 ${bgClasses[color]} rounded-full overflow-hidden`}>
        <div
          className={`h-full ${colorClasses[color]} rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <span className="text-xs text-gray-600 w-12 text-right">
          {formatValue(value)}
        </span>
      )}
    </div>
  );
}

// Badge de status
export function StatusBadge({
  status,
  size = "sm",
}: {
  status: "success" | "warning" | "danger" | "info" | "neutral";
  size?: "xs" | "sm";
  children: React.ReactNode;
}) {
  const colorClasses = {
    success: "bg-green-100 text-green-700",
    warning: "bg-orange-100 text-orange-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
    neutral: "bg-gray-100 text-gray-700",
  };

  const sizeClasses = {
    xs: "px-1.5 py-0.5 text-[10px]",
    sm: "px-2 py-0.5 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${colorClasses[status]} ${sizeClasses[size]}`}
    >
      {status === "success" && "No prazo"}
      {status === "warning" && "Atenção"}
      {status === "danger" && "Atrasado"}
      {status === "info" && "Em análise"}
      {status === "neutral" && "Pendente"}
    </span>
  );
}
