"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, UserCircle2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppModalShell } from "@/components/ui/app-modal-shell";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { createPeople, listPeople } from "@/src/lib/api/endpoints";
import type { PeopleRequestDTO, PeopleResponseDTO } from "@/src/lib/api/types";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";
import { fetchAllPages } from "@/src/lib/partners/metrics";
import { UF_LIST } from "../types";

type CompanyResponsiblePerson = {
  id: string;
  nome: string;
  cpf?: string;
  email?: string;
};

type CompanyResponsiblePersonSectionProps = {
  value?: string;
  responsavel?: CompanyResponsiblePerson;
  onChange: (
    responsavelPersonId?: string,
    responsavel?: CompanyResponsiblePerson,
  ) => void;
  disabled?: boolean;
  enabled?: boolean;
  labels?: Partial<ResponsiblePersonSectionLabels>;
};

type ResponsiblePersonSectionLabels = {
  title: string;
  description: string;
  createButton: string;
  selectPlaceholder: string;
  helperText: string;
  selectedTitle: string;
  removeButton: string;
  createModalTitle: string;
  createModalDescription: string;
};

type CreatePersonFormState = {
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  city: string;
  state: string;
};

const DEFAULT_CREATE_PERSON_FORM: CreatePersonFormState = {
  fullName: "",
  cpf: "",
  email: "",
  phone: "",
  city: "",
  state: "",
};

const DEFAULT_LABELS: ResponsiblePersonSectionLabels = {
  title: "Responsavel da empresa",
  description:
    "Opcional. Vincule uma pessoa ja cadastrada ou cadastre uma nova para usar como responsavel desta empresa.",
  createButton: "Nova pessoa",
  selectPlaceholder: "Selecione uma pessoa responsavel",
  helperText:
    "Use este vinculo para preparar as validacoes futuras entre a empresa e pessoas ja alocadas em projetos.",
  selectedTitle: "Responsavel selecionado",
  removeButton: "Remover responsavel",
  createModalTitle: "Nova pessoa responsavel",
  createModalDescription:
    "Cadastre a pessoa e vincule-a imediatamente como responsavel desta empresa.",
};

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
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

function normalizeCpf(raw?: string | null): string | undefined {
  const digits = onlyDigits(raw ?? "");
  if (digits.length !== 11) {
    return undefined;
  }

  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

function mapPersonToResponsavel(person: PeopleResponseDTO): CompanyResponsiblePerson {
  return {
    id: String(person.id),
    nome: person.fullName,
    cpf: normalizeCpf(person.cpf),
    email: person.email ?? undefined,
  };
}

function buildOptionLabel(person: PeopleResponseDTO): string {
  const cpf = normalizeCpf(person.cpf);
  return cpf ? `${person.fullName} - CPF ${cpf}` : person.fullName;
}

export function CompanyResponsiblePersonSection({
  value,
  responsavel,
  onChange,
  disabled = false,
  enabled = true,
  labels,
}: CompanyResponsiblePersonSectionProps) {
  const resolvedLabels = {
    ...DEFAULT_LABELS,
    ...labels,
  };

  const [people, setPeople] = useState<PeopleResponseDTO[]>([]);
  const [isLoadingPeople, setIsLoadingPeople] = useState(false);
  const [peopleError, setPeopleError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let isMounted = true;

    const loadPeople = async () => {
      setIsLoadingPeople(true);
      setPeopleError(null);

      try {
        const loadedPeople = await fetchAllPages<PeopleResponseDTO>((params) => listPeople(params));
        if (!isMounted) {
          return;
        }

        setPeople(
          loadedPeople
            .filter((person) => Boolean(person.isActive))
            .sort((first, second) => first.fullName.localeCompare(second.fullName, "pt-BR")),
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setPeopleError(
          getUserErrorMessage(error, "Nao foi possivel carregar as pessoas cadastradas."),
        );
      } finally {
        if (isMounted) {
          setIsLoadingPeople(false);
        }
      }
    };

    void loadPeople();

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  const selectedPerson = useMemo(() => {
    if (!value) {
      return responsavel;
    }

    const foundPerson = people.find((person) => String(person.id) === value);
    return foundPerson ? mapPersonToResponsavel(foundPerson) : responsavel;
  }, [people, responsavel, value]);

  const options = useMemo<DropdownOption[]>(() => {
    const mappedOptions = people.map((person) => ({
      value: String(person.id),
      label: buildOptionLabel(person),
    }));

    if (!value || mappedOptions.some((option) => option.value === value) || !selectedPerson) {
      return mappedOptions;
    }

    const fallbackLabel = selectedPerson.cpf
      ? `${selectedPerson.nome} - CPF ${selectedPerson.cpf}`
      : selectedPerson.nome;

    return [{ value, label: fallbackLabel }, ...mappedOptions];
  }, [people, selectedPerson, value]);

  const handleSelect = (nextValue: string | undefined) => {
    if (!nextValue) {
      onChange(undefined, undefined);
      return;
    }

    const person = people.find((item) => String(item.id) === nextValue);
    onChange(nextValue, person ? mapPersonToResponsavel(person) : selectedPerson);
  };

  const handleSaveNewPerson = async (payload: PeopleRequestDTO) => {
    const createdPerson = await createPeople(payload);

    setPeople((current) =>
      [...current, createdPerson].sort((first, second) =>
        first.fullName.localeCompare(second.fullName, "pt-BR"),
      ),
    );

    const nextResponsavel = mapPersonToResponsavel(createdPerson);
    onChange(String(createdPerson.id), nextResponsavel);
    setIsCreateModalOpen(false);
  };

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">{resolvedLabels.title}</p>
              <p className="text-xs text-gray-500">{resolvedLabels.description}</p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(true)}
              disabled={disabled}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {resolvedLabels.createButton}
            </Button>
          </div>

          <div className="space-y-2">
            <Dropdown
              options={options}
              value={value}
              onChange={handleSelect}
              placeholder={isLoadingPeople ? "Carregando pessoas..." : resolvedLabels.selectPlaceholder}
              disabled={disabled || isLoadingPeople}
              searchable
              className="w-full"
            />

            {peopleError ? (
              <p className="text-xs text-amber-700">{peopleError}</p>
            ) : (
              <p className="text-xs text-gray-500">{resolvedLabels.helperText}</p>
            )}
          </div>

          {selectedPerson ? (
            <div className="flex flex-col gap-3 rounded-lg border border-emerald-100 bg-white px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-emerald-50 p-2 text-emerald-700">
                  <UserCircle2 className="h-4 w-4" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                    {resolvedLabels.selectedTitle}
                  </p>
                  <p className="text-sm font-medium text-gray-900">{selectedPerson.nome}</p>
                  {selectedPerson.cpf ? (
                    <p className="text-xs text-gray-500">CPF: {selectedPerson.cpf}</p>
                  ) : null}
                  {selectedPerson.email ? (
                    <p className="text-xs text-gray-500">{selectedPerson.email}</p>
                  ) : null}
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={() => onChange(undefined, undefined)}
                disabled={disabled}
                className="justify-start gap-2 px-0 text-sm text-gray-500 hover:bg-transparent hover:text-red-600"
              >
                <X className="h-4 w-4" />
                {resolvedLabels.removeButton}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <CreateResponsiblePersonModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveNewPerson}
        labels={resolvedLabels}
      />
    </>
  );
}

function CreateResponsiblePersonModal({
  isOpen,
  onClose,
  onSave,
  labels,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: PeopleRequestDTO) => Promise<void>;
  labels: ResponsiblePersonSectionLabels;
}) {
  const [form, setForm] = useState<CreatePersonFormState>(DEFAULT_CREATE_PERSON_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm(DEFAULT_CREATE_PERSON_FORM);
    setError(null);
    setIsSaving(false);
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async () => {
    const fullName = form.fullName.trim();
    const cpf = onlyDigits(form.cpf);
    const city = form.city.trim();
    const state = form.state.trim().toUpperCase().slice(0, 2);

    if (!fullName) {
      setError("Informe o nome completo da pessoa.");
      return;
    }

    if (!city || !state) {
      setError("Preencha os campos obrigatorios: nome, cidade e UF.");
      return;
    }

    if (cpf && cpf.length !== 11) {
      setError("Informe um CPF valido com 11 digitos ou deixe em branco.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        fullName,
        cpf: cpf || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        city,
        state,
      });
    } catch (saveError) {
      setError(getUserErrorMessage(saveError, "Nao foi possivel cadastrar a pessoa."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={labels.createModalTitle}
      description={labels.createModalDescription}
      icon={<UserPlus className="h-5 w-5" />}
      maxWidthClassName="max-w-xl"
      zIndexClassName="z-[60]"
      closeDisabled={isSaving}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {isSaving ? "Salvando..." : "Cadastrar pessoa"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Nome completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.fullName}
            onChange={(event) =>
              setForm((current) => ({ ...current, fullName: event.target.value }))
            }
            autoFocus
            disabled={isSaving}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
            placeholder="Nome da pessoa"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">CPF</label>
            <input
              type="text"
              value={form.cpf}
              onChange={(event) =>
                setForm((current) => ({ ...current, cpf: formatCpf(event.target.value) }))
              }
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
              placeholder="000.000.000-00"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Telefone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: formatPhone(event.target.value) }))
              }
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">E-mail</label>
          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            disabled={isSaving}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
            placeholder="email@dominio.com"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Cidade <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(event) =>
                setForm((current) => ({ ...current, city: event.target.value }))
              }
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
              placeholder="Cidade"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              UF <span className="text-red-500">*</span>
            </label>
            <select
              value={form.state}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  state: event.target.value.toUpperCase(),
                }))
              }
              disabled={isSaving}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]"
            >
              <option value="">Selecione</option>
              {UF_LIST.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>
    </AppModalShell>
  );
}
