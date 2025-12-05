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
} from "recharts";

// Dados mock - Contratos por parceiro
const data = [
  { name: "FADEX", contratos: 85 },
  { name: "FAPTO", contratos: 18 },
  { name: "FUNCERN", contratos: 5 },
  { name: "FADURPE", contratos: 3 },
  { name: "FAPESQ", contratos: 2 },
  { name: "FUNETEC", contratos: 2 },
  { name: "INNOVATIS", contratos: 1 },
];

export function PartnerBarChart() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 h-full">
      <h3 className="text-lg font-semibold text-zinc-900 mb-6">
        Contratos por parceiro
      </h3>

      <div className="h-72 min-w-0 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#71717a" }}
              domain={[0, "dataMax + 10"]}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#71717a" }}
              width={80}
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
              cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
            />
            <Bar
              dataKey="contratos"
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? "#3B82F6" : "#93C5FD"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
