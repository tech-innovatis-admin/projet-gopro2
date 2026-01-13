"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

// Dados mock - Contratos por parceiro (ORDENADOS por volume)
const data = [
  { name: "FADEX", contratos: 85, valor: 8500000 },
  { name: "FAPTO", contratos: 18, valor: 2340000 },
  { name: "FUNCERN", contratos: 5, valor: 875000 },
  { name: "FADURPE", contratos: 3, valor: 420000 },
  { name: "FAPESQ", contratos: 2, valor: 280000 },
  { name: "FUNETEC", contratos: 2, valor: 195000 },
  { name: "INNOVATIS", contratos: 1, valor: 150000 },
].sort((a, b) => b.contratos - a.contratos); // Ordenação decrescente

// Paleta institucional Innovatis
const COLORS = {
  primary: "#004225",    // Verde escuro - destaque principal (1º lugar)
  secondary: "#00B894",  // Verde claro - secundário
  tertiary: "#34D399",   // Verde mais claro
  neutral: "#6B7280",    // Cinza - contexto
};

// Função para obter cor baseada na posição (gradiente)
const getBarColor = (index: number) => {
  if (index === 0) return COLORS.primary;
  if (index === 1) return COLORS.secondary;
  if (index === 2) return COLORS.tertiary;
  return `rgba(0, 184, 148, ${0.6 - index * 0.08})`; // Degrade para os demais
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
};

export function PartnerBarChart() {
  const totalContratos = data.reduce((acc, item) => acc + item.contratos, 0);
  const totalValor = data.reduce((acc, item) => acc + item.valor, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#004225]">
          Ranking de Contratos por Parceiro
        </h3>
        <span className="text-sm text-zinc-500">{totalContratos} contratos</span>
      </div>

      <div className="h-72 min-w-0 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
          >
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
              formatter={(value: number, name: string, props: any) => {
                const valor = props?.payload?.valor ?? 0;
                return [
                  <span key="tooltip">
                    <strong>{value}</strong> contratos • {formatCurrency(valor)}
                  </span>,
                  "",
                ];
              }}
              labelStyle={{ color: "#18181b", fontWeight: 600 }}
              cursor={{ fill: "rgba(0, 66, 37, 0.05)" }}
            />
            <Bar
              dataKey="contratos"
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(index)}
                />
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

      {/* Resumo */}
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
