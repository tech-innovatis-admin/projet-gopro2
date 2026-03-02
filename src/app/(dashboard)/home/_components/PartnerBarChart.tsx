"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface PartnerBarItem {
  name: string;
  contratos: number;
  valor: number;
}

interface PartnerBarChartProps {
  data: PartnerBarItem[];
  isLoading?: boolean;
}

const COLORS = {
  primary: "#004225",
  secondary: "#00B894",
  tertiary: "#34D399",
  neutral: "#6B7280",
};

const getBarColor = (index: number) => {
  if (index === 0) return COLORS.primary;
  if (index === 1) return COLORS.secondary;
  if (index === 2) return COLORS.tertiary;
  return `rgba(0, 184, 148, ${Math.max(0.2, 0.6 - index * 0.08)})`;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export function PartnerBarChart({ data, isLoading = false }: PartnerBarChartProps) {
  const totalContratos = data.reduce((acc, item) => acc + item.contratos, 0);
  const totalValor = data.reduce((acc, item) => acc + item.valor, 0);

  return (
    <div className="h-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-zinc-900">Ranking de Contratos por Parceiro</h3>
        <span className="text-sm text-zinc-500">{totalContratos} contratos</span>
      </div>

      {isLoading ? (
        <div className="h-72 flex items-center justify-center text-sm text-zinc-500">
          Carregando parceiros...
        </div>
      ) : (
        <div className="h-72 min-w-0 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: COLORS.neutral }}
                domain={[0, "dataMax + 10"]}
              />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#18181b", fontWeight: 500 }}
                width={75}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e4e4e7",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value, _name, item) => {
                  const contracts = typeof value === "number" ? value : Number(value ?? 0);
                  const payload = item?.payload as PartnerBarItem | undefined;
                  const partnerValue = payload?.valor ?? 0;
                  return [`${contracts} contratos • ${formatCurrency(partnerValue)}`, ""];
                }}
                labelStyle={{ color: "#18181b", fontWeight: 600 }}
                cursor={{ fill: "rgba(0, 66, 37, 0.05)" }}
              />
              <Bar dataKey="contratos" radius={[0, 4, 4, 0]} maxBarSize={24}>
                {data.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={getBarColor(index)} />
                ))}
                <LabelList
                  dataKey="contratos"
                  position="right"
                  fill={COLORS.neutral}
                  fontSize={12}
                  fontWeight={600}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="pt-4 border-t border-zinc-100 mt-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">Valor total dos contratos</span>
          <span className="text-lg font-bold" style={{ color: COLORS.primary }}>
            {formatCurrency(totalValor)}
          </span>
        </div>
      </div>
    </div>
  );
}
