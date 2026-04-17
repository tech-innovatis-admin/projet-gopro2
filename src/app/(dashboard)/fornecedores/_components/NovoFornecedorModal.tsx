"use client";

import { useState } from "react";
import { X, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Fornecedor, UF_LIST, MUNICIPIOS_POR_UF } from "../types";

interface NovoFornecedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fornecedor: Omit<Fornecedor, "id" | "createdAt">) => void;
}

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  localidade?: string;
  uf?: string;
};

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function formatZipCode(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

async function fetchViaCep(zipCode: string): Promise<ViaCepResponse> {
  const normalizedZipCode = onlyDigits(zipCode);
  if (normalizedZipCode.length !== 8) throw new Error("CEP deve ter 8 dígitos.");
  const response = await fetch(`https://viacep.com.br/ws/${normalizedZipCode}/json/`);
  if (!response.ok) throw new Error("Falha ao consultar CEP.");
  const data = (await response.json()) as ViaCepResponse;
  if (data.erro) throw new Error("CEP não encontrado.");
  return data;
}

export function NovoFornecedorModal({ isOpen, onClose, onSubmit }: NovoFornecedorModalProps) {
  const [formData, setFormData] = useState({
    nome: "",
    razaoSocial: "",
    cnpj: "",
    email: "",
    telefone: "",
    cep: "",
    uf: "",
    municipio: "",
    endereco: "",
    observacoes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isZipCodeLoading, setIsZipCodeLoading] = useState(false);
  const [zipCodeLookupError, setZipCodeLookupError] = useState<string | null>(null);

  const municipiosDisponiveis = formData.uf ? MUNICIPIOS_POR_UF[formData.uf] || [] : [];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (!formData.uf) newErrors.uf = "UF é obrigatório";
    if (!formData.municipio) newErrors.municipio = "Município é obrigatório";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleZipCodeChange = async (rawValue: string) => {
    const formattedZipCode = formatZipCode(rawValue);
    const normalizedZipCode = onlyDigits(formattedZipCode);
    setFormData((prev) => ({ ...prev, cep: formattedZipCode }));

    if (normalizedZipCode.length !== 8) {
      setZipCodeLookupError(null);
      setIsZipCodeLoading(false);
      return;
    }

    setIsZipCodeLoading(true);
    setZipCodeLookupError(null);
    try {
      const viaCepData = await fetchViaCep(normalizedZipCode);
      setFormData((prev) => {
        if (onlyDigits(prev.cep || "") !== normalizedZipCode) return prev;
        return {
          ...prev,
          cep: formatZipCode(normalizedZipCode),
          uf: viaCepData.uf?.trim().toUpperCase() || prev.uf,
          municipio: viaCepData.localidade?.trim() || prev.municipio,
          endereco: viaCepData.logradouro?.trim() || prev.endereco,
        };
      });
    } catch (lookupError) {
      setZipCodeLookupError(
        lookupError instanceof Error ? lookupError.message : "Não foi possível consultar o CEP."
      );
    } finally {
      setIsZipCodeLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      ...formData,
      cnpj: onlyDigits(formData.cnpj) || undefined,
      telefone: onlyDigits(formData.telefone) || undefined,
      cep: onlyDigits(formData.cep) || undefined,
      status: "ATIVO",
    });

    setFormData({
      nome: "",
      razaoSocial: "",
      cnpj: "",
      email: "",
      telefone: "",
      cep: "",
      uf: "",
      municipio: "",
      endereco: "",
      observacoes: "",
    });
    setErrors({});
    setZipCodeLookupError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1F4E79]/10 rounded-lg">
              <Building2 className="h-5 w-5 text-[#1F4E79]" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Novo Fornecedor</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Dados Básicos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome / Razão Social *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className={cn("w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent", errors.nome ? "border-red-500" : "border-gray-300")}
                  placeholder="Nome do fornecedor"
                />
                {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                <input type="text" value={formData.cnpj} onChange={(e) => setFormData({ ...formData, cnpj: formatCnpj(e.target.value) })} maxLength={18} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent" placeholder="00.000.000/0000-00" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent" placeholder="contato@empresa.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input type="text" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })} maxLength={15} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent" placeholder="(00) 00000-0000" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Localização</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                <input type="text" value={formData.cep} onChange={(e) => void handleZipCodeChange(e.target.value)} maxLength={9} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent" placeholder="00000-000" />
                {isZipCodeLoading ? <p className="text-xs text-gray-500 mt-1">Consultando CEP...</p> : null}
                {zipCodeLookupError ? <p className="text-xs text-red-500 mt-1">{zipCodeLookupError}</p> : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UF *</label>
                <select value={formData.uf} onChange={(e) => setFormData({ ...formData, uf: e.target.value, municipio: "" })} className={cn("w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent", errors.uf ? "border-red-500" : "border-gray-300")}>
                  <option value="">Selecione...</option>
                  {UF_LIST.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
                {errors.uf && <p className="text-xs text-red-500 mt-1">{errors.uf}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Município *</label>
                <select value={formData.municipio} onChange={(e) => setFormData({ ...formData, municipio: e.target.value })} disabled={!formData.uf} className={cn("w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent", errors.municipio ? "border-red-500" : "border-gray-300", !formData.uf && "opacity-50 cursor-not-allowed")}>
                  <option value="">{formData.uf ? "Selecione..." : "Selecione UF primeiro"}</option>
                  {formData.municipio && !municipiosDisponiveis.includes(formData.municipio) && <option value={formData.municipio}>{formData.municipio}</option>}
                  {municipiosDisponiveis.map((mun) => (
                    <option key={mun} value={mun}>{mun}</option>
                  ))}
                </select>
                {errors.municipio && <p className="text-xs text-red-500 mt-1">{errors.municipio}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input type="text" value={formData.endereco} onChange={(e) => setFormData({ ...formData, endereco: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent" placeholder="Rua, número" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent resize-none" placeholder="Observações adicionais..." />
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit} className="bg-[#1F4E79] hover:bg-[#153653]">Criar Fornecedor</Button>
        </div>
      </div>
    </div>
  );
}

