"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/components/ui/NavBar";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  getPartnerById,
  getPeopleById,
  getProjectById,
  getPublicAgencyById,
  getSecretaryById,
  listAllPublicAgencies,
  listAllSecretaries,
  listPartners,
  listPeople,
  updateProject,
} from "@/src/lib/api/endpoints";
import { canViewContractAudit, fetchCurrentUser } from "@/src/lib/auth/session";
import {
  type ProjectGovIfEnum,
  type ProjectResponseDTO,
  type ProjectStatusEnum,
  type ProjectTypeEnum,
  type ProjectUpdateDTO,
} from "@/src/lib/api/types";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";
import { formatDateOnlyToPtBr } from "@/src/lib/date-only";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import {
  ChevronRight,
  Home,
  MoreHorizontal,
  Building2,
  User,
  Calendar,
  DollarSign,
  Tag,
  MapPin,
  FileText,
  ChevronDown,
  ChevronUp,
  Edit,
  Save,
  X,
  Check,
  CheckCircle,
} from "lucide-react";
import { type Contrato } from "./types";
import { ContractRouteLoadingSkeleton } from "./_components/ContractLoadingSkeleton";

type ContratoView = Contrato & {
  parceiroSecundario?: string;
  clienteSecundario?: string;
};

type TabItem = {
  label: string;
  href: string;
  description: string;
};

type SelectOption = {
  id: number;
  label: string;
};

type SecretaryOption = SelectOption & {
  publicAgencyId: number | null;
};

type EditRelations = {
  primaryPartnerId: number | null;
  secundaryPartnerId: number | null;
  primaryClientId: number | null;
  secundaryClientId: number | null;
  cordinatorId: number | null;
  projectGovIf: ProjectGovIfEnum | null;
};

const NO_INFO_LABEL = "-";

const PROJECT_STATUS_OPTIONS: Array<{
  value: ProjectStatusEnum;
  label: string;
}> = [
    { value: "PRE_PROJETO", label: "Pre-projeto" },
    { value: "PLANEJAMENTO", label: "Planejamento" },
    { value: "EXECUCAO", label: "Execucao" },
    { value: "FINALIZADO", label: "Finalizado" },
    { value: "SUSPENSO", label: "Suspenso" },
  ];

const EMPTY_CONTRATO: ContratoView = {
  id: "",
  codigo: "",
  titulo: "",
  tipo: "PROJETO",
  status: "PRE_PROJETO",
  coordenador: NO_INFO_LABEL,
  parceiro: NO_INFO_LABEL,
  parceiroSecundario: NO_INFO_LABEL,
  cliente: NO_INFO_LABEL,
  clienteSecundario: NO_INFO_LABEL,
  orgaoFinanciador: NO_INFO_LABEL,
  segmentos: [],
  localidade: NO_INFO_LABEL,
  contaBancariaProjeto: NO_INFO_LABEL,
  executedByInnovatis: null,
  dataInicio: "",
  dataFim: "",
  valorTotal: 0,
  valorExecutado: 0,
  descricao: "",
};

function normalizeSegments(areaSegmento: string | null) {
  if (!areaSegmento) return [];
  return areaSegmento
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function normalizeLocation(
  city: string | null,
  state: string | null,
  executionLocation: string | null
) {
  if (executionLocation && executionLocation.trim()) return executionLocation.trim();
  if (city && state) return `${city} - ${state}`;
  if (city) return city;
  if (state) return state;
  return NO_INFO_LABEL;
}

function normalizeMoneyValue(value: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function mapProjectToContrato(
  project: ProjectResponseDTO,
  names: {
    primaryPartner: string;
    secondaryPartner: string;
    primaryClient: string;
    secondaryClient: string;
    coordinator: string;
  }
): ContratoView {
  return {
    id: String(project.id),
    codigo: project.code || `PROJ-${project.id}`,
    titulo: project.name || `Contrato ${project.id}`,
    tipo: project.projectType === "PRODUTO" ? "PRODUTO" : "PROJETO",
    status: project.projectStatus || "PRE_PROJETO",
    coordenador: names.coordinator,
    parceiro: names.primaryPartner,
    parceiroSecundario: names.secondaryPartner,
    cliente: names.primaryClient,
    clienteSecundario: names.secondaryClient,
    orgaoFinanciador: names.secondaryClient,
    segmentos: normalizeSegments(project.areaSegmento),
    localidade: normalizeLocation(project.city, project.state, project.executionLocation),
    contaBancariaProjeto: project.projectBankAccount || NO_INFO_LABEL,
    dataInicio: project.startDate ?? project.openingDate ?? "",
    dataFim: project.endDate ?? project.closingDate ?? "",
    dataRealInicio: project.openingDate ?? undefined,
    dataRealTermino: project.closingDate ?? undefined,
    valorTotal: normalizeMoneyValue(project.contractValue),
    valorExecutado: normalizeMoneyValue(project.totalReceived),
    descricao: project.object || "",
    unidade: project.projectGovIf ?? undefined,
    executedByInnovatis: project.executedByInnovatis === true,
  };
}

function toEditRelations(project: ProjectResponseDTO | null): EditRelations {
  if (!project) {
    return {
      primaryPartnerId: null,
      secundaryPartnerId: null,
      primaryClientId: null,
      secundaryClientId: null,
      cordinatorId: null,
      projectGovIf: null,
    };
  }

  return {
    primaryPartnerId: project.primaryPartnerId ?? null,
    secundaryPartnerId: project.secundaryPartnerId ?? null,
    primaryClientId: project.primaryClientId ?? null,
    secundaryClientId: project.secundaryClientId ?? null,
    cordinatorId: project.cordinatorId ?? null,
    projectGovIf: project.projectGovIf ?? null,
  };
}

function toOptionalDate(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toOptionalText(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseSelectNumber(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function ContratoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const contratoId = params.contratoId as string;
  const autoEditRequested = searchParams.get("edit") === "true";
  const autoEditAppliedRef = useRef(false);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const [isDescricaoExpanded, setIsDescricaoExpanded] = useState(false);
  const [isInfoComplementarExpanded, setIsInfoComplementarExpanded] = useState(false);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  const [hasTitleOverflow, setHasTitleOverflow] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [contratoBase, setContratoBase] = useState<ContratoView>({
    ...EMPTY_CONTRATO,
    id: contratoId,
  });
  const [editContrato, setEditContrato] = useState<ContratoView>({
    ...EMPTY_CONTRATO,
    id: contratoId,
  });
  const [projectSnapshot, setProjectSnapshot] = useState<ProjectResponseDTO | null>(null);
  const [partnerOptions, setPartnerOptions] = useState<SelectOption[]>([]);
  const [peopleOptions, setPeopleOptions] = useState<SelectOption[]>([]);
  const [publicAgencyOptions, setPublicAgencyOptions] = useState<SelectOption[]>([]);
  const [secretaryOptions, setSecretaryOptions] = useState<SecretaryOption[]>([]);
  const [editRelations, setEditRelations] = useState<EditRelations>(toEditRelations(null));
  const [isLoadingContrato, setIsLoadingContrato] = useState(true);
  const [loadContratoError, setLoadContratoError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);
  const [tabSectionRefreshKey, setTabSectionRefreshKey] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [canViewAuditTab, setCanViewAuditTab] = useState(false);

  // Garantir que o componente está montado no cliente para evitar problemas de hidratação
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAuditAccess() {
      try {
        const user = await fetchCurrentUser();
        if (!cancelled) {
          setCanViewAuditTab(canViewContractAudit(user));
        }
      } catch {
        if (!cancelled) {
          setCanViewAuditTab(false);
        }
      }
    }

    void loadAuditAccess();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    autoEditAppliedRef.current = false;
    setIsTitleExpanded(false);
    setHasTitleOverflow(false);
  }, [contratoId]);

  const loadSelectOptions = useCallback(async () => {
    const [partnersPage, peoplePage, publicAgencies, secretaries] = await Promise.all([
      listPartners({ page: 0, size: 100 }).catch(() => null),
      listPeople({ page: 0, size: 100 }).catch(() => null),
      listAllPublicAgencies(100).catch(() => []),
      listAllSecretaries(100).catch(() => []),
    ]);

    const nextPartnerOptions: SelectOption[] = (partnersPage?.content ?? []).map((partner) => ({
      id: partner.id,
      label: partner.name,
    }));

    const nextPeopleOptions: SelectOption[] = (peoplePage?.content ?? []).map((person) => ({
      id: person.id,
      label: person.fullName,
    }));

    const nextPublicAgencyOptions: SelectOption[] = publicAgencies.map(
      (agency) => ({
        id: agency.id,
        label: agency.name,
      })
    );

    const nextSecretaryOptions: SecretaryOption[] = secretaries.map(
      (secretary) => ({
        id: secretary.id,
        label: secretary.name,
        publicAgencyId: secretary.publicAgency?.id ?? null,
      })
    );

    setPartnerOptions(nextPartnerOptions);
    setPeopleOptions(nextPeopleOptions);
    setPublicAgencyOptions(nextPublicAgencyOptions);
    setSecretaryOptions(nextSecretaryOptions);

    return {
      nextPartnerOptions,
      nextPeopleOptions,
      nextPublicAgencyOptions,
      nextSecretaryOptions,
    };
  }, []);

  const loadContrato = useCallback(async () => {
    setIsLoadingContrato(true);
    setLoadContratoError(null);

    try {
      const [project, selectOptions] = await Promise.all([
        getProjectById(contratoId),
        loadSelectOptions(),
      ]);

      const partnerLabelById = new Map(
        selectOptions.nextPartnerOptions.map((option) => [option.id, option.label])
      );
      const peopleLabelById = new Map(
        selectOptions.nextPeopleOptions.map((option) => [option.id, option.label])
      );
      const publicAgencyLabelById = new Map(
        selectOptions.nextPublicAgencyOptions.map((option) => [option.id, option.label])
      );
      const secretaryLabelById = new Map(
        selectOptions.nextSecretaryOptions.map((option) => [option.id, option.label])
      );

      const resolvePartnerName = async (id: number | null) => {
        if (!id) return NO_INFO_LABEL;
        const fromOptions = partnerLabelById.get(id);
        if (fromOptions) return fromOptions;
        try {
          const partner = await getPartnerById(id);
          return partner.name || NO_INFO_LABEL;
        } catch {
          return `Parceiro #${id}`;
        }
      };

      const resolvePrimaryClientName = async (id: number | null) => {
        if (!id) return NO_INFO_LABEL;
        const fromOptions = publicAgencyLabelById.get(id);
        if (fromOptions) return fromOptions;
        try {
          const agency = await getPublicAgencyById(id);
          return agency.name || NO_INFO_LABEL;
        } catch {
          return `Cliente #${id}`;
        }
      };

      const resolveSecondaryClientName = async (id: number | null) => {
        if (!id) return NO_INFO_LABEL;
        const fromOptions = secretaryLabelById.get(id);
        if (fromOptions) return fromOptions;
        try {
          const secretary = await getSecretaryById(id);
          return secretary.name || NO_INFO_LABEL;
        } catch {
          return `Secretaria #${id}`;
        }
      };

      const resolveCoordinatorName = async (id: number | null) => {
        if (!id) return NO_INFO_LABEL;
        const fromOptions = peopleLabelById.get(id);
        if (fromOptions) return fromOptions;
        try {
          const person = await getPeopleById(id);
          return person.fullName || NO_INFO_LABEL;
        } catch {
          return `Pessoa #${id}`;
        }
      };

      const [primaryPartner, secondaryPartner, primaryClient, secondaryClient, coordinator] =
        await Promise.all([
          resolvePartnerName(project.primaryPartnerId),
          resolvePartnerName(project.secundaryPartnerId),
          resolvePrimaryClientName(project.primaryClientId),
          resolveSecondaryClientName(project.secundaryClientId),
          resolveCoordinatorName(project.cordinatorId),
        ]);

      const mapped = mapProjectToContrato(project, {
        primaryPartner,
        secondaryPartner,
        primaryClient,
        secondaryClient,
        coordinator,
      });

      setProjectSnapshot(project);
      setEditRelations(toEditRelations(project));
      setContratoBase(mapped);
      setEditContrato(mapped);
    } catch (error) {
      setLoadContratoError(
        getUserErrorMessage(error, "Não foi possível carregar os detalhes do contrato.")
      );
      setProjectSnapshot(null);
      setEditRelations(toEditRelations(null));
      setContratoBase({ ...EMPTY_CONTRATO, id: contratoId });
      setEditContrato({ ...EMPTY_CONTRATO, id: contratoId });
    } finally {
      setIsLoadingContrato(false);
    }
  }, [contratoId, loadSelectOptions]);

  useEffect(() => {
    void loadContrato();
  }, [loadContrato]);

  const contrato: ContratoView = isEditing ? editContrato : contratoBase;
  const filteredSecondaryClientOptions = useMemo(() => {
    if (!editRelations.primaryClientId) return [];

    return secretaryOptions.filter(
      (secretary) => secretary.publicAgencyId === editRelations.primaryClientId
    );
  }, [editRelations.primaryClientId, secretaryOptions]);

  useEffect(() => {
    if (!editRelations.secundaryClientId) return;
    const isValid = filteredSecondaryClientOptions.some(
      (secretary) => secretary.id === editRelations.secundaryClientId
    );
    if (!isValid) {
      setEditRelations((prev) => ({ ...prev, secundaryClientId: null }));
    }
  }, [editRelations.secundaryClientId, filteredSecondaryClientOptions]);

  const tabs: TabItem[] = [
    {
      label: "Visão Geral",
      href: `/contratos/${contratoId}`,
      description: "Resumo e informacoes principais",
    },
    // {
    //   label: "Trilha",
    //   href: `/contratos/${contratoId}/trilha`,
    //   description: "Funil de preparação do contrato",
    // },
    {
      label: "Metas",
      href: `/contratos/${contratoId}/meta-etapa-fase`,
      description: "Estrutura de metas e entregas",
    },
    {
      label: "Desembolso",
      href: `/contratos/${contratoId}/desembolso`,
      description: "Cronograma de desembolsos",
    },
    {
      label: "Rubricas",
      href: `/contratos/${contratoId}/rubricas`,
      description: "Orcamento e execução financeira",
    },
    {
      label: "Pagamentos",
      href: `/contratos/${contratoId}/pagamentos`,
      description: "Histórico de pagamentos",
    },
    {
      label: "Pessoas",
      href: `/contratos/${contratoId}/equipe-tecnica`,
      description: "Membros",
    },
    {
      label: "Empresas",
      href: `/contratos/${contratoId}/empresas`,
      description: "Empresas vinculadas",
    },
    ...(canViewAuditTab
      ? [
          {
            label: "Auditoria",
            href: `/contratos/${contratoId}/auditoria`,
            description: "Trilha de alterações do contrato",
          },
        ]
      : []),
    {
      label: "Arquivos",
      href: `/contratos/${contratoId}/arquivos`,
      description: "Documentos anexados",
    },
  ];

  const isActiveTab = (href: string) => {
    if (href === `/contratos/${contratoId}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const currentContrato = isEditing ? editContrato : contrato;
  const contractDisplayTitle = `${contrato.codigo} - ${contrato.titulo}`;
  const editPopupUrl = useMemo(
    () => `/contratos/novo-contrato?popup=1&editContractId=${contratoId}`,
    [contratoId]
  );
  const shouldCheckLongTitle = contractDisplayTitle.trim().length > 120;
  const currentProjectStatus = (
    isEditing ? editContrato.status : contratoBase.status
  ) as ProjectStatusEnum;
  // const saldoTotal = (currentContrato.valorTotal || 0) - (currentContrato.valorExecutado || 0);
  const canEditContrato = !isLoadingContrato && !loadContratoError && !!projectSnapshot;

  // Truncar descrição para preview
  const currentDescricao = isEditing ? editContrato.descricao : contrato.descricao;
  const descricaoPreview = currentDescricao
    ? currentDescricao.length > 150
      ? currentDescricao.substring(0, 150) + "..."
      : currentDescricao
    : null;

  // Funções de edição
  const handleEdit = useCallback(() => {
    setSaveError(null);
    setSavedMessage(false);
    setIsEditing(false);
    setShowEditPopup(true);
  }, []);

  const refreshTabSection = useCallback(() => {
    setTabSectionRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!autoEditRequested || autoEditAppliedRef.current) {
      return;
    }

    if (canEditContrato && !isEditing) {
      handleEdit();
      autoEditAppliedRef.current = true;
    }
  }, [autoEditRequested, canEditContrato, isEditing, handleEdit]);

  useEffect(() => {
    if (isEditing) {
      setHasTitleOverflow(false);
      return;
    }

    const measureTitleOverflow = () => {
      const element = titleRef.current;
      if (!element || isTitleExpanded) {
        return;
      }

      setHasTitleOverflow(element.scrollHeight > element.clientHeight + 1);
    };

    measureTitleOverflow();
    window.addEventListener("resize", measureTitleOverflow);

    return () => {
      window.removeEventListener("resize", measureTitleOverflow);
    };
  }, [contractDisplayTitle, isEditing, isTitleExpanded]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const payload = event.data as
        | {
            source?: string;
            type?: string;
            contractId?: string | number;
          }
        | undefined;

      if (!payload || payload.source !== "contract-form") {
        return;
      }

      if (payload.type === "contract-edit-closed") {
        setShowEditPopup(false);
        return;
      }

      if (
        payload.type === "contract-edit-saved" &&
        String(payload.contractId ?? "") === String(contratoId)
      ) {
        setShowEditPopup(false);
        setSaveError(null);
        void loadContrato().then(() => {
          refreshTabSection();
          setSavedMessage(true);
          setTimeout(() => setSavedMessage(false), 3000);
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [contratoId, loadContrato, refreshTabSection]);

  const handleCancel = () => {
    setSaveError(null);
    setEditContrato({ ...contratoBase });
    setEditRelations(toEditRelations(projectSnapshot));
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!projectSnapshot) return;

    setIsSaving(true);
    setSaveError(null);

    const payload: ProjectUpdateDTO = {
      name: toOptionalText(editContrato.titulo),
      code: toOptionalText(editContrato.codigo),
      projectStatus: editContrato.status as ProjectStatusEnum,
      areaSegmento:
        editContrato.segmentos && editContrato.segmentos.length > 0
          ? editContrato.segmentos.join(", ")
          : undefined,
      object: toOptionalText(editContrato.descricao),
      primaryPartnerId: editRelations.primaryPartnerId ?? undefined,
      secundaryPartnerId: editRelations.secundaryPartnerId ?? undefined,
      primaryClientId: editRelations.primaryClientId ?? undefined,
      secundaryClientId: editRelations.secundaryClientId ?? undefined,
      cordinatorId: editRelations.cordinatorId ?? undefined,
      projectGovIf: editRelations.projectGovIf ?? undefined,
      projectType: editContrato.tipo as ProjectTypeEnum,
      contractValue: editContrato.valorTotal,
      startDate: toOptionalDate(editContrato.dataInicio),
      endDate: toOptionalDate(editContrato.dataFim),
      openingDate: toOptionalDate(editContrato.dataRealInicio),
      closingDate: toOptionalDate(editContrato.dataRealTermino),
      city: projectSnapshot.city ?? undefined,
      state: projectSnapshot.state ?? undefined,
      executionLocation:
        editContrato.localidade === NO_INFO_LABEL
          ? undefined
          : toOptionalText(editContrato.localidade),
      projectBankAccount:
        editContrato.contaBancariaProjeto === NO_INFO_LABEL
          ? undefined
          : toOptionalText(editContrato.contaBancariaProjeto),
    };

    try {
      await updateProject(contratoId, payload);
      await loadContrato();
      refreshTabSection();
      setIsEditing(false);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (error) {
      setSaveError(getUserErrorMessage(error, "Não foi possível salvar as alterações do contrato."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (updates: Partial<Contrato>) => {
    setEditContrato((prev) => ({ ...prev, ...updates }));
  };

  const handleRelationChange = (updates: Partial<EditRelations>) => {
    setEditRelations((prev) => ({ ...prev, ...updates }));
  };

  const toggleSegmento = (segmento: string) => {
    const selected = editContrato.segmentos || [];
    const updated = selected.includes(segmento)
      ? selected.filter((s) => s !== segmento)
      : [...selected, segmento];
    handleChange({ segmentos: updated });
  };

  const handleStatusChange = async (nextStatus: ProjectStatusEnum) => {
    if (isEditing) {
      handleChange({ status: nextStatus });
      return;
    }

    if (!projectSnapshot || nextStatus === contratoBase.status) {
      return;
    }

    setIsUpdatingStatus(true);
    setSaveError(null);

    try {
      await updateProject(contratoId, { projectStatus: nextStatus });
      await loadContrato();
      refreshTabSection();
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (error) {
      setSaveError(getUserErrorMessage(error, "Não foi possível atualizar o status do projeto."));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const segmentoOptions = [
    "Educação",
    "Saúde",
    "Cidades",
    "Meio Ambiente",
    "Tecnologia",
    "Turismo",
    "Social",
    "Economia",
    "Cultura",
    "Ciência",
    "Esporte",
    "Agricultura",
    "Outro",
  ];

  if (isLoadingContrato && !projectSnapshot) {
    return <ContractRouteLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <NavBar />

      <div className="mx-auto max-w-7xl overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex min-w-0 card items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/home" className="hover:text-gray-700 flex items-center gap-1">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/contratos" className="hover:text-gray-700">
            Contratos
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span
            className="min-w-0 flex-1 truncate text-gray-900 font-medium"
            title={`${(isEditing ? editContrato : contrato).codigo} - ${(isEditing ? editContrato : contrato).titulo}`}
          >
            {(isEditing ? editContrato : contrato).codigo} – {(isEditing ? editContrato : contrato).titulo}
          </span>
        </nav>

        {loadContratoError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div>{loadContratoError}</div>
            <button
              type="button"
              onClick={() => void loadContrato()}
              className="mt-2 rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Header do Contrato */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          {/* Linha principal */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={editContrato.codigo}
                      onChange={(e) => handleChange({ codigo: e.target.value })}
                      className="px-2 py-1 text-2xl font-bold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
                      placeholder="Código"
                    />
                    <span className="text-2xl font-bold text-gray-900">–</span>
                    <input
                      type="text"
                      value={editContrato.titulo}
                      onChange={(e) => handleChange({ titulo: e.target.value })}
                      className="px-2 py-1 text-2xl font-bold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225] flex-1 min-w-[200px]"
                      placeholder="Título do contrato"
                    />
                    <select
                      value={editRelations.projectGovIf ?? ""}
                      onChange={(e) =>
                        handleRelationChange({
                          projectGovIf: (e.target.value || null) as ProjectGovIfEnum | null,
                        })
                      }
                      className={`h-9 rounded-full border px-3 text-sm font-semibold focus:outline-none focus:ring-2 ${editRelations.projectGovIf === "GOV"
                          ? "border-sky-200 bg-sky-50 text-sky-700 focus:ring-sky-200/70"
                          : editRelations.projectGovIf === "IF"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 focus:ring-emerald-200/70"
                            : "border-gray-300 bg-white text-gray-700 focus:ring-[#004225]/20 focus:border-[#004225]"
                        }`}
                    >
                      <option value="">Gov/IF</option>
                      <option value="GOV">GOV</option>
                      <option value="IF">IF</option>
                    </select>
                  </div>
                ) : (
                  <div className="min-w-0 flex-1">
                    <h1
                      ref={titleRef}
                      className={`min-w-0 text-2xl font-bold text-[#003319] break-words [overflow-wrap:anywhere] ${
                        (hasTitleOverflow || shouldCheckLongTitle) && !isTitleExpanded ? "line-clamp-2" : ""
                      }`}
                    >
                      {contrato.codigo} – {contrato.titulo}
                    </h1>
                    {(hasTitleOverflow || isTitleExpanded) && (
                      <button
                        type="button"
                        onClick={() => setIsTitleExpanded((current) => !current)}
                        className="mt-2 text-sm font-medium text-[#004225] transition-colors hover:text-[#003319]"
                      >
                        {isTitleExpanded ? "Ver menos" : "Ver mais"}
                      </button>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {currentContrato.unidade && (
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${String(currentContrato.unidade).toUpperCase() === "GOV"
                              ? "border-sky-200 bg-sky-50 text-sky-700"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            }`}
                        >
                          {String(currentContrato.unidade).toUpperCase()}
                        </span>
                      )}
                      {!isLoadingContrato && !loadContratoError && (
                        <ExecutionModeBadge
                          executedByInnovatis={currentContrato.executedByInnovatis === true}
                        />
                      )}
                    </div>
                  </div>
                )}
                {/* Temporarily hidden:
                {!isEditing && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="text-sm font-medium">Saldo: {formatCurrency(saldoTotal)}</span>
                  </div>
                )}
                */}
                {isEditing && (
                  <div className="flex items-center gap-2">
                    <select
                      value={editContrato.tipo}
                      onChange={(e) => handleChange({ tipo: e.target.value as "PROJETO" | "PRODUTO" })}
                      className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                    >
                      <option value="PROJETO">Projeto</option>
                      <option value="PRODUTO">Produto</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 text-gray-500 text-sm flex-wrap">
                <span>Contrato ID: {contratoId}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      disabled={
                        isUpdatingStatus || (!isEditing && !projectSnapshot)
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-transparent bg-transparent px-0 py-0 text-xs disabled:opacity-60"
                    >
                      <StatusBadge status={currentProjectStatus} />
                      <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    sideOffset={6}
                    className="z-50 min-w-[180px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                  >
                    {PROJECT_STATUS_OPTIONS.map((option) => {
                      const isSelected = option.value === currentProjectStatus;
                      return (
                        <DropdownMenuItem
                          key={option.value}
                          onSelect={(event) => {
                            event.preventDefault();
                            void handleStatusChange(option.value);
                          }}
                          className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 outline-none cursor-pointer"
                        >
                          <span>{option.label}</span>
                          {isSelected ? (
                            <Check className="h-4 w-4 text-[#004225]" />
                          ) : (
                            <span className="h-4 w-4" />
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
              {savedMessage && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                  <CheckCircle className="h-4 w-4" />
                  Salvo com sucesso!
                </div>
              )}
              {saveError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                  {saveError}
                </div>
              )}
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !projectSnapshot}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Salvando..." : "Salvar"}
                  </button>
                </>
              ) : (
                <>
                  {isMounted ? (
                    <div className="relative">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            disabled={!canEditContrato}
                            className="inline-flex items-center justify-center w-10 h-10 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          sideOffset={5}
                          className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-50"
                        >
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              handleEdit();
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer focus:bg-gray-50 outline-none"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-10 h-10 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sub-informações em grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Coluna 1 - Cliente/Parceiro */}
            <div className="space-y-3">

              <div className="flex items-start gap-3 group">
                <Building2 className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">
                    Parceiro Primário
                  </p>
                  {isEditing ? (
                    <select
                      value={editRelations.primaryPartnerId ?? ""}
                      onChange={(e) =>
                        handleRelationChange({
                          primaryPartnerId: parseSelectNumber(e.target.value),
                        })
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
                    >
                      <option value="">Selecione um parceiro</option>
                      {partnerOptions.map((partner) => (
                        <option key={partner.id} value={partner.id}>
                          {partner.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {contrato.parceiro || NO_INFO_LABEL}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3 group">
                <Building2 className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">
                    Parceiro Secundário
                  </p>
                  {isEditing ? (
                    <select
                      value={editRelations.secundaryPartnerId ?? ""}
                      onChange={(e) =>
                        handleRelationChange({
                          secundaryPartnerId: parseSelectNumber(e.target.value),
                        })
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
                    >
                      <option value="">Sem parceiro secundário</option>
                      {partnerOptions.map((partner) => (
                        <option key={partner.id} value={partner.id}>
                          {partner.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {contrato.parceiroSecundario || NO_INFO_LABEL}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Coluna 2 - Cliente Secundario/Tipo */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 group">
                <Building2 className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">
                    Cliente Primário
                  </p>
                  {isEditing ? (
                    <select
                      value={editRelations.primaryClientId ?? ""}
                      onChange={(e) =>
                        handleRelationChange({
                          primaryClientId: parseSelectNumber(e.target.value),
                        })
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
                    >
                      <option value="">Selecione um cliente</option>
                      {publicAgencyOptions.map((agency) => (
                        <option key={agency.id} value={agency.id}>
                          {agency.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{contrato.cliente || NO_INFO_LABEL}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3 group">
                <Building2 className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">
                    Cliente Secundário (Secretaria)
                  </p>
                  {isEditing ? (
                    <select
                      value={editRelations.secundaryClientId ?? ""}
                      onChange={(e) =>
                        handleRelationChange({
                          secundaryClientId: parseSelectNumber(e.target.value),
                        })
                      }
                      disabled={!editRelations.primaryClientId}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
                    >
                      <option value="">
                        {editRelations.primaryClientId
                          ? "Selecione uma secretaria"
                          : "Selecione primeiro o cliente primário"}
                      </option>
                      {filteredSecondaryClientOptions.map((secretary) => (
                        <option key={secretary.id} value={secretary.id}>
                          {secretary.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {contrato.clienteSecundario || contrato.orgaoFinanciador || NO_INFO_LABEL}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Coluna 3 - Valor Total/Situação Financeira */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 group">
                <DollarSign className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">Valor Total</p>
                  {isEditing ? (
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">R$</span>
                      <input
                        type="text"
                        value={editContrato.valorTotal.toLocaleString("pt-BR")}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value.replace(/\D/g, "")) / 100;
                          if (!isNaN(value)) handleChange({ valorTotal: value });
                        }}
                        className="w-full pl-8 pr-2 py-1 text-sm font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
                        placeholder="0,00"
                      />
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-gray-900">
                      R$ {contrato.valorTotal.toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3 group">
                <Tag className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">
                    Tipo
                  </p>
                  {isEditing ? (
                    <select
                      value={editContrato.tipo}
                      onChange={(e) => handleChange({ tipo: e.target.value as "PROJETO" | "PRODUTO" })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
                    >
                      <option value="PROJETO">Projeto</option>
                      <option value="PRODUTO">Produto</option>
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {contrato.tipo === "PROJETO" ? "Projeto" : "Produto"}
                    </p>
                  )}
                </div>
              </div>
              {/* <div className="flex items-start gap-3 group">
                <div className="h-5 w-5" /> {/* Spacer
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">Situação Financeira</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full w-24">
                      <div
                        className="h-2 bg-[#004225] rounded-full"
                        style={{ width: `${percentualExecutado}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {percentualExecutado}% executado
                    </span>
                  </div>
                </div>
              </div> */}
            </div>

            {/* Coluna 4 - Datas */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 group">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">Data de Início</p>
                  {isEditing ? (
                    <DatePicker
                      value={editContrato.dataInicio}
                      onChange={(value) => handleChange({ dataInicio: value })}
                      className="h-9 rounded-lg px-2 py-1 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(contrato.dataInicio)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3 group">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">Data de Término</p>
                  {isEditing ? (
                    <DatePicker
                      value={editContrato.dataFim}
                      onChange={(value) => handleChange({ dataFim: value })}
                      className="h-9 rounded-lg px-2 py-1 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(contrato.dataFim)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Informações Complementares - Seção Expansível */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsInfoComplementarExpanded(!isInfoComplementarExpanded)}
              className="w-full flex items-center justify-between text-left hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
            >
              <span className="text-xs font-medium text-gray-700">
                Informações Complementares
              </span>
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform duration-500 ease-out ${isInfoComplementarExpanded ? "rotate-180" : ""
                  }`}
                style={{
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </button>

            <div
              className={`overflow-hidden transition-all duration-700 ease-out ${isInfoComplementarExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                }`}
              style={{
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div className="mt-3">
                {/* Grid de 4 coluna na parte expandida */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                  {/* Coluna 1 - Coordenador */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 group">
                      <User className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">Coordenador</p>
                        {isEditing ? (
                          <select
                            value={editRelations.cordinatorId ?? ""}
                            onChange={(e) =>
                              handleRelationChange({
                                cordinatorId: parseSelectNumber(e.target.value),
                              })
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
                          >
                            <option value="">Selecione um coordenador</option>
                            {peopleOptions.map((person) => (
                              <option key={person.id} value={person.id}>
                                {person.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-sm font-medium text-gray-900">{contrato.coordenador}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Coluna 2 - Localidade da parte expandida */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 group">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">Localidade</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editContrato.localidade}
                            onChange={(e) => handleChange({ localidade: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900">{contrato.localidade}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3 group">
                      <DollarSign className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">
                          Conta Bancária do Projeto
                        </p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={
                              editContrato.contaBancariaProjeto === NO_INFO_LABEL
                                ? ""
                                : editContrato.contaBancariaProjeto || ""
                            }
                            onChange={(e) =>
                              handleChange({
                                contaBancariaProjeto: e.target.value.replace(/\D/g, "").slice(0, 30),
                              })
                            }
                            placeholder="Somente números"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900">
                            {contrato.contaBancariaProjeto || NO_INFO_LABEL}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Coluna 3 - Segmentos da parte expandida */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 group">
                      <Tag className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2 group-hover:text-[#003319] transition-colors cursor-default">Segmentos</p>
                        {isEditing ? (
                          <div className="flex flex-wrap gap-2">
                            {segmentoOptions.map((segmento) => {
                              const isActive = (editContrato.segmentos || []).includes(segmento);
                              return (
                                <button
                                  key={segmento}
                                  type="button"
                                  onClick={() => toggleSegmento(segmento)}
                                  className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${isActive
                                      ? "bg-[#004225] text-white border-[#004225]"
                                      : "bg-white text-gray-700 border-gray-300 hover:border-[#004225]"
                                    }`}
                                >
                                  {segmento}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          contrato.segmentos && contrato.segmentos.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {contrato.segmentos.map((segmento) => (
                                <span
                                  key={segmento}
                                  className="px-3 py-1 text-xs bg-[#004225] text-white rounded-full"
                                >
                                  {segmento}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">Nenhum segmento selecionado</p>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Coluna 4 - Datas Reais de Execução */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 group">
                      <Calendar className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">Data Efetiva de Início</p>
                        {isEditing ? (
                          <DatePicker
                            value={editContrato.dataRealInicio || ""}
                            onChange={(value) => handleChange({ dataRealInicio: value || undefined })}
                            className="h-9 rounded-lg px-2 py-1 text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900">
                            {contrato.dataRealInicio ? formatDate(contrato.dataRealInicio) : "—"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3 group">
                      <Calendar className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wide group-hover:text-[#003319] transition-colors cursor-default">Data Efetiva de Término</p>
                        {isEditing ? (
                          <DatePicker
                            value={editContrato.dataRealTermino || ""}
                            onChange={(value) => handleChange({ dataRealTermino: value || undefined })}
                            className="h-9 rounded-lg px-2 py-1 text-sm"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900">
                            {contrato.dataRealTermino ? formatDate(contrato.dataRealTermino) : "—"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Objeto do Projeto - abaixo do grid, ocupando toda a largura */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-start gap-3 group">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5 group-hover:text-[#003319] transition-colors" />
                    <div className="min-w-0 flex-1 w-full">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-2 group-hover:text-[#003319] transition-colors cursor-default">Objeto</p>
                      {isEditing ? (
                        <textarea
                          value={editContrato.descricao || ""}
                          onChange={(e) => handleChange({ descricao: e.target.value })}
                          rows={4}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225] resize-none"
                          placeholder="Descrição do objeto do contrato..."
                        />
                      ) : contrato.descricao ? (
                        <>
                          <p className="w-full text-sm text-gray-900 whitespace-pre-wrap break-words">
                            {isDescricaoExpanded ? contrato.descricao : descricaoPreview}
                          </p>
                          {contrato.descricao.length > 150 && (
                            <button
                              onClick={() => setIsDescricaoExpanded(!isDescricaoExpanded)}
                              className="mt-2 text-sm text-[#004225] hover:text-[#003319] font-medium flex items-center gap-1"
                            >
                              {isDescricaoExpanded ? (
                                <>
                                  <ChevronUp className="h-4 w-4" />
                                  Ver menos
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4" />
                                  Ver mais
                                </>
                              )}
                            </button>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Nenhum objeto cadastrado</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs de navegação*/}
        <div
          key={`${pathname}-${tabSectionRefreshKey}`}
          className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6"
        >
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`
                    flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                    ${isActiveTab(tab.href)
                      ? "border-[#004225] text-[#004225]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Conteúdo da aba */}
          <div className="p-6">{children}</div>
        </div>

        {showEditPopup && (
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
          >
            <div
              className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Editar Contrato</h2>
                  <p className="text-sm text-gray-500">
                    Atualize as informações principais usando o mesmo formulário de cadastro.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditPopup(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                  aria-label="Fechar edição do contrato"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <iframe
                key={editPopupUrl}
                src={editPopupUrl}
                title={`Editar contrato ${contratoId}`}
                className="h-full w-full border-0 bg-white"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componentes auxiliares
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    PRE_PROJETO: { bg: "bg-gray-100", text: "text-gray-800", label: "Pré-projeto" },
    PLANEJAMENTO: { bg: "bg-slate-100", text: "text-slate-800", label: "Planejamento" },
    EXECUCAO: { bg: "bg-blue-100", text: "text-blue-800", label: "Execução" },
    FINALIZADO: { bg: "bg-green-100", text: "text-green-800", label: "Finalizado" },
    SUSPENSO: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Suspenso" },
  };

  const { bg, text, label } = config[status] || config.PRE_PROJETO;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
}

function ExecutionModeBadge({
  executedByInnovatis,
}: {
  executedByInnovatis: boolean;
}) {
  return (
    <span
        className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${
          executedByInnovatis
            ? "border-[#004225] bg-[#004225] text-white"
            : "border-orange-200 bg-orange-50 text-orange-700"
        }`}
    >
      {executedByInnovatis ? "INNOVATIS" : "PARCEIRO"}
    </span>
  );
}

function formatDate(iso: string) {
  return formatDateOnlyToPtBr(iso);
}
