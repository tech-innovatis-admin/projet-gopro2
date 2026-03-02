"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ContractsLineItem {
  month: string;
  contratos: number;
}

interface ContractsLineChartProps {
  data: ContractsLineItem[];
  isLoading?: boolean;
}

const COLORS = {
  line: "#0B7A4B",
  gradient: "#00B894",
  gradientEnd: "#004225",
  neutral: "#6B7280",
};

export function ContractsLineChart({
  data,
  isLoading = false,
}: ContractsLineChartProps) {
  return (
    <div className="h-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-zinc-900">Evolucao de Contratos</h3>
      </div>

      {isLoading ? (
        <div className="flex h-72 items-center justify-center text-sm text-zinc-500">
          Carregando evolucao...
        </div>
      ) : (
        <div className="h-72 min-w-0 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorContratos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.gradient} stopOpacity={0.3} />
                  <stop offset="50%" stopColor={COLORS.line} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={COLORS.gradientEnd} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: COLORS.neutral }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: COLORS.neutral }}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e4e4e7",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value: number) => [`${value} contratos`, "Total"]}
                labelStyle={{ color: "#18181b", fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="contratos"
                stroke={COLORS.line}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorContratos)"
                dot={{ fill: COLORS.line, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: COLORS.line, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

