"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { MapLocation } from "./MapComponent";

export interface ContractsMapItem {
  location: string;
  city?: string | null;
  state?: string | null;
  contracts: number;
  totalValue: number;
}

interface ContractsMapProps {
  data: ContractsMapItem[];
  isLoading?: boolean;
}

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-80 bg-zinc-100 rounded-xl flex items-center justify-center">
      <div className="flex items-center gap-2 text-zinc-500">Carregando mapa...</div>
    </div>
  ),
});

const stateCenters: Record<string, [number, number]> = {
  AC: [-9.9754, -67.8243],
  AL: [-9.6498, -35.7089],
  AP: [0.0349, -51.0694],
  AM: [-3.119, -60.0217],
  BA: [-12.9714, -38.5014],
  CE: [-3.7319, -38.5267],
  DF: [-15.7939, -47.8828],
  ES: [-20.3155, -40.3128],
  GO: [-16.6864, -49.2643],
  MA: [-2.53, -44.296],
  MT: [-15.601, -56.0974],
  MS: [-20.4697, -54.6201],
  MG: [-19.9167, -43.9345],
  PA: [-1.4558, -48.4902],
  PB: [-7.1195, -34.845],
  PR: [-25.4284, -49.2733],
  PE: [-8.0476, -34.877],
  PI: [-5.0919, -42.8034],
  RJ: [-22.9068, -43.1729],
  RN: [-5.7945, -35.211],
  RS: [-30.0346, -51.2177],
  RO: [-8.7608, -63.8999],
  RR: [2.8235, -60.6753],
  SC: [-27.5949, -48.5482],
  SP: [-23.5505, -46.6333],
  SE: [-10.9472, -37.0731],
  TO: [-10.1832, -48.3336],
};

function normalizeState(state?: string | null): string {
  if (!state) return "";
  return state
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function normalizeText(value?: string | null): string {
  return value?.trim() ?? "";
}

function parseLocation(location?: string | null): { city: string | null; state: string | null } {
  const normalized = normalizeText(location);
  if (!normalized) return { city: null, state: null };

  const parts = normalized
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return { city: null, state: null };

  const parsedState = parts[parts.length - 1];
  const parsedCity = parts.slice(0, -1).join(" - ");
  const state = normalizeState(parsedState);

  return {
    city: parsedCity || null,
    state: state.length === 2 ? state : null,
  };
}

function resolveState(item: ContractsMapItem): string | null {
  const stateFromField = normalizeState(item.state);
  if (stateFromField) return stateFromField;
  return parseLocation(item.location).state;
}

function resolveCity(item: ContractsMapItem): string | null {
  const cityFromField = normalizeText(item.city);
  if (cityFromField) return cityFromField;
  return parseLocation(item.location).city;
}

function resolveLocationLabel(item: ContractsMapItem, city: string | null, state: string | null): string {
  const location = normalizeText(item.location);
  if (location) return location;
  if (city && state) return `${city} - ${state}`;
  if (city) return city;
  if (state) return state;
  return "Nao informado";
}

function toMapLocations(data: ContractsMapItem[]): MapLocation[] {
  return data.map((item, index) => {
    const city = resolveCity(item);
    const state = resolveState(item);
    const stateKey = normalizeState(state);
    const base = stateCenters[stateKey] ?? [-14.235, -51.925];
    const jitter = (index % 6) * 0.08;

    return {
      id: index + 1,
      location: resolveLocationLabel(item, city, state),
      city,
      state,
      contracts: item.contracts,
      totalValue: item.totalValue,
      lat: base[0] + jitter,
      lng: base[1] + jitter,
    };
  });
}

export function ContractsMap({ data, isLoading = false }: ContractsMapProps) {
  const mapLocations = useMemo(() => toMapLocations(data), [data]);
  const totalContracts = data.reduce((acc, item) => acc + item.contracts, 0);

  return (
    <div className="h-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h3 className="mb-6 text-lg font-semibold text-zinc-900">Mapa de Contratos</h3>

      {isLoading ? (
        <div className="h-80 bg-zinc-100 rounded-xl flex items-center justify-center text-sm text-zinc-500">
          Carregando localidades...
        </div>
      ) : (
        <div className="h-80 rounded-xl overflow-hidden border border-zinc-200">
          <MapComponent locations={mapLocations} />
        </div>
      )}

      <div className="mt-4 flex items-center justify-end gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          <span className="text-xs text-zinc-500">Contratos por localidade</span>
        </div>
        <span className="text-xs text-zinc-400">
          {totalContracts} contratos em {data.length} localidades
        </span>
      </div>
    </div>
  );
}
