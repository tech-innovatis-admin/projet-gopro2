"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Save,
  X,
  Users,
  Building,
  GraduationCap,
  MapPin,
  Mail,
  Phone,
  Globe,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDiscardModal } from "@/components/ui/confirm-discard-modal";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import { useFormApiErrors } from "@/src/hooks/useFormApiErrors";
import { useModalCloseGuard } from "@/src/hooks/useModalCloseGuard";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";
import { fetchCitiesByState as fetchCitiesByStateLookup } from "@/src/lib/ibge";
import { getPartnerById, updatePartner } from "@/src/lib/api/endpoints";
import {
  type ParceiroTipo,
  type ParceiroStatus,
  UF_LIST,
} from "../../types";
import {
  mapPartnerToParceiro,
  mapParceiroFormToPartnerRequestDTO,
} from "../../mappers";

// ---------------------------------------------------------------------------
// Helpers (idênticos ao NovoParceiroModal)
// ---------------------------------------------------------------------------

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
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  localidade?: string;
  uf?: string;
};

async function fetchViaCep(zipCode: string): Promise<ViaCepResponse> {
  const normalized = onlyDigits(zipCode);
  if (normalized.length !== 8) throw new Error("CEP deve ter 8 dígitos.");
  const res = await fetch(`https://viacep.com.br/ws/${normalized}/json/`);
  if (!res.ok) throw new Error("Falha ao consultar CEP.");
  const data = (await res.json()) as ViaCepResponse;
  if (data.erro) throw new Error("CEP não encontrado.");
  return data;
}

// ---------------------------------------------------------------------------
// Form type
// ---------------------------------------------------------------------------

type FormData = {
  nome: string;
  sigla: string;
  tipo: ParceiroTipo | "";
  cnpj: string;
  email: string;
  telefone: string;
  site: string;
  cep: string;
  uf: string;
  municipio: string;
  endereco: string;
  status: ParceiroStatus;
  observacoes: string;
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EditarParceiroPage() {
  const params = useParams();
  const router = useRouter();
  const parceiroId = params.parceiroId as string;

  const [form, setForm] = useState<FormData | null>(null);
  const [originalForm, setOriginalForm] = useState<FormData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isZipCodeLoading, setIsZipCodeLoading] = useState(false);
  const [zipCodeLookupError, setZipCodeLookupError] = useState<string | null>(null);
  const [municipioOptions, setMunicipioOptions] = useState<DropdownOption[]>([]);
  const [isMunicipioLoading, setIsMunicipioLoading] = useState(false);
  const [municipioLookupError, setMunicipioLookupError] = useState<string | null>(null);
  const [allowManualMunicipioEntry, setAllowManualMunicipioEntry] = useState(false);

  const {
    fieldErrors: apiFieldErrors,
    globalError: submitError,
    clearErrors,
    handleSubmitError,
  } = useFormApiErrors<keyof FormData>({
    fieldMap: {
      name: "nome",
      acronym: "sigla",
      cnpj: "cnpj",
      email: "email",
      phone: "telefone",
      site: "site",
      address: "endereco",
      city: "municipio",
      state: "uf",
    },
  });

  // -------------------------------------------------------------------------
  // Load
  // -------------------------------------------------------------------------

  useEffect(() => {
    async function load() {
      try {
        const response = await getPartnerById(parceiroId);
        const parceiro = mapPartnerToParceiro(response, []);
        const initial: FormData = {
          nome: parceiro.nome ?? "",
          sigla: parceiro.sigla ?? "",
          tipo: parceiro.tipo ?? "",
          cnpj: parceiro.cnpj ?? "",
          email: parceiro.email ?? "",
          telefone: formatPhone(parceiro.telefone ?? ""),
          site: parceiro.site ?? "",
          cep: "",
          uf: parceiro.uf ?? "",
          municipio: parceiro.municipio ?? "",
          endereco: parceiro.endereco ?? "",
          status: parceiro.status ?? "ATIVO",
          observacoes: parceiro.observacoes ?? "",
        };
        setForm(initial);
        setOriginalForm(initial);
      } catch {
        setLoadError(true);
      }
    }
    void load();
  }, [parceiroId]);

  // -------------------------------------------------------------------------
  // Change detection & close guard
  // -------------------------------------------------------------------------

  const hasChanges = useMemo(() => {
    if (!form || !originalForm) return false;
    return JSON.stringify(form) !== JSON.stringify(originalForm);
  }, [form, originalForm]);

  const navigateBack = useCallback(() => {
    router.push(`/parceiros/${parceiroId}`);
  }, [parceiroId, router]);

  const { requestClose, discardConfirmProps } = useModalCloseGuard({
    isOpen: true,
    shouldConfirm: hasChanges,
    closeDisabled: isSaving,
    closeOnEscape: false,
    onClose: navigateBack,
  });

  // -------------------------------------------------------------------------
  // Field helpers
  // -------------------------------------------------------------------------

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  // -------------------------------------------------------------------------
  // IBGE — municípios por UF
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!form) return;
    const selectedUf = form.uf.trim().toUpperCase();

    setMunicipioLookupError(null);
    setAllowManualMunicipioEntry(false);

    if (!selectedUf) {
      setMunicipioOptions([]);
      setIsMunicipioLoading(false);
      return;
    }

    setIsMunicipioLoading(true);

    void fetchCitiesByStateLookup(selectedUf)
      .then((lookup) => {
        setMunicipioOptions(lookup.options);
        setAllowManualMunicipioEntry(lookup.allowManualEntry);
        setMunicipioLookupError(lookup.message ?? null);
      })
      .catch((error) => {
        setMunicipioOptions([]);
        setAllowManualMunicipioEntry(true);
        setMunicipioLookupError(
          getUserErrorMessage(error, "Não foi possível carregar os municípios da UF selecionada.")
        );
      })
      .finally(() => setIsMunicipioLoading(false));
  }, [form?.uf]);

  // -------------------------------------------------------------------------
  // CEP — ViaCep
  // -------------------------------------------------------------------------

  const handleZipCodeChange = useCallback(async (rawValue: string) => {
    const formatted = formatZipCode(rawValue);
    const normalized = onlyDigits(formatted);

    setForm((prev) => (prev ? { ...prev, cep: formatted } : prev));

    if (normalized.length !== 8) {
      setZipCodeLookupError(null);
      setIsZipCodeLoading(false);
      return;
    }

    setIsZipCodeLoading(true);
    setZipCodeLookupError(null);

    try {
      const data = await fetchViaCep(normalized);
      setForm((prev) => {
        if (!prev || onlyDigits(prev.cep) !== normalized) return prev;
        return {
          ...prev,
          cep: formatZipCode(normalized),
          uf: data.uf?.trim().toUpperCase() || prev.uf,
          municipio: data.localidade?.trim() || prev.municipio,
          endereco: data.logradouro?.trim() || prev.endereco,
        };
      });
    } catch (err) {
      setZipCodeLookupError(
        err instanceof Error ? err.message : "Não foi possível consultar o CEP."
      );
    } finally {
      setIsZipCodeLoading(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  const validate = (): boolean => {
    if (!form) return false;
    const errors: Partial<Record<keyof FormData, string>> = {};
    if (!form.nome.trim()) errors.nome = "Nome é obrigatório";
    if (!form.tipo) errors.tipo = "Selecione o tipo";
    if (!form.cnpj.trim()) errors.cnpj = "CNPJ é obrigatório";
    if (!form.municipio.trim()) errors.municipio = "Município é obrigatório";
    if (!form.uf.trim()) errors.uf = "UF é obrigatória";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !validate()) return;

    setIsSaving(true);
    clearErrors();

    try {
      const payload = mapParceiroFormToPartnerRequestDTO({
        nome: form.nome.trim(),
        sigla: form.sigla.trim(),
        tipo: form.tipo as ParceiroTipo,
        cnpj: form.cnpj.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim(),
        site: form.site.trim(),
        cep: onlyDigits(form.cep),
        uf: form.uf.trim(),
        municipio: form.municipio.trim(),
        endereco: form.endereco.trim(),
        status: form.status,
        observacoes: form.observacoes.trim(),
      });

      await updatePartner(parceiroId, payload);
      router.push(`/parceiros/${parceiroId}`);
    } catch (submitFailure) {
      const fallback = getUserErrorMessage(
        submitFailure,
        "Não foi possível atualizar o parceiro."
      );
      handleSubmitError(submitFailure, fallback);
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (loadError) {
    return (
      <div className="flex items-center justify-center py-20 text-center">
        <p className="text-sm text-red-600">Não foi possível carregar os dados do parceiro.</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-500">Carregando...</p>
      </div>
    );
  }

  const municipioDropdownOptions = municipioOptions;

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto py-6 space-y-6">

        {/* Tipo */}
        <div className="bg-white p-6 rounded-xl border space-y-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            Tipo de Parceiro <span className="text-red-500">*</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleChange("tipo", "IFES")}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all",
                form.tipo === "IFES"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50"
              )}
            >
              <GraduationCap className="h-5 w-5" />
              <span className="font-medium">Instituto Federal</span>
            </button>
            <button
              type="button"
              onClick={() => handleChange("tipo", "FUNDACAO")}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all",
                form.tipo === "FUNDACAO"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
              )}
            >
              <Building className="h-5 w-5" />
              <span className="font-medium">Fundação</span>
            </button>
          </div>
          {formErrors.tipo && <p className="text-xs text-red-600">{formErrors.tipo}</p>}
        </div>

        {/* Dados básicos */}
        <div className="bg-white p-6 rounded-xl border space-y-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            Dados Básicos
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                placeholder="Ex.: Instituto Federal do Maranhão"
                className={cn(
                  "w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors",
                  formErrors.nome || apiFieldErrors.nome ? "border-red-300" : "border-gray-200"
                )}
              />
              {(formErrors.nome || apiFieldErrors.nome) && (
                <p className="text-xs text-red-600">{formErrors.nome || apiFieldErrors.nome}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Sigla</label>
              <input
                type="text"
                value={form.sigla}
                onChange={(e) => handleChange("sigla", e.target.value.toUpperCase())}
                placeholder="Ex.: IFMA"
                maxLength={10}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              CNPJ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.cnpj}
              onChange={(e) => handleChange("cnpj", formatCnpj(e.target.value))}
              placeholder="00.000.000/0001-00"
              maxLength={18}
              className={cn(
                "w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors",
                formErrors.cnpj || apiFieldErrors.cnpj ? "border-red-300" : "border-gray-200"
              )}
            />
            {(formErrors.cnpj ?? apiFieldErrors.cnpj) && (
              <p className="text-xs text-red-600">{formErrors.cnpj ?? apiFieldErrors.cnpj}</p>
            )}
          </div>
        </div>

        {/* Endereço */}
        <div className="bg-white p-6 rounded-xl border space-y-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            Endereço
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">CEP</label>
              <input
                type="text"
                value={form.cep}
                onChange={(e) => { void handleZipCodeChange(e.target.value); }}
                placeholder="00000-000"
                maxLength={9}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors"
              />
              {isZipCodeLoading && (
                <p className="text-xs text-gray-500">Consultando CEP...</p>
              )}
              {zipCodeLookupError && (
                <p className="text-xs text-red-600">{zipCodeLookupError}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                UF <span className="text-red-500">*</span>
              </label>
              <Dropdown
                options={UF_LIST.map((uf) => ({ label: uf, value: uf }))}
                value={form.uf}
                onChange={(value) => {
                  setForm((prev) =>
                    prev ? { ...prev, uf: (value ?? "").toUpperCase(), municipio: "" } : prev
                  );
                  setMunicipioLookupError(null);
                  setAllowManualMunicipioEntry(false);
                  setFormErrors((prev) => ({ ...prev, uf: undefined }));
                }}
                placeholder="Selecione"
                className={cn(
                  "w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors bg-white",
                  formErrors.uf || apiFieldErrors.uf ? "border-red-300" : "border-gray-200"
                )}
              />
              {(formErrors.uf || apiFieldErrors.uf) && (
                <p className="text-xs text-red-600">{formErrors.uf || apiFieldErrors.uf}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Município <span className="text-red-500">*</span>
              </label>
              {allowManualMunicipioEntry && form.uf ? (
                <input
                  type="text"
                  value={form.municipio}
                  onChange={(e) => handleChange("municipio", e.target.value)}
                  placeholder="Digite o município"
                  className={cn(
                    "w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors",
                    formErrors.municipio ? "border-red-300" : "border-gray-200"
                  )}
                />
              ) : (
                <Dropdown
                  options={municipioDropdownOptions}
                  value={form.municipio || undefined}
                  onChange={(value) => {
                    handleChange("municipio", value ?? "");
                    setFormErrors((prev) => ({ ...prev, municipio: undefined }));
                  }}
                  placeholder={
                    !form.uf
                      ? "Selecione a UF primeiro"
                      : isMunicipioLoading
                        ? "Carregando municípios..."
                        : "Selecione o município"
                  }
                  disabled={!form.uf || isMunicipioLoading || municipioDropdownOptions.length === 0}
                  searchable
                  className={cn(
                    "w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors bg-white",
                    formErrors.municipio || apiFieldErrors.municipio ? "border-red-300" : "border-gray-200"
                  )}
                />
              )}
              {municipioLookupError && (
                <p className="text-xs text-amber-600">{municipioLookupError}</p>
              )}
              {(formErrors.municipio || apiFieldErrors.municipio) && (
                <p className="text-xs text-red-600">
                  {formErrors.municipio || apiFieldErrors.municipio}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Endereço Completo</label>
              <input
                type="text"
                value={form.endereco}
                onChange={(e) => handleChange("endereco", e.target.value)}
                placeholder="Ex.: Av. Getúlio Vargas, 04"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="bg-white p-6 rounded-xl border space-y-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            Contato
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="contato@parceiro.edu.br"
                className={cn(
                  "w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors",
                  formErrors.email || apiFieldErrors.email ? "border-red-300" : "border-gray-200"
                )}
              />
              {(formErrors.email || apiFieldErrors.email) && (
                <p className="text-xs text-red-600">{formErrors.email || apiFieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Phone className="h-4 w-4 text-gray-400" />
                Telefone
              </label>
              <input
                type="tel"
                value={form.telefone}
                onChange={(e) => handleChange("telefone", formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Globe className="h-4 w-4 text-gray-400" />
              Website
            </label>
            <input
              type="url"
              value={form.site}
              onChange={(e) => handleChange("site", e.target.value)}
              placeholder="https://www.parceiro.edu.br"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors"
            />
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white p-6 rounded-xl border space-y-2">
          <label className="text-sm font-medium text-gray-700">Observações</label>
          <textarea
            value={form.observacoes}
            onChange={(e) => handleChange("observacoes", e.target.value)}
            placeholder="Informações adicionais sobre o parceiro..."
            rows={3}
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225] transition-colors resize-none"
          />
        </div>

        {/* Erro global da API */}
        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={requestClose}
            disabled={isSaving}
            className="px-5"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="px-5 bg-[#004225] hover:bg-[#003319]"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>

      <ConfirmDiscardModal {...discardConfirmProps} />
    </>
  );
}
