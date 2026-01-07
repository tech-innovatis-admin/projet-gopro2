"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getFornecedorById } from "../../mockData";
import {
  type Fornecedor,
  type FornecedorCategoria,
  type FornecedorServico,
  type FornecedorStatus,
  CATEGORIA_LABELS,
  SERVICO_LABELS,
  UF_LIST,
  MUNICIPIOS_POR_UF,
  STATUS_CONFIG,
} from "../../types";

// =============================================================================
// PÁGINA DE EDIÇÃO DO FORNECEDOR
// =============================================================================

export default function EditarFornecedorPage() {
  const params = useParams();
  const router = useRouter();
  const fornecedorId = params.fornecedorId as string;

  const fornecedorOriginal = getFornecedorById(fornecedorId);

  const [formData, setFormData] = useState<Partial<Fornecedor>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Carrega dados do fornecedor
  useEffect(() => {
    if (fornecedorOriginal) {
      setFormData({
        nome: fornecedorOriginal.nome,
        razaoSocial: fornecedorOriginal.razaoSocial || "",
        cnpj: fornecedorOriginal.cnpj || "",
        email: fornecedorOriginal.email || "",
        telefone: fornecedorOriginal.telefone || "",
        uf: fornecedorOriginal.uf,
        municipio: fornecedorOriginal.municipio,
        endereco: fornecedorOriginal.endereco || "",
        categorias: [...fornecedorOriginal.categorias],
        servicos: [...fornecedorOriginal.servicos],
        status: fornecedorOriginal.status,
        observacoes: fornecedorOriginal.observacoes || "",
      });
    }
  }, [fornecedorOriginal]);

  // Municípios baseados no UF selecionado
  const municipiosDisponiveis = formData.uf
    ? MUNICIPIOS_POR_UF[formData.uf] || []
    : [];

  // Verifica se há mudanças
  useEffect(() => {
    if (!fornecedorOriginal) return;

    const changed =
      formData.nome !== fornecedorOriginal.nome ||
      formData.uf !== fornecedorOriginal.uf ||
      formData.municipio !== fornecedorOriginal.municipio ||
      formData.status !== fornecedorOriginal.status ||
      JSON.stringify(formData.categorias) !==
        JSON.stringify(fornecedorOriginal.categorias) ||
      JSON.stringify(formData.servicos) !==
        JSON.stringify(fornecedorOriginal.servicos);

    setHasChanges(changed);
  }, [formData, fornecedorOriginal]);

  // Validação
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome?.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }
    if (!formData.uf) {
      newErrors.uf = "UF é obrigatório";
    }
    if (!formData.municipio) {
      newErrors.municipio = "Município é obrigatório";
    }
    if (!formData.categorias || formData.categorias.length === 0) {
      newErrors.categorias = "Selecione pelo menos uma categoria";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSaving(true);

    // Simula delay de API
    await new Promise((resolve) => setTimeout(resolve, 800));

    // TODO: Chamar API para persistir mudanças
    // await fetch(`/api/fornecedores/${fornecedorId}`, {
    //   method: "PUT",
    //   body: JSON.stringify(formData),
    // });

    setIsSaving(false);
    
    // Mostra feedback (em produção seria um toast)
    alert("Alterações salvas com sucesso! (Mock - não persistido)");
    
    router.push(`/fornecedores/${fornecedorId}`);
  };

  // Toggle categoria
  const toggleCategoria = (cat: FornecedorCategoria) => {
    setFormData((prev) => ({
      ...prev,
      categorias: prev.categorias?.includes(cat)
        ? prev.categorias.filter((c) => c !== cat)
        : [...(prev.categorias || []), cat],
    }));
  };

  // Toggle serviço
  const toggleServico = (serv: FornecedorServico) => {
    setFormData((prev) => ({
      ...prev,
      servicos: prev.servicos?.includes(serv)
        ? prev.servicos.filter((s) => s !== serv)
        : [...(prev.servicos || []), serv],
    }));
  };

  if (!fornecedorOriginal) {
    return null; // Layout trata o erro
  }

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Aviso de mudanças não salvas */}
        {hasChanges && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              Você tem alterações não salvas. Clique em "Salvar" para persistir as mudanças.
            </p>
          </div>
        )}

        {/* Dados básicos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Dados Básicos</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nome / Razão Social *
              </label>
              <input
                type="text"
                value={formData.nome || ""}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                className={cn(
                  "w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent transition-colors",
                  errors.nome ? "border-red-500" : "border-gray-300"
                )}
                placeholder="Nome do fornecedor"
              />
              {errors.nome && (
                <p className="text-xs text-red-500 mt-1">{errors.nome}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                CNPJ
              </label>
              <input
                type="text"
                value={formData.cnpj || ""}
                onChange={(e) =>
                  setFormData({ ...formData, cnpj: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent"
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Status *
              </label>
              <select
                value={formData.status || "ATIVO"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as FornecedorStatus,
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent"
              >
                {(Object.keys(STATUS_CONFIG) as FornecedorStatus[]).map((st) => (
                  <option key={st} value={st}>
                    {STATUS_CONFIG[st].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent"
                placeholder="contato@empresa.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Telefone
              </label>
              <input
                type="text"
                value={formData.telefone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, telefone: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent"
                placeholder="(00) 0000-0000"
              />
            </div>
          </div>
        </div>

        {/* Localização */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Localização</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                UF *
              </label>
              <select
                value={formData.uf || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    uf: e.target.value,
                    municipio: "", // Limpa município ao mudar UF
                  })
                }
                className={cn(
                  "w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent",
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Município *
              </label>
              <select
                value={formData.municipio || ""}
                onChange={(e) =>
                  setFormData({ ...formData, municipio: e.target.value })
                }
                disabled={!formData.uf}
                className={cn(
                  "w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent",
                  errors.municipio ? "border-red-500" : "border-gray-300",
                  !formData.uf && "opacity-50 cursor-not-allowed"
                )}
              >
                <option value="">
                  {formData.uf ? "Selecione..." : "Selecione UF primeiro"}
                </option>
                {/* Inclui município atual mesmo que não esteja na lista */}
                {formData.municipio &&
                  !municipiosDisponiveis.includes(formData.municipio) && (
                    <option value={formData.municipio}>
                      {formData.municipio}
                    </option>
                  )}
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Endereço
              </label>
              <input
                type="text"
                value={formData.endereco || ""}
                onChange={(e) =>
                  setFormData({ ...formData, endereco: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent"
                placeholder="Rua, número"
              />
            </div>
          </div>
        </div>

        {/* Categorias */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Categorias *</h3>
            <span className="text-sm text-gray-500">
              {formData.categorias?.length || 0} selecionada(s)
            </span>
          </div>
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
                    "px-4 py-2 text-sm font-medium rounded-full border transition-colors",
                    formData.categorias?.includes(cat)
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Serviços</h3>
            <span className="text-sm text-gray-500">
              {formData.servicos?.length || 0} selecionado(s)
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SERVICO_LABELS) as FornecedorServico[]).map(
              (serv) => (
                <button
                  key={serv}
                  type="button"
                  onClick={() => toggleServico(serv)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-full border transition-colors",
                    formData.servicos?.includes(serv)
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Observações
          </label>
          <textarea
            value={formData.observacoes || ""}
            onChange={(e) =>
              setFormData({ ...formData, observacoes: e.target.value })
            }
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent resize-none"
            placeholder="Observações adicionais sobre o fornecedor..."
          />
        </div>

        {/* Ações */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/fornecedores/${fornecedorId}`)}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="gap-2 bg-[#1F4E79] hover:bg-[#153653]"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
