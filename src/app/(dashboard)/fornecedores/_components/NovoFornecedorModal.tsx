"use client";

import { useState } from "react";
import { X, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type Fornecedor,
  type FornecedorCategoria,
  type FornecedorServico,
  CATEGORIA_LABELS,
  SERVICO_LABELS,
  UF_LIST,
  MUNICIPIOS_POR_UF,
} from "../types";

// =============================================================================
// MODAL PARA NOVO FORNECEDOR (MVP - Sem persistência real)
// =============================================================================

interface NovoFornecedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fornecedor: Omit<Fornecedor, "id" | "createdAt">) => void;
}

export function NovoFornecedorModal({
  isOpen,
  onClose,
  onSubmit,
}: NovoFornecedorModalProps) {
  const [formData, setFormData] = useState({
    nome: "",
    razaoSocial: "",
    cnpj: "",
    email: "",
    telefone: "",
    uf: "",
    municipio: "",
    endereco: "",
    categorias: [] as FornecedorCategoria[],
    servicos: [] as FornecedorServico[],
    observacoes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Municípios baseados no UF selecionado
  const municipiosDisponiveis = formData.uf
    ? MUNICIPIOS_POR_UF[formData.uf] || []
    : [];

  // Validação básica
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }
    if (!formData.uf) {
      newErrors.uf = "UF é obrigatório";
    }
    if (!formData.municipio) {
      newErrors.municipio = "Município é obrigatório";
    }
    if (formData.categorias.length === 0) {
      newErrors.categorias = "Selecione pelo menos uma categoria";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({
      ...formData,
      status: "ATIVO",
    });

    // Reset form
    setFormData({
      nome: "",
      razaoSocial: "",
      cnpj: "",
      email: "",
      telefone: "",
      uf: "",
      municipio: "",
      endereco: "",
      categorias: [],
      servicos: [],
      observacoes: "",
    });
    setErrors({});
    onClose();
  };

  // Toggle categoria
  const toggleCategoria = (cat: FornecedorCategoria) => {
    setFormData((prev) => ({
      ...prev,
      categorias: prev.categorias.includes(cat)
        ? prev.categorias.filter((c) => c !== cat)
        : [...prev.categorias, cat],
    }));
  };

  // Toggle serviço
  const toggleServico = (serv: FornecedorServico) => {
    setFormData((prev) => ({
      ...prev,
      servicos: prev.servicos.includes(serv)
        ? prev.servicos.filter((s) => s !== serv)
        : [...prev.servicos, serv],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1F4E79]/10 rounded-lg">
              <Building2 className="h-5 w-5 text-[#1F4E79]" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Novo Fornecedor
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto custom-scrollbar">
          {/* Dados básicos */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Dados Básicos
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome / Razão Social *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent",
                    errors.nome ? "border-red-500" : "border-gray-300"
                  )}
                  placeholder="Nome do fornecedor"
                />
                {errors.nome && (
                  <p className="text-xs text-red-500 mt-1">{errors.nome}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) =>
                    setFormData({ ...formData, cnpj: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent"
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent"
                  placeholder="contato@empresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) =>
                    setFormData({ ...formData, telefone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent"
                  placeholder="(00) 0000-0000"
                />
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Localização
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UF *
                </label>
                <select
                  value={formData.uf}
                  onChange={(e) =>
                    setFormData({ ...formData, uf: e.target.value, municipio: "" })
                  }
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent",
                    errors.uf ? "border-red-500" : "border-gray-300"
                  )}
                >
                  <option value="">Selecione...</option>
                  {UF_LIST.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
                {errors.uf && (
                  <p className="text-xs text-red-500 mt-1">{errors.uf}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Município *
                </label>
                <select
                  value={formData.municipio}
                  onChange={(e) =>
                    setFormData({ ...formData, municipio: e.target.value })
                  }
                  disabled={!formData.uf}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent",
                    errors.municipio ? "border-red-500" : "border-gray-300",
                    !formData.uf && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <option value="">
                    {formData.uf ? "Selecione..." : "Selecione UF primeiro"}
                  </option>
                  {municipiosDisponiveis.map((mun) => (
                    <option key={mun} value={mun}>
                      {mun}
                    </option>
                  ))}
                </select>
                {errors.municipio && (
                  <p className="text-xs text-red-500 mt-1">{errors.municipio}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) =>
                    setFormData({ ...formData, endereco: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent"
                  placeholder="Rua, número"
                />
              </div>
            </div>
          </div>

          {/* Categorias */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Categorias *
            </h3>
            {errors.categorias && (
              <p className="text-xs text-red-500">{errors.categorias}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CATEGORIA_LABELS) as FornecedorCategoria[]).map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategoria(cat)}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-full border transition-colors",
                      formData.categorias.includes(cat)
                        ? "bg-[#1F4E79] text-white border-[#1F4E79]"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    {CATEGORIA_LABELS[cat]}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Serviços */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Serviços
            </h3>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SERVICO_LABELS) as FornecedorServico[]).map(
                (serv) => (
                  <button
                    key={serv}
                    type="button"
                    onClick={() => toggleServico(serv)}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-full border transition-colors",
                      formData.servicos.includes(serv)
                        ? "bg-[#00C48B] text-white border-[#00C48B]"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    {SERVICO_LABELS[serv]}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) =>
                setFormData({ ...formData, observacoes: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent resize-none"
              placeholder="Observações adicionais..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            className="bg-[#1F4E79] hover:bg-[#153653]"
          >
            Criar Fornecedor
          </Button>
        </div>
      </div>
    </div>
  );
}
