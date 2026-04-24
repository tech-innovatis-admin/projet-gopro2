"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCompanyById, updateCompany } from "@/src/lib/api/endpoints";
import { type Fornecedor, type FornecedorStatus, UF_LIST, MUNICIPIOS_POR_UF, STATUS_CONFIG } from "../../types";
import {
  getFriendlyApiError,
  mapCompanyToFornecedor,
  mapFornecedorFormToCompanyUpdateDTO,
} from "../../mappers";

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

export default function EditarFornecedorPage() {
  const params = useParams();
  const router = useRouter();
  const fornecedorId = params.fornecedorId as string;

  const [fornecedorOriginal, setFornecedorOriginal] = useState<Fornecedor | null>(null);
  const [formData, setFormData] = useState<Partial<Fornecedor>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [isZipCodeLoading, setIsZipCodeLoading] = useState(false);
  const [zipCodeLookupError, setZipCodeLookupError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const company = await getCompanyById(fornecedorId);
        if (!mounted) return;
        const fornecedor = mapCompanyToFornecedor(company);
        setFornecedorOriginal(fornecedor);
        setFormData(fornecedor);
      } catch (error) {
        if (!mounted) return;
        alert(getFriendlyApiError(error));
        router.push("/fornecedores");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [fornecedorId, router]);

  const municipiosDisponiveis = formData.uf ? MUNICIPIOS_POR_UF[formData.uf] || [] : [];

  useEffect(() => {
    if (!fornecedorOriginal) return;
    setHasChanges(JSON.stringify(formData) !== JSON.stringify(fornecedorOriginal));
  }, [formData, fornecedorOriginal]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.nome?.trim()) newErrors.nome = "Nome é obrigatório";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload = mapFornecedorFormToCompanyUpdateDTO({
        nome: formData.nome?.trim() || "",
        razaoSocial: formData.razaoSocial?.trim() || "",
        cnpj: formData.cnpj || "",
        email: formData.email || "",
        telefone: formData.telefone || "",
        responsavelPersonId: formData.responsavelPersonId,
        cep: formData.cep || "",
        uf: formData.uf || "",
        municipio: formData.municipio || "",
        endereco: formData.endereco || "",
        status: formData.status || "ATIVO",
        observacoes: formData.observacoes || "",
      });
      await updateCompany(fornecedorId, payload);
      alert("Fornecedor atualizado com sucesso!");
      router.push(`/fornecedores/${fornecedorId}`);
    } catch (error) {
      alert(getFriendlyApiError(error));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <p className="p-6">Carregando...</p>;
  if (!fornecedorOriginal) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {hasChanges && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              Você tem alterações não salvas. Clique em &quot;Salvar&quot; para persistir as mudanças.
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Dados Básicos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome / Razão Social *</label>
              <input
                type="text"
                value={formData.nome || ""}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className={cn(
                  "w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent transition-colors",
                  errors.nome ? "border-red-500" : "border-gray-300"
                )}
                placeholder="Nome do fornecedor"
              />
              {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CNPJ</label>
              <input
                type="text"
                value={formData.cnpj || ""}
                onChange={(e) => setFormData({ ...formData, cnpj: formatCnpj(e.target.value) })}
                maxLength={18}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent"
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status *</label>
              <select
                value={formData.status || "ATIVO"}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as FornecedorStatus })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent"
                placeholder="contato@empresa.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
              <input
                type="text"
                value={formData.telefone || ""}
                onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                maxLength={15}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Localização</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CEP</label>
              <input
                type="text"
                value={formData.cep || ""}
                onChange={(e) => void handleZipCodeChange(e.target.value)}
                maxLength={9}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent"
                placeholder="00000-000"
              />
              {isZipCodeLoading ? <p className="text-xs text-gray-500 mt-1">Consultando CEP...</p> : null}
              {zipCodeLookupError ? <p className="text-xs text-red-500 mt-1">{zipCodeLookupError}</p> : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">UF *</label>
              <select
                value={formData.uf || ""}
                onChange={(e) => setFormData({ ...formData, uf: e.target.value, municipio: "" })}
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
              {errors.uf && <p className="text-xs text-red-500 mt-1">{errors.uf}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Município *</label>
              <select
                value={formData.municipio || ""}
                onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                disabled={!formData.uf}
                className={cn(
                  "w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent",
                  errors.municipio ? "border-red-500" : "border-gray-300",
                  !formData.uf && "opacity-50 cursor-not-allowed"
                )}
              >
                <option value="">{formData.uf ? "Selecione..." : "Selecione UF primeiro"}</option>
                {formData.municipio && !municipiosDisponiveis.includes(formData.municipio) && (
                  <option value={formData.municipio}>{formData.municipio}</option>
                )}
                {municipiosDisponiveis.map((mun) => (
                  <option key={mun} value={mun}>
                    {mun}
                  </option>
                ))}
              </select>
              {errors.municipio && <p className="text-xs text-red-500 mt-1">{errors.municipio}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Endereço</label>
              <input
                type="text"
                value={formData.endereco || ""}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent"
                placeholder="Rua, número"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
          <textarea
            value={formData.observacoes || ""}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F4E79] focus:border-transparent resize-none"
            placeholder="Observações adicionais sobre o fornecedor..."
          />
        </div>

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
          <Button type="submit" disabled={isSaving} className="gap-2 bg-[#1F4E79] hover:bg-[#153653]">
            <Save className="h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}

