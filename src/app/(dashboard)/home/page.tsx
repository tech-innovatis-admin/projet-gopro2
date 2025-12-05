"use client";

import { NavBar } from "@/components/ui/NavBar";
import { CategoryPieChart, ContractsLineChart, PartnerBarChart, ContractsMap } from "./_components";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-zinc-900 mb-2">
                  Bem-vindo a GoPro2
                </h1>
                <p className="text-zinc-600">
                  Gerenciar com eficiência e inteligência
                </p>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-zinc-500">Olá,</p>
                  <p className="text-lg font-semibold text-zinc-900">Administrador</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#004225] to-[#00B894] flex items-center justify-center text-white font-semibold">
                  A
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Total de Contratos</p>
                  <p className="text-2xl font-bold text-zinc-900">116</p>
                  <p className="text-sm font-medium text-[#004225] mt-1">R$ 19.247.850,00</p>
                </div>
                <div className="p-3 bg-[#004225]/10 rounded-lg">
                  <svg className="h-6 w-6 text-[#004225]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Projetos em Andamento</p>
                  <p className="text-2xl font-bold text-zinc-900">42</p>
                  <p className="text-sm font-medium text-[#00B894] mt-1">R$ 8.423.120,00</p>
                </div>
                <div className="p-3 bg-[#00B894]/10 rounded-lg">
                  <svg className="h-6 w-6 text-[#00B894]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Projetos Concluídos</p>
                  <p className="text-2xl font-bold text-zinc-900">58</p>
                  <p className="text-sm font-medium text-[#004225] mt-1">R$ 9.124.730,00</p>
                </div>
                <div className="p-3 bg-[#004225]/10 rounded-lg">
                  <svg className="h-6 w-6 text-[#004225]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Projetos Suspensos</p>
                  <p className="text-2xl font-bold text-zinc-900">16</p>
                  <p className="text-sm font-medium text-orange-600 mt-1">R$ 1.700.000,00</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 1 - Pie Chart + Line Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryPieChart />
            <ContractsLineChart />
          </div>

          {/* Charts Row 2 - Map + Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ContractsMap />
            <PartnerBarChart />
          </div>
        </div>
      </main>
    </div>
  );
}
