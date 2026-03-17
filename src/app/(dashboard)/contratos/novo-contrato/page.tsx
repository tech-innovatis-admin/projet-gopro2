"use client";

import { Suspense, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Calendar,
  MapPin,
  User,
  Building2,
  Tag,
  AlertCircle,
  DollarSign,
  ChevronRight,
  ChevronDown,
  Home,
  ArrowLeft,
  Plus,
  Trash2,
  Milestone,
  Flag,
  X,
  Upload,
  Eye,
} from "lucide-react";
import { NavBar } from "@/components/ui/NavBar";
import { Checkbox } from "@/components/ui/checkbox";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { DatePicker } from "@/components/ui/DatePicker";
import { Label } from "@/components/ui/label";
import { ProjectCreatedModal } from "./_components/ProjectCreatedModal";
import {
  createPartner,
  createPeople,
  createPublicAgency,
  createSecretary,
  createDisbursementSchedule,
  createGoal,
  createPhase,
  createProject,
  createStage,
  getProjectById,
  listPartners,
  listPeople,
  listAllPublicAgencies,
  listAllSecretaries,
  updateProject,
  uploadDocument,
} from "@/src/lib/api/endpoints";
import {
  type DisbursementScheduleRequestDTO,
  type GoalRequestDTO,
  HttpError,
  type PartnerRequestDTO,
  type PartnersTypeEnum,
  type PeopleRequestDTO,
  type PhaseRequestDTO,
  type PublicAgencyRequestDTO,
  type PublicAgencyTypeEnum,
  type ProjectGovIfEnum,
  type ProjectRequestDTO,
  type ProjectResponseDTO,
  type ProjectStatusEnum,
  type ProjectTypeEnum,
  type ProjectUpdateDTO,
  type SecretaryRequestDTO,
  type StageRequestDTO,
  type StatusDisbursementScheduleEnum,
} from "@/src/lib/api/types";
import {
  canManageContractChildren,
  fetchCurrentUser,
} from "@/src/lib/auth/session";

// Tipos
type ContratoStatus = ProjectStatusEnum;
type ContratoTipo = ProjectTypeEnum;
type StatusDesembolso = StatusDisbursementScheduleEnum;
type OptionItem = {
  id: string;
  name: string;
  cnpj?: string | null;
};
type SecretariaOptionItem = OptionItem & {
  publicAgencyId: string;
};
type CoordinatorOptionItem = {
  id: string;
  fullName: string;
  cpf: string | null;
};

// Tipos para Metas, Etapas e Fases
type Fase = {
  id: string;
  numero: number;
  titulo: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
};

type Etapa = {
  id: string;
  numero: number;
  titulo: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  fases: Fase[];
};

type Meta = {
  id: string;
  numero: number;
  titulo: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  etapas: Etapa[];
};

type ParcelaDesembolso = {
  id: string;
  numero: number;
  dataPrevista: string;
  valorPrevisto: number;
  status: StatusDesembolso;
  observacao?: string;
};

type NovoContratoForm = {
  titulo: string;
  govIf: ProjectGovIfEnum | "";
  status: ContratoStatus | "";
  coordenador: string;
  parceiroId: string;
  parceiroSecundarioId: string;
  executedByInnovatis: boolean;
  clientePrimarioId: string;
  clienteSecundarioId: string;
  segmentos: string[];
  tipo: ContratoTipo | "";
  dataInicio: string;
  dataFim: string;
  dataInicioEfetivo: string;
  dataFimEfetivo: string;
  uf: string;
  cidade: string;
  scope: string;
  contract_value: string;
  metas: Meta[];
  parcelas: ParcelaDesembolso[];
};

type FormErrors = Partial<Record<keyof NovoContratoForm, string>>;
type PartnerTargetField = "parceiroId" | "parceiroSecundarioId";
type CoordinatorForm = {
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  city: string;
  state: string;
};
type PartnerCreateForm = {
  name: string;
  tradeName: string;
  partnersType: PartnersTypeEnum;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  site: string;
  city: string;
  state: string;
  acronym: string;
};
type ClientCreateForm = {
  name: string;
  cnpj: string;
  publicAgencyType: PublicAgencyTypeEnum;
  sigla: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  city: string;
  state: string;
};
type SecretaryCreateForm = {
  name: string;
  cnpj: string;
  sigla: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
};
type IbgeStateResponse = {
  id: number;
  sigla: string;
  nome: string;
};
type IbgeCityResponse = {
  id: number;
  nome: string;
};
type TipoDocumento = "contrato" | "tr" | "planoTrabalho" | "outro";
type ProjetoDocumentos = Partial<Record<TipoDocumento, File>>;

const DOCUMENT_CATEGORY_BY_TYPE: Record<TipoDocumento, string> = {
  contrato: "CONTRATO",
  tr: "TERMO_REFERENCIA",
  planoTrabalho: "PLANO_TRABALHO",
  outro: "OUTRO",
};

const documentoLabels: Record<TipoDocumento, string> = {
  contrato: "Contrato",
  tr: "TR (Termo de Referencia)",
  planoTrabalho: "Plano de Trabalho",
  outro: "Outro Documento",
};

const MAX_DOCUMENT_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = ["application/pdf", "image/png", "image/jpeg"];

const DEFAULT_MAX_CONTRACT_VALUE = 9999999999999.99;
const configuredMaxContractValue = Number(process.env.NEXT_PUBLIC_PROJECT_MAX_CONTRACT_VALUE);
const MAX_CONTRACT_VALUE =
  Number.isFinite(configuredMaxContractValue) && configuredMaxContractValue > 0
    ? configuredMaxContractValue
    : DEFAULT_MAX_CONTRACT_VALUE;

const statusOptions: { value: ContratoStatus; label: string }[] = [
  { value: "PRE_PROJETO", label: "Pre-projeto" },
  { value: "EXECUCAO", label: "Execucao" },
  { value: "FINALIZADO", label: "Finalizado" },
  { value: "SUSPENSO", label: "Suspenso" },
  { value: "PLANEJAMENTO", label: "Planejamento" },
];

const tipoOptions: { value: ContratoTipo; label: string }[] = [
  { value: "PROJETO", label: "Projeto" },
  { value: "PRODUTO", label: "Produto" },
];

const segmentoOptions = [
  "Educacao",
  "Saude",
  "Cidades",
  "Meio Ambiente",
  "Tecnologia",
  "Turismo",
  "Social",
  "Economia",
  "Cultura",
  "Ciencia",
  "Esporte",
  "Agricultura",
  "Outro",
];

const statusDesembolsoOptions: { value: StatusDesembolso; label: string; color: string }[] = [
  { value: "PREVISTO", label: "Previsto", color: "bg-gray-100 text-gray-800" },
  { value: "PARCIAL", label: "Parcial", color: "bg-blue-100 text-blue-800" },
  { value: "RECEBIDO", label: "Recebido", color: "bg-green-100 text-green-800" },
  { value: "CANCELADO", label: "Cancelado", color: "bg-red-100 text-red-800" },
];

const partnerTypeOptions: { value: PartnersTypeEnum; label: string }[] = [
  { value: "FUNDACAO", label: "Fundação" },
  { value: "IF", label: "IF" },
];

const publicAgencyTypeOptions: { value: PublicAgencyTypeEnum; label: string }[] = [
  { value: "PREFEITURA", label: "Prefeitura" },
  { value: "GOVERNO_ESTADUAL", label: "Governo Estadual" },
  { value: "MINISTERIO", label: "Ministerio" },
];

const initialFormState: NovoContratoForm = {
  titulo: "",
  govIf: "",
  status: "",
  coordenador: "",
  parceiroId: "",
  parceiroSecundarioId: "",
  executedByInnovatis: false,
  clientePrimarioId: "",
  clienteSecundarioId: "",
  segmentos: [],
  tipo: "",
  dataInicio: "",
  dataFim: "",
  dataInicioEfetivo: "",
  dataFimEfetivo: "",
  uf: "",
  cidade: "",
  scope: "",
  contract_value: "",
  metas: [],
  parcelas: [],
};

const initialCoordinatorFormState: CoordinatorForm = {
  fullName: "",
  cpf: "",
  email: "",
  phone: "",
  birthDate: "",
  city: "",
  state: "",
};

const initialPartnerCreateFormState: PartnerCreateForm = {
  name: "",
  tradeName: "",
  partnersType: "FUNDACAO",
  cnpj: "",
  email: "",
  phone: "",
  address: "",
  site: "",
  city: "",
  state: "",
  acronym: "",
};

const initialClientCreateFormState: ClientCreateForm = {
  name: "",
  cnpj: "",
  publicAgencyType: "PREFEITURA",
  sigla: "",
  code: "",
  email: "",
  phone: "",
  address: "",
  contactPerson: "",
  city: "",
  state: "",
};

const initialSecretaryCreateFormState: SecretaryCreateForm = {
  name: "",
  cnpj: "",
  sigla: "",
  code: "",
  email: "",
  phone: "",
  address: "",
  contactPerson: "",
};

const onlyDigits = (value: string) => value.replace(/\D/g, "");

function normalizeSegments(value: string | null): string[] {
  if (!value || !value.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function splitExecutionLocation(
  executionLocation: string | null
): { city: string; state: string } {
  if (!executionLocation) {
    return { city: "", state: "" };
  }

  const parts = executionLocation
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return { city: executionLocation.trim(), state: "" };
  }

  return {
    city: parts.slice(0, -1).join(" - "),
    state: parts[parts.length - 1].toUpperCase(),
  };
}

function formatCurrencyInputValue(value: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "";
  }

  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function mapProjectToForm(project: ProjectResponseDTO): NovoContratoForm {
  const fallbackLocation = splitExecutionLocation(project.executionLocation);

  return {
    ...initialFormState,
    titulo: project.name ?? "",
    govIf: project.projectGovIf ?? "",
    status: project.projectStatus ?? "",
    coordenador: project.cordinatorId ? String(project.cordinatorId) : "",
    parceiroId: project.primaryPartnerId ? String(project.primaryPartnerId) : "",
    parceiroSecundarioId: project.secundaryPartnerId
      ? String(project.secundaryPartnerId)
      : "",
    executedByInnovatis: project.executedByInnovatis === true,
    clientePrimarioId: project.primaryClientId ? String(project.primaryClientId) : "",
    clienteSecundarioId: project.secundaryClientId
      ? String(project.secundaryClientId)
      : "",
    segmentos: normalizeSegments(project.areaSegmento),
    tipo: project.projectType ?? "",
    dataInicio: project.startDate ?? "",
    dataFim: project.endDate ?? "",
    dataInicioEfetivo: project.openingDate ?? "",
    dataFimEfetivo: project.closingDate ?? "",
    uf: (project.state ?? fallbackLocation.state ?? "").toUpperCase(),
    cidade: project.city ?? fallbackLocation.city ?? "",
    scope: project.object ?? "",
    contract_value: formatCurrencyInputValue(project.contractValue),
  };
}

const formatCpfInput = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const formatCnpjInput = (value: string) => {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const formatPhoneInput = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
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
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${normalizedUf}/municipios`
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

function NovoContratoPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPopupMode = searchParams.get("popup") === "1";
  const editContractId = searchParams.get("editContractId");
  const isEditMode = Boolean(editContractId);
  const hideAdvancedSections = isPopupMode && isEditMode;
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [canManageChildren, setCanManageChildren] = useState(false);
  const hideChildSections = hideAdvancedSections || !canManageChildren;
  const pageTitle = isEditMode ? "Editar Contrato" : "Novo Contrato";
  const pageDescription = isEditMode
    ? "Atualize as informacoes principais do contrato."
    : "Preencha as informacoes do contrato";
  const [form, setForm] = useState<NovoContratoForm>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEditProject, setIsLoadingEditProject] = useState(false);
  const [, setTouched] = useState<Set<keyof NovoContratoForm>>(new Set());
  const [ufOptions, setUfOptions] = useState<DropdownOption[]>([]);
  const [cidadeOptions, setCidadeOptions] = useState<DropdownOption[]>([]);
  const [isUfLoading, setIsUfLoading] = useState(false);
  const [isCidadeLoading, setIsCidadeLoading] = useState(false);
  const [ufLookupError, setUfLookupError] = useState<string | null>(null);
  const [cidadeLookupError, setCidadeLookupError] = useState<string | null>(null);
  const [showMetasSection, setShowMetasSection] = useState(false);
  const [expandedMetas, setExpandedMetas] = useState<Set<string>>(new Set());
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(new Set());
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastCreatedProjectId, setLastCreatedProjectId] = useState<number | null>(null);
  const [postSubmitMessage, setPostSubmitMessage] = useState<string | null>(null);
  const [postSubmitActionLoading, setPostSubmitActionLoading] = useState<"view" | "new" | null>(
    null
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [organizacoesFinanciadoras, setOrganizacoesFinanciadoras] = useState<OptionItem[]>([]);
  const [organizacoesParceiras, setOrganizacoesParceiras] = useState<OptionItem[]>([]);
  const [secretariasCliente, setSecretariasCliente] = useState<SecretariaOptionItem[]>([]);
  const [coordenadores, setCoordenadores] = useState<CoordinatorOptionItem[]>([]);
  const [showParcelasSection, setShowParcelasSection] = useState(false);
  const [isAddingParcela, setIsAddingParcela] = useState(false);
  const [showCoordinatorModal, setShowCoordinatorModal] = useState(false);
  const [isCreatingCoordinator, setIsCreatingCoordinator] = useState(false);
  const [coordinatorForm, setCoordinatorForm] = useState<CoordinatorForm>(
    initialCoordinatorFormState
  );
  const [coordinatorFormError, setCoordinatorFormError] = useState<string | null>(null);
  const [coordinatorCityOptions, setCoordinatorCityOptions] = useState<DropdownOption[]>([]);
  const [isCoordinatorCityLoading, setIsCoordinatorCityLoading] = useState(false);
  const [coordinatorCityLookupError, setCoordinatorCityLookupError] = useState<string | null>(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [partnerTargetField, setPartnerTargetField] =
    useState<PartnerTargetField>("parceiroId");
  const [isCreatingPartner, setIsCreatingPartner] = useState(false);
  const [partnerForm, setPartnerForm] = useState<PartnerCreateForm>(
    initialPartnerCreateFormState
  );
  const [partnerFormError, setPartnerFormError] = useState<string | null>(null);
  const [partnerCityOptions, setPartnerCityOptions] = useState<DropdownOption[]>([]);
  const [isPartnerCityLoading, setIsPartnerCityLoading] = useState(false);
  const [partnerCityLookupError, setPartnerCityLookupError] = useState<string | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [clientForm, setClientForm] = useState<ClientCreateForm>(initialClientCreateFormState);
  const [clientFormError, setClientFormError] = useState<string | null>(null);
  const [showSecretaryModal, setShowSecretaryModal] = useState(false);
  const [isCreatingSecretary, setIsCreatingSecretary] = useState(false);
  const [secretaryForm, setSecretaryForm] = useState<SecretaryCreateForm>(
    initialSecretaryCreateFormState
  );
  const [secretaryFormError, setSecretaryFormError] = useState<string | null>(null);
  const [newParcela, setNewParcela] = useState<Partial<ParcelaDesembolso>>({
    dataPrevista: "",
    valorPrevisto: 0,
    status: "PREVISTO",
    observacao: "",
  });
  const [documentos, setDocumentos] = useState<ProjetoDocumentos>({});
  const [fileErrors, setFileErrors] = useState<Record<TipoDocumento, string>>({
    contrato: "",
    tr: "",
    planoTrabalho: "",
    outro: "",
  });
  
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Carregar organizacoes disponiveis
  const loadOrganizations = useCallback(async () => {
    setLoadError(null);

    try {
      const [partnersPage, publicAgencies, secretaries, peoplePage] = await Promise.all([
        listPartners({ page: 0, size: 100 }),
        listAllPublicAgencies(100),
        listAllSecretaries(100),
        listPeople({ page: 0, size: 100 }),
      ]);

      setOrganizacoesParceiras(
        partnersPage.content.map((partner) => ({
          id: String(partner.id),
          name: partner.name,
          cnpj: partner.cnpj,
        }))
      );

      setOrganizacoesFinanciadoras(
        publicAgencies
          .filter((agency) => agency.isClient)
          .map((agency) => ({
            id: String(agency.id),
            name: agency.name,
            cnpj: agency.cnpj,
          }))
      );

      setSecretariasCliente(
        secretaries
          .filter(
            (secretary) =>
              secretary.isClient &&
              secretary.isActive &&
              secretary.publicAgency?.id !== null &&
              secretary.publicAgency?.id !== undefined
          )
          .map((secretary) => ({
            id: String(secretary.id),
            name: secretary.name,
            cnpj: secretary.cnpj,
            publicAgencyId: String(secretary.publicAgency!.id),
          }))
      );

      setCoordenadores(
        peoplePage.content
          .filter((person) => person.isActive)
          .map((person) => ({
            id: String(person.id),
            fullName: person.fullName,
            cpf: person.cpf,
          }))
      );
    } catch (error) {
      const message =
        error instanceof HttpError
          ? error.message
          : "Nao foi possivel carregar parceiros, agencias, secretarias e coordenadores.";
      setLoadError(message);
      setOrganizacoesParceiras([]);
      setOrganizacoesFinanciadoras([]);
      setSecretariasCliente([]);
      setCoordenadores([]);
    }
  }, []);

  // Converter opcoes para formato DropdownOption
  const govIfOptions: DropdownOption[] = useMemo(() => [
    { value: "IF", label: "IF" },
    { value: "GOV", label: "Gov" },
  ], []);

  const ufDropdownOptions = useMemo(() => ufOptions, [ufOptions]);
  const cidadeDropdownOptions = useMemo(() => cidadeOptions, [cidadeOptions]);
  const coordinatorUfDropdownOptions = useMemo(() => ufOptions, [ufOptions]);
  const coordinatorCityDropdownOptions = useMemo(
    () => coordinatorCityOptions,
    [coordinatorCityOptions]
  );
  const partnerUfDropdownOptions = useMemo(() => ufOptions, [ufOptions]);
  const partnerCityDropdownOptions = useMemo(() => partnerCityOptions, [partnerCityOptions]);

  const tipoDropdownOptions: DropdownOption[] = useMemo(() => 
    tipoOptions.map(opt => ({ value: opt.value, label: opt.label })),
    []
  );

  const statusDropdownOptions: DropdownOption[] = useMemo(() => 
    statusOptions.map(opt => ({ value: opt.value, label: opt.label })),
    []
  );

  const parceiroDropdownOptions: DropdownOption[] = useMemo(() => 
    organizacoesParceiras.map(org => ({
      value: org.id,
      label: `${org.name}${org.cnpj ? ` (${org.cnpj})` : ""}`,
      icon: <Building2 className="h-4 w-4" />,
    })),
    [organizacoesParceiras]
  );

  const clientePrimarioDropdownOptions: DropdownOption[] = useMemo(() => 
    organizacoesFinanciadoras.map(org => ({
      value: org.id,
      label: `${org.name}${org.cnpj ? ` (${org.cnpj})` : ""}`,
      icon: <Building2 className="h-4 w-4" />,
    })),
    [organizacoesFinanciadoras]
  );

  const clienteSecundarioDropdownOptions: DropdownOption[] = useMemo(() => 
    secretariasCliente
      .filter(
        (secretary) =>
          form.clientePrimarioId !== "" &&
          secretary.publicAgencyId === form.clientePrimarioId
      )
      .map((secretary) => ({
      value: secretary.id,
      label: `${secretary.name}${secretary.cnpj ? ` (${secretary.cnpj})` : ""}`,
      icon: <Building2 className="h-4 w-4" />,
    })),
    [form.clientePrimarioId, secretariasCliente]
  );

  const selectedPrimaryClient = useMemo(
    () =>
      organizacoesFinanciadoras.find(
        (client) => client.id === form.clientePrimarioId
      ),
    [form.clientePrimarioId, organizacoesFinanciadoras]
  );

  const coordenadorDropdownOptions: DropdownOption[] = useMemo(
    () =>
      coordenadores
        .map((person) => ({
          value: person.id,
          label: `${person.fullName}${person.cpf ? ` (${formatCpfInput(person.cpf)})` : ""}`,
          icon: <User className="h-4 w-4" />,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [coordenadores]
  );

  // Focus first input on mount
  useEffect(() => {
    setTimeout(() => firstInputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    void loadOrganizations();
  }, [loadOrganizations]);

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

  const loadEditProject = useCallback(async (signal?: AbortSignal) => {
    if (!isEditMode || !editContractId) {
      return;
    }

    setIsLoadingEditProject(true);
    setLoadError(null);
    setSubmitError(null);

    try {
      const project = await getProjectById(editContractId);
      if (signal?.aborted) {
        return;
      }
      setForm(mapProjectToForm(project));
      setErrors({});
      setTouched(new Set());
      setShowMetasSection(false);
      setExpandedMetas(new Set());
      setExpandedEtapas(new Set());
      setShowParcelasSection(false);
      setIsAddingParcela(false);
      setNewParcela({
        dataPrevista: "",
        valorPrevisto: 0,
        status: "PREVISTO",
        observacao: "",
      });
    } catch (error) {
      if (signal?.aborted) {
        return;
      }
      const message =
        error instanceof HttpError
          ? error.message
          : "Nao foi possivel carregar os dados atuais do contrato.";
      setLoadError(message);
    } finally {
      if (signal?.aborted) {
        return;
      }
      setIsLoadingEditProject(false);
    }
  }, [editContractId, isEditMode]);

  useEffect(() => {
    if (!isEditMode || !editContractId) {
      return;
    }

    const controller = new AbortController();
    void loadEditProject(controller.signal);

    return () => {
      controller.abort();
    };
  }, [editContractId, isEditMode, loadEditProject]);

  useEffect(() => {
    let isMounted = true;
    setIsUfLoading(true);
    setUfLookupError(null);

    void fetchBrazilStates()
      .then((options) => {
        if (!isMounted) return;
        setUfOptions(options);
      })
      .catch(() => {
        if (!isMounted) return;
        setUfOptions([]);
        setUfLookupError("Nao foi possivel carregar os estados. Tente novamente.");
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
    const selectedUf = form.uf.trim().toUpperCase();
    if (!selectedUf) {
      setCidadeOptions([]);
      setCidadeLookupError(null);
      setIsCidadeLoading(false);
      return;
    }

    let isMounted = true;
    setIsCidadeLoading(true);
    setCidadeLookupError(null);

    void fetchCitiesByState(selectedUf)
      .then((options) => {
        if (!isMounted) return;
        setCidadeOptions(options);
      })
      .catch(() => {
        if (!isMounted) return;
        setCidadeOptions([]);
        setCidadeLookupError("Nao foi possivel carregar as cidades deste estado.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsCidadeLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [form.uf]);

  useEffect(() => {
    const selectedUf = coordinatorForm.state.trim().toUpperCase();
    if (!selectedUf) {
      setCoordinatorCityOptions([]);
      setCoordinatorCityLookupError(null);
      setIsCoordinatorCityLoading(false);
      return;
    }

    let isMounted = true;
    setIsCoordinatorCityLoading(true);
    setCoordinatorCityLookupError(null);

    void fetchCitiesByState(selectedUf)
      .then((options) => {
        if (!isMounted) return;
        setCoordinatorCityOptions(options);
      })
      .catch(() => {
        if (!isMounted) return;
        setCoordinatorCityOptions([]);
        setCoordinatorCityLookupError("Nao foi possivel carregar as cidades deste estado.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsCoordinatorCityLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [coordinatorForm.state]);

  useEffect(() => {
    const selectedUf = partnerForm.state.trim().toUpperCase();
    if (!selectedUf) {
      setPartnerCityOptions([]);
      setPartnerCityLookupError(null);
      setIsPartnerCityLoading(false);
      return;
    }

    let isMounted = true;
    setIsPartnerCityLoading(true);
    setPartnerCityLookupError(null);

    void fetchCitiesByState(selectedUf)
      .then((options) => {
        if (!isMounted) return;
        setPartnerCityOptions(options);
      })
      .catch(() => {
        if (!isMounted) return;
        setPartnerCityOptions([]);
        setPartnerCityLookupError("Nao foi possivel carregar as cidades deste estado.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsPartnerCityLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [partnerForm.state]);

  // Validation
  const validateField = (
    name: keyof NovoContratoForm,
    value: string | boolean | string[] | Meta[] | ParcelaDesembolso[]
  ): string => {
    switch (name) {
      case "titulo":
        if (typeof value !== "string" || !value.trim()) return "O titulo do projeto e obrigatorio";
        if (value.trim().length < 5) return "O titulo deve ter pelo menos 5 caracteres";
        return "";
      case "govIf":
        if (typeof value !== "string" || !value || (value !== "IF" && value !== "GOV")) return "Selecione uma opcao";
        return "";
      case "tipo":
        if (typeof value !== "string" || !value) return "Selecione um tipo de contrato";
        return "";
      case "status":
        if (typeof value !== "string" || !value) return "Selecione um status";
        return "";
      case "coordenador":
        if (typeof value !== "string" || !value.trim()) return "Selecione um coordenador";
        return "";
      case "parceiroId":
        if (typeof value !== "string" || !value.trim()) return "Selecione um parceiro";
        return "";
      case "parceiroSecundarioId":
        // Opcional, sem validacao obrigatoria
        return "";
      case "executedByInnovatis":
        return "";
      case "clientePrimarioId":
        if (typeof value !== "string" || !value.trim()) return "Selecione um cliente primario";
        return "";
      case "clienteSecundarioId":
        // Opcional, sem validacao obrigatoria
        return "";
      case "segmentos":
        if (!Array.isArray(value) || value.length === 0) return "Selecione ao menos um segmento";
        return "";
      case "dataInicio":
        if (typeof value !== "string" || !value) return "A data de inicio e obrigatoria";
        return "";
      case "dataFim":
        if (typeof value !== "string" || !value) return "A data de fim e obrigatoria";
        if (form.dataInicio && new Date(value) < new Date(form.dataInicio)) {
          return "A data de fim deve ser posterior a data de inicio";
        }
        return "";
      case "dataInicioEfetivo":
        // Opcional, mas se preenchido deve ser valido
        if (typeof value === "string" && value && form.dataInicio && new Date(value) < new Date(form.dataInicio)) {
          return "A data de inicio efetivo deve ser posterior ou igual a data de inicio do contrato";
        }
        return "";
      case "dataFimEfetivo":
        // Opcional, mas se preenchido deve ser posterior ao inicio efetivo
        if (typeof value === "string" && value && form.dataInicioEfetivo && new Date(value) < new Date(form.dataInicioEfetivo)) {
          return "A data de fim efetivo deve ser posterior a data de inicio efetivo";
        }
        return "";
      case "uf":
        if (typeof value !== "string" || !value.trim()) return "Selecione a UF";
        if (value.trim().length !== 2) return "UF invalida";
        return "";
      case "cidade":
        if (typeof value !== "string" || !value.trim()) return "Selecione a cidade";
        return "";
      case "scope":
        if (typeof value !== "string" || !value.trim()) return "O objeto do contrato e obrigatorio";
        if (value.trim().length < 10) return "O objeto do contrato deve ter pelo menos 10 caracteres";
        return "";
      case "contract_value":
        if (typeof value !== "string" || !value.trim()) return "O valor do projeto e obrigatorio";
        const numericValue = value.replace(/\D/g, "");
        if (!numericValue || parseInt(numericValue, 10) <= 0) return "Informe um valor valido maior que zero";
        if (parseInt(numericValue, 10) / 100 > MAX_CONTRACT_VALUE) {
          return `O valor maximo permitido e ${new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(MAX_CONTRACT_VALUE)}.`;
        }
        return "";
      case "metas":
        // Metas sao opcionais, nao precisam de validacao obrigatoria
        return "";
      case "parcelas":
        // Parcelas sao opcionais, nao precisam de validacao obrigatoria
        return "";
      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    (Object.keys(form) as Array<keyof NovoContratoForm>).forEach((key) => {
      const error = validateField(key, form[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Funcao para formatar valor monetario
  const formatCurrency = (value: string): string => {
    const onlyNumbers = value.replace(/\D/g, "");
    if (!onlyNumbers) return "";

    const numberValue = parseInt(onlyNumbers, 10) / 100;
    
    return numberValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Funcao para converter valor formatado para numero (em centavos)
  const parseCurrencyToCents = (formattedValue: string): number => {
    const onlyNumbers = formattedValue.replace(/\D/g, "");
    return parseInt(onlyNumbers, 10) || 0;
  };

  const parseCurrencyToNumber = (formattedValue: string): number =>
    parseCurrencyToCents(formattedValue) / 100;

  const resetFormState = useCallback(() => {
    setForm(initialFormState);
    setErrors({});
    setTouched(new Set());
    setShowMetasSection(false);
    setExpandedMetas(new Set());
    setExpandedEtapas(new Set());
    setShowParcelasSection(false);
    setIsAddingParcela(false);
    setNewParcela({ dataPrevista: "", valorPrevisto: 0, status: "PREVISTO", observacao: "" });
    setDocumentos({});
    setFileErrors({
      contrato: "",
      tr: "",
      planoTrabalho: "",
      outro: "",
    });
  }, []);

  const handleFileChange = (tipo: TipoDocumento, file: File | null) => {
    if (!file) {
      setDocumentos((prev) => {
        const next = { ...prev };
        delete next[tipo];
        return next;
      });
      setFileErrors((prev) => ({ ...prev, [tipo]: "" }));
      return;
    }

    if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
      setFileErrors((prev) => ({
        ...prev,
        [tipo]: "Arquivo muito grande. Maximo de 20MB por arquivo.",
      }));
      return;
    }

    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      setFileErrors((prev) => ({
        ...prev,
        [tipo]: "Formato invalido. Aceitos: PDF, PNG, JPG e JPEG.",
      }));
      return;
    }

    setDocumentos((prev) => ({ ...prev, [tipo]: file }));
    setFileErrors((prev) => ({ ...prev, [tipo]: "" }));
  };

  const removeFile = (tipo: TipoDocumento) => {
    setDocumentos((prev) => {
      const next = { ...prev };
      delete next[tipo];
      return next;
    });
    setFileErrors((prev) => ({ ...prev, [tipo]: "" }));
  };

  const previewFile = (tipo: TipoDocumento) => {
    const file = documentos[tipo];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    window.open(objectUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 15_000);
  };

  const handleChange = (name: keyof NovoContratoForm, value: string | undefined) => {
    // Converter undefined para string vazia para campos que esperam string
    const stringValue = value ?? "";
    
    if (name === "contract_value") {
      const formatted = formatCurrency(stringValue);
      setForm((prev) => ({ ...prev, [name]: formatted }));
      
      // Sempre validar e atualizar erros apos mudanca
      const error = validateField(name, formatted);
      setErrors((prev) => ({ ...prev, [name]: error || undefined }));
      
      // Marcar como touched
      setTouched((prev) => new Set(prev).add(name));
    } else if (name === "clientePrimarioId") {
      // Troca do cliente primario invalida a selecao da secretaria secundaria.
      setForm((prev) => ({
        ...prev,
        clientePrimarioId: stringValue,
        clienteSecundarioId: "",
      }));

      const error = validateField(name, stringValue);
      setErrors((prev) => ({
        ...prev,
        clientePrimarioId: error || undefined,
        clienteSecundarioId: undefined,
      }));

      setTouched((prev) => new Set(prev).add(name).add("clienteSecundarioId"));
    } else if (name === "uf") {
      const normalizedUf = stringValue.trim().toUpperCase();
      setForm((prev) => ({
        ...prev,
        uf: normalizedUf,
        cidade: "",
      }));
      setCidadeOptions([]);
      setCidadeLookupError(null);

      const error = validateField(name, normalizedUf);
      setErrors((prev) => ({
        ...prev,
        uf: error || undefined,
        cidade: undefined,
      }));

      setTouched((prev) => new Set(prev).add("uf").add("cidade"));
    } else {
      setForm((prev) => ({ ...prev, [name]: stringValue }));
      
      // Sempre validar e atualizar erros apos mudanca
      const error = validateField(name, stringValue);
      setErrors((prev) => ({ ...prev, [name]: error || undefined }));
      
      // Marcar como touched
      setTouched((prev) => new Set(prev).add(name));
    }
  };

  const handleExecutionModeChange = (checked: boolean) => {
    setForm((prev) => ({ ...prev, executedByInnovatis: checked }));

    const error = validateField("executedByInnovatis", checked);
    setErrors((prev) => ({ ...prev, executedByInnovatis: error || undefined }));

    setTouched((prev) => new Set(prev).add("executedByInnovatis"));
  };

  const handleSegmentToggle = (segmento: string) => {
    setForm((prev) => {
      const exists = prev.segmentos.includes(segmento);
      const updated = exists
        ? prev.segmentos.filter((s) => s !== segmento)
        : [...prev.segmentos, segmento];

      setTouched((prevTouched) => new Set(prevTouched).add("segmentos"));
      setErrors((prevErrors) => ({
        ...prevErrors,
        segmentos: validateField("segmentos", updated),
      }));

      return { ...prev, segmentos: updated };
    });
  };

  const handleBlur = (name: keyof NovoContratoForm) => {
    setTouched((prev) => new Set(prev).add(name));
    const error = validateField(name, form[name]);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const optionalInputValue = (value: string) => {
    const normalized = value.trim();
    return normalized ? normalized : undefined;
  };

  const closePartnerModal = () => {
    setShowPartnerModal(false);
    setPartnerForm(initialPartnerCreateFormState);
    setPartnerFormError(null);
    setPartnerCityOptions([]);
    setPartnerCityLookupError(null);
    setIsPartnerCityLoading(false);
  };

  const openPartnerModal = (targetField: PartnerTargetField) => {
    setPartnerTargetField(targetField);
    setPartnerForm(initialPartnerCreateFormState);
    setPartnerFormError(null);
    setPartnerCityOptions([]);
    setPartnerCityLookupError(null);
    setIsPartnerCityLoading(false);
    setShowPartnerModal(true);
  };

  const handleCreatePartner = async (event: React.FormEvent) => {
    event.preventDefault();
    setPartnerFormError(null);

    const name = partnerForm.name.trim();
    const tradeName = partnerForm.tradeName.trim();
    const phone = partnerForm.phone.trim();
    const address = partnerForm.address.trim();
    const city = partnerForm.city.trim();
    const state = partnerForm.state.trim();
    const cnpjDigits = onlyDigits(partnerForm.cnpj);

    if (!name || !tradeName || !city || !state) {
      setPartnerFormError(
        "Preencha os campos obrigatorios: nome, nome fantasia, cidade e estado."
      );
      return;
    }

    if (cnpjDigits.length !== 14) {
      setPartnerFormError("Informe um CNPJ valido com 14 digitos.");
      return;
    }

    setIsCreatingPartner(true);
    try {
      const payload: PartnerRequestDTO = {
        acronym: optionalInputValue(partnerForm.acronym),
        name,
        tradeName,
        partnersType: partnerForm.partnersType,
        cnpj: cnpjDigits,
        email: optionalInputValue(partnerForm.email),
        phone: optionalInputValue(phone),
        address: optionalInputValue(address),
        site: optionalInputValue(partnerForm.site),
        city,
        state,
        isActive: true,
      };

      const createdPartner = await createPartner(payload);

      setOrganizacoesParceiras((prev) => {
        const next = [
          ...prev.filter((item) => item.id !== String(createdPartner.id)),
          {
            id: String(createdPartner.id),
            name: createdPartner.name,
            cnpj: createdPartner.cnpj,
          },
        ];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });

      handleChange(partnerTargetField, String(createdPartner.id));
      closePartnerModal();
    } catch (error) {
      const message =
        error instanceof HttpError ? error.message : "Nao foi possivel cadastrar o parceiro.";
      setPartnerFormError(message);
    } finally {
      setIsCreatingPartner(false);
    }
  };

  const closeClientModal = () => {
    setShowClientModal(false);
    setClientForm(initialClientCreateFormState);
    setClientFormError(null);
  };

  const openClientModal = () => {
    setClientForm(initialClientCreateFormState);
    setClientFormError(null);
    setShowClientModal(true);
  };

  const handleCreateClient = async (event: React.FormEvent) => {
    event.preventDefault();
    setClientFormError(null);

    const name = clientForm.name.trim();
    const cnpjDigits = onlyDigits(clientForm.cnpj);

    if (!name) {
      setClientFormError("Informe o nome do cliente.");
      return;
    }

    if (cnpjDigits.length !== 14) {
      setClientFormError("Informe um CNPJ valido com 14 digitos.");
      return;
    }

    setIsCreatingClient(true);
    try {
      const payload: PublicAgencyRequestDTO = {
        code: optionalInputValue(clientForm.code),
        sigla: optionalInputValue(clientForm.sigla),
        name,
        cnpj: cnpjDigits,
        isClient: true,
        publicAgencyType: clientForm.publicAgencyType,
        email: optionalInputValue(clientForm.email),
        phone: optionalInputValue(clientForm.phone),
        address: optionalInputValue(clientForm.address),
        contactPerson: optionalInputValue(clientForm.contactPerson),
        city: optionalInputValue(clientForm.city),
        state: optionalInputValue(clientForm.state),
        isActive: true,
      };

      const createdClient = await createPublicAgency(payload);

      setOrganizacoesFinanciadoras((prev) => {
        const next = [
          ...prev.filter((item) => item.id !== String(createdClient.id)),
          {
            id: String(createdClient.id),
            name: createdClient.name,
            cnpj: createdClient.cnpj,
          },
        ];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });

      handleChange("clientePrimarioId", String(createdClient.id));
      closeClientModal();
    } catch (error) {
      const message =
        error instanceof HttpError ? error.message : "Nao foi possivel cadastrar o cliente.";
      setClientFormError(message);
    } finally {
      setIsCreatingClient(false);
    }
  };

  const closeSecretaryModal = () => {
    setShowSecretaryModal(false);
    setSecretaryForm(initialSecretaryCreateFormState);
    setSecretaryFormError(null);
  };

  const openSecretaryModal = () => {
    if (!form.clientePrimarioId) {
      setSecretaryFormError("Selecione o cliente primario antes de cadastrar a secretaria.");
      return;
    }
    setSecretaryForm(initialSecretaryCreateFormState);
    setSecretaryFormError(null);
    setShowSecretaryModal(true);
  };

  const handleCreateSecretary = async (event: React.FormEvent) => {
    event.preventDefault();
    setSecretaryFormError(null);

    if (!form.clientePrimarioId) {
      setSecretaryFormError("Selecione o cliente primario antes de cadastrar a secretaria.");
      return;
    }

    const name = secretaryForm.name.trim();
    const cnpjDigits = onlyDigits(secretaryForm.cnpj);

    if (!name) {
      setSecretaryFormError("Informe o nome da secretaria.");
      return;
    }

    if (secretaryForm.cnpj.trim() && cnpjDigits.length !== 14) {
      setSecretaryFormError("Informe um CNPJ valido com 14 digitos ou deixe em branco.");
      return;
    }

    setIsCreatingSecretary(true);
    try {
      const payload: SecretaryRequestDTO = {
        code: optionalInputValue(secretaryForm.code),
        sigla: optionalInputValue(secretaryForm.sigla),
        publicAgencyId: parseInt(form.clientePrimarioId, 10),
        name,
        cnpj: cnpjDigits.length === 14 ? cnpjDigits : undefined,
        isClient: true,
        email: optionalInputValue(secretaryForm.email),
        phone: optionalInputValue(secretaryForm.phone),
        address: optionalInputValue(secretaryForm.address),
        contactPerson: optionalInputValue(secretaryForm.contactPerson),
        isActive: true,
      };

      const createdSecretary = await createSecretary(payload);

      setSecretariasCliente((prev) => {
        const next = [
          ...prev.filter((item) => item.id !== String(createdSecretary.id)),
          {
            id: String(createdSecretary.id),
            name: createdSecretary.name,
            cnpj: createdSecretary.cnpj,
            publicAgencyId: String(createdSecretary.publicAgency?.id ?? form.clientePrimarioId),
          },
        ];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });

      handleChange("clienteSecundarioId", String(createdSecretary.id));
      closeSecretaryModal();
    } catch (error) {
      const message =
        error instanceof HttpError ? error.message : "Nao foi possivel cadastrar a secretaria.";
      setSecretaryFormError(message);
    } finally {
      setIsCreatingSecretary(false);
    }
  };

  const closeCoordinatorModal = () => {
    setShowCoordinatorModal(false);
    setCoordinatorForm(initialCoordinatorFormState);
    setCoordinatorFormError(null);
    setCoordinatorCityLookupError(null);
    setIsCoordinatorCityLoading(false);
    setCoordinatorCityOptions([]);
  };

  const openCoordinatorModal = () => {
    setCoordinatorForm(initialCoordinatorFormState);
    setCoordinatorFormError(null);
    setCoordinatorCityLookupError(null);
    setIsCoordinatorCityLoading(false);
    setCoordinatorCityOptions([]);
    setShowCoordinatorModal(true);
  };

  const handleCreateCoordinator = async (event: React.FormEvent) => {
    event.preventDefault();
    setCoordinatorFormError(null);

    const fullName = coordinatorForm.fullName.trim();
    const cpfDigits = onlyDigits(coordinatorForm.cpf);
    const email = coordinatorForm.email.trim();
    const phone = coordinatorForm.phone.trim();
    const birthDate = coordinatorForm.birthDate;
    const city = coordinatorForm.city.trim();
    const state = coordinatorForm.state.trim().toUpperCase();

    if (!fullName) {
      setCoordinatorFormError("Informe o nome completo do coordenador.");
      return;
    }

    if (cpfDigits.length > 0 && cpfDigits.length !== 11) {
      setCoordinatorFormError("Informe um CPF valido com 11 digitos.");
      return;
    }

    if (!city) {
      setCoordinatorFormError("Informe a cidade.");
      return;
    }

    if (!state) {
      setCoordinatorFormError("Informe o estado.");
      return;
    }

    setIsCreatingCoordinator(true);
    try {
      const payload: PeopleRequestDTO = {
        fullName,
        cpf: cpfDigits || undefined,
        email: email || undefined,
        phone: phone || undefined,
        birthDate: birthDate || undefined,
        city,
        state,
      };

      const createdPerson = await createPeople(payload);

      setCoordenadores((prev) => {
        const next = [
          ...prev.filter((person) => person.id !== String(createdPerson.id)),
          {
            id: String(createdPerson.id),
            fullName: createdPerson.fullName,
            cpf: createdPerson.cpf,
          },
        ];
        return next.sort((a, b) => a.fullName.localeCompare(b.fullName));
      });

      handleChange("coordenador", String(createdPerson.id));
      closeCoordinatorModal();
    } catch (error) {
      const message = error instanceof HttpError
        ? (error.fieldErrors?.length
          ? error.fieldErrors.map((fieldError) => fieldError.message).join(" | ")
          : error.message)
        : "Nao foi possivel cadastrar o coordenador.";
      setCoordinatorFormError(message);
    } finally {
      setIsCreatingCoordinator(false);
    }
  };

  // ============================================================================
  // Funcoes para gerenciar Metas, Etapas e Fases
  // ============================================================================
  
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Toggle expandir/colapsar
  const toggleMeta = (id: string) => {
    setExpandedMetas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleEtapa = (id: string) => {
    setExpandedEtapas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Adicionar Meta
  const addMeta = () => {
    const novoNumero = form.metas.length + 1;
    const novaMeta: Meta = {
      id: generateId(),
      numero: novoNumero,
      titulo: "",
      etapas: [],
    };
    setForm((prev) => ({ ...prev, metas: [...prev.metas, novaMeta] }));
    setExpandedMetas((prev) => new Set(prev).add(novaMeta.id));
  };

  // Remover Meta
  const removeMeta = (metaId: string) => {
    setForm((prev) => ({
      ...prev,
      metas: prev.metas
        .filter((m) => m.id !== metaId)
        .map((m, idx) => ({ ...m, numero: idx + 1 })),
    }));
  };

  // Atualizar Meta
  const updateMeta = (metaId: string, field: keyof Meta, value: string) => {
    setForm((prev) => ({
      ...prev,
      metas: prev.metas.map((m) =>
        m.id === metaId ? { ...m, [field]: value } : m
      ),
    }));
  };

  // Adicionar Etapa
  const addEtapa = (metaId: string) => {
    setForm((prev) => ({
      ...prev,
      metas: prev.metas.map((meta) => {
        if (meta.id !== metaId) return meta;
        const novoNumero = meta.etapas.length + 1;
        const novaEtapa: Etapa = {
          id: generateId(),
          numero: novoNumero,
          titulo: "",
          fases: [],
        };
        setExpandedEtapas((prevExpanded) => new Set(prevExpanded).add(novaEtapa.id));
        return { ...meta, etapas: [...meta.etapas, novaEtapa] };
      }),
    }));
  };

  // Remover Etapa
  const removeEtapa = (metaId: string, etapaId: string) => {
    setForm((prev) => ({
      ...prev,
      metas: prev.metas.map((meta) => {
        if (meta.id !== metaId) return meta;
        return {
          ...meta,
          etapas: meta.etapas
            .filter((e) => e.id !== etapaId)
            .map((e, idx) => ({ ...e, numero: idx + 1 })),
        };
      }),
    }));
  };

  // Atualizar Etapa
  const updateEtapa = (metaId: string, etapaId: string, field: keyof Etapa, value: string) => {
    setForm((prev) => ({
      ...prev,
      metas: prev.metas.map((meta) => {
        if (meta.id !== metaId) return meta;
        return {
          ...meta,
          etapas: meta.etapas.map((e) =>
            e.id === etapaId ? { ...e, [field]: value } : e
          ),
        };
      }),
    }));
  };

  // Adicionar Fase
  const addFase = (metaId: string, etapaId: string) => {
    setForm((prev) => ({
      ...prev,
      metas: prev.metas.map((meta) => {
        if (meta.id !== metaId) return meta;
        return {
          ...meta,
          etapas: meta.etapas.map((etapa) => {
            if (etapa.id !== etapaId) return etapa;
            const novoNumero = etapa.fases.length + 1;
            const novaFase: Fase = {
              id: generateId(),
              numero: novoNumero,
              titulo: "",
            };
            return { ...etapa, fases: [...etapa.fases, novaFase] };
          }),
        };
      }),
    }));
  };

  // Remover Fase
  const removeFase = (metaId: string, etapaId: string, faseId: string) => {
    setForm((prev) => ({
      ...prev,
      metas: prev.metas.map((meta) => {
        if (meta.id !== metaId) return meta;
        return {
          ...meta,
          etapas: meta.etapas.map((etapa) => {
            if (etapa.id !== etapaId) return etapa;
            return {
              ...etapa,
              fases: etapa.fases
                .filter((f) => f.id !== faseId)
                .map((f, idx) => ({ ...f, numero: idx + 1 })),
            };
          }),
        };
      }),
    }));
  };

  // Atualizar Fase
  const updateFase = (metaId: string, etapaId: string, faseId: string, field: keyof Fase, value: string) => {
    setForm((prev) => ({
      ...prev,
      metas: prev.metas.map((meta) => {
        if (meta.id !== metaId) return meta;
        return {
          ...meta,
          etapas: meta.etapas.map((etapa) => {
            if (etapa.id !== etapaId) return etapa;
            return {
              ...etapa,
              fases: etapa.fases.map((f) =>
                f.id === faseId ? { ...f, [field]: value } : f
              ),
            };
          }),
        };
      }),
    }));
  };

  // ============================================================================
  // Funcoes para gerenciar Parcelas de Desembolso
  // ============================================================================

  const sortAndRenumberParcelas = (items: ParcelaDesembolso[]) =>
    [...items].sort((a, b) => a.numero - b.numero).map((p, idx) => ({ ...p, numero: idx + 1 }));

  const validateParcela = (p: Partial<ParcelaDesembolso>) => {
    const valor = typeof p.valorPrevisto === "number" ? p.valorPrevisto : 0;
    return Boolean(p.dataPrevista && valor > 0);
  };

  const addParcela = () => {
    if (!validateParcela(newParcela)) return;

    const novaParcela: ParcelaDesembolso = {
      id: generateId(),
      numero: form.parcelas.length + 1,
      dataPrevista: newParcela.dataPrevista!,
      valorPrevisto: newParcela.valorPrevisto || 0,
      status: newParcela.status ?? "PREVISTO",
      observacao: newParcela.observacao || "",
    };

    setForm((prev) => ({
      ...prev,
      parcelas: sortAndRenumberParcelas([...prev.parcelas, novaParcela]),
    }));

    setNewParcela({ dataPrevista: "", valorPrevisto: 0, status: "PREVISTO", observacao: "" });
    setIsAddingParcela(false);
  };

  const removeParcela = (id: string) => {
    setForm((prev) => ({
      ...prev,
      parcelas: sortAndRenumberParcelas(prev.parcelas.filter((p) => p.id !== id)),
    }));
  };

  const formatCurrencyDisplay = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR");
  };

  const valorTotalContrato = form.contract_value ? parseCurrencyToNumber(form.contract_value) : 0;
  const totalPrevisto = form.parcelas.reduce((acc, p) => acc + (p.valorPrevisto || 0), 0);
  const restante = Math.max(valorTotalContrato - totalPrevisto, 0);
  const excedente = Math.max(totalPrevisto - valorTotalContrato, 0);

  const buildProjectCode = (tipo: ContratoTipo) => {
    const prefix = tipo === "PRODUTO" ? "PRD" : "PRJ";
    return `${prefix}-${Date.now().toString().slice(-8)}`;
  };

  // Funcao auxiliar para transformar dados do formulario para formato do backend
  const transformFormToBackend = (formData: NovoContratoForm): ProjectRequestDTO => {
    const contractValue = parseCurrencyToCents(formData.contract_value) / 100;
    const city = formData.cidade.trim() || undefined;
    const state = formData.uf.trim().toUpperCase() || undefined;
    const executionLocation =
      city && state ? `${city} - ${state}` : city ?? state ?? undefined;

    return {
      name: formData.titulo.trim(),
      code: buildProjectCode(formData.tipo as ContratoTipo),
      projectStatus: formData.status as ProjectRequestDTO["projectStatus"],
      areaSegmento: formData.segmentos.join(", ") || undefined,
      object: formData.scope.trim(),
      primaryPartnerId: parseInt(formData.parceiroId, 10),
      secundaryPartnerId: formData.parceiroSecundarioId
        ? parseInt(formData.parceiroSecundarioId, 10)
        : undefined,
      primaryClientId: parseInt(formData.clientePrimarioId, 10),
      secundaryClientId: formData.clienteSecundarioId
        ? parseInt(formData.clienteSecundarioId, 10)
        : undefined,
      cordinatorId: formData.coordenador ? parseInt(formData.coordenador, 10) : undefined,
      projectGovIf: formData.govIf as ProjectRequestDTO["projectGovIf"],
      projectType: formData.tipo as ProjectRequestDTO["projectType"],
      contractValue: contractValue > 0 ? contractValue : undefined,
      startDate: formData.dataInicio || undefined,
      endDate: formData.dataFim || undefined,
      openingDate: formData.dataInicioEfetivo || undefined,
      closingDate: formData.dataFimEfetivo || undefined,
      city,
      state,
      executionLocation,
      executedByInnovatis: formData.executedByInnovatis,
    };
  };

  const transformFormToUpdateBackend = (formData: NovoContratoForm): ProjectUpdateDTO => {
    return Object.fromEntries(
      Object.entries(transformFormToBackend(formData)).filter(([key]) => key !== "code")
    ) as ProjectUpdateDTO;
  };

  const normalizeOptionalText = (value?: string) => {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  };

  const validateHierarchyBeforeSubmit = (formData: NovoContratoForm): string | null => {
    for (const parcela of formData.parcelas) {
      if (!validateParcela(parcela)) {
        return `Parcela ${parcela.numero} invalida. Preencha data prevista e valor maior que zero.`;
      }
    }

    for (const meta of formData.metas) {
      if (!meta.titulo.trim()) {
        return `Preencha o titulo da Meta ${meta.numero}.`;
      }

      for (const etapa of meta.etapas) {
        if (!etapa.titulo.trim()) {
          return `Preencha o titulo da Etapa ${meta.numero}.${etapa.numero}.`;
        }

        for (const fase of etapa.fases) {
          if (!fase.titulo.trim()) {
            return `Preencha o titulo da Fase ${meta.numero}.${etapa.numero}.${fase.numero}.`;
          }
        }
      }
    }

    return null;
  };

  const buildDisbursementPayload = (
    projectId: number,
    parcela: ParcelaDesembolso
  ): DisbursementScheduleRequestDTO => ({
    projectId,
    numero: parcela.numero,
    expectedMonth: parcela.dataPrevista,
    expectedAmount: parcela.valorPrevisto,
    status: parcela.status,
    notes: normalizeOptionalText(parcela.observacao),
  });

  const buildGoalPayload = (projectId: number, meta: Meta): GoalRequestDTO => ({
    projectId,
    numero: meta.numero,
    titulo: meta.titulo.trim(),
    descricao: normalizeOptionalText(meta.descricao),
    dataInicio: meta.dataInicio || undefined,
    dataFim: meta.dataFim || undefined,
  });

  const buildStagePayload = (goalId: number, etapa: Etapa): StageRequestDTO => ({
    goalId,
    numero: etapa.numero,
    titulo: etapa.titulo.trim(),
    descricao: normalizeOptionalText(etapa.descricao),
    dataInicio: etapa.dataInicio || undefined,
    dataFim: etapa.dataFim || undefined,
  });

  const buildPhasePayload = (stageId: number, fase: Fase): PhaseRequestDTO => ({
    stageId,
    numero: fase.numero,
    titulo: fase.titulo.trim(),
    descricao: normalizeOptionalText(fase.descricao),
    dataInicio: fase.dataInicio || undefined,
    dataFim: fase.dataFim || undefined,
  });

  const persistProjectDetails = async (projectId: number, formData: NovoContratoForm) => {
    for (const parcela of formData.parcelas) {
      await createDisbursementSchedule(buildDisbursementPayload(projectId, parcela));
    }

    for (const meta of formData.metas) {
      const createdGoal = await createGoal(buildGoalPayload(projectId, meta));

      for (const etapa of meta.etapas) {
        const createdStage = await createStage(buildStagePayload(createdGoal.id, etapa));

        for (const fase of etapa.fases) {
          await createPhase(buildPhasePayload(createdStage.id, fase));
        }
      }
    }
  };

  const uploadPendingDocuments = async (projectId: number) => {
    const entries = Object.entries(documentos) as Array<[TipoDocumento, File | undefined]>;
    const failedUploads: TipoDocumento[] = [];
    let uploadedCount = 0;

    for (const [tipo, file] of entries) {
      if (!file) continue;

      try {
        await uploadDocument({
          file,
          ownerType: "PROJECT",
          ownerId: projectId,
          category: DOCUMENT_CATEGORY_BY_TYPE[tipo],
        });
        uploadedCount += 1;
        setFileErrors((prev) => ({ ...prev, [tipo]: "" }));
      } catch (uploadError) {
        console.error("Falha no upload do documento", {
          projectId,
          tipo,
          error: uploadError,
        });
        failedUploads.push(tipo);
        setFileErrors((prev) => ({
          ...prev,
          [tipo]: "Falha ao enviar este arquivo. Tente novamente.",
        }));
      }
    }

    return { uploadedCount, failedUploads };
  };

  const notifyParentPopup = useCallback(
    (type: "contract-edit-saved" | "contract-edit-closed", payload?: Record<string, unknown>) => {
      if (!isPopupMode || typeof window === "undefined" || window.parent === window) {
        return;
      }

      window.parent.postMessage(
        {
          source: "contract-form",
          type,
          ...payload,
        },
        window.location.origin
      );
    },
    [isPopupMode]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched(new Set(Object.keys(form) as Array<keyof NovoContratoForm>));
    setSubmitError(null);

    if (!validateForm()) return;

    if (!isEditMode) {
      const hierarchyError = validateHierarchyBeforeSubmit(form);
      if (hierarchyError) {
        setSubmitError(hierarchyError);
        return;
      }
    }

    setIsSubmitting(true);
    let createdProjectId: number | null = null;

    try {
      if (isEditMode && editContractId) {
        const updatePayload = transformFormToUpdateBackend(form);
        await updateProject(editContractId, updatePayload);

        if (isPopupMode) {
          notifyParentPopup("contract-edit-saved", { contractId: editContractId });
          return;
        }

        router.push(`/contratos/${editContractId}`);
        return;
      }

      const transformedData = transformFormToBackend(form);
      const createdProject = await createProject(transformedData);
      createdProjectId = createdProject.id;

      if (canManageChildren) {
        await persistProjectDetails(createdProject.id, form);
      }
      const uploadSummary = canManageChildren
        ? await uploadPendingDocuments(createdProject.id)
        : { uploadedCount: 0, failedUploads: [] as TipoDocumento[] };

      setLastCreatedProjectId(createdProject.id);
      if (uploadSummary.failedUploads.length > 0) {
        const failedLabels = uploadSummary.failedUploads
          .map((tipo) => documentoLabels[tipo])
          .join(", ");
        setPostSubmitMessage(
          `Projeto cadastrado. ${uploadSummary.uploadedCount} documento(s) enviado(s). Falha em: ${failedLabels}.`
        );
      } else if (uploadSummary.uploadedCount > 0) {
        setPostSubmitMessage(
          `Projeto cadastrado e ${uploadSummary.uploadedCount} documento(s) enviado(s) com sucesso.`
        );
      } else {
        setPostSubmitMessage("Projeto cadastrado com sucesso.");
      }

      setShowSuccessModal(true);
    } catch (error) {
      const rootMessage =
        error instanceof HttpError
          ? error.message
          : error instanceof Error
            ? error.message
            : isEditMode
              ? "Nao foi possivel atualizar o contrato."
              : "Nao foi possivel concluir o cadastro do contrato.";

      const message = createdProjectId
        ? `${rootMessage} Projeto ${createdProjectId} foi criado, mas ocorreu erro ao salvar cronograma/metas.`
        : rootMessage;
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isPopupMode) {
      notifyParentPopup("contract-edit-closed", { contractId: editContractId });
      return;
    }

    router.back();
  };

  const handleCreateAnotherProject = () => {
    setPostSubmitActionLoading("new");
    resetFormState();
    setPostSubmitMessage(null);
    setLastCreatedProjectId(null);
    setShowSuccessModal(false);
    setPostSubmitActionLoading(null);
    setTimeout(() => firstInputRef.current?.focus(), 100);
  };

  const handleViewCreatedProject = () => {
    if (!lastCreatedProjectId) return;
    setPostSubmitActionLoading("view");
    router.push(`/contratos/${lastCreatedProjectId}`);
  };

  return (
    <div className={isPopupMode ? "min-h-screen bg-white" : "min-h-screen bg-[#F5F6F8]"}>
      {!isPopupMode && <NavBar />}

      {!isEditMode && (
        <ProjectCreatedModal
          open={showSuccessModal}
          createdProjectId={lastCreatedProjectId}
          message={postSubmitMessage}
          pendingAction={postSubmitActionLoading}
          onClose={() => setShowSuccessModal(false)}
          onViewCreated={handleViewCreatedProject}
          onCreateAnother={handleCreateAnotherProject}
        />
      )}

      <div
        className={
          isPopupMode
            ? "mx-auto w-full max-w-5xl px-4 py-4"
            : "mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6"
        }
      >
        {!isPopupMode && (
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/home" className="hover:text-gray-700 flex items-center gap-1">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/contratos" className="hover:text-gray-700">
              Contratos
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">{pageTitle}</span>
          </nav>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#004225]/10 rounded-lg">
              <FileText className="h-5 w-5 text-[#004225]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{pageTitle}</h1>
              <p className="text-sm text-gray-500">{pageDescription}</p>
            </div>
          </div>
        </div>

        {loadError && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <div className="flex items-center justify-between gap-2">
              <span>{loadError}</span>
              <button
                type="button"
                onClick={() => {
                  void loadOrganizations();
                  void loadEditProject();
                }}
                className="font-medium underline underline-offset-2"
              >
                Recarregar
              </button>
            </div>
          </div>
        )}

        {submitError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {isLoadingEditProject && (
          <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
            Carregando dados atuais do contrato...
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {!loadingAccess && !canManageChildren && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Seu perfil pode criar e editar as informacoes principais do contrato, mas metas, desembolsos e documentos ficam apenas para consulta nesta tela.
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 space-y-5">
              {/* Título do Projeto */}
              <FormField
                label="Título do Projeto"
                required
                error={errors.titulo}
                icon={<FileText className="h-4 w-4" />}
              >
                <input
                  ref={firstInputRef}
                  type="text"
                  value={form.titulo}
                  onChange={(e) => handleChange("titulo", e.target.value)}
                  onBlur={() => handleBlur("titulo")}
                  placeholder="Ex.: Plataforma de Gestão de Projetos da Innovatis"
                  className={`w-full h-11 px-4 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#004225]/20 ${
                    errors.titulo
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-300 focus:border-[#004225]"
                  }`}
                />
              </FormField>

              {/* Gov/IF, Tipo e Status - Grid 3 colunas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Gov/IF */}
                <FormField
                  label="Gov/IF"
                  required
                  error={errors.govIf}
                  icon={<Tag className="h-4 w-4" />}
                >
                  <Dropdown
                    options={govIfOptions}
                    value={form.govIf || undefined}
                    placeholder="Selecione..."
                    searchable={true}
                    onChange={(value) => handleChange("govIf", value ?? "")}
                    className={errors.govIf ? "border-red-300 focus:border-red-500" : ""}
                  />
                </FormField>

                {/* Tipo de Contrato */}
                <FormField
                  label="Tipo de Contrato"
                  required
                  error={errors.tipo}
                  icon={<Tag className="h-4 w-4" />}
                >
                  <Dropdown
                    options={tipoDropdownOptions}
                    value={form.tipo || undefined}
                    placeholder="Selecione..."
                    searchable={true}
                    onChange={(value) => handleChange("tipo", value ?? "")}
                    className={errors.tipo ? "border-red-300 focus:border-red-500" : ""}
                  />
                </FormField>

                {/* Status */}
                <FormField
                  label="Status"
                  required
                  error={errors.status}
                  icon={<Tag className="h-4 w-4" />}
                >
                  <Dropdown
                    options={statusDropdownOptions}
                    value={form.status || undefined}
                    placeholder="Selecione..."
                    searchable={true}
                    onChange={(value) => handleChange("status", value ?? "")}
                    className={errors.status ? "border-red-300 focus:border-red-500" : ""}
                  />
                </FormField>
              </div>

              {/* Coordenador */}
              <FormField
                label="Coordenador"
                required
                error={errors.coordenador}
                icon={<User className="h-4 w-4" />}
              >
                <div className="space-y-2">
                  <Dropdown
                    options={coordenadorDropdownOptions}
                    value={form.coordenador || undefined}
                    placeholder={
                      coordenadorDropdownOptions.length === 0
                        ? "Nenhum coordenador cadastrado"
                        : "Selecione um coordenador..."
                    }
                    searchable={true}
                    onChange={(value) => handleChange("coordenador", value ?? "")}
                    className={errors.coordenador ? "border-red-300 focus:border-red-500" : ""}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-500">
                      {coordenadorDropdownOptions.length === 0
                        ? "Cadastre um coordenador para continuar."
                        : "Não encontrou a pessoa? Cadastre um novo coordenador."}
                    </p>
                    <button
                      type="button"
                      onClick={openCoordinatorModal}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#004225] bg-[#004225]/10 rounded-md hover:bg-[#004225]/20 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Cadastrar Coordenador
                    </button>
                  </div>
                </div>
              </FormField>

              {/* Parceiro Primario */}
              <FormField
                label="Parceiro Primário"
                required
                error={errors.parceiroId}
                icon={<Building2 className="h-4 w-4" />}
              >
                <div className="space-y-2">
                  <Dropdown
                    options={parceiroDropdownOptions}
                    value={form.parceiroId || undefined}
                    placeholder="Selecione um parceiro primário..."
                    searchable={true}
                    onChange={(value) => handleChange("parceiroId", value ?? "")}
                    className={errors.parceiroId ? "border-red-300 focus:border-red-500" : ""}
                  />
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => openPartnerModal("parceiroId")}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#004225] bg-[#004225]/10 rounded-md hover:bg-[#004225]/20 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Cadastrar Parceiro
                    </button>
                  </div>
                </div>
              </FormField>

              {/* Parceiro Secundario */}
              <FormField
                label="Parceiro Secundário"
                error={errors.parceiroSecundarioId}
                icon={<Building2 className="h-4 w-4" />}
              >
                <div className="space-y-2">
                  <Dropdown
                    options={parceiroDropdownOptions}
                    value={form.parceiroSecundarioId || undefined}
                    placeholder="Selecione um parceiro secundário (opcional)..."
                    searchable={true}
                    onChange={(value) => handleChange("parceiroSecundarioId", value ?? "")}
                    className={errors.parceiroSecundarioId ? "border-red-300 focus:border-red-500" : ""}
                  />
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => openPartnerModal("parceiroSecundarioId")}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#004225] bg-[#004225]/10 rounded-md hover:bg-[#004225]/20 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Cadastrar Parceiro
                    </button>
                  </div>
                </div>
              </FormField>

              <div className="md:col-span-2">
                <FormField
                  label="Execução do projeto"
                  required
                  error={errors.executedByInnovatis}
                  icon={<Flag className="h-4 w-4" />}
                >
                  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="executedByInnovatis"
                        checked={form.executedByInnovatis}
                        onCheckedChange={(checked) => handleExecutionModeChange(checked === true)}
                        className="mt-0.5 border-gray-300 data-[state=checked]:bg-[#004225] data-[state=checked]:border-[#004225]"
                      />
                      <div className="space-y-1">
                        <Label
                          htmlFor="executedByInnovatis"
                          className="cursor-pointer text-sm font-medium text-gray-700"
                        >
                          Projeto executado pela Innovatis
                        </Label>
                        <p className="text-xs text-gray-500">
                          Se não marcar, o projeto sera executado pelo parceiro.
                        </p>
                      </div>
                    </div>
                  </div>
                </FormField>
              </div>

              {/* Cliente Primario */}
              <FormField
                label="Cliente Primário"
                required
                error={errors.clientePrimarioId}
                icon={<Building2 className="h-4 w-4" />}
              >
                <div className="space-y-2">
                  <Dropdown
                    options={clientePrimarioDropdownOptions}
                    value={form.clientePrimarioId || undefined}
                    placeholder="Selecione um cliente primário..."
                    searchable={true}
                    onChange={(value) => handleChange("clientePrimarioId", value ?? "")}
                    className={errors.clientePrimarioId ? "border-red-300 focus:border-red-500" : ""}
                  />
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={openClientModal}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#004225] bg-[#004225]/10 rounded-md hover:bg-[#004225]/20 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Cadastrar Cliente
                    </button>
                  </div>
                </div>
              </FormField>

              {/* Cliente Secundario */}
              <FormField
                label="Secretaria (Cliente Secundário)"
                error={errors.clienteSecundarioId}
                icon={<Building2 className="h-4 w-4" />}
              >
                <div className="space-y-2">
                  <Dropdown
                    options={clienteSecundarioDropdownOptions}
                    value={form.clienteSecundarioId || undefined}
                    placeholder={
                      !form.clientePrimarioId
                        ? "Selecione primeiro um cliente primário..."
                        : clienteSecundarioDropdownOptions.length === 0
                          ? "Nenhuma secretaria encontrada para o cliente selecionado"
                          : "Selecione uma secretaria (opcional)..."
                    }
                    searchable={true}
                    disabled={!form.clientePrimarioId || clienteSecundarioDropdownOptions.length === 0}
                    onChange={(value) => handleChange("clienteSecundarioId", value ?? "")}
                    className={errors.clienteSecundarioId ? "border-red-300 focus:border-red-500" : ""}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-500">
                      {!form.clientePrimarioId
                        ? "Escolha o cliente primario para cadastrar uma secretaria vinculada."
                        : "A secretaria sera vinculada ao cliente primario selecionado."}
                    </p>
                    <button
                      type="button"
                      onClick={openSecretaryModal}
                      disabled={!form.clientePrimarioId}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#004225] bg-[#004225]/10 rounded-md hover:bg-[#004225]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Cadastrar Secretaria
                    </button>
                  </div>
                </div>
              </FormField>

              {/* Segmento do Contrato */}
              <FormField
                label="Segmento do Contrato"
                required
                error={errors.segmentos}
                icon={<Tag className="h-4 w-4" />}
              >
                <div className="flex flex-wrap gap-1">
                  {segmentoOptions.map((segmento) => {
                    const active = form.segmentos.includes(segmento);
                    return (
                      <button
                        key={segmento}
                        type="button"
                        onClick={() => handleSegmentToggle(segmento)}
                        className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                          active
                            ? "bg-[#004225] text-white border-[#004225]"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {segmento}
                      </button>
                    );
                  })}
                </div>
              </FormField>

              {/* Datas - Grid 2 colunas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Data de Inicio */}
                <FormField
                  label="Início do Contrato"
                  required
                  error={errors.dataInicio}
                  icon={<Calendar className="h-4 w-4" />}
                >
                  <DatePicker
                    value={form.dataInicio}
                    onChange={(value) => handleChange("dataInicio", value)}
                    onBlur={() => handleBlur("dataInicio")}
                    placeholder="Selecione a data de inicio"
                    error={!!errors.dataInicio}
                  />
                </FormField>

                {/* Data de Fim */}
                <FormField
                  label="Fim do Contrato"
                  required
                  error={errors.dataFim}
                  icon={<Calendar className="h-4 w-4" />}
                >
                  <DatePicker
                    value={form.dataFim}
                    onChange={(value) => handleChange("dataFim", value)}
                    onBlur={() => handleBlur("dataFim")}
                    placeholder="Selecione a data de fim"
                    minDate={form.dataInicio || undefined}
                    error={!!errors.dataFim}
                  />
                </FormField>
              </div>

              {/* Datas Efetivas - Grid 2 colunas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Data de Inicio Efetivo */}
                <FormField
                  label="Início Efetivo"
                  error={errors.dataInicioEfetivo}
                  icon={<Calendar className="h-4 w-4" />}
                >
                  <DatePicker
                    value={form.dataInicioEfetivo}
                    onChange={(value) => handleChange("dataInicioEfetivo", value)}
                    onBlur={() => handleBlur("dataInicioEfetivo")}
                    placeholder="Selecione a data de inicio efetivo"
                    minDate={form.dataInicio || undefined}
                    error={!!errors.dataInicioEfetivo}
                  />
                </FormField>

                {/* Data de Fim Efetivo */}
                <FormField
                  label="Fim Efetivo"
                  error={errors.dataFimEfetivo}
                  icon={<Calendar className="h-4 w-4" />}
                >
                  <DatePicker
                    value={form.dataFimEfetivo}
                    onChange={(value) => handleChange("dataFimEfetivo", value)}
                    onBlur={() => handleBlur("dataFimEfetivo")}
                    placeholder="Selecione a data de fim efetivo"
                    minDate={form.dataInicioEfetivo || form.dataInicio || undefined}
                    error={!!errors.dataFimEfetivo}
                  />
                </FormField>
              </div>

              {/* Localidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="UF"
                  required
                  error={errors.uf}
                  icon={<MapPin className="h-4 w-4" />}
                >
                  <Dropdown
                    options={ufDropdownOptions}
                    value={form.uf || undefined}
                    onChange={(value) => handleChange("uf", value)}
                    placeholder={isUfLoading ? "Carregando estados..." : "Selecione a UF"}
                    disabled={isUfLoading || ufDropdownOptions.length === 0}
                    searchable
                    className={
                      errors.uf ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : ""
                    }
                  />
                  {ufLookupError ? (
                    <p className="mt-1 text-xs text-amber-600">{ufLookupError}</p>
                  ) : null}
                </FormField>

                <FormField
                  label="Cidade"
                  required
                  error={errors.cidade}
                  icon={<MapPin className="h-4 w-4" />}
                >
                  <Dropdown
                    options={cidadeDropdownOptions}
                    value={form.cidade || undefined}
                    onChange={(value) => handleChange("cidade", value)}
                    placeholder={
                      !form.uf
                        ? "Selecione a UF primeiro"
                        : isCidadeLoading
                          ? "Carregando cidades..."
                          : "Selecione a cidade"
                    }
                    disabled={!form.uf || isCidadeLoading || cidadeDropdownOptions.length === 0}
                    searchable
                    className={
                      errors.cidade
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : ""
                    }
                  />
                  {cidadeLookupError ? (
                    <p className="mt-1 text-xs text-amber-600">{cidadeLookupError}</p>
                  ) : null}
                </FormField>
              </div>

              {/* Objeto do Contrato (Scope) */}
              <FormField
                label="Objeto do Contrato"
                required
                error={errors.scope}
                icon={<FileText className="h-4 w-4" />}
              >
                <textarea
                  value={form.scope}
                  onChange={(e) => handleChange("scope", e.target.value)}
                  onBlur={() => handleBlur("scope")}
                  placeholder="Descreva o objeto/escopo do contrato..."
                  rows={4}
                  className={`w-full px-4 py-3 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#004225]/20 resize-none ${
                    errors.scope
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-300 focus:border-[#004225]"
                  }`}
                />
              </FormField>

              {/* Valor do Projeto */}
              <FormField
                label="Valor do Projeto"
                required
                error={errors.contract_value}
                icon={<DollarSign className="h-4 w-4" />}
              >
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
                  <input
                    type="text"
                    value={form.contract_value}
                    onChange={(e) => handleChange("contract_value", e.target.value)}
                    onBlur={() => handleBlur("contract_value")}
                    placeholder="0,00"
                    className={`w-full h-11 pl-10 pr-4 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#004225]/20 ${
                      errors.contract_value
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-300 focus:border-[#004225]"
                    }`}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Máximo permitido: {formatCurrencyDisplay(MAX_CONTRACT_VALUE)}
                </p>
              </FormField>

              {/* Documentos */}
              <div
                className="border-t border-gray-200 pt-5 mt-2 space-y-3"
                hidden={hideChildSections}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-[#004225]" />
                  <h3 className="text-sm font-semibold text-gray-900">Documentos do Projeto</h3>
                  <span className="text-xs text-gray-500">(opcional)</span>
                </div>
                <p className="text-xs text-gray-500">
                  Os arquivos serão enviados automaticamente apos o cadastro do projeto.
                  Formatos aceitos: PDF, PNG, JPG e JPEG. Máximo: 20MB por arquivo.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(["contrato", "tr", "planoTrabalho", "outro"] as TipoDocumento[]).map((tipo) => (
                    <ProjectDocumentUploadField
                      key={tipo}
                      label={documentoLabels[tipo]}
                      file={documentos[tipo]}
                      error={fileErrors[tipo]}
                      onFileChange={(file) => handleFileChange(tipo, file)}
                      onRemove={() => removeFile(tipo)}
                      onPreview={() => previewFile(tipo)}
                      disabled={isSubmitting}
                    />
                  ))}
                </div>
                {Object.values(documentos).filter(Boolean).length === 0 ? (
                  <p className="text-xs text-gray-500 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2">
                    Nenhum documento selecionado ainda.
                  </p>
                ) : null}
              </div>

              {/* ================================================================ */}
              {/* Secao de Cronograma de Desembolso (Opcional) */}
              {/* ================================================================ */}
              <div
                className="border-t border-gray-200 pt-5 mt-2"
                hidden={hideChildSections}
              >
                <button
                  type="button"
                  onClick={() => setShowParcelasSection(!showParcelasSection)}
                  className="w-full flex items-center justify-between p-4 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Cronograma de Desembolso
                      </h3>
                      <p className="text-xs text-gray-500">
                        {form.parcelas.length > 0
                          ? `${form.parcelas.length} parcela${form.parcelas.length > 1 ? "s" : ""} cadastrada${form.parcelas.length > 1 ? "s" : ""} - Total: ${formatCurrencyDisplay(totalPrevisto)}`
                          : "Opcional - Cadastre os desembolsos previstos"}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-700 transition-transform duration-200 ${
                      showParcelasSection ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showParcelasSection && (
                  <div className="mt-4 space-y-4">
                    {/* Resumo do valor total */}
                    {valorTotalContrato > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Valor Total do Projeto</p>
                          <p className="text-lg font-bold text-gray-900">{formatCurrencyDisplay(valorTotalContrato)}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Total Previsto</p>
                          <p className="text-lg font-bold text-gray-900">{formatCurrencyDisplay(totalPrevisto)}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">{excedente > 0 ? "Excedente" : "Restante"}</p>
                          <p className={`text-lg font-bold ${excedente > 0 ? "text-red-600" : "text-[#004225]"}`}>
                            {formatCurrencyDisplay(excedente > 0 ? excedente : restante)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Alerta de validacao */}
                    {valorTotalContrato > 0 && (excedente > 0 || restante > 0) && (
                      <div
                        className={`rounded-lg border p-3 ${
                          excedente > 0
                            ? "bg-red-50 border-red-200"
                            : "bg-[#00C48B]/10 border-[#00C48B]/30"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle
                            className={`${excedente > 0 ? "text-red-600" : "text-[#00C48B]"} w-4 h-4 mt-0.5`}
                          />
                          <p className={`text-xs font-medium ${excedente > 0 ? "text-red-900" : "text-[#004225]"}`}>
                            {excedente > 0
                              ? `O cronograma excede o valor total do projeto em ${formatCurrencyDisplay(excedente)}.`
                              : `Faltam ${formatCurrencyDisplay(restante)} para completar o valor total do projeto.`}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Botao Adicionar Parcela */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setIsAddingParcela(true)}
                        disabled={isAddingParcela}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar Parcela
                      </button>
                    </div>

                    {/* Form para nova parcela */}
                    {isAddingParcela && (
                      <div className="bg-gray-50 border-2 border-[#004225]/20 rounded-lg p-4">
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <div>
                            <h4 className="font-medium text-sm text-black">Nova Parcela</h4>
                            <p className="text-xs text-gray-600 mt-0.5">Informe data, valor previsto e status</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingParcela(false);
                              setNewParcela({ dataPrevista: "", valorPrevisto: 0, status: "PREVISTO", observacao: "" });
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Data prevista <span className="text-red-500">*</span>
                            </label>
                            <DatePicker
                              value={newParcela.dataPrevista || ""}
                              onChange={(value) => setNewParcela({ ...newParcela, dataPrevista: value })}
                              placeholder="Selecione a data"
                              minDate={form.dataInicio || undefined}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Valor previsto <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">R$</span>
                              <input
                                type="text"
                                value={newParcela.valorPrevisto ? formatCurrency(String(newParcela.valorPrevisto * 100)) : ""}
                                onChange={(e) => {
                                  const formatted = formatCurrency(e.target.value);
                                  const numericValue = parseFloat(formatted.replace(/\./g, "").replace(",", ".")) || 0;
                                  setNewParcela({ ...newParcela, valorPrevisto: numericValue });
                                }}
                                placeholder="0,00"
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Status <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={newParcela.status ?? "PREVISTO"}
                              onChange={(e) =>
                                setNewParcela({
                                  ...newParcela,
                                  status: e.target.value as StatusDesembolso,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#004225]/20"
                            >
                              {statusDesembolsoOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Observacao</label>
                            <input
                              type="text"
                              value={newParcela.observacao || ""}
                              onChange={(e) => setNewParcela({ ...newParcela, observacao: e.target.value })}
                              placeholder="Opcional"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingParcela(false);
                              setNewParcela({ dataPrevista: "", valorPrevisto: 0, status: "PREVISTO", observacao: "" });
                            }}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={addParcela}
                            disabled={!validateParcela(newParcela)}
                            className="px-4 py-2 text-sm bg-[#004225] text-white rounded-lg hover:bg-[#003319] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Lista de parcelas */}
                    {form.parcelas.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-500 mb-2">
                          Nenhuma parcela cadastrada
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsAddingParcela(true)}
                          className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                        >
                          + Adicionar primeira parcela
                        </button>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="text-center py-3 px-4 font-medium text-gray-600">Parcela</th>
                              <th className="text-center py-3 px-4 font-medium text-gray-600">Data prevista</th>
                              <th className="text-center py-3 px-4 font-medium text-gray-600">Valor previsto</th>
                              <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                              <th className="text-center py-3 px-4 font-medium text-gray-600">Observação</th>
                              <th className="text-center py-3 px-4 font-medium text-gray-600">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {form.parcelas.map((parcela) => (
                              <tr key={parcela.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4 font-medium text-gray-500 text-center">{parcela.numero}o</td>
                                <td className="py-3 px-4 text-center text-gray-700">{formatDate(parcela.dataPrevista)}</td>
                                <td className="py-3 px-4 text-center font-semibold text-gray-900">
                                  {formatCurrencyDisplay(parcela.valorPrevisto)}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      statusDesembolsoOptions.find((opt) => opt.value === parcela.status)?.color ||
                                      "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {statusDesembolsoOptions.find((opt) => opt.value === parcela.status)?.label ||
                                      "Desconhecido"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-gray-700">
                                  {parcela.observacao ? parcela.observacao : <span className="text-gray-400">-</span>}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => removeParcela(parcela.id)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Remover"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50 font-medium">
                            <tr>
                              <td colSpan={2} className="py-3 px-4 text-right text-gray-600">
                                Totais:
                              </td>
                              <td className="py-3 px-4 text-center text-gray-900">
                                {formatCurrencyDisplay(totalPrevisto)}
                              </td>
                              <td colSpan={3} className="py-3 px-4 text-left text-gray-500">
                                {excedente > 0
                                  ? `Excede em ${formatCurrencyDisplay(excedente)}`
                                  : restante > 0
                                  ? `Falta ${formatCurrencyDisplay(restante)}`
                                  : "Fechado"}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ================================================================ */}
              {/* Secao de Metas, Etapas e Fases (Opcional) */}
              {/* ================================================================ */}
              <div
                className="border-t border-gray-200 pt-5 mt-2"
                hidden={hideChildSections}
              >
                <button
                  type="button"
                  onClick={() => setShowMetasSection(!showMetasSection)}
                  className="w-full flex items-center justify-between p-4 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Metas, Etapas e Fases
                      </h3>
                      <p className="text-xs text-gray-500">
                        {form.metas.length > 0
                          ? `${form.metas.length} meta${form.metas.length > 1 ? "s" : ""} cadastrada${form.metas.length > 1 ? "s" : ""}`
                          : "Opcional - Defina a estrutura detalhada do contrato"}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-700 transition-transform duration-200 ${
                      showMetasSection ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showMetasSection && (
                  <div className="mt-4 space-y-4">
                    {/* Botao Adicionar Meta */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={addMeta}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar Meta
                      </button>
                    </div>

                    {/* Lista de Metas */}
                    {form.metas.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-500 mb-2">
                          Nenhuma meta cadastrada
                        </p>
                        <button
                          type="button"
                          onClick={addMeta}
                          className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                        >
                          + Adicionar primeira meta
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {form.metas.map((meta) => (
                          <div
                            key={meta.id}
                            className="border border-gray-200 rounded-lg overflow-hidden"
                          >
                            {/* Header da Meta */}
                            <div className="flex items-center gap-3 px-4 py-3 bg-gray-400/50 border-b border-gray-200">
                              <button
                                type="button"
                                onClick={() => toggleMeta(meta.id)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                {expandedMetas.has(meta.id) ? (
                                  <ChevronDown className="h-4 w-4 text-gray-700" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-700" />
                                )}
                              </button>
                              <span className="text-sm font-bold text-gray-800">
                                Meta {meta.numero}:
                              </span>
                              <input
                                type="text"
                                value={meta.titulo}
                                onChange={(e) => updateMeta(meta.id, "titulo", e.target.value)}
                                placeholder="Titulo da meta..."
                                className="flex-1 px-2 py-1 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                              />
                              <button
                                type="button"
                                onClick={() => removeMeta(meta.id)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Excluir meta"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Conteudo da Meta (expandido) */}
                            {expandedMetas.has(meta.id) && (
                              <div className="p-4 space-y-4 bg-white">
                                {/* Campos da Meta */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                                      Data Início
                                    </label>
                                    <DatePicker
                                      value={meta.dataInicio || ""}
                                      onChange={(value) => updateMeta(meta.id, "dataInicio", value)}
                                      placeholder="Selecione a data"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                                      Data Fim
                                    </label>
                                    <DatePicker
                                      value={meta.dataFim || ""}
                                      onChange={(value) => updateMeta(meta.id, "dataFim", value)}
                                      placeholder="Selecione a data"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                                    Descrição (opcional)
                                  </label>
                                  <textarea
                                    value={meta.descricao || ""}
                                    onChange={(e) => updateMeta(meta.id, "descricao", e.target.value)}
                                    placeholder="Descrição da meta..."
                                    rows={2}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none"
                                  />
                                </div>

                                {/* Etapas da Meta */}
                                <div className="border-t border-gray-100 pt-3">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                      <Milestone className="h-3.5 w-3.5" />
                                      Etapas
                                    </h4>
                                    <button
                                      type="button"
                                      onClick={() => addEtapa(meta.id)}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                    >
                                      <Plus className="h-3 w-3" />
                                      Adicionar Etapa
                                    </button>
                                  </div>

                                  {meta.etapas.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded">
                                      Nenhuma etapa cadastrada
                                    </p>
                                  ) : (
                                    <div className="space-y-2 ml-4">
                                      {meta.etapas.map((etapa) => (
                                        <div
                                          key={etapa.id}
                                          className="border border-gray-200 rounded-lg overflow-hidden"
                                        >
                                          {/* Header da Etapa */}
                                          <div className="flex items-center gap-2 px-3 py-2 bg-gray-400/30 border-b border-gray-200">
                                            <button
                                              type="button"
                                              onClick={() => toggleEtapa(etapa.id)}
                                              className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                                            >
                                              {expandedEtapas.has(etapa.id) ? (
                                                <ChevronDown className="h-3.5 w-3.5 text-gray-700" />
                                              ) : (
                                                <ChevronRight className="h-3.5 w-3.5 text-gray-700" />
                                              )}
                                            </button>
                                            <Milestone className="h-3.5 w-3.5 text-gray-600 flex-shrink-0" />
                                            <span className="text-xs font-bold text-gray-800">
                                              Etapa {etapa.numero}:
                                            </span>
                                            <input
                                              type="text"
                                              value={etapa.titulo}
                                              onChange={(e) =>
                                                updateEtapa(meta.id, etapa.id, "titulo", e.target.value)
                                              }
                                              placeholder="Titulo da etapa..."
                                              className="flex-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => removeEtapa(meta.id, etapa.id)}
                                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                          </div>

                                          {/* Conteudo da Etapa (expandido) */}
                                          {expandedEtapas.has(etapa.id) && (
                                            <div className="p-3 space-y-3 bg-white">
                                              {/* Campos da Etapa */}
                                              <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                  <label className="text-xs text-gray-500 mb-1 block">
                                                    Data Inicio
                                                  </label>
                                                  <DatePicker
                                                    value={etapa.dataInicio || ""}
                                                    onChange={(value) =>
                                                      updateEtapa(meta.id, etapa.id, "dataInicio", value)
                                                    }
                                                    placeholder="Selecione a data"
                                                  />
                                                </div>
                                                <div>
                                                  <label className="text-xs text-gray-500 mb-1 block">
                                                    Data Fim
                                                  </label>
                                                  <DatePicker
                                                    value={etapa.dataFim || ""}
                                                    onChange={(value) =>
                                                      updateEtapa(meta.id, etapa.id, "dataFim", value)
                                                    }
                                                    placeholder="Selecione a data"
                                                  />
                                                </div>
                                              </div>

                                              {/* Fases da Etapa */}
                                              <div className="border-t border-gray-100 pt-2">
                                                <div className="flex items-center justify-between mb-2">
                                                  <h5 className="text-xs font-medium text-gray-600 flex items-center gap-1">
                                                    <Flag className="h-3 w-3" />
                                                    Fases
                                                  </h5>
                                                  <button
                                                    type="button"
                                                    onClick={() => addFase(meta.id, etapa.id)}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                                  >
                                                    <Plus className="h-3 w-3" />
                                                    Fase
                                                  </button>
                                                </div>

                                                {etapa.fases.length === 0 ? (
                                                  <p className="text-xs text-gray-400 text-center py-2 border border-dashed border-gray-200 rounded">
                                                    Nenhuma fase
                                                  </p>
                                                ) : (
                                                  <div className="space-y-2 ml-3">
                                                    {etapa.fases.map((fase) => (
                                                      <div
                                                        key={fase.id}
                                                        className="flex items-center gap-2 p-2 bg-gray-100 border border-gray-300 rounded"
                                                      >
                                                        <Flag className="h-3 w-3 text-gray-600 flex-shrink-0" />
                                                        <span className="text-xs font-medium text-gray-800">
                                                          Fase {fase.numero}:
                                                        </span>
                                                        <input
                                                          type="text"
                                                          value={fase.titulo}
                                                          onChange={(e) =>
                                                            updateFase(
                                                              meta.id,
                                                              etapa.id,
                                                              fase.id,
                                                              "titulo",
                                                              e.target.value
                                                            )
                                                          }
                                                          placeholder="Titulo da fase..."
                                                          className="flex-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                                                        />
                                                        <div className="w-32">
                                                          <DatePicker
                                                            value={fase.dataInicio || ""}
                                                            onChange={(value) =>
                                                              updateFase(
                                                                meta.id,
                                                                etapa.id,
                                                                fase.id,
                                                                "dataInicio",
                                                                value
                                                              )
                                                            }
                                                            placeholder="Inicio"
                                                          />
                                                        </div>
                                                        <div className="w-32">
                                                          <DatePicker
                                                            value={fase.dataFim || ""}
                                                            onChange={(value) =>
                                                              updateFase(
                                                                meta.id,
                                                                etapa.id,
                                                                fase.id,
                                                                "dataFim",
                                                                value
                                                              )
                                                            }
                                                            placeholder="Fim"
                                                          />
                                                        </div>
                                                        <button
                                                          type="button"
                                                          onClick={() =>
                                                            removeFase(meta.id, etapa.id, fase.id)
                                                          }
                                                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                                        >
                                                          <Trash2 className="h-3 w-3" />
                                                        </button>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting || showSuccessModal || isLoadingEditProject}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || showSuccessModal || isLoadingEditProject}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] focus:outline-none focus:ring-2 focus:ring-[#004225]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>{isEditMode ? "Salvar Alteracoes" : "Criar Contrato"}</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {showPartnerModal && (
        <div
          className="fixed inset-0 z-[80] bg-black/45 p-4 flex items-center justify-center"
          onClick={closePartnerModal}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Cadastrar Parceiro</h3>
                <p className="text-xs text-gray-500 mt-1">
                  O parceiro criado sera selecionado automaticamente no campo atual.
                </p>
              </div>
              <button
                type="button"
                onClick={closePartnerModal}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Fechar popup de parceiro"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePartner} className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={partnerForm.name}
                    onChange={(event) =>
                      setPartnerForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="Nome do parceiro"
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nome fantasia <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={partnerForm.tradeName}
                    onChange={(event) =>
                      setPartnerForm((prev) => ({ ...prev, tradeName: event.target.value }))
                    }
                    placeholder="Nome fantasia"
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={partnerForm.partnersType}
                    onChange={(event) =>
                      setPartnerForm((prev) => ({
                        ...prev,
                        partnersType: event.target.value as PartnersTypeEnum,
                      }))
                    }
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  >
                    {partnerTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sigla</label>
                  <input
                    type="text"
                    value={partnerForm.acronym}
                    onChange={(event) =>
                      setPartnerForm((prev) => ({ ...prev, acronym: event.target.value }))
                    }
                    placeholder="Sigla"
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    CNPJ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={partnerForm.cnpj}
                    onChange={(event) =>
                      setPartnerForm((prev) => ({
                        ...prev,
                        cnpj: formatCnpjInput(event.target.value),
                      }))
                    }
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={partnerForm.phone}
                    onChange={(event) =>
                      setPartnerForm((prev) => ({
                        ...prev,
                        phone: formatPhoneInput(event.target.value),
                      }))
                    }
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={partnerForm.email}
                    onChange={(event) =>
                      setPartnerForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    placeholder="contato@parceiro.com"
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Endereco
                </label>
                <input
                  type="text"
                  value={partnerForm.address}
                  onChange={(event) =>
                    setPartnerForm((prev) => ({ ...prev, address: event.target.value }))
                  }
                  placeholder="Endereco completo"
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Estado <span className="text-red-500">*</span>
                  </label>
                  <Dropdown
                    options={partnerUfDropdownOptions}
                    value={partnerForm.state || undefined}
                    onChange={(value) => {
                      setPartnerForm((prev) => ({
                        ...prev,
                        state: (value || "").toUpperCase(),
                        city: "",
                      }));
                      setPartnerCityLookupError(null);
                    }}
                    placeholder={isUfLoading ? "Carregando estados..." : "Selecione a UF"}
                    disabled={isUfLoading || partnerUfDropdownOptions.length === 0}
                    searchable
                    className="h-10"
                  />
                  {ufLookupError ? (
                    <p className="mt-1 text-xs text-amber-600">{ufLookupError}</p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Cidade <span className="text-red-500">*</span>
                  </label>
                  <Dropdown
                    options={partnerCityDropdownOptions}
                    value={partnerForm.city || undefined}
                    onChange={(value) =>
                      setPartnerForm((prev) => ({ ...prev, city: value || "" }))
                    }
                    placeholder={
                      !partnerForm.state
                        ? "Selecione a UF primeiro"
                        : isPartnerCityLoading
                          ? "Carregando cidades..."
                          : "Selecione a cidade"
                    }
                    disabled={
                      !partnerForm.state ||
                      isPartnerCityLoading ||
                      partnerCityDropdownOptions.length === 0
                    }
                    searchable
                    className="h-10"
                  />
                  {partnerCityLookupError ? (
                    <p className="mt-1 text-xs text-amber-600">{partnerCityLookupError}</p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Site</label>
                  <input
                    type="text"
                    value={partnerForm.site}
                    onChange={(event) =>
                      setPartnerForm((prev) => ({ ...prev, site: event.target.value }))
                    }
                    placeholder="https://"
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  />
                </div>
              </div>

              {partnerFormError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {partnerFormError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closePartnerModal}
                  disabled={isCreatingPartner}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPartner}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] disabled:opacity-50 transition-colors"
                >
                  {isCreatingPartner ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Parceiro"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showClientModal && (
        <div
          className="fixed inset-0 z-[80] bg-black/45 p-4 flex items-center justify-center"
          onClick={closeClientModal}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Cadastrar Cliente</h3>
                <p className="text-xs text-gray-500 mt-1">
                  O cliente cadastrado sera selecionado como cliente primario.
                </p>
              </div>
              <button
                type="button"
                onClick={closeClientModal}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Fechar popup de cliente"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={clientForm.name}
                    onChange={(event) =>
                      setClientForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="Nome do cliente"
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    CNPJ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={clientForm.cnpj}
                    onChange={(event) =>
                      setClientForm((prev) => ({
                        ...prev,
                        cnpj: formatCnpjInput(event.target.value),
                      }))
                    }
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tipo de orgao <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={clientForm.publicAgencyType}
                    onChange={(event) =>
                      setClientForm((prev) => ({
                        ...prev,
                        publicAgencyType: event.target.value as PublicAgencyTypeEnum,
                      }))
                    }
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  >
                    {publicAgencyTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sigla</label>
                  <input
                    type="text"
                    value={clientForm.sigla}
                    onChange={(event) =>
                      setClientForm((prev) => ({ ...prev, sigla: event.target.value }))
                    }
                    placeholder="Sigla"
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Codigo</label>
                  <input
                    type="text"
                    value={clientForm.code}
                    onChange={(event) =>
                      setClientForm((prev) => ({ ...prev, code: event.target.value }))
                    }
                    placeholder="Codigo"
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={clientForm.email}
                    onChange={(event) =>
                      setClientForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    placeholder="contato@cliente.com"
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
                  <input
                    type="text"
                    value={clientForm.phone}
                    onChange={(event) =>
                      setClientForm((prev) => ({
                        ...prev,
                        phone: formatPhoneInput(event.target.value),
                      }))
                    }
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade</label>
                  <input
                    type="text"
                    value={clientForm.city}
                    onChange={(event) =>
                      setClientForm((prev) => ({ ...prev, city: event.target.value }))
                    }
                    placeholder="Cidade"
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
                  <input
                    type="text"
                    value={clientForm.state}
                    onChange={(event) =>
                      setClientForm((prev) => ({
                        ...prev,
                        state: event.target.value.toUpperCase().slice(0, 2),
                      }))
                    }
                    placeholder="UF"
                    maxLength={2}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Endereco</label>
                <input
                  type="text"
                  value={clientForm.address}
                  onChange={(event) =>
                    setClientForm((prev) => ({ ...prev, address: event.target.value }))
                  }
                  placeholder="Endereco completo"
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Responsavel de contato
                </label>
                <input
                  type="text"
                  value={clientForm.contactPerson}
                  onChange={(event) =>
                    setClientForm((prev) => ({ ...prev, contactPerson: event.target.value }))
                  }
                  placeholder="Nome do responsavel"
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                />
              </div>

              {clientFormError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {clientFormError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeClientModal}
                  disabled={isCreatingClient}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingClient}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] disabled:opacity-50 transition-colors"
                >
                  {isCreatingClient ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Cliente"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSecretaryModal && (
        <div
          className="fixed inset-0 z-[80] bg-black/45 p-4 flex items-center justify-center"
          onClick={closeSecretaryModal}
        >
          <div
            className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Cadastrar Secretaria</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Secretaria vinculada ao cliente primario:
                  <span className="font-semibold text-gray-700">
                    {" "}
                    {selectedPrimaryClient?.name ?? "-"}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeSecretaryModal}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Fechar popup de secretaria"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSecretary} className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nome da secretaria <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={secretaryForm.name}
                  onChange={(event) =>
                    setSecretaryForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Nome da secretaria"
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">CNPJ</label>
                  <input
                    type="text"
                    value={secretaryForm.cnpj}
                    onChange={(event) =>
                      setSecretaryForm((prev) => ({
                        ...prev,
                        cnpj: formatCnpjInput(event.target.value),
                      }))
                    }
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sigla</label>
                  <input
                    type="text"
                    value={secretaryForm.sigla}
                    onChange={(event) =>
                      setSecretaryForm((prev) => ({ ...prev, sigla: event.target.value }))
                    }
                    placeholder="Sigla"
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Codigo</label>
                  <input
                    type="text"
                    value={secretaryForm.code}
                    onChange={(event) =>
                      setSecretaryForm((prev) => ({ ...prev, code: event.target.value }))
                    }
                    placeholder="Codigo"
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={secretaryForm.email}
                    onChange={(event) =>
                      setSecretaryForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    placeholder="secretaria@orgao.gov.br"
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
                  <input
                    type="text"
                    value={secretaryForm.phone}
                    onChange={(event) =>
                      setSecretaryForm((prev) => ({
                        ...prev,
                        phone: formatPhoneInput(event.target.value),
                      }))
                    }
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Endereco</label>
                <input
                  type="text"
                  value={secretaryForm.address}
                  onChange={(event) =>
                    setSecretaryForm((prev) => ({ ...prev, address: event.target.value }))
                  }
                  placeholder="Endereco completo"
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Responsavel de contato
                </label>
                <input
                  type="text"
                  value={secretaryForm.contactPerson}
                  onChange={(event) =>
                    setSecretaryForm((prev) => ({ ...prev, contactPerson: event.target.value }))
                  }
                  placeholder="Nome do responsavel"
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                />
              </div>

              {secretaryFormError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {secretaryFormError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeSecretaryModal}
                  disabled={isCreatingSecretary}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingSecretary}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] disabled:opacity-50 transition-colors"
                >
                  {isCreatingSecretary ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Secretaria"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCoordinatorModal && (
        <div
          className="fixed inset-0 z-[80] bg-black/45 p-4 flex items-center justify-center"
          onClick={closeCoordinatorModal}
        >
          <div
            className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Cadastrar Coordenador</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Cadastre uma pessoa e selecione como coordenador do projeto.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCoordinatorModal}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Fechar popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCoordinator} className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nome completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={coordinatorForm.fullName}
                  onChange={(event) =>
                    setCoordinatorForm((prev) => ({ ...prev, fullName: event.target.value }))
                  }
                  placeholder="Ex.: Joao da Silva"
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    CPF (opcional)
                  </label>
                  <input
                    type="text"
                    value={coordinatorForm.cpf}
                    onChange={(event) =>
                      setCoordinatorForm((prev) => ({
                        ...prev,
                        cpf: formatCpfInput(event.target.value),
                      }))
                    }
                    placeholder="000.000.000-00"
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
                  <input
                    type="text"
                    value={coordinatorForm.phone}
                    onChange={(event) =>
                      setCoordinatorForm((prev) => ({
                        ...prev,
                        phone: formatPhoneInput(event.target.value),
                      }))
                    }
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={coordinatorForm.email}
                  onChange={(event) =>
                    setCoordinatorForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  placeholder="coordenador@exemplo.com"
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Data de nascimento
                </label>
                <input
                  type="date"
                  value={coordinatorForm.birthDate}
                  onChange={(event) =>
                    setCoordinatorForm((prev) => ({ ...prev, birthDate: event.target.value }))
                  }
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]/20 focus:border-[#004225]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    UF <span className="text-red-500">*</span>
                  </label>
                  <Dropdown
                    options={coordinatorUfDropdownOptions}
                    value={coordinatorForm.state || undefined}
                    onChange={(value) => {
                      setCoordinatorForm((prev) => ({
                        ...prev,
                        state: (value || "").toUpperCase(),
                        city: "",
                      }));
                      setCoordinatorCityLookupError(null);
                    }}
                    placeholder={isUfLoading ? "Carregando estados..." : "Selecione a UF"}
                    disabled={isUfLoading || coordinatorUfDropdownOptions.length === 0}
                    searchable
                    className="h-10"
                  />
                  {ufLookupError ? (
                    <p className="mt-1 text-xs text-amber-600">{ufLookupError}</p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Cidade <span className="text-red-500">*</span>
                  </label>
                  <Dropdown
                    options={coordinatorCityDropdownOptions}
                    value={coordinatorForm.city || undefined}
                    onChange={(value) =>
                      setCoordinatorForm((prev) => ({ ...prev, city: value || "" }))
                    }
                    placeholder={
                      !coordinatorForm.state
                        ? "Selecione a UF primeiro"
                        : isCoordinatorCityLoading
                          ? "Carregando cidades..."
                          : "Selecione a cidade"
                    }
                    disabled={
                      !coordinatorForm.state ||
                      isCoordinatorCityLoading ||
                      coordinatorCityDropdownOptions.length === 0
                    }
                    searchable
                    className="h-10"
                  />
                  {coordinatorCityLookupError ? (
                    <p className="mt-1 text-xs text-amber-600">{coordinatorCityLookupError}</p>
                  ) : null}
                </div>
              </div>

              {coordinatorFormError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {coordinatorFormError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeCoordinatorModal}
                  disabled={isCreatingCoordinator}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCoordinator}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] disabled:opacity-50 transition-colors"
                >
                  {isCreatingCoordinator ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Coordenador"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NovoContratoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F6F8]" />}>
      <NovoContratoPageContent />
    </Suspense>
  );
}

function ProjectDocumentUploadField({
  label,
  file,
  error,
  onFileChange,
  onRemove,
  onPreview,
  disabled,
}: {
  label: string;
  file?: File;
  error?: string;
  onFileChange: (file: File | null) => void;
  onRemove: () => void;
  onPreview: () => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-700">{label}</label>

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm border-2 border-dashed rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
            error
              ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
              : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
          }`}
        >
          <Upload className="h-4 w-4" />
          Selecionar arquivo
        </button>
      ) : (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-700 flex-shrink-0" />
            <p className="text-xs text-emerald-900 truncate flex-1" title={file.name}>
              {file.name}
            </p>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px] text-emerald-700">Pronto para envio</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onPreview}
                disabled={disabled}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100 rounded transition-colors disabled:opacity-60"
              >
                <Eye className="h-3 w-3" />
                Visualizar
              </button>
              <button
                type="button"
                onClick={onRemove}
                disabled={disabled}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100 rounded transition-colors disabled:opacity-60"
              >
                <Trash2 className="h-3 w-3" />
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        disabled={disabled}
        onChange={(event) => onFileChange(event.target.files?.[0] || null)}
      />

      {error ? (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

// Componente auxiliar para campos do formulario
function FormField({
  label,
  required,
  error,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        {icon && <span className="text-gray-400">{icon}</span>}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
