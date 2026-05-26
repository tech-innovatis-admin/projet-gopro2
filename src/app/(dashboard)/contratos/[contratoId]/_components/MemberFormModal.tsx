'use client';

import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { Trash2, UserCircle, X } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { ConfirmDiscardModal } from "@/components/ui/confirm-discard-modal";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { MoneyInput } from "../desembolso/_components/MoneyImput";
import { useModalCloseGuard } from "@/src/hooks/useModalCloseGuard";
import {
  formatCPF,
  validateCPFComplete,
} from "../equipe-tecnica/_components/CPFValidator";
import {
  formatPhone,
  validatePhoneComplete,
} from "../equipe-tecnica/_components/PhoneValidator";
import {
  fetchBrazilStates as fetchBrazilStatesLookup,
  fetchCitiesByState as fetchCitiesByStateLookup,
} from "@/src/lib/ibge";
import { type ContractTypeEnum, type StatusProjectPeopleEnum } from "@/src/lib/api/types";

export type Papel =
  | "COORDENADOR"
  | "VICE_COORDENADOR"
  | "SECRETARIO"
  | "PESQUISADOR"
  | "BOLSISTA"
  | "TECNICO"
  | "OUTRO";

export const papelLabels: Record<Papel, string> = {
  COORDENADOR: "Coordenador",
  VICE_COORDENADOR: "Vice-coordenador",
  SECRETARIO: "Secretario",
  PESQUISADOR: "Pesquisador",
  BOLSISTA: "Bolsista",
  TECNICO: "Tecnico",
  OUTRO: "Outro",
};

export type MembroFormData = {
  nome: string;
  papel: Papel;
  email: string;
  telefone: string;
  cpf: string;
  birthDate: string;
  endereco: string;
  city: string;
  state: string;
  vinculo: string;
  cargaHoraria: number;
  notes: string;
  contractType: ContractTypeEnum | "";
  status: StatusProjectPeopleEnum | "";
  startDate: string;
  endDate: string;
  baseAmount: number | "";
};

function isBlank(value?: string) {
  return !value || value.trim().length === 0;
}

export function hasRequiredMemberFields(formData: MembroFormData) {
  return (
    !isBlank(formData.nome) &&
    !isBlank(formData.papel) &&
    !isBlank(formData.city) &&
    !isBlank(formData.state)
  );
}

export function defaultMemberFormData(): MembroFormData {
  return {
    nome: "",
    papel: "COORDENADOR",
    email: "",
    telefone: "",
    cpf: "",
    birthDate: "",
    endereco: "",
    city: "",
    state: "",
    vinculo: "",
    cargaHoraria: 0,
    notes: "",
    contractType: "",
    status: "",
    startDate: "",
    endDate: "",
    baseAmount: "",
  };
}
export function MemberFormModal({
  formData,
  setFormData,
  avatarFile,
  setAvatarFile,
  currentAvatarUrl,
  isSaving,
  isEditingItem,
  onSave,
  onClose,
  onDelete,
  cpfError,
  setCpfError,
  phoneError,
  setPhoneError,
  errorMessage,
}: {
  formData: MembroFormData;
  setFormData: Dispatch<SetStateAction<MembroFormData>>;
  avatarFile: File | null;
  setAvatarFile: Dispatch<SetStateAction<File | null>>;
  currentAvatarUrl: string;
  isSaving: boolean;
  isEditingItem: boolean;
  onSave: () => void;
  onClose: () => void;
  onDelete?: () => void;
  cpfError: string;
  setCpfError: Dispatch<SetStateAction<string>>;
  phoneError: string;
  setPhoneError: Dispatch<SetStateAction<string>>;
  errorMessage?: string | null;
}) {
  const avatarPreview = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : ""),
    [avatarFile],
  );
  const displayAvatarUrl = avatarPreview || currentAvatarUrl;

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const canSave =
    hasRequiredMemberFields(formData) &&
    !cpfError &&
    !phoneError;

  const [ufOptions, setUfOptions] = useState<DropdownOption[]>([]);
  const [cityOptions, setCityOptions] = useState<DropdownOption[]>([]);
  const [isUfLoading, setIsUfLoading] = useState(true);
  const [isCityLoading, setIsCityLoading] = useState(Boolean(formData.state));
  const [ufLookupError, setUfLookupError] = useState<string | null>(null);
  const [cityLookupError, setCityLookupError] = useState<string | null>(null);
  const [allowManualCityEntry, setAllowManualCityEntry] = useState(false);
  const hasFilledData =
    formData.nome.trim().length > 0 ||
    formData.papel !== "COORDENADOR" ||
    formData.cpf.trim().length > 0 ||
    formData.email.trim().length > 0 ||
    formData.telefone.trim().length > 0 ||
    formData.birthDate.trim().length > 0 ||
    formData.state.trim().length > 0 ||
    formData.city.trim().length > 0 ||
    formData.vinculo.trim().length > 0 ||
    Number(formData.cargaHoraria) > 0 ||
    formData.contractType !== "" ||
    formData.status !== "" ||
    formData.startDate.trim().length > 0 ||
    formData.endDate.trim().length > 0 ||
    (typeof formData.baseAmount === "number" && formData.baseAmount > 0) ||
    formData.endereco.trim().length > 0 ||
    formData.notes.trim().length > 0 ||
    Boolean(avatarFile);
  const { requestClose, discardConfirmProps } = useModalCloseGuard({
    isOpen: true,
    shouldConfirm: hasFilledData,
    closeDisabled: isSaving,
    onClose,
  });

  useEffect(() => {
    let isMounted = true;

    void fetchBrazilStatesLookup()
      .then((lookup) => {
        if (!isMounted) return;
        setUfOptions(lookup.options);
        setUfLookupError(lookup.message ?? null);
      })
      .catch(() => {
        if (!isMounted) return;
        setUfOptions([]);
        setUfLookupError("Não foi possível carregar os estados.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsUfLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const selectedUf = formData.state.trim().toUpperCase();
    if (!selectedUf) {
      return;
    }

    let isMounted = true;

    void fetchCitiesByStateLookup(selectedUf)
      .then((lookup) => {
        if (!isMounted) return;
        setCityOptions(lookup.options);
        setCityLookupError(lookup.message ?? null);
        setAllowManualCityEntry(lookup.allowManualEntry);
      })
      .catch(() => {
        if (!isMounted) return;
        setCityOptions([]);
        setCityLookupError("ão foi possível carregar as cidades deste estado.");
        setAllowManualCityEntry(true);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsCityLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [formData.state]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#004225] to-[#00563A] text-white">
          <div className="flex items-center gap-3">
            <UserCircle className="h-6 w-6" />
            <h2 className="text-lg font-bold">
              {isEditingItem ? "Editar Pessoa" : "Nova Pessoa"}
            </h2>
          </div>
          <button
            onClick={requestClose}
            disabled={isSaving}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {errorMessage ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {displayAvatarUrl ? (
                  <img
                    src={displayAvatarUrl}
                    alt="Pre-visualizacao"
                    className="h-16 w-16 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center">
                    <UserCircle className="h-10 w-10 text-gray-400" />
                  </div>
                )}
                <div className="text-sm text-gray-700 space-y-1">
                  <div>
                    Nome: <strong>{formData.nome || "N/A"}</strong>
                  </div>
                  <div>
                    CPF: <strong>{formData.cpf || "N/A"}</strong>
                  </div>
                  <div>
                    Papel: <strong>{papelLabels[formData.papel]}</strong>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <label
                  htmlFor="avatar-upload"
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 cursor-pointer"
                >
                  Carregar foto
                </label>
                <p className="text-xs text-gray-500 text-center">
                  JPG, PNG ou WEBP
                </p>
              </div>
            </div>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setAvatarFile(file);
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nome completo" required className="md:col-span-2">
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="Nome completo"
              />
            </Field>

            <Field label="Papel" required>
              <Dropdown
                options={Object.entries(papelLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
                value={formData.papel}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, papel: (value || prev.papel) as Papel }))
                }
                placeholder="Selecione..."
                disabled={isSaving}
                className="w-full"
              />
            </Field>

            <Field label="CPF (opcional)">
              <input
                type="text"
                value={formData.cpf}
                onChange={(e) => {
                  const formatted = formatCPF(e.target.value);
                  setFormData((prev) => ({ ...prev, cpf: formatted }));
                  if (!formatted || !formatted.trim()) {
                    setCpfError("");
                  } else if (formatted.length === 14) {
                    const validation = validateCPFComplete(formatted);
                    setCpfError(validation.errorMessage);
                  } else {
                    setCpfError("");
                  }
                }}
                onBlur={() => {
                  if (!formData.cpf || !formData.cpf.trim()) {
                    setCpfError("");
                    return;
                  }
                  const validation = validateCPFComplete(formData.cpf || "");
                  setCpfError(validation.errorMessage);
                }}
                maxLength={14}
                className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  cpfError
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-[#004225]"
                }`}
                placeholder="000.000.000-00"
              />
              {cpfError ? (
                <p className="text-xs text-red-600">{cpfError}</p>
              ) : null}
            </Field>

            <Field label="E-mail">
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value.toLowerCase() }))
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="email@dominio.com"
              />
            </Field>

            <Field label="Telefone">
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  setFormData((prev) => ({ ...prev, telefone: formatted }));
                  if (formatted.replace(/\D/g, "").length >= 10) {
                    const validation = validatePhoneComplete(formatted);
                    setPhoneError(validation.errorMessage);
                  } else {
                    setPhoneError("");
                  }
                }}
                onBlur={() => {
                  if (!formData.telefone || !formData.telefone.trim()) {
                    setPhoneError("");
                    return;
                  }
                  const validation = validatePhoneComplete(formData.telefone);
                  setPhoneError(validation.errorMessage);
                }}
                maxLength={15}
                className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  phoneError
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-[#004225]"
                }`}
                placeholder="(00) 00000-0000"
              />
              {phoneError ? (
                <p className="text-xs text-red-600">{phoneError}</p>
              ) : null}
            </Field>

            <Field label="Data de nascimento">
              <DatePicker
                value={formData.birthDate}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, birthDate: value }))
                }
              />
            </Field>

            <Field label="UF" required>
              <Dropdown
                options={ufOptions}
                value={formData.state || undefined}
                onChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    state: (value || "").toUpperCase(),
                    city: "",
                  }));
                  setCityLookupError(null);
                  setCityOptions([]);
                  setIsCityLoading(Boolean(value));
                  setAllowManualCityEntry(false);
                }}
                placeholder={isUfLoading ? "Carregando estados..." : "Selecione a UF"}
                disabled={isUfLoading || ufOptions.length === 0}
                searchable
                className="w-full"
              />
              {ufLookupError ? (
                <p className="text-xs text-amber-600">{ufLookupError}</p>
              ) : null}
            </Field>

            <Field label="Cidade" required>
              {allowManualCityEntry && formData.state ? (
                <input
                  type="text"
                  value={formData.city || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, city: e.target.value }))
                  }
                  placeholder="Digite a cidade"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                />
              ) : (
                <Dropdown
                  options={cityOptions}
                  value={formData.city || undefined}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, city: value || "" }))
                  }
                  placeholder={
                    !formData.state
                      ? "Selecione a UF primeiro"
                      : isCityLoading
                        ? "Carregando cidades..."
                        : "Selecione a cidade"
                  }
                  disabled={!formData.state || isCityLoading || cityOptions.length === 0}
                  searchable
                  className="w-full"
                />
              )}
              {cityLookupError ? (
                <p className="text-xs text-amber-600">{cityLookupError}</p>
              ) : null}
            </Field>

            <Field label="Ví­nculo institucional">
              <input
                type="text"
                value={formData.vinculo}
                onChange={(e) => setFormData((prev) => ({ ...prev, vinculo: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="Ex: Professor Associado"
              />
            </Field>

            <Field label="Carga horária (h)">
              <input
                type="number"
                min={0}
                value={formData.cargaHoraria}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cargaHoraria: Number(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
              />
            </Field>            <Field label="Tipo de contrato">
              <Dropdown
                options={[
                  { value: "", label: "Não informado" },
                  { value: "BOLSA", label: "Bolsa" },
                  { value: "RPA", label: "RPA" },
                  { value: "CLT", label: "CLT" },
                ]}
                value={formData.contractType || ""}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    contractType: (value || "") as ContractTypeEnum | "",
                  }))
                }
                placeholder="Não informado"
                disabled={isSaving}
                className="w-full"
              />
            </Field>            <Field label="Status">
              <Dropdown
                options={[
                  { value: "", label: "Não informado" },
                  { value: "PENDENTE", label: "Pendente" },
                  { value: "ATIVO", label: "Ativo" },
                  { value: "ENCERRADO", label: "Encerrado" },
                ]}
                value={formData.status || ""}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: (value || "") as StatusProjectPeopleEnum | "",
                  }))
                }
                placeholder="Não informado"
                disabled={isSaving}
                className="w-full"
              />
            </Field>

            <Field label="Data iní­cio">
              <DatePicker
                value={formData.startDate}
                onChange={(value) => setFormData((prev) => ({ ...prev, startDate: value }))}
              />
            </Field>

            <Field label="Data fim">
              <DatePicker
                value={formData.endDate}
                onChange={(value) => setFormData((prev) => ({ ...prev, endDate: value }))}
              />
            </Field>

            <Field label="Valor base (R$)">
              <MoneyInput
                valueCents={
                  typeof formData.baseAmount === "number" && Number.isFinite(formData.baseAmount)
                    ? Math.round(formData.baseAmount * 100)
                    : 0
                }
                onValueChange={(valueCents) =>
                  setFormData((prev) => ({
                    ...prev,
                    baseAmount: valueCents > 0 ? valueCents / 100 : "",
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="R$ 0,00"
              />
            </Field>

            <Field label="Endereço" className="md:col-span-2">
              <input
                type="text"
                value={formData.endereco}
                onChange={(e) => setFormData((prev) => ({ ...prev, endereco: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="Rua, número e bairro"
              />
            </Field>

            <Field label="Observações" className="md:col-span-2">
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] resize-none"
                placeholder="Observações adicionais"
              />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div>
            {isEditingItem && onDelete && (
              <button
                onClick={() => {
                  if (confirm("Deseja realmente remover esta pessoa do projeto?")) {
                    onDelete();
                  }
                }}
                className="px-4 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4 inline-block mr-2" />
                Remover do Projeto
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={requestClose}
              disabled={isSaving}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={isSaving || !canSave}
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving
                ? "Salvando..."
                : isEditingItem
                  ? "Salvar alterações"
                  : "Adicionar pessoa"}
            </button>
          </div>
        </div>
      </div>
      <ConfirmDiscardModal {...discardConfirmProps} isLoading={isSaving} />
    </div>
  );
}
function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className || ""}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      {children}
    </div>
  );
}
