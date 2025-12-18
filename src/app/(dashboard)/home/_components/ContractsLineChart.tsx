"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

// Dados mock - Evolução mensal dos contratos em 2025
const data = [
  { month: "Jan/25", contratos: 2 },
  { month: "Fev/25", contratos: 3 },
  { month: "Mar/25", contratos: 5 },
  { month: "Abr/25", contratos: 4 },
  { month: "Mai/25", contratos: 6 },
  { month: "Jun/25", contratos: 0 },
  { month: "Jul/25", contratos: 1 },
  { month: "Ago/25", contratos: 2 },
  { month: "Set/25", contratos: 27 },
  { month: "Out/25", contratos: 5 },
  { month: "Nov/25", contratos: 1 },
  { month: "Dez/25", contratos: 3 },
];

// Paleta institucional - Degradê verde Innovatis
const COLORS = {
  line: "#0B7A4B",       // Verde médio - linha principal
  gradient: "#00B894",   // Verde-água - início do degradê
  gradientEnd: "#004225", // Verde escuro - fim do degradê
  neutral: "#6B7280",    // Cinza - contexto
};

export function ContractsLineChart() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 h-full">
      <h3 className="text-lg font-semibold text-[#004225] mb-6">
        Evolução dos Contratos
      </h3>

      <div className="h-72 min-w-0 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
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
    </div>
  );
}
