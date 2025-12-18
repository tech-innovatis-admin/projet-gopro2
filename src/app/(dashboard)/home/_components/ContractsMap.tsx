"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dados mock - Localizações dos contratos ativos no Nordeste
const contractLocations = [
  { id: 1, city: "Teresina", state: "PI", lat: -5.0892, lng: -42.8019, contracts: 12 },
  { id: 2, city: "Fortaleza", state: "CE", lat: -3.7172, lng: -38.5433, contracts: 8 },
  { id: 3, city: "Natal", state: "RN", lat: -5.7945, lng: -35.211, contracts: 15 },
  { id: 4, city: "João Pessoa", state: "PB", lat: -7.1195, lng: -34.845, contracts: 6 },
  { id: 5, city: "Recife", state: "PE", lat: -8.0476, lng: -34.877, contracts: 18 },
  { id: 6, city: "Campina Grande", state: "PB", lat: -7.2306, lng: -35.8811, contracts: 4 },
  { id: 7, city: "Mossoró", state: "RN", lat: -5.1878, lng: -37.3442, contracts: 3 },
];

// Componente do mapa carregado dinamicamente (SSR disabled)
const MapComponent = dynamic(
  () => import("./MapComponent"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-80 bg-zinc-100 rounded-xl flex items-center justify-center">
        <div className="flex items-center gap-2 text-zinc-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Carregando mapa...
        </div>
      </div>
    )
  }
);

export function ContractsMap() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 h-full">
      <h3 className="text-lg font-semibold text-[#004225] mb-6">
        Mapa de Contratos
      </h3>
      
      <div className="h-80 rounded-xl overflow-hidden border border-zinc-200">
        <MapComponent locations={contractLocations} />
      </div>
      
      {/* Legenda */}
      <div className="mt-4 flex items-center justify-end gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          <span className="text-xs text-zinc-500">Contrato ativo</span>
        </div>
        <span className="text-xs text-zinc-400">
          {contractLocations.reduce((acc, loc) => acc + loc.contracts, 0)} contratos em {contractLocations.length} cidades
        </span>
      </div>
    </div>
  );
}
