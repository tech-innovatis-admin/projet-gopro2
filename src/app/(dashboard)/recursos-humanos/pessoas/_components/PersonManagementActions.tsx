"use client";

import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Loader2, Pencil, Trash2, UserCircle, UserX, X } from "lucide-react";
import { AppModalShell } from "@/components/ui/app-modal-shell";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/DatePicker";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { deletePeople, updatePeople } from "@/src/lib/api/endpoints";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";
import { fetchBrazilStates, fetchCitiesByState } from "@/src/lib/ibge";
import type { Person } from "../types";
import {
  buildPeopleRequestPayload,
  createPersonFormData,
  formatCPF,
  formatPhone,
  getCPFValidationMessage,
  mapPeopleResponseToPerson,
  type PersonFormData,
} from "../person-utils";
import { PersonActionItem } from "./PersonActionItem";

export type PersonActionFeedback = {
  type: "success" | "error";
  message: string;
};

type PersonManagementActionsProps = {
  person: Person;
  compact?: boolean;
  onPersonUpdated: (person: Person) => void;
  onPersonDeactivated: (personId: string) => void;
  onFeedback?: (feedback: PersonActionFeedback | null) => void;
};

export function PersonManagementActions({
  person,
  compact = false,
  onPersonUpdated,
  onPersonDeactivated,
  onFeedback,
}: PersonManagementActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [formData, setFormData] = useState<PersonFormData>(() => createPersonFormData(person));
  const [cpfError, setCpfError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const resetEditState = () => {
    setFormData(createPersonFormData(person));
    setCpfError("");
    setPhoneError("");
    setFormError(null);
  };

  const openEditModal = () => {
    resetEditState();
    onFeedback?.(null);
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    if (isSaving) {
      return;
    }

    setIsEditOpen(false);
    resetEditState();
  };

  const openDeactivateModal = () => {
    setDeactivateError(null);
    onFeedback?.(null);
    setIsDeactivateOpen(true);
  };

  const closeDeactivateModal = () => {
    if (isDeactivating) {
      return;
    }

    setIsDeactivateOpen(false);
    setDeactivateError(null);
  };

  const handleSave = async () => {
    const trimmedName = formData.fullName.trim();
    if (!trimmedName) {
      setFormError("Informe o nome completo da pessoa.");
      return;
    }

    const nextCpfError = getCPFValidationMessage(formData.cpf);
    const nextPhoneError = getPhoneValidationMessage(formData.phone);

    setCpfError(nextCpfError);
    setPhoneError(nextPhoneError);

    if (nextCpfError || nextPhoneError) {
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const response = await updatePeople(person.id, buildPeopleRequestPayload(formData));
      const updatedPerson = mapPeopleResponseToPerson(response, person);
      onPersonUpdated(updatedPerson);
      onFeedback?.({
        type: "success",
        message: "Pessoa atualizada com sucesso.",
      });
      setIsEditOpen(false);
    } catch (error) {
      const message = getUserErrorMessage(error, "Nao foi possivel atualizar a pessoa.");
      setFormError(message);
      onFeedback?.({
        type: "error",
        message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    setDeactivateError(null);

    try {
      await deletePeople(person.id);
      onPersonDeactivated(person.id);
      onFeedback?.({
        type: "success",
        message: "Pessoa desativada com sucesso.",
      });
      setIsDeactivateOpen(false);
    } catch (error) {
      const message = getUserErrorMessage(error, "Nao foi possivel desativar a pessoa.");
      setDeactivateError(message);
      onFeedback?.({
        type: "error",
        message,
      });
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleRequestDeactivateFromEdit = () => {
    if (isSaving) {
      return;
    }

    setIsEditOpen(false);
    resetEditState();
    openDeactivateModal();
  };

  return (
    <>
      {compact ? (
        <div className="flex items-center gap-1">
          <PersonActionItem
            label="Editar pessoa"
            icon={<Pencil className="h-4 w-4" />}
            onClick={openEditModal}
          />
          <PersonActionItem
            label="Desativar pessoa"
            icon={<UserX className="h-4 w-4" />}
            onClick={openDeactivateModal}
            className="border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50 hover:text-red-800"
          />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={openEditModal}>
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={openDeactivateModal}
            className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          >
            <UserX className="h-4 w-4" />
            Desativar
          </Button>
        </div>
      )}

      {isEditOpen ? (
        <PersonEditModal
          person={person}
          formData={formData}
          setFormData={setFormData}
          isSaving={isSaving}
          cpfError={cpfError}
          phoneError={phoneError}
          formError={formError}
          setCpfError={setCpfError}
          setPhoneError={setPhoneError}
          setFormError={setFormError}
          onClose={closeEditModal}
          onSave={handleSave}
          onRequestDeactivate={handleRequestDeactivateFromEdit}
        />
      ) : null}

      <AppModalShell
        isOpen={isDeactivateOpen}
        onClose={closeDeactivateModal}
        title="Desativar pessoa"
        description="A pessoa deixara de aparecer na listagem ativa de pessoas em projetos."
        icon={<UserX className="h-5 w-5" />}
        tone="warning"
        maxWidthClassName="max-w-lg"
        closeDisabled={isDeactivating}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={closeDeactivateModal}
              disabled={isDeactivating}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeactivate}
              disabled={isDeactivating}
            >
              {isDeactivating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserX className="h-4 w-4" />
              )}
              {isDeactivating ? "Desativando..." : "Confirmar desativacao"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Voce esta prestes a desativar <strong>{person.fullName}</strong>.
          </p>
          {person.cpf ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              CPF: <strong>{formatCPF(person.cpf)}</strong>
            </div>
          ) : null}
          {deactivateError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {deactivateError}
            </div>
          ) : null}
        </div>
      </AppModalShell>
    </>
  );
}

function PersonEditModal({
  person,
  formData,
  setFormData,
  isSaving,
  cpfError,
  phoneError,
  formError,
  setCpfError,
  setPhoneError,
  setFormError,
  onClose,
  onSave,
  onRequestDeactivate,
}: {
  person: Person;
  formData: PersonFormData;
  setFormData: Dispatch<SetStateAction<PersonFormData>>;
  isSaving: boolean;
  cpfError: string;
  phoneError: string;
  formError: string | null;
  setCpfError: Dispatch<SetStateAction<string>>;
  setPhoneError: Dispatch<SetStateAction<string>>;
  setFormError: Dispatch<SetStateAction<string | null>>;
  onClose: () => void;
  onSave: () => void;
  onRequestDeactivate: () => void;
}) {
  const [ufOptions, setUfOptions] = useState<DropdownOption[]>([]);
  const [cityOptions, setCityOptions] = useState<DropdownOption[]>([]);
  const [isUfLoading, setIsUfLoading] = useState(true);
  const [isCityLoading, setIsCityLoading] = useState(Boolean(formData.state));
  const [ufLookupError, setUfLookupError] = useState<string | null>(null);
  const [cityLookupError, setCityLookupError] = useState<string | null>(null);
  const [allowManualCityEntry, setAllowManualCityEntry] = useState(false);

  const initials = useMemo(() => getInitials(person.fullName), [person.fullName]);
  const canSave = Boolean(formData.fullName.trim()) && !cpfError && !phoneError;

  const resolvedCityOptions = useMemo(() => {
    if (!formData.city) {
      return cityOptions;
    }

    const cityAlreadyExists = cityOptions.some((option) => option.value === formData.city);
    if (cityAlreadyExists) {
      return cityOptions;
    }

    return [{ value: formData.city, label: formData.city }, ...cityOptions];
  }, [cityOptions, formData.city]);

  useEffect(() => {
    let isMounted = true;

    void fetchBrazilStates()
      .then((lookup) => {
        if (!isMounted) return;
        setUfOptions(lookup.options);
        setUfLookupError(lookup.message ?? null);
      })
      .catch(() => {
        if (!isMounted) return;
        setUfOptions([]);
        setUfLookupError("Nao foi possivel carregar os estados.");
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

    void fetchCitiesByState(selectedUf)
      .then((lookup) => {
        if (!isMounted) return;
        setCityOptions(lookup.options);
        setCityLookupError(lookup.message ?? null);
        setAllowManualCityEntry(lookup.allowManualEntry);
      })
      .catch(() => {
        if (!isMounted) return;
        setCityOptions([]);
        setCityLookupError("Nao foi possivel carregar as cidades deste estado.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#004225] to-[#00563A] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <UserCircle className="h-6 w-6" />
            <h2 className="text-lg font-bold">Editar Pessoa</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-2 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-6">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {person.avatarUrl ? (
                  <div
                    aria-hidden="true"
                    className="h-16 w-16 rounded-full border border-gray-200 bg-cover bg-center"
                    style={{ backgroundImage: `url("${person.avatarUrl}")` }}
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
                    <span className="text-lg font-bold text-[#004225]">{initials}</span>
                  </div>
                )}
                <div className="space-y-1 text-sm text-gray-700">
                  <div>
                    Nome: <strong>{formData.fullName || "N/A"}</strong>
                  </div>
                  <div>
                    CPF: <strong>{formData.cpf || "N/A"}</strong>
                  </div>
                  <div>
                    Telefone: <strong>{formData.phone || "N/A"}</strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 sm:items-end">
                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {person.isActive ? "Cadastro ativo" : "Cadastro inativo"}
                </span>
                <p className="max-w-[180px] text-xs text-gray-500 sm:text-right">
                  Dados cadastrais usados em todas as vinculacoes da pessoa.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Nome completo" required className="md:col-span-2">
              <input
                type="text"
                value={formData.fullName}
                onChange={(event) => {
                  setFormError(null);
                  setFormData((current) => ({ ...current, fullName: event.target.value }));
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="Nome completo"
                autoFocus
              />
            </Field>

            <Field label="CPF">
              <input
                type="text"
                value={formData.cpf}
                onChange={(event) => {
                  const formatted = formatCPF(event.target.value);
                  setFormError(null);
                  setFormData((current) => ({ ...current, cpf: formatted }));

                  if (!formatted.trim()) {
                    setCpfError("");
                    return;
                  }

                  if (formatted.length === 14) {
                    setCpfError(getCPFValidationMessage(formatted));
                    return;
                  }

                  setCpfError("");
                }}
                onBlur={() => setCpfError(getCPFValidationMessage(formData.cpf))}
                maxLength={14}
                inputMode="numeric"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                  cpfError
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-[#004225]"
                }`}
                placeholder="000.000.000-00"
              />
              {cpfError ? <p className="text-xs text-red-600">{cpfError}</p> : null}
            </Field>

            <Field label="E-mail">
              <input
                type="email"
                value={formData.email}
                onChange={(event) => {
                  setFormError(null);
                  setFormData((current) => ({ ...current, email: event.target.value }));
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="email@dominio.com"
              />
            </Field>

            <Field label="Telefone">
              <input
                type="text"
                value={formData.phone}
                onChange={(event) => {
                  const formatted = formatPhone(event.target.value);
                  setFormError(null);
                  setFormData((current) => ({ ...current, phone: formatted }));

                  const digitsLength = formatted.replace(/\D/g, "").length;
                  if (!digitsLength) {
                    setPhoneError("");
                    return;
                  }

                  if (digitsLength >= 10) {
                    setPhoneError(getPhoneValidationMessage(formatted));
                    return;
                  }

                  setPhoneError("");
                }}
                onBlur={() => setPhoneError(getPhoneValidationMessage(formData.phone))}
                maxLength={15}
                inputMode="numeric"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                  phoneError
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-[#004225]"
                }`}
                placeholder="(00) 00000-0000"
              />
              {phoneError ? <p className="text-xs text-red-600">{phoneError}</p> : null}
            </Field>

            <Field label="Data de nascimento">
              <DatePicker
                value={formData.birthDate}
                onChange={(value) => {
                  setFormError(null);
                  setFormData((current) => ({ ...current, birthDate: value }));
                }}
              />
            </Field>

            <Field label="UF">
              <Dropdown
                options={ufOptions}
                value={formData.state || undefined}
                onChange={(value) => {
                  setFormError(null);
                  setFormData((current) => ({
                    ...current,
                    state: (value || "").toUpperCase(),
                    city: value === current.state ? current.city : "",
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
              {ufLookupError ? <p className="text-xs text-amber-600">{ufLookupError}</p> : null}
            </Field>

            <Field label="Cidade">
              {allowManualCityEntry && formData.state ? (
                <input
                  type="text"
                  value={formData.city}
                  onChange={(event) => {
                    setFormError(null);
                    setFormData((current) => ({ ...current, city: event.target.value }));
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#004225]"
                  placeholder="Digite a cidade"
                />
              ) : (
                <Dropdown
                  options={resolvedCityOptions}
                  value={formData.city || undefined}
                  onChange={(value) => {
                    setFormError(null);
                    setFormData((current) => ({ ...current, city: value || "" }));
                  }}
                  placeholder={
                    !formData.state
                      ? "Selecione a UF primeiro"
                      : isCityLoading
                        ? "Carregando cidades..."
                        : "Selecione a cidade"
                  }
                  disabled={
                    !formData.state || isCityLoading || resolvedCityOptions.length === 0
                  }
                  searchable
                  className="w-full"
                />
              )}
              {cityLookupError ? (
                <p className="text-xs text-amber-600">{cityLookupError}</p>
              ) : null}
            </Field>

            <Field label="Endereco" className="md:col-span-2">
              <input
                type="text"
                value={formData.address}
                onChange={(event) => {
                  setFormError(null);
                  setFormData((current) => ({ ...current, address: event.target.value }));
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="Rua, numero e complemento"
              />
            </Field>

            <Field label="Observacoes" className="md:col-span-2">
              <textarea
                value={formData.notes}
                onChange={(event) => {
                  setFormError(null);
                  setFormData((current) => ({ ...current, notes: event.target.value }));
                }}
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="Observacoes adicionais"
              />
            </Field>
          </div>

          {formError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div>
            <button
              type="button"
              onClick={onRequestDeactivate}
              disabled={isSaving}
              className="rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="mr-2 inline-block h-4 w-4" />
              Desativar pessoa
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving || !canSave}
              className="rounded-lg bg-[#004225] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#003319] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Salvando..." : "Salvar alteracoes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required = false,
  className = "",
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      {children}
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getPhoneValidationMessage(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.length < 10) {
    return "Telefone invalido. Minimo de 10 digitos.";
  }

  if (digits.length > 11) {
    return "Telefone invalido.";
  }

  const ddd = Number.parseInt(digits.slice(0, 2), 10);
  if (!Number.isInteger(ddd) || ddd < 11 || ddd > 99) {
    return "Telefone invalido.";
  }

  return "";
}
