"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Loader2, X } from "lucide-react";
import { ConfirmDiscardModal } from "@/components/ui/confirm-discard-modal";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { CompanyResponsiblePersonSection } from "./CompanyResponsiblePersonSection";
import { type Fornecedor, UF_LIST } from "../types";
import { useFormApiErrors } from "@/src/hooks/useFormApiErrors";
import { useModalCloseGuard } from "@/src/hooks/useModalCloseGuard";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";
import { fetchCitiesByState as fetchCitiesByStateLookup } from "@/src/lib/ibge";

interface NovoFornecedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fornecedor: Omit<Fornecedor, "id" | "createdAt">) => Promise<void> | void;
}

type ResponsavelFornecedor = {
  id: string;
  nome: string;
  cpf?: string;
  email?: string;
};

type FormData = {
  nome: string;
  razaoSocial: string;
  cnpj: string;
  email: string;
  telefone: string;
  responsavelPersonId: string;
  cep: string;
  uf: string;
  municipio: string;
  endereco: string;
  observacoes: string;
};

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  localidade?: string;
  uf?: string;
};

const INITIAL_FORM: FormData = {
  nome: "",
  razaoSocial: "",
  cnpj: "",
  email: "",
  telefone: "",
  responsavelPersonId: "",
  cep: "",
  uf: "",
  municipio: "",
  endereco: "",
  observacoes: "",
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
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

async function fetchViaCep(zipCode: string): Promise<ViaCepResponse | null> {
  const normalizedZipCode = onlyDigits(zipCode);
  if (normalizedZipCode.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${normalizedZipCode}/json/`);
  if (!response.ok) {
    throw new Error("Nao foi possivel consultar o CEP.");
  }

  const data = (await response.json()) as ViaCepResponse;
  if (data.erro) return null;
  return data;
}

function hasRequiredCompanyFields(formData: FormData) {
  return (
    formData.nome.trim().length > 0 &&
    formData.razaoSocial.trim().length > 0 &&
    formData.cnpj.trim().length > 0 &&
    formData.email.trim().length > 0 &&
    formData.telefone.trim().length > 0 &&
    formData.endereco.trim().length > 0 &&
    formData.municipio.trim().length > 0 &&
    formData.uf.trim().length > 0
  );
}

export function NovoFornecedorModal({ isOpen, onClose, onSubmit }: NovoFornecedorModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [responsavel, setResponsavel] = useState<ResponsavelFornecedor | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [isResolvingZipCode, setIsResolvingZipCode] = useState(false);
  const [zipCodeLookupError, setZipCodeLookupError] = useState<string | null>(null);
  const [municipioOptions, setMunicipioOptions] = useState<DropdownOption[]>([]);
  const [isMunicipioLoading, setIsMunicipioLoading] = useState(false);
  const [municipioLookupError, setMunicipioLookupError] = useState<string | null>(null);
  const [allowManualMunicipioEntry, setAllowManualMunicipioEntry] = useState(false);
  const {
    fieldErrors,
    globalError: submitError,
    handleSubmitError,
    clearErrors,
    setFieldErrors,
    setGlobalError,
  } = useFormApiErrors<keyof FormData>({
    fieldMap: {
      name: "nome",
      tradeName: "razaoSocial",
      cnpj: "cnpj",
      email: "email",
      phone: "telefone",
      address: "endereco",
      city: "municipio",
      state: "uf",
      responsiblePersonId: "responsavelPersonId",
    },
  });
  const resetFormState = useCallback(() => {
    setFormData(INITIAL_FORM);
    setResponsavel(undefined);
    clearErrors();
    setIsSaving(false);
    setIsResolvingZipCode(false);
    setZipCodeLookupError(null);
    setMunicipioOptions([]);
    setIsMunicipioLoading(false);
    setMunicipioLookupError(null);
    setAllowManualMunicipioEntry(false);
  }, [clearErrors]);
  const municipioDropdownOptions = useMemo(() => municipioOptions, [municipioOptions]);
  const hasFilledData = useMemo(
    () =>
      (Object.keys(INITIAL_FORM) as Array<keyof FormData>).some(
        (field) => formData[field] !== INITIAL_FORM[field]
      ),
    [formData]
  );
  const { requestClose, discardConfirmProps } = useModalCloseGuard({
    isOpen,
    shouldConfirm: hasFilledData,
    closeDisabled: isSaving,
    onClose,
    onDiscardConfirm: resetFormState,
  });

  useEffect(() => {
    if (!isOpen) {
      resetFormState();
    }
  }, [isOpen, resetFormState]);

  useEffect(() => {
    const selectedUf = formData.uf.trim().toUpperCase();

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
          getUserErrorMessage(error, "Nao foi possivel carregar os municipios da UF selecionada.")
        );
      })
      .finally(() => {
        setIsMunicipioLoading(false);
      });
  }, [formData.uf]);

  if (!isOpen) return null;

  const handleLookupZipCode = async (rawZipCode?: string) => {
    const normalizedZipCode = onlyDigits(rawZipCode ?? formData.cep);
    if (normalizedZipCode.length !== 8) {
      setZipCodeLookupError("CEP deve conter 8 digitos.");
      return;
    }

    try {
      setZipCodeLookupError(null);
      setIsResolvingZipCode(true);
      const viaCepData = await fetchViaCep(normalizedZipCode);

      if (!viaCepData) {
        setZipCodeLookupError("CEP nao encontrado.");
        return;
      }

      setFormData((prev) => {
        if (onlyDigits(prev.cep) !== normalizedZipCode) {
          return prev;
        }

        return {
          ...prev,
          cep: formatZipCode(normalizedZipCode),
          endereco: viaCepData.logradouro || prev.endereco,
          municipio: viaCepData.localidade || prev.municipio,
          uf: (viaCepData.uf || prev.uf || "").toUpperCase(),
        };
      });
    } catch (error) {
      setZipCodeLookupError(
        error instanceof Error ? error.message : "Nao foi possivel consultar o CEP.",
      );
    } finally {
      setIsResolvingZipCode(false);
    }
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();

    if (!hasRequiredCompanyFields(formData)) {
      setGlobalError(
        "Preencha os campos obrigatorios: razao social, nome fantasia, CNPJ, e-mail, telefone, endereco, cidade e UF.",
      );
      return;
    }

    const cnpjDigits = onlyDigits(formData.cnpj);
    if (cnpjDigits.length !== 14) {
      setFieldErrors((prev) => ({ ...prev, cnpj: "Informe um CNPJ valido com 14 digitos." }));
      return;
    }

    setIsSaving(true);
    clearErrors();

    try {
      await onSubmit({
        nome: formData.nome.trim(),
        razaoSocial: formData.razaoSocial.trim(),
        cnpj: cnpjDigits,
        email: formData.email.trim(),
        telefone: formData.telefone.trim(),
        responsavelPersonId: formData.responsavelPersonId || undefined,
        cep: onlyDigits(formData.cep) || undefined,
        uf: formData.uf.trim().toUpperCase(),
        municipio: formData.municipio.trim(),
        endereco: formData.endereco.trim(),
        observacoes: formData.observacoes.trim() || undefined,
        status: "ATIVO",
      });
      resetFormState();
      onClose();
    } catch (error) {
      const fallback = getUserErrorMessage(error, "Nao foi possivel cadastrar o fornecedor.");
      handleSubmitError(error, fallback);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#004225] to-[#00563A] text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/10 p-2">
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold">Novo Fornecedor</h2>
          </div>
          <button
            type="button"
          onClick={requestClose}
            disabled={isSaving}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Razao Social" required error={fieldErrors.nome}>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="Razao social da empresa"
                disabled={isSaving}
              />
            </Field>

            <Field label="Nome Fantasia" required error={fieldErrors.razaoSocial}>
              <input
                type="text"
                value={formData.razaoSocial}
                onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="Nome fantasia"
                disabled={isSaving}
              />
            </Field>

            <Field label="CNPJ" required error={fieldErrors.cnpj}>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: formatCnpj(e.target.value) })}
                maxLength={18}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="00.000.000/0000-00"
                disabled={isSaving}
              />
            </Field>

            <Field label="E-mail" required error={fieldErrors.email}>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="email@empresa.com.br"
                disabled={isSaving}
              />
            </Field>

            <Field label="Telefone" required error={fieldErrors.telefone}>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                maxLength={15}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="(00) 00000-0000"
                disabled={isSaving}
              />
            </Field>

            <Field label="CEP">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.cep}
                    onChange={(e) => {
                      const formattedZipCode = formatZipCode(e.target.value);
                      setFormData({ ...formData, cep: formattedZipCode });
                      if (onlyDigits(formattedZipCode).length === 8) {
                        void handleLookupZipCode(formattedZipCode);
                      } else {
                        setZipCodeLookupError(null);
                      }
                    }}
                    onBlur={() => {
                      if (onlyDigits(formData.cep).length === 8) {
                        void handleLookupZipCode();
                      }
                    }}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                    placeholder="00000-000"
                    maxLength={9}
                    disabled={isSaving}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void handleLookupZipCode();
                    }}
                    className="px-3 py-2 text-xs font-medium text-[#004225] border border-emerald-300 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isResolvingZipCode || isSaving}
                  >
                    {isResolvingZipCode ? "Buscando..." : "Buscar CEP"}
                  </button>
                </div>
                {zipCodeLookupError ? (
                  <p className="text-xs text-red-600">{zipCodeLookupError}</p>
                ) : null}
              </div>
            </Field>

            <Field label="Endereco" required className="md:col-span-2" error={fieldErrors.endereco}>
              <input
                type="text"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="Rua, numero e bairro"
                disabled={isSaving}
              />
            </Field>

            <Field label="Município" required error={fieldErrors.municipio}>
              {allowManualMunicipioEntry && formData.uf ? (
                <input
                  type="text"
                  value={formData.municipio}
                  onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                  placeholder="Digite a cidade"
                  disabled={isSaving}
                />
              ) : (
                <Dropdown
                  options={municipioDropdownOptions}
                  value={formData.municipio || undefined}
                  onChange={(value) => setFormData({ ...formData, municipio: value ?? "" })}
                  placeholder={
                    !formData.uf
                      ? "Selecione a UF primeiro"
                      : isMunicipioLoading
                        ? "Carregando cidades..."
                        : "Selecione a cidade"
                  }
                  disabled={!formData.uf || isMunicipioLoading || municipioDropdownOptions.length === 0 || isSaving}
                  searchable
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] bg-white"
                />
              )}
              {municipioLookupError ? (
                <p className="text-xs text-amber-600">{municipioLookupError}</p>
              ) : null}
            </Field>

            <Field label="UF" required error={fieldErrors.uf}>
              <Dropdown
                options={UF_LIST.map((uf) => ({ value: uf, label: uf }))}
                value={formData.uf || undefined}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    uf: (value ?? "").toUpperCase(),
                    municipio: "",
                  }))
                }
                placeholder="Selecione a UF"
                searchable
                disabled={isSaving}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] bg-white"
              />
            </Field>

            <div className="md:col-span-2">
              <CompanyResponsiblePersonSection
                value={formData.responsavelPersonId || undefined}
                responsavel={responsavel}
                onChange={(responsavelPersonId, nextResponsavel) => {
                  setFormData((current) => ({
                    ...current,
                    responsavelPersonId: responsavelPersonId ?? "",
                  }));
                  setResponsavel(nextResponsavel);
                }}
                disabled={isSaving}
                enabled={isOpen}
                labels={{
                  description:
                    "Opcional. Vincule uma pessoa ja cadastrada ou cadastre uma nova para usar como responsavel deste fornecedor.",
                  helperText:
                    "Esse vinculo prepara as validacoes futuras entre a empresa e pessoas ja alocadas em projetos.",
                  createModalDescription:
                    "Cadastre a pessoa e vincule-a imediatamente como responsavel deste fornecedor.",
                }}
              />
            </div>

            <Field label="Observacoes" className="md:col-span-2">
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] resize-none"
                placeholder="Observacoes adicionais"
                disabled={isSaving}
              />
            </Field>
          </div>

          {submitError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            type="button"
            onClick={requestClose}
            disabled={isSaving}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={isSaving || !hasRequiredCompanyFields(formData) || onlyDigits(formData.cnpj).length !== 14}
            className="px-6 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </span>
            ) : (
              "Adicionar Fornecedor"
            )}
          </button>
        </div>
      <ConfirmDiscardModal {...discardConfirmProps} />
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  className,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className || ""}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
