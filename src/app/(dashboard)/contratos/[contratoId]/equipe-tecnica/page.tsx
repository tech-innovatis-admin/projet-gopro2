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
  listBudgetItems,
  listBudgetTransfers,
  listExpenses,
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
import {
  canManageContractChildren,
  fetchCurrentUser,
  requireCurrentUserId,
} from "@/src/lib/auth/session";
import { ContractLinkedItemsLoadingSkeleton } from "../_components/ContractLoadingSkeleton";
import {
  type ContractTypeEnum,
  HttpError,
  type BudgetItemResponseDTO,
  type BudgetTransferResponseDTO,
  type ExpenseResponseDTO,
  type PageResponseDTO,
  type PeopleResponseDTO,
  type RoleProjectPeopleEnum,
  type StatusProjectPeopleEnum,
} from "@/src/lib/api/types";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";
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
import { Dropdown } from "@/components/ui/dropdown";
import { MemberFormModal } from "../_components/MemberFormModal";

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

type BeneficiaryFinancialSummary = {
  finalBudgetAmount: number;
  paidAmount: number;
  pendingAmount: number;
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
const DEFAULT_PROJECT_PERSON_STATUS: StatusProjectPeopleEnum = "ATIVO";

function parseProjectId(rawId: string) {
  const parsed = Number(rawId);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isUuid(value?: string | null) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
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
  return getUserErrorMessage(error, fallback);
}

function isBlank(value?: string) {
  return !value || value.trim().length === 0;
}

function hasRequiredMemberFields(formData: MembroFormData) {
  return (
    !isBlank(formData.nome) &&
    !isBlank(formData.status)
  );
}

function formatDateBr(value?: string) {
  if (!value) return "Perí­odo não informado";
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

function toSafeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function fetchAllPages<T>(
  fetchPage: (query: { page: number; size: number }) => Promise<PageResponseDTO<T>>,
): Promise<T[]> {
  const pageSize = 100;
  const allItems: T[] = [];
  let page = 0;
  let hasNext = true;

  while (hasNext) {
    const response = await fetchPage({ page, size: pageSize });
    allItems.push(...response.content);
    hasNext = !response.last;
    page += 1;
  }

  return allItems;
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
  return "Não informado";
}

function buildPeriodLabel(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) return "Perí­odo não informado";
  if (startDate && endDate) {
    return `${formatDateBr(startDate)} ate ${formatDateBr(endDate)}`;
  }
  if (startDate) return `Iní­cio: ${formatDateBr(startDate)}`;
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
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [canManageChildren, setCanManageChildren] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
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
  const [financialSummaryByProjectPeopleId, setFinancialSummaryByProjectPeopleId] = useState<
    Map<number, BeneficiaryFinancialSummary>
  >(new Map());
  const [rubricaUsageCountByProjectPeopleId, setRubricaUsageCountByProjectPeopleId] = useState<
    Map<number, number>
  >(new Map());

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

  useEffect(() => {
    let cancelled = false;

    async function loadAccess() {
      try {
        const user = await fetchCurrentUser();
        if (!cancelled) {
          setCanManageChildren(canManageContractChildren(user));
        }
      } finally {
        if (!cancelled) {
          setLoadingAccess(false);
        }
      }
    }

    void loadAccess();
    return () => {
      cancelled = true;
    };
  }, []);

  const ensureCanManageChildren = () => {
    if (canManageChildren) {
      return true;
    }

    setActionError("Seu perfil pode apenas visualizar esta área do contrato.");
    return false;
  };

  const resetMemberFormState = () => {
    setEditingMembro(null);
    setFormData(defaultFormData());
    setAvatarFile(null);
    setCpfError("");
    setPhoneError("");
    setModalError(null);
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
      setLoadError("ID do contrato inválido.");
      setMembros([]);
      setAllPeople([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      setActionError(null);

      const [projectPeoplePage, budgetItems, budgetTransfers, expenses] = await Promise.all([
        listProjectPeopleDetailed({
          page: 0,
          size: DEFAULT_PAGE_SIZE,
          projectId,
        }),
        fetchAllPages<BudgetItemResponseDTO>((query) =>
          listBudgetItems({
            ...query,
            projectId,
          }),
        ),
        fetchAllPages<BudgetTransferResponseDTO>((query) =>
          listBudgetTransfers({
            ...query,
            projectId,
          }),
        ),
        fetchAllPages<ExpenseResponseDTO>((query) =>
          listExpenses({
            ...query,
            projectId,
          }),
        ),
      ]);

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

      const activeTransfers = budgetTransfers.filter((transfer) => transfer.isActive);
      const transferBalanceByItemId = new Map<number, number>();
      for (const transfer of activeTransfers) {
        transferBalanceByItemId.set(
          transfer.toItemId,
          toSafeNumber(transferBalanceByItemId.get(transfer.toItemId)) + toSafeNumber(transfer.amount),
        );
        transferBalanceByItemId.set(
          transfer.fromItemId,
          toSafeNumber(transferBalanceByItemId.get(transfer.fromItemId)) - toSafeNumber(transfer.amount),
        );
      }

      const paidByBudgetItemId = new Map<number, number>();
      for (const expense of expenses) {
        if (!expense.isActive || expense.paymentStatus !== "PAGO") continue;
        paidByBudgetItemId.set(
          expense.budgetItemId,
          toSafeNumber(paidByBudgetItemId.get(expense.budgetItemId)) + toSafeNumber(expense.amount),
        );
      }

      const summaryByProjectPeopleId = new Map<number, BeneficiaryFinancialSummary>();
      const usageCountByProjectPeopleId = new Map<number, number>();
      for (const item of budgetItems) {
        if (!item.isActive) continue;
        const isPersonLinkedItem =
          item.projectPeopleId != null &&
          (item.beneficiaryType === "person" || item.beneficiaryType == null);
        if (!isPersonLinkedItem) continue;

        const finalBudgetAmount =
          toSafeNumber(item.plannedAmount) + toSafeNumber(transferBalanceByItemId.get(item.id));
        const paidAmount = toSafeNumber(paidByBudgetItemId.get(item.id));

        const projectPeopleId = item.projectPeopleId as number;
        const current = summaryByProjectPeopleId.get(projectPeopleId) ?? {
          finalBudgetAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
        };

        const nextFinalBudgetAmount = current.finalBudgetAmount + finalBudgetAmount;
        const nextPaidAmount = current.paidAmount + paidAmount;
        summaryByProjectPeopleId.set(projectPeopleId, {
          finalBudgetAmount: nextFinalBudgetAmount,
          paidAmount: nextPaidAmount,
          pendingAmount: nextFinalBudgetAmount - nextPaidAmount,
        });
        usageCountByProjectPeopleId.set(
          projectPeopleId,
          toSafeNumber(usageCountByProjectPeopleId.get(projectPeopleId)) + 1,
        );
      }

      setFinancialSummaryByProjectPeopleId(summaryByProjectPeopleId);
      setRubricaUsageCountByProjectPeopleId(usageCountByProjectPeopleId);
      setMembros(nextMembers);
    } catch (error) {
      setLoadError(getErrorMessage(error, "Falha ao carregar membros do projeto."));
      setMembros([]);
      setFinancialSummaryByProjectPeopleId(new Map());
      setRubricaUsageCountByProjectPeopleId(new Map());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMembros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const openNewModal = () => {
    if (!ensureCanManageChildren()) return;
    setActionError(null);
    setEditingMembro(null);
    setAvatarFile(null);
    setCpfError("");
    setPhoneError("");
    setFormData(defaultFormData());
    setIsFormModalOpen(true);
  };

  const openEditModal = (membro: MembroProjeto) => {
    if (!ensureCanManageChildren()) return;
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
    if (!ensureCanManageChildren()) return;
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
      setActionError(getErrorMessage(error, "Não foi possível carregar pessoas existentes."));
    }
  };

  const saveMembro = async () => {
    if (!ensureCanManageChildren()) return;
    if (!projectId) {
      setActionError("ID do contrato inválido.");
      return;
    }
    if (!hasRequiredMemberFields(formData)) {
      setModalError("Preencha os campos obrigatórios: nome completo e status.");
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
      setModalError(null);
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
              "Pessoa salva, mas a foto não foi enviada.",
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
              status: formData.status as StatusProjectPeopleEnum,
              notes: toOptional(formData.notes),
              createdBy: actorUserId,
            },
            1,
          );
        } catch (error) {
          linkWarning = getErrorMessage(
            error,
            "Pessoa cadastrada, mas não foi possível vincular ao projeto.",
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
              "Pessoa salva, mas a foto não foi enviada.",
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
      setModalError(getErrorMessage(error, "Não foi possível salvar o membro."));
    } finally {
      setIsSaving(false);
    }
  };

  const linkExistingPerson = async () => {
    if (!ensureCanManageChildren()) return;
    if (!projectId) {
      setActionError("ID do contrato inválido.");
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
          status: DEFAULT_PROJECT_PERSON_STATUS,
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
      setActionError(getErrorMessage(error, "Não foi possível vincular a pessoa."));
    } finally {
      setIsLinking(false);
    }
  };

  const removeMembro = async (membroId: string) => {
    if (!ensureCanManageChildren()) return;
    const membro = membros.find((item) => item.id === membroId);
    if (!membro) return;

    if (!confirm(`Deseja realmente remover ${membro.nome} deste projeto?`)) return;

    try {
      setActionError(null);
      const linkedItemsCount = toSafeNumber(
        rubricaUsageCountByProjectPeopleId.get(membro.projectPeopleId),
      );
      if (linkedItemsCount > 0) {
        setActionError(
          `Não é possível desvincular a pessoa. Existem ${linkedItemsCount} item(ns) de rubrica ativo(s) vinculados a ela neste contrato.`,
        );
        return;
      }
      await deleteProjectPeople(membro.projectPeopleId);
      await loadMembros();
    } catch (error) {
      setActionError(getErrorMessage(error, "Não foi possível remover o membro."));
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
          {canManageChildren && (
            <>
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
            </>
          )}
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

      {!loadingAccess && !canManageChildren && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Seu perfil pode consultar a equipe tecnica, mas não pode criar, vincular, editar ou remover pessoas.
        </div>
      )}

      {isLoading ? (
        <ContractLinkedItemsLoadingSkeleton titleWidthClassName="w-48" />
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
          {canManageChildren && (
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
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {membros.map((membro) => {
            const financialSummary = financialSummaryByProjectPeopleId.get(membro.projectPeopleId);
            return (
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
                {canManageChildren ? (
                  <button
                    onClick={() => openEditModal(membro)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#004225] border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4" />
                    Editar
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">Somente leitura</span>
                )}
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
                  <span>Vínculo: {membro.vinculo || "Não informado"}</span>
                  <span>{membro.cargaHoraria ? `${membro.cargaHoraria}h` : "0h"}</span>
                </div>

                {typeof membro.baseAmount === "number" && (
                  <div className="text-gray-600">
                    Valor base: <strong className="text-gray-900">{formatCurrency(membro.baseAmount)}</strong>
                  </div>
                )}

                {financialSummary && (
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 space-y-1.5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">
                      Financeiro na rubrica
                    </p>
                    <p className="text-sm text-gray-700">
                      Valor final:{" "}
                      <strong className="text-gray-900">
                        {formatCurrency(financialSummary.finalBudgetAmount)}
                      </strong>
                    </p>
                    <p className="text-sm text-gray-700">
                      Pago:{" "}
                      <strong className="text-emerald-700">
                        {formatCurrency(financialSummary.paidAmount)}
                      </strong>
                    </p>
                    <p className="text-sm text-gray-700">
                      Falta pagar:{" "}
                      <strong className="text-amber-700">
                        {formatCurrency(financialSummary.pendingAmount)}
                      </strong>
                    </p>
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
                {canManageChildren && (
                  <button
                    onClick={() => {
                      void removeMembro(membro.id);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remover
                  </button>
                )}
              </div>
            </div>
            );
          })}
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

      {canManageChildren && isFormModalOpen && (
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
          errorMessage={modalError}
        />
      )}

      {canManageChildren && isLinkModalOpen && (
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
              Não há pessoas disponíveis para vincular.
            </div>
          ) : (
            <>
              <Field label="Pessoa">
                <Dropdown
                  options={people.map((person) => ({
                    value: String(person.id),
                    label: `${person.fullName}${person.cpf ? ` - CPF ${formatCPF(person.cpf)}` : ""}`,
                  }))}
                  value={selectedPersonId ? String(selectedPersonId) : undefined}
                  onChange={(value) => setSelectedPersonId(value ? Number(value) : "")}
                  placeholder="Pesquise por nome ou CPF"
                  searchable
                  disabled={isLinking}
                  emptyText="Nenhuma pessoa disponí­vel"
                  className="w-full"
                />
              </Field>

              <Field label="Papel">
                <Dropdown
                  options={Object.entries(papelLabels).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  value={linkPapel}
                  onChange={(value) => setLinkPapel((value || linkPapel) as Papel)}
                  placeholder="Selecione..."
                  disabled={isLinking}
                  className="w-full"
                />
              </Field>

              <Field label="Vínculo institucional">
                <input
                  type="text"
                  value={linkVinculo}
                  onChange={(e) => setLinkVinculo(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                  placeholder="Ex: Professor Associado"
                />
              </Field>

              <Field label="Carga horária (h)">
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



