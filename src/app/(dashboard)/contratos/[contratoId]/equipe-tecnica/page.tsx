"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle,
  Edit2,
  Link2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Trash2,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import {
  createPeople,
  createProjectPeople,
  deleteProjectPeople,
  generateDocumentDownloadUrl,
  getPeopleById,
  listDocumentsByOwner,
  listPeople,
  listProjectPeopleDetailed,
  updatePeople,
  updateProjectPeople,
  uploadDocument,
} from "@/src/lib/api/endpoints";
import { requireCurrentUserId } from "@/src/lib/auth/session";
import {
  type ContractTypeEnum,
  HttpError,
  type PeopleResponseDTO,
  type RoleProjectPeopleEnum,
  type StatusProjectPeopleEnum,
} from "@/src/lib/api/types";
import {
  formatCPF,
  unformatCPF,
  validateCPFComplete,
} from "./_components/CPFValidator";
import {
  formatPhone,
  unformatPhone,
  validatePhoneComplete,
} from "./_components/PhoneValidator";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";

type Papel =
  | "COORDENADOR"
  | "VICE_COORDENADOR"
  | "SECRETARIO"
  | "PESQUISADOR"
  | "BOLSISTA"
  | "TECNICO"
  | "OUTRO";

const papelLabels: Record<Papel, string> = {
  COORDENADOR: "Coordenador",
  VICE_COORDENADOR: "Vice-coordenador",
  SECRETARIO: "Secretario",
  PESQUISADOR: "Pesquisador",
  BOLSISTA: "Bolsista",
  TECNICO: "Tecnico",
  OUTRO: "Outro",
};

type MembroProjeto = {
  id: string;
  projectPeopleId: number;
  personId: number;
  nome: string;
  papel: Papel;
  email: string;
  telefone: string;
  cpf: string;
  avatarUrl: string;
  birthDate?: string;
  endereco: string;
  city?: string;
  state?: string;
  vinculo: string;
  cargaHoraria: number;
  notes?: string;
  contractType?: ContractTypeEnum | null;
  status?: StatusProjectPeopleEnum | null;
  startDate?: string;
  endDate?: string;
  baseAmount?: number;
};

type MembroFormData = {
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

const DEFAULT_PAGE_SIZE = 100;

function parseProjectId(rawId: string) {
  const parsed = Number(rawId);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function onlyDigits(value?: string) {
  return (value || "").replace(/\D/g, "");
}

function formatMoneyInput(value: number | "") {
  if (typeof value !== "number" || Number.isNaN(value)) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function parseMoneyInput(value: string): number | "" {
  const digits = onlyDigits(value);
  if (!digits) return "";
  const cents = Number(digits);
  if (!Number.isFinite(cents)) return "";
  return cents / 100;
}

function isUuid(value?: string | null) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

type IbgeStateResponse = {
  id: number;
  sigla: string;
  nome: string;
};

type IbgeCityResponse = {
  id: number;
  nome: string;
};

async function fetchBrazilStates() {
  const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados");
  if (!response.ok) {
    throw new Error("Nao foi possivel carregar os estados.");
  }

  const data = (await response.json()) as IbgeStateResponse[];
  return data
    .filter((item) => item.sigla?.trim())
    .sort((a, b) => a.sigla.localeCompare(b.sigla))
    .map((item) => ({
      value: item.sigla.trim().toUpperCase(),
      label: `${item.sigla.trim().toUpperCase()} - ${item.nome}`,
    }));
}

async function fetchCitiesByState(uf: string) {
  const normalizedUf = uf.trim().toUpperCase();
  if (!normalizedUf) return [];

  const response = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${normalizedUf}/municipios`,
  );
  if (!response.ok) {
    throw new Error("Nao foi possivel carregar as cidades.");
  }

  const data = (await response.json()) as IbgeCityResponse[];
  return data
    .filter((item) => item.nome?.trim())
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map((item) => ({
      value: item.nome.trim(),
      label: item.nome.trim(),
    }));
}

function roleToPapel(role: RoleProjectPeopleEnum | null): Papel {
  if (role === "BOLSISTA") return "BOLSISTA";
  return "COORDENADOR";
}

function papelToRole(papel: Papel): RoleProjectPeopleEnum {
  if (papel === "BOLSISTA") return "BOLSISTA";
  return "DIRETOR";
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof HttpError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function isBlank(value?: string) {
  return !value || value.trim().length === 0;
}

function hasRequiredMemberFields(formData: MembroFormData) {
  return (
    !isBlank(formData.nome) &&
    !isBlank(formData.papel) &&
    !isBlank(formData.city) &&
    !isBlank(formData.state)
  );
}

function formatDateBr(value?: string) {
  if (!value) return "Periodo nao informado";
  const parts = value.split("-");
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatCurrency(value?: number) {
  if (typeof value !== "number") return "N/A";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getStatusLabel(value?: StatusProjectPeopleEnum | null) {
  if (value === "ATIVO") return "Ativo";
  if (value === "ENCERRADO") return "Encerrado";
  if (value === "PENDENTE") return "Pendente";
  return "Sem status";
}

function getContractTypeLabel(value?: ContractTypeEnum | null) {
  if (value === "BOLSA") return "Bolsa";
  if (value === "RPA") return "RPA";
  if (value === "CLT") return "CLT";
  return "Nao informado";
}

function buildPeriodLabel(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) return "Periodo nao informado";
  if (startDate && endDate) {
    return `${formatDateBr(startDate)} ate ${formatDateBr(endDate)}`;
  }
  if (startDate) return `Inicio: ${formatDateBr(startDate)}`;
  return `Fim: ${formatDateBr(endDate)}`;
}

function defaultFormData(): MembroFormData {
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

export default function EquipeTecnicaPage() {
  const params = useParams();
  const contratoId = params.contratoId as string;
  const projectId = parseProjectId(contratoId);

  const [membros, setMembros] = useState<MembroProjeto[]>([]);
  const [allPeople, setAllPeople] = useState<PeopleResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMembro, setEditingMembro] = useState<MembroProjeto | null>(null);
  const [formData, setFormData] = useState<MembroFormData>(defaultFormData());
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [cpfError, setCpfError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<number | "">("");
  const [linkPapel, setLinkPapel] = useState<Papel>("COORDENADOR");
  const [linkVinculo, setLinkVinculo] = useState("");
  const [linkCargaHoraria, setLinkCargaHoraria] = useState<number | "">("");
  const [isLinking, setIsLinking] = useState(false);

  const linkedPersonIds = useMemo(
    () =>
      new Set(
        membros
          .map((membro) => membro.personId)
          .filter((id): id is number => typeof id === "number"),
      ),
    [membros],
  );

  const availablePeople = useMemo(
    () =>
      allPeople
        .filter((person) => !linkedPersonIds.has(person.id))
        .sort((a, b) => a.fullName.localeCompare(b.fullName, "pt-BR")),
    [allPeople, linkedPersonIds],
  );

  const totalHoras = useMemo(
    () => membros.reduce((acc, membro) => acc + (membro.cargaHoraria || 0), 0),
    [membros],
  );

  const resetMemberFormState = () => {
    setEditingMembro(null);
    setFormData(defaultFormData());
    setAvatarFile(null);
    setCpfError("");
    setPhoneError("");
  };

  const closeMemberFormModal = () => {
    setIsFormModalOpen(false);
    resetMemberFormState();
  };

  const isRetriableProjectPeopleError = (error: unknown) =>
    error instanceof HttpError &&
    (error.status === 0 || error.status === 504 || error.status >= 500);

  const createProjectPeopleWithRetry = async (
    payload: Parameters<typeof createProjectPeople>[0],
    retries = 1,
  ) => {
    let attempt = 0;

    while (true) {
      try {
        return await createProjectPeople(payload);
      } catch (error) {
        if (!isRetriableProjectPeopleError(error) || attempt >= retries) {
          throw error;
        }

        attempt += 1;
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
  };

  const loadMembros = async () => {
    if (!projectId) {
      setLoadError("ID do contrato invalido.");
      setMembros([]);
      setAllPeople([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      setActionError(null);

      const projectPeoplePage = await listProjectPeopleDetailed({
        page: 0,
        size: DEFAULT_PAGE_SIZE,
        projectId,
      });

      const links = projectPeoplePage.content.filter((item) => item.projectId === projectId);

      const avatarByPersonId: Record<number, string | undefined> = {};
      const uniquePersonIds = [...new Set(links.map((link) => link.personId))];
      await Promise.all(
        uniquePersonIds.map(async (personId) => {
          const person = links.find((link) => link.personId === personId);
          if (person?.personAvatarUrl) {
            const avatarReference = person.personAvatarUrl.trim();
            if (/^https?:\/\//i.test(avatarReference)) {
              avatarByPersonId[personId] = avatarReference;
              return;
            }
            if (isUuid(avatarReference)) {
              try {
                const download = await generateDocumentDownloadUrl(avatarReference, {
                  expiresInMinutes: 60,
                });
                avatarByPersonId[personId] = download.url;
                return;
              } catch {
                // Continua para fallback por listagem de documentos.
              }
            }
          }

          try {
            const docs = await listDocumentsByOwner({
              ownerType: "PEOPLE",
              ownerId: personId,
            });

            let imageDoc = [...docs]
              .filter((doc) => doc.contentType?.startsWith("image/"))
              .sort((a, b) => {
                const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return createdB - createdA;
              })[0];

            // Compatibilidade com uploads antigos vinculados no relacionamento.
            if (!imageDoc) {
              const projectPeopleLink = links.find((link) => link.personId === personId);
              if (projectPeopleLink) {
                const legacyDocs = await listDocumentsByOwner({
                  ownerType: "PROJECT_PEOPLE",
                  ownerId: projectPeopleLink.id,
                });
                imageDoc = [...legacyDocs]
                  .filter((doc) => doc.contentType?.startsWith("image/"))
                  .sort((a, b) => {
                    const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return createdB - createdA;
                  })[0];
              }
            }

            if (!imageDoc) return;

            const download = await generateDocumentDownloadUrl(imageDoc.id, {
              expiresInMinutes: 60,
            });
            avatarByPersonId[personId] = download.url;
          } catch {
            // Avatar e opcional.
          }
        }),
      );

      const nextMembers: MembroProjeto[] = links.map((link) => {
        return {
          id: String(link.id),
          projectPeopleId: link.id,
          personId: link.personId,
          nome: link.personFullName || `Pessoa #${link.personId}`,
          papel: roleToPapel(link.role),
          email: link.personEmail || "",
          telefone: link.personPhone || "",
          cpf: link.personCpf || "",
          avatarUrl: avatarByPersonId[link.personId] || "",
          birthDate: link.personBirthDate || undefined,
          endereco: link.personAddress || "",
          city: link.personCity || undefined,
          state: link.personState || undefined,
          vinculo: link.institutionalLink || "",
          cargaHoraria:
            typeof link.workloadHours === "number" ? Number(link.workloadHours) : 0,
          notes: link.notes ?? undefined,
          contractType: link.contractType ?? undefined,
          status: link.status ?? undefined,
          startDate: link.startDate ?? undefined,
          endDate: link.endDate ?? undefined,
          baseAmount:
            typeof link.baseAmount === "number" ? Number(link.baseAmount) : undefined,
        };
      });

      setMembros(nextMembers);
    } catch (error) {
      setLoadError(getErrorMessage(error, "Falha ao carregar membros do projeto."));
      setMembros([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMembros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const openNewModal = () => {
    setActionError(null);
    setEditingMembro(null);
    setAvatarFile(null);
    setCpfError("");
    setPhoneError("");
    setFormData(defaultFormData());
    setIsFormModalOpen(true);
  };

  const openEditModal = (membro: MembroProjeto) => {
    setActionError(null);
    setEditingMembro(membro);
    setAvatarFile(null);
    setCpfError("");
    setPhoneError("");
    setFormData({
      nome: membro.nome,
      papel: membro.papel,
      email: membro.email || "",
      telefone: membro.telefone ? formatPhone(membro.telefone) : "",
      cpf: membro.cpf ? formatCPF(membro.cpf) : "",
      birthDate: membro.birthDate || "",
      endereco: membro.endereco || "",
      city: membro.city || "",
      state: (membro.state || "").toUpperCase(),
      vinculo: membro.vinculo || "",
      cargaHoraria: membro.cargaHoraria || 0,
      notes: membro.notes || "",
      contractType: membro.contractType || "",
      status: membro.status || "",
      startDate: membro.startDate || "",
      endDate: membro.endDate || "",
      baseAmount: typeof membro.baseAmount === "number" ? membro.baseAmount : "",
    });
    setIsFormModalOpen(true);
  };

  const openLinkModal = async () => {
    try {
      setActionError(null);
      let currentPeople = allPeople;
      if (allPeople.length === 0) {
        const peoplePage = await listPeople({ page: 0, size: 500 });
        currentPeople = peoplePage.content;
        setAllPeople(currentPeople);
      }
      const selectablePeople = currentPeople
        .filter((person) => !linkedPersonIds.has(person.id))
        .sort((a, b) => a.fullName.localeCompare(b.fullName, "pt-BR"));
      setSelectedPersonId(selectablePeople[0]?.id ?? "");
      setLinkPapel("COORDENADOR");
      setLinkVinculo("");
      setLinkCargaHoraria("");
      setIsLinkModalOpen(true);
    } catch (error) {
      setActionError(getErrorMessage(error, "Nao foi possivel carregar pessoas existentes."));
    }
  };

  const saveMembro = async () => {
    if (!projectId) {
      setActionError("ID do contrato invalido.");
      return;
    }
    if (!hasRequiredMemberFields(formData)) {
      setActionError(
        "Preencha os campos obrigatorios: nome, papel, cidade e estado.",
      );
      return;
    }

    if (formData.cpf && formData.cpf.trim()) {
      const cpfValidation = validateCPFComplete(formData.cpf || "");
      if (!cpfValidation.isValid) {
        setCpfError(cpfValidation.errorMessage);
        return;
      }
    }

    if (formData.telefone && formData.telefone.trim()) {
      const phoneValidation = validatePhoneComplete(formData.telefone);
      if (!phoneValidation.isValid) {
        setPhoneError(phoneValidation.errorMessage);
        return;
      }
    }

    const cpfUnformatted = formData.cpf ? unformatCPF(formData.cpf) : undefined;
    const phoneUnformatted = formData.telefone
      ? unformatPhone(formData.telefone)
      : undefined;

    try {
      setIsSaving(true);
      setActionError(null);
      const actorUserId = await requireCurrentUserId();

      let personId = editingMembro?.personId;
      let avatarUploadWarning: string | null = null;
      let linkWarning: string | null = null;
      const peoplePayloadBase = {
        fullName: formData.nome.trim(),
        cpf: cpfUnformatted || undefined,
        email: toOptional(formData.email),
        phone: toOptional(phoneUnformatted),
        birthDate: toOptional(formData.birthDate),
        address: toOptional(formData.endereco),
        city: formData.city.trim(),
        state: formData.state.trim().toUpperCase(),
        notes: toOptional(formData.notes),
      };

      if (editingMembro && personId) {
        const existingPerson = await getPeopleById(personId);
        let nextAvatarUrl = existingPerson.avatarUrl ?? undefined;

        if (avatarFile) {
          try {
            const uploaded = await uploadDocument({
              file: avatarFile,
              ownerType: "PEOPLE",
              ownerId: personId,
              category: "FOTO_PERFIL",
            });
            nextAvatarUrl = uploaded.id;
          } catch (error) {
            avatarUploadWarning = getErrorMessage(
              error,
              "Pessoa salva, mas a foto nao foi enviada.",
            );
          }
        }

        await updatePeople(personId, {
          ...peoplePayloadBase,
          avatarUrl: nextAvatarUrl,
        });

        await updateProjectPeople(editingMembro.projectPeopleId, {
          projectId,
          personId,
          role: papelToRole(formData.papel),
          workloadHours: formData.cargaHoraria,
          institutionalLink: toOptional(formData.vinculo),
          contractType: formData.contractType || undefined,
          startDate: toOptional(formData.startDate),
          endDate: toOptional(formData.endDate),
          status: formData.status || undefined,
          baseAmount:
            typeof formData.baseAmount === "number" ? formData.baseAmount : undefined,
          notes: toOptional(formData.notes),
          updatedBy: actorUserId,
        });
      } else {
        const person = await createPeople({
          ...peoplePayloadBase,
        });
        personId = person.id;

        try {
          await createProjectPeopleWithRetry(
            {
              projectId,
              personId,
              role: papelToRole(formData.papel),
              workloadHours: formData.cargaHoraria,
              institutionalLink: toOptional(formData.vinculo),
              contractType: formData.contractType || undefined,
              startDate: toOptional(formData.startDate),
              endDate: toOptional(formData.endDate),
              status: formData.status || undefined,
              baseAmount:
                typeof formData.baseAmount === "number" ? formData.baseAmount : undefined,
              notes: toOptional(formData.notes),
              createdBy: actorUserId,
            },
            1,
          );
        } catch (error) {
          linkWarning = getErrorMessage(
            error,
            "Pessoa cadastrada, mas nao foi possivel vincular ao projeto.",
          );
        }

        if (avatarFile && personId) {
          try {
            const uploaded = await uploadDocument({
              file: avatarFile,
              ownerType: "PEOPLE",
              ownerId: personId,
              category: "FOTO_PERFIL",
            });

            await updatePeople(personId, {
              ...peoplePayloadBase,
              avatarUrl: uploaded.id,
            });
          } catch (error) {
            avatarUploadWarning = getErrorMessage(
              error,
              "Pessoa salva, mas a foto nao foi enviada.",
            );
          }
        }
      }

      await loadMembros();
      closeMemberFormModal();
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);

      const warnings = [avatarUploadWarning, linkWarning].filter(
        (warning): warning is string => Boolean(warning),
      );
      if (warnings.length > 0) {
        setActionError(warnings.join(" "));
      }
    } catch (error) {
      setActionError(getErrorMessage(error, "Nao foi possivel salvar o membro."));
    } finally {
      setIsSaving(false);
    }
  };

  const linkExistingPerson = async () => {
    if (!projectId) {
      setActionError("ID do contrato invalido.");
      return;
    }
    if (!selectedPersonId || typeof selectedPersonId !== "number") {
      setActionError("Selecione uma pessoa para vincular.");
      return;
    }

    try {
      setIsLinking(true);
      setActionError(null);
      const actorUserId = await requireCurrentUserId();

      await createProjectPeopleWithRetry(
        {
          projectId,
          personId: selectedPersonId,
          role: papelToRole(linkPapel),
          institutionalLink: toOptional(linkVinculo),
          workloadHours:
            typeof linkCargaHoraria === "number" ? linkCargaHoraria : undefined,
          createdBy: actorUserId,
        },
        1,
      );

      await loadMembros();
      setIsLinkModalOpen(false);
      setSelectedPersonId("");
      setLinkPapel("COORDENADOR");
      setLinkVinculo("");
      setLinkCargaHoraria("");
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (error) {
      setActionError(getErrorMessage(error, "Nao foi possivel vincular a pessoa."));
    } finally {
      setIsLinking(false);
    }
  };

  const removeMembro = async (membroId: string) => {
    const membro = membros.find((item) => item.id === membroId);
    if (!membro) return;

    if (!confirm(`Deseja realmente remover ${membro.nome} deste projeto?`)) return;

    try {
      setActionError(null);
      await deleteProjectPeople(membro.projectPeopleId);
      await loadMembros();
    } catch (error) {
      setActionError(getErrorMessage(error, "Nao foi possivel remover o membro."));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pessoas do Projeto</h2>
          <p className="text-sm text-gray-500">
            Vincule pessoas existentes ou cadastre novas para este projeto.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedMessage && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              Salvo com sucesso!
            </div>
          )}
          <button
            onClick={() => {
              void openLinkModal();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#004225] bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            <Link2 className="h-4 w-4" />
            Vincular Existente
          </button>
          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova Pessoa
          </button>
        </div>
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}
      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-gray-500">Carregando pessoas do projeto...</p>
        </div>
      ) : membros.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Nenhuma pessoa vinculada
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Vincule uma pessoa existente ou cadastre uma nova.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                void openLinkModal();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#004225] bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              <Link2 className="h-4 w-4" />
              Vincular Existente
            </button>
            <button
              onClick={openNewModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nova Pessoa
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {membros.map((membro) => (
            <div
              key={membro.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    {membro.avatarUrl ? (
                      <img
                        src={membro.avatarUrl}
                        alt={membro.nome}
                        className="h-10 w-10 rounded-full object-cover border border-emerald-100"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center">
                        <UserCircle className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{membro.nome}</h3>
                    <p className="text-xs text-gray-500">CPF: {formatCPF(membro.cpf || "")}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Papel: {papelLabels[membro.papel]}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => openEditModal(membro)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#004225] border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit2 className="h-4 w-4" />
                  Editar
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      membro.status === "ATIVO"
                        ? "bg-emerald-100 text-emerald-800"
                        : membro.status === "ENCERRADO"
                          ? "bg-zinc-200 text-zinc-800"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {getStatusLabel(membro.status)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {getContractTypeLabel(membro.contractType)}
                  </span>
                </div>

                {membro.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{membro.email}</span>
                  </div>
                )}

                {membro.telefone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{formatPhone(membro.telefone)}</span>
                  </div>
                )}

                {membro.endereco && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{membro.endereco}</span>
                  </div>
                )}

                {(membro.city || membro.state) && (
                  <div className="text-gray-600">
                    Localidade:{" "}
                    <strong className="text-gray-900">
                      {[membro.city, membro.state].filter(Boolean).join(" - ")}
                    </strong>
                  </div>
                )}

                {membro.birthDate && (
                  <div className="text-gray-600">
                    Nascimento:{" "}
                    <strong className="text-gray-900">{formatDateBr(membro.birthDate)}</strong>
                  </div>
                )}

                <div className="flex items-center justify-between text-gray-600">
                  <span>Vinculo: {membro.vinculo || "Nao informado"}</span>
                  <span>{membro.cargaHoraria ? `${membro.cargaHoraria}h` : "0h"}</span>
                </div>

                {typeof membro.baseAmount === "number" && (
                  <div className="text-gray-600">
                    Valor base: <strong className="text-gray-900">{formatCurrency(membro.baseAmount)}</strong>
                  </div>
                )}

                {membro.notes && (
                  <p className="text-gray-600 line-clamp-2">{membro.notes}</p>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  {buildPeriodLabel(membro.startDate, membro.endDate)}
                </div>
                <button
                  onClick={() => {
                    void removeMembro(membro.id);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {membros.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-sm font-medium text-gray-700">
            Total: <strong className="text-gray-900">{membros.length}</strong> pessoa
            {membros.length !== 1 ? "s" : ""}
          </span>
          <span className="text-sm text-gray-600">
            Carga total: <strong className="text-gray-900">{totalHoras}h</strong>
          </span>
        </div>
      )}

      {isFormModalOpen && (
        <MemberFormModal
          formData={formData}
          setFormData={setFormData}
          avatarFile={avatarFile}
          setAvatarFile={setAvatarFile}
          currentAvatarUrl={editingMembro?.avatarUrl ?? ""}
          isSaving={isSaving}
          isEditingItem={!!editingMembro}
          onClose={closeMemberFormModal}
          onSave={() => {
            void saveMembro();
          }}
          onDelete={
            editingMembro
              ? () => {
                  void removeMembro(editingMembro.id);
                  closeMemberFormModal();
                }
              : undefined
          }
          cpfError={cpfError}
          setCpfError={setCpfError}
          phoneError={phoneError}
          setPhoneError={setPhoneError}
        />
      )}

      {isLinkModalOpen && (
        <LinkExistingMemberModal
          people={availablePeople}
          selectedPersonId={selectedPersonId}
          setSelectedPersonId={setSelectedPersonId}
          linkPapel={linkPapel}
          setLinkPapel={setLinkPapel}
          linkVinculo={linkVinculo}
          setLinkVinculo={setLinkVinculo}
          linkCargaHoraria={linkCargaHoraria}
          setLinkCargaHoraria={setLinkCargaHoraria}
          isLinking={isLinking}
          onClose={() => {
            setIsLinkModalOpen(false);
            setSelectedPersonId("");
            setLinkPapel("COORDENADOR");
            setLinkVinculo("");
            setLinkCargaHoraria("");
          }}
          onConfirm={() => {
            void linkExistingPerson();
          }}
        />
      )}
    </div>
  );
}

function MemberFormModal({
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
}: {
  formData: MembroFormData;
  setFormData: React.Dispatch<React.SetStateAction<MembroFormData>>;
  avatarFile: File | null;
  setAvatarFile: React.Dispatch<React.SetStateAction<File | null>>;
  currentAvatarUrl: string;
  isSaving: boolean;
  isEditingItem: boolean;
  onSave: () => void;
  onClose: () => void;
  onDelete?: () => void;
  cpfError: string;
  setCpfError: React.Dispatch<React.SetStateAction<string>>;
  phoneError: string;
  setPhoneError: React.Dispatch<React.SetStateAction<string>>;
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

  useEffect(() => {
    let isMounted = true;

    void fetchBrazilStates()
      .then((options) => {
        if (!isMounted) return;
        setUfOptions(options);
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
      .then((options) => {
        if (!isMounted) return;
        setCityOptions(options);
      })
      .catch(() => {
        if (!isMounted) return;
        setCityOptions([]);
        setCityLookupError("Nao foi possivel carregar as cidades deste estado.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#004225] to-[#00563A] text-white">
          <div className="flex items-center gap-3">
            <UserCircle className="h-6 w-6" />
            <h2 className="text-lg font-bold">
              {isEditingItem ? "Editar Pessoa" : "Nova Pessoa"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
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
              <select
                value={formData.papel}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, papel: e.target.value as Papel }))
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
              >
                {Object.entries(papelLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
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
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, birthDate: e.target.value }))
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
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
              {cityLookupError ? (
                <p className="text-xs text-amber-600">{cityLookupError}</p>
              ) : null}
            </Field>

            <Field label="Vinculo institucional">
              <input
                type="text"
                value={formData.vinculo}
                onChange={(e) => setFormData((prev) => ({ ...prev, vinculo: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="Ex: Professor Associado"
              />
            </Field>

            <Field label="Carga horaria (h)">
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
            </Field>

            <Field label="Tipo de contrato">
              <select
                value={formData.contractType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contractType: (e.target.value || "") as ContractTypeEnum | "",
                  }))
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
              >
                <option value="">Nao informado</option>
                <option value="BOLSA">Bolsa</option>
                <option value="RPA">RPA</option>
                <option value="CLT">CLT</option>
              </select>
            </Field>

            <Field label="Status">
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: (e.target.value || "") as StatusProjectPeopleEnum | "",
                  }))
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
              >
                <option value="">Nao informado</option>
                <option value="PENDENTE">Pendente</option>
                <option value="ATIVO">Ativo</option>
                <option value="ENCERRADO">Encerrado</option>
              </select>
            </Field>

            <Field label="Data inicio">
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
              />
            </Field>

            <Field label="Data fim">
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
              />
            </Field>

            <Field label="Valor base (R$)">
              <input
                type="text"
                inputMode="numeric"
                value={formatMoneyInput(formData.baseAmount)}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    baseAmount: parseMoneyInput(e.target.value),
                  }))
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="R$ 0,00"
              />
            </Field>

            <Field label="Endereco" className="md:col-span-2">
              <input
                type="text"
                value={formData.endereco}
                onChange={(e) => setFormData((prev) => ({ ...prev, endereco: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="Rua, numero e bairro"
              />
            </Field>

            <Field label="Observacoes" className="md:col-span-2">
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] resize-none"
                placeholder="Observacoes adicionais"
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
              onClick={onClose}
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
                  ? "Salvar alteracoes"
                  : "Adicionar pessoa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkExistingMemberModal({
  people,
  selectedPersonId,
  setSelectedPersonId,
  linkPapel,
  setLinkPapel,
  linkVinculo,
  setLinkVinculo,
  linkCargaHoraria,
  setLinkCargaHoraria,
  isLinking,
  onClose,
  onConfirm,
}: {
  people: PeopleResponseDTO[];
  selectedPersonId: number | "";
  setSelectedPersonId: React.Dispatch<React.SetStateAction<number | "">>;
  linkPapel: Papel;
  setLinkPapel: React.Dispatch<React.SetStateAction<Papel>>;
  linkVinculo: string;
  setLinkVinculo: React.Dispatch<React.SetStateAction<string>>;
  linkCargaHoraria: number | "";
  setLinkCargaHoraria: React.Dispatch<React.SetStateAction<number | "">>;
  isLinking: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#004225] to-[#00563A] text-white">
          <h2 className="text-lg font-bold">Vincular Pessoa Existente</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {people.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Nao ha pessoas disponiveis para vincular.
            </div>
          ) : (
            <>
              <Field label="Pessoa">
                <select
                  value={selectedPersonId}
                  onChange={(e) =>
                    setSelectedPersonId(e.target.value ? Number(e.target.value) : "")
                  }
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                >
                  <option value="">Selecione...</option>
                  {people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.fullName}
                      {person.cpf ? ` - CPF ${formatCPF(person.cpf)}` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Papel">
                <select
                  value={linkPapel}
                  onChange={(e) => setLinkPapel(e.target.value as Papel)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                >
                  {Object.entries(papelLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Vinculo institucional">
                <input
                  type="text"
                  value={linkVinculo}
                  onChange={(e) => setLinkVinculo(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                  placeholder="Ex: Professor Associado"
                />
              </Field>

              <Field label="Carga horaria (h)">
                <input
                  type="number"
                  min={0}
                  value={linkCargaHoraria}
                  onChange={(e) =>
                    setLinkCargaHoraria(e.target.value ? Number(e.target.value) : "")
                  }
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                  placeholder="0"
                />
              </Field>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={people.length === 0 || !selectedPersonId || isLinking}
            className="px-6 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLinking ? "Vinculando..." : "Vincular"}
          </button>
        </div>
      </div>
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
  children: React.ReactNode;
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


