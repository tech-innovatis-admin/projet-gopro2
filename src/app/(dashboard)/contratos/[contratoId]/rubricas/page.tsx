'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Edit2,
  Check,
  X,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { AppModalShell } from '@/components/ui/app-modal-shell';
import { Dropdown } from '@/components/ui/dropdown';
import { RemanejamentoModal } from './_components/RemanejamentoModal';
import { HistoricoRemanejamentos } from './_components/HistoricoRemanejamentos';
import { MoneyInput } from '../desembolso/_components/MoneyImput';
import { ResizableTable } from '@/components/ui/resizable-table';
import { ContractRubricasLoadingSkeleton } from '../_components/ContractLoadingSkeleton';
import {
  CompanyFormModal,
  type CompanyFormData,
  hasRequiredCompanyFields,
  onlyDigits,
} from '../_components/CompanyFormModal';
import {
  MemberFormModal,
  defaultMemberFormData,
  hasRequiredMemberFields,
  type MembroFormData,
} from '../_components/MemberFormModal';
import { unformatCPF, validateCPFComplete } from '../equipe-tecnica/_components/CPFValidator';
import {
  unformatPhone,
  validatePhoneComplete,
} from '../equipe-tecnica/_components/PhoneValidator';
import { NovoParceiroModal } from '@/src/app/(dashboard)/parceiros/_components/NovoParceiroModal';
import { mapParceiroFormToPartnerRequestDTO } from '@/src/app/(dashboard)/parceiros/mappers';
import {
  createBudgetCategory,
  createBudgetItem,
  assignBudgetItemBeneficiary,
  removeBudgetItemBeneficiary,
  createBudgetTransfer,
  createCompany,
  createPeople,
  createProjectCompany,
  createProjectPeople,
  deleteBudgetCategory,
  deleteBudgetItem,
  listBudgetCategories,
  listBudgetItems,
  listBudgetTransfers,
  listCompanies,
  listGoals,
  listPartners,
  createPartner,
  listPeople,
  listProjectCompaniesDetailed,
  listProjectPeopleDetailed,
  updatePeople,
  updateProjectPeople,
  updateProjectCompany,
  updateBudgetCategory,
  updateBudgetItem,
  uploadDocument,
  getProjectBudgetSummary,
} from '@/src/lib/api/endpoints';
import { resolveUserNamesById } from '@/src/lib/audit/userLookup';
import {
  canManageAdminArea,
  canManageContractChildren,
  fetchCurrentUser,
  requireCurrentUserId,
} from '@/src/lib/auth/session';
import {
  buildBudgetTransferComebackReason,
  parseBudgetTransferComeback,
} from '@/src/lib/budget-transfers/comeback';
import {
  type BudgetTransferRequestDTO,
  type CompanyResponseDTO,
  type ContractingStatusEnum,
  type GoalResponseDTO,
  HttpError,
  type PageResponseDTO,
  type PeopleResponseDTO,
  type ProjectCompanyDetailedResponseDTO,
  type ProjectBudgetSummaryDTO,
  type RoleProjectPeopleEnum,
  type StatusProjectPeopleEnum,
} from '@/src/lib/api/types';
import { getUserErrorMessage } from '@/src/lib/feedback/user-messages';

type ID = string;

interface Remanejamento {
  id: string;
  contratoId: string;
  itemOrigemId: string;
  itemDestinoId: string;
  valor: number;
  data: string;
  motivo: string;
  createdBy: string;
  createdAt: string;
  status?: 'PENDENTE' | 'APROVADO';
}

type Lancamento = {
  valor: number;
  dataPag: string;
};
type BeneficiaryType = 'person' | 'company' | 'partner';

function toOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function papelToRole(papel: MembroFormData['papel']): RoleProjectPeopleEnum {
  if (papel === 'BOLSISTA') return 'BOLSISTA';
  return 'DIRETOR';
}

type Subitem = {
  id: ID;
  empresaRh: string;
  lancamentos: Record<ID, Lancamento | undefined>;
};

interface ItemRubrica {
  id: string;
  codigo?: string;
  descricao: string;
  quantidade: number;
  meses: number;
  valorUnitario: number;
  valorTotal: number;
  meta?: string;
  metaId?: string;
  metaIds?: string[];
  notes?: string;
  webs?: string;
  serviceOrder?: string;
  protocol?: string;
  subitens?: Subitem[];
  remanejamentoDebito?: number;
  remanejamentoCredito?: number;
  valorFinal?: number;
  projectPeopleId?: string;
  projectCompanyId?: string;
  projectPartnerId?: string;
  beneficiaryType?: BeneficiaryType;
  beneficiaryReferenceId?: string;
  unlinkedItem?: boolean;
}
interface ProjectPersonOption {
  id: string;
  label: string;
  baseAmount?: number | null;
}
interface ProjectCompanyOption {
  id: string;
  label: string;
  name: string;
  cnpj?: string | null;
  status?: ContractingStatusEnum | null;
  availableBalance?: number | null;
  totalValue?: number | null;
}

interface ProjectPartnerOption {
  id: string;
  label: string;
  partnerType: 'IF' | 'FUNDACAO';
}

type ProjectPartnerData = {
  id: number;
  partnerId: number;
  partnerName: string;
  partnerTradeName: string | null;
  partnerType: 'IF' | 'FUNDACAO';
};

type NewPartnerFormData = { name: string; partnersType: 'IF' | 'FUNDACAO' | '' };
const emptyPartnerForm = (): NewPartnerFormData => ({ name: '', partnersType: '' });

interface Rubrica {
  id: string;
  codigo: string;
  nome: string;
  itens: ItemRubrica[];
  expanded: boolean;
}

interface MetaOption {
  id: string;
  numero: number;
  titulo: string;
}

interface RubricaEditForm {
  nome: string;
}

interface MetaSelectionFieldProps {
  metas: MetaOption[];
  selectedMetaIds: string[];
  onChange: (metaIds: string[]) => void;
  disabled?: boolean;
  tone?: 'default' | 'accent';
  mode?: 'create' | 'edit';
}

const PAGE_SIZE = 20;
const MAX_PAGE_REQUESTS = 1000;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

const CONTRACTING_STATUS_LABELS: Record<ContractingStatusEnum, string> = {
  EM_CADASTRO: 'Em cadastro',
  EM_CONTRATACAO: 'Em contratação',
  CONTRATADA: 'Contratada',
  EM_EXECUCAO: 'Em execução',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

const formatContractingStatus = (status?: ContractingStatusEnum | null) =>
  status ? CONTRACTING_STATUS_LABELS[status] ?? status : 'Status não informado';

const buildProjectCompanyOption = (
  company: ProjectCompanyDetailedResponseDTO
): ProjectCompanyOption => {
  const name =
    company.companyTradeName?.trim() ||
    company.companyName?.trim() ||
    `Empresa #${company.companyId}`;
  const cnpj = company.companyCnpj?.trim() || null;
  const status = company.status ?? null;
  const balance =
    typeof company.availableBalance === 'number' && Number.isFinite(company.availableBalance)
      ? company.availableBalance
      : null;
  const totalValue =
    typeof company.totalValue === 'number' && Number.isFinite(company.totalValue)
      ? company.totalValue
      : null;

  return {
    id: String(company.id),
    name,
    cnpj,
    status,
    availableBalance: balance,
    totalValue,
    label: [
      name,
      cnpj ? `CNPJ ${cnpj}` : 'CNPJ não informado',
      formatContractingStatus(status),
      balance != null ? `Saldo ${formatCurrency(balance)}` : null,
    ]
      .filter(Boolean)
      .join(' - '),
  };
};

const toSafeNumber = (value: number | null | undefined): number => {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }
  return value;
};

const toPositiveInt = (value: number | undefined, fallback = 1): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.trunc(parsed));
};

const parsePositiveIntInput = (value: string): number | undefined => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(1, Math.trunc(parsed));
};

const toMoneyValue = (value: number | undefined): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Number(parsed.toFixed(2));
};

const toInputDateValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatCnpjCompact = (value?: string | null) => {
  const digits = (value ?? '').replace(/\D/g, '').slice(0, 14);
  if (digits.length !== 14) return null;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const toErrorMessage = (error: unknown, fallback: string) =>
  getUserErrorMessage(error, fallback);

const extractCriticalBeneficiaryConflictMessage = (error: unknown): string | null => {
  if (!(error instanceof HttpError) || !error.fieldErrors) {
    return null;
  }

  const candidateMessages = [
    error.fieldErrors.projectPeopleId,
    error.fieldErrors.projectCompanyId,
  ].filter((message): message is string => Boolean(message?.trim()));

  for (const message of candidateMessages) {
    const normalized = message.toLowerCase();
    const isConflictMessage =
      normalized.includes('responsavel') &&
      normalized.includes('rubrica') &&
      (normalized.includes('ja recebe') || normalized.includes('nao pode receber'));

    if (isConflictMessage) {
      return message;
    }
  }

  return null;
};

const RUBRICA_DEFAULT_COMPANY_STATUS: ContractingStatusEnum = 'CONTRATADA';

const isPersistedId = (id: string) => /^\d+$/.test(id);
const toPersistedId = (id: string) => Number.parseInt(id, 10);
const META_IDS_NOTES_PREFIX = '[[GOPRO_META_IDS:';
const META_IDS_NOTES_SUFFIX = ']]';

const createEmptyItemDraft = (): Partial<ItemRubrica> => ({
  descricao: '',
  quantidade: 1,
  meses: 1,
  valorUnitario: 0,
  metaIds: [],
  webs: '',
  serviceOrder: '',
  protocol: '',
  projectPeopleId: undefined,
  projectCompanyId: undefined,
  beneficiaryType: undefined,
  beneficiaryReferenceId: undefined,
  unlinkedItem: false,
});

const createEmptyCompanyForm = (): CompanyFormData => ({
  razaoSocial: '',
  nomeFantasia: '',
  cnpj: '',
  email: '',
  telefone: '',
  endereco: '',
  cidade: '',
  uf: '',
  status: RUBRICA_DEFAULT_COMPANY_STATUS,
});

const buildDraftItemTotal = (draft: Partial<ItemRubrica>) => {
  const quantidade = toPositiveInt(draft.quantidade, 1);
  const meses = toPositiveInt(draft.meses, 1);
  const valorUnitario = toMoneyValue(draft.valorUnitario);
  return Number((quantidade * meses * valorUnitario).toFixed(2));
};


const isItemDraftDirty = (draft: Partial<ItemRubrica> | null) => {
  if (!draft) return false;

  const selectedMetaIds = (draft.metaIds ?? []).filter(Boolean);
  return (
    (draft.descricao ?? '').trim().length > 0 ||
    (draft.webs ?? '').trim().length > 0 ||
    (draft.serviceOrder ?? '').trim().length > 0 ||
    (draft.protocol ?? '').trim().length > 0 ||
    toPositiveInt(draft.quantidade, 1) !== 1 ||
    toPositiveInt(draft.meses, 1) !== 1 ||
    toMoneyValue(draft.valorUnitario) > 0 ||
    selectedMetaIds.length > 0 ||
    Boolean(draft.projectPeopleId) ||
    Boolean(draft.projectCompanyId) ||
    Boolean(draft.beneficiaryType) ||
    Boolean(draft.beneficiaryReferenceId) ||
    Boolean(draft.unlinkedItem)
  );
};

const calculateDraftTotal = (draft: Partial<ItemRubrica>) => {
  const quantidade = toPositiveInt(draft.quantidade, 0);
  const meses = toPositiveInt(draft.meses, 0);
  const valorUnitario = toMoneyValue(draft.valorUnitario);

  return Number((quantidade * meses * valorUnitario).toFixed(2));
};

const getOrderedSelectedMetaIds = (metaIds: string[] | undefined, metas: MetaOption[]) => {
  const uniqueMetaIds = Array.from(new Set((metaIds ?? []).filter(Boolean)));

  if (metas.length === 0) {
    return uniqueMetaIds;
  }

  const selectedIds = new Set(uniqueMetaIds);
  return metas.map((meta) => meta.id).filter((metaId) => selectedIds.has(metaId));
};

const toggleSelectedMetaId = (
  currentMetaIds: string[],
  metaId: string,
  metas: MetaOption[]
) => {
  const nextMetaIds = new Set(currentMetaIds);

  if (nextMetaIds.has(metaId)) {
    nextMetaIds.delete(metaId);
  } else {
    nextMetaIds.add(metaId);
  }

  return getOrderedSelectedMetaIds(Array.from(nextMetaIds), metas);
};

const areAllMetasSelected = (selectedMetaIds: string[], metas: MetaOption[]) =>
  metas.length > 0 && selectedMetaIds.length === metas.length;

const getMetaSelectionSummary = (selectedMetaIds: string[], metas: MetaOption[]) => {
  if (metas.length === 0) {
    return 'Sem metas cadastradas';
  }

  if (selectedMetaIds.length === 0) {
    return 'Sem vínculo com metas';
  }

  if (areAllMetasSelected(selectedMetaIds, metas)) {
    return `Todas as metas (${selectedMetaIds.length})`;
  }

  if (selectedMetaIds.length === 1) {
    const selectedMeta = metas.find((meta) => meta.id === selectedMetaIds[0]);
    return selectedMeta ? `Meta ${selectedMeta.numero}` : '1 meta selecionada';
  }

  return `${selectedMetaIds.length} metas selecionadas`;
};

const getMetaSelectionHelperText = (
  selectedMetaIds: string[],
  metas: MetaOption[],
  mode: 'create' | 'edit'
) => {
  if (metas.length === 0) {
    return 'Nenhuma meta cadastrada. O item será salvo sem vínculo.';
  }

  if (selectedMetaIds.length === 0) {
    return 'Opcional: deixe sem vínculo ou selecione uma ou mais metas.';
  }

  if (selectedMetaIds.length === 1) {
    return 'Será mantido um único item vinculado a esta meta.';
  }

  if (mode === 'create') {
    return `Ao salvar, o item permanecerá único e ficará vinculado a ${selectedMetaIds.length} metas.`;
  }

  return 'Ao salvar, este item permanecerá único e manterá todas as metas selecionadas.';
};

const parseBudgetItemMetaNotes = (notes?: string | null) => {
  if (!notes?.trim()) {
    return { metaIds: [] as string[], cleanedNotes: undefined as string | undefined };
  }

  const lines = notes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const metaIds = new Set<string>();
  const remainingLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith(META_IDS_NOTES_PREFIX) && line.endsWith(META_IDS_NOTES_SUFFIX)) {
      const serializedIds = line
        .slice(META_IDS_NOTES_PREFIX.length, -META_IDS_NOTES_SUFFIX.length)
        .split(',')
        .map((value) => value.trim())
        .filter((value) => /^\d+$/.test(value));

      serializedIds.forEach((metaId) => metaIds.add(metaId));
      continue;
    }

    remainingLines.push(line);
  }

  return {
    metaIds: Array.from(metaIds),
    cleanedNotes: remainingLines.length > 0 ? remainingLines.join('\n') : undefined,
  };
};

const buildBudgetItemNotes = (notes: string | undefined, selectedMetaIds: string[]) => {
  const cleanedNotes = notes?.trim() || '';
  const orderedMetaIds = Array.from(new Set(selectedMetaIds.filter(Boolean)));

  if (orderedMetaIds.length <= 1) {
    return cleanedNotes || undefined;
  }

  const metadata = `${META_IDS_NOTES_PREFIX}${orderedMetaIds.join(',')}${META_IDS_NOTES_SUFFIX}`;
  return cleanedNotes ? `${metadata}\n${cleanedNotes}` : metadata;
};

function MetaSelectionField({
  metas,
  selectedMetaIds,
  onChange,
  disabled = false,
  tone = 'default',
  mode = 'create',
}: MetaSelectionFieldProps) {
  const allSelected = areAllMetasSelected(selectedMetaIds, metas);
  const summary = getMetaSelectionSummary(selectedMetaIds, metas);
  const helperText = getMetaSelectionHelperText(selectedMetaIds, metas, mode);
  const containerClassName =
    tone === 'accent'
      ? 'border-blue-300 bg-white/90'
      : 'border-gray-300 bg-white';
  const activeChipClassName =
    tone === 'accent'
      ? 'border-blue-500 bg-blue-100 text-blue-800'
      : 'border-emerald-500 bg-emerald-50 text-emerald-800';
  const inactiveChipClassName = 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50';

  return (
    <div className={`rounded-lg border p-2 ${containerClassName}`}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange([])}
          disabled={disabled}
          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            selectedMetaIds.length === 0 ? activeChipClassName : inactiveChipClassName
          }`}
        >
          Sem vínculo
        </button>
        <button
          type="button"
          onClick={() => onChange(allSelected ? [] : metas.map((meta) => meta.id))}
          disabled={disabled || metas.length === 0}
          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            allSelected ? activeChipClassName : inactiveChipClassName
          }`}
        >
          Todas as metas
        </button>
        <span className="text-[11px] font-medium text-gray-500">{summary}</span>
      </div>

      {metas.length > 0 && (
        <div className="mt-2 max-h-28 space-y-1 overflow-y-auto pr-1">
          {metas.map((meta) => {
            const isChecked = selectedMetaIds.includes(meta.id);

            return (
              <label
                key={meta.id}
                className={`flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 transition-colors ${
                  isChecked ? 'bg-gray-50' : 'hover:bg-gray-50'
                } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <Checkbox
                  checked={isChecked}
                  disabled={disabled}
                  onCheckedChange={() =>
                    onChange(toggleSelectedMetaId(selectedMetaIds, meta.id, metas))
                  }
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-700">Meta {meta.numero}</p>
                  <p className="truncate text-[11px] text-gray-500">{meta.titulo}</p>
                </div>
              </label>
            );
          })}
        </div>
      )}

      <p className="mt-2 text-[11px] text-gray-500">{helperText}</p>
    </div>
  );
}

const normalizeTransferStatus = (status: string | null | undefined): 'PENDENTE' | 'APROVADO' =>
  status === 'APROVADO' ? 'APROVADO' : 'PENDENTE';

async function fetchAllPages<T>(
  fetchPage: (query: { page: number; size: number }) => Promise<PageResponseDTO<T>>
): Promise<T[]> {
  const allItems: T[] = [];
  let page = 0;

  for (let i = 0; i < MAX_PAGE_REQUESTS; i += 1) {
    const response = await fetchPage({ page, size: PAGE_SIZE });
    allItems.push(...response.content);
    if (response.last) break;
    page += 1;
  }

  return allItems;
}

export default function RubricasPage() {
  const params = useParams();
  const contratoId = params.contratoId as string;
  const projectId = useMemo(() => Number.parseInt(contratoId, 10), [contratoId]);

  const [rubricas, setRubricas] = useState<Rubrica[]>([]);
  const [metas, setMetas] = useState<MetaOption[]>([]);
  const [projectPeopleOptions, setProjectPeopleOptions] = useState<ProjectPersonOption[]>([]);
  const [projectCompanyOptions, setProjectCompanyOptions] = useState<ProjectCompanyOption[]>([]);
  const [projectPartnerOptions, setProjectPartnerOptions] = useState<ProjectPartnerOption[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<ProjectBudgetSummaryDTO | null>(null);
  const [availablePeople, setAvailablePeople] = useState<PeopleResponseDTO[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<CompanyResponseDTO[]>([]);
  const [availablePartners, setAvailablePartners] = useState<{ id: number; name: string; tradeName: string | null; partnersType: 'IF' | 'FUNDACAO' }[]>([]);
  const [showCreatePersonModal, setShowCreatePersonModal] = useState(false);
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [showLinkPersonModal, setShowLinkPersonModal] = useState(false);
  const [showLinkCompanyModal, setShowLinkCompanyModal] = useState(false);
  const [selectedPersonToLink, setSelectedPersonToLink] = useState<string | undefined>(undefined);
  const [selectedCompanyToLink, setSelectedCompanyToLink] = useState<string | undefined>(undefined);
  const [newPersonForm, setNewPersonForm] = useState<MembroFormData>(defaultMemberFormData);
  const [newPersonAvatarFile, setNewPersonAvatarFile] = useState<File | null>(null);
  const [newPersonCpfError, setNewPersonCpfError] = useState('');
  const [newPersonPhoneError, setNewPersonPhoneError] = useState('');
  const [newCompanyForm, setNewCompanyForm] = useState<CompanyFormData>(createEmptyCompanyForm());
  const [createPersonModalError, setCreatePersonModalError] = useState<string | null>(null);
  const [createPersonFieldErrors, setCreatePersonFieldErrors] = useState<Record<string, string>>({});
  const [createCompanyModalError, setCreateCompanyModalError] = useState<string | null>(null);
  const [createCompanyFieldErrors, setCreateCompanyFieldErrors] = useState<Record<string, string>>({});
  const [showLinkPartnerModal, setShowLinkPartnerModal] = useState(false);
  const [showCreatePartnerModal, setShowCreatePartnerModal] = useState(false);
  const [selectedPartnerToLink, setSelectedPartnerToLink] = useState<string | undefined>(undefined);
  const [linkPartnerModalError, setLinkPartnerModalError] = useState<string | null>(null);
  const [linkPartnerFieldError, setLinkPartnerFieldError] = useState<string | null>(null);
  const [linkPartnerAttempted, setLinkPartnerAttempted] = useState(false);
  const [linkPersonModalError, setLinkPersonModalError] = useState<string | null>(null);
  const [linkPersonFieldError, setLinkPersonFieldError] = useState<string | null>(null);
  const [linkCompanyModalError, setLinkCompanyModalError] = useState<string | null>(null);
  const [linkCompanyFieldError, setLinkCompanyFieldError] = useState<string | null>(null);
  const [createItemAttempted, setCreateItemAttempted] = useState(false);
  const [editItemAttempted, setEditItemAttempted] = useState(false);
  const [linkPersonAttempted, setLinkPersonAttempted] = useState(false);
  const [linkCompanyAttempted, setLinkCompanyAttempted] = useState(false);
  const [editingRubrica, setEditingRubrica] = useState<string | null>(null);
  const [editRubricaForm, setEditRubricaForm] = useState<RubricaEditForm | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ItemRubrica> | null>(null);
  const [beneficiaryModalContext, setBeneficiaryModalContext] = useState<'create' | 'edit'>('create');
  const [addingToRubrica, setAddingToRubrica] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<ItemRubrica>>(createEmptyItemDraft);
  const [itemPendingDeletion, setItemPendingDeletion] = useState<{
    rubricaId: string;
    itemId: string;
    descricao: string;
  } | null>(null);
  const [rubricaPendingDeletion, setRubricaPendingDeletion] = useState<Rubrica | null>(null);
  const [isAddingRubrica, setIsAddingRubrica] = useState(false);
  const [newRubrica, setNewRubrica] = useState({ nome: '' });
  const [remanejamentos, setRemanejamentos] = useState<Remanejamento[]>([]);
  const [remanejamentoModalOpen, setRemanejamentoModalOpen] = useState(false);
  const [itemParaRemanejamento, setItemParaRemanejamento] = useState<ItemRubrica | null>(null);
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [canManageChildren, setCanManageChildren] = useState(false);
  const [canOpenTransferHistory, setCanOpenTransferHistory] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [itemFieldErrors, setItemFieldErrors] = useState<Record<string, string>>({});
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [criticalConflictMessage, setCriticalConflictMessage] = useState<string | null>(null);

  const showSavedMessage = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(null), 2500);
  };

  const captureItemFieldErrors = (error: unknown) => {
    if (error instanceof HttpError && error.fieldErrors) {
      setItemFieldErrors(error.fieldErrors);
      return;
    }
    setItemFieldErrors({});
  };

  useEffect(() => {
    let cancelled = false;

    async function loadAccess() {
      try {
        const user = await fetchCurrentUser();
        if (!cancelled) {
          setCanManageChildren(canManageContractChildren(user));
          setCanOpenTransferHistory(canManageAdminArea(user));
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

    setActionError('Seu perfil pode apenas visualizar esta área do contrato.');
    return false;
  };

  const currentCreateRubrica = useMemo(
    () => rubricas.find((rubrica) => rubrica.id === addingToRubrica) ?? null,
    [addingToRubrica, rubricas]
  );

  const currentEditRubrica = useMemo(
    () =>
      editingItem
        ? rubricas.find((rubrica) => rubrica.itens.some((item) => item.id === editingItem)) ?? null
        : null,
    [editingItem, rubricas]
  );
  const originalEditingItem = useMemo(
    () =>
      editingItem
        ? currentEditRubrica?.itens.find((item) => item.id === editingItem) ?? null
        : null,
    [currentEditRubrica, editingItem]
  );
  const isCreateItemDirty = isItemDraftDirty(newItem);
  const isEditItemDirty = useMemo(() => {
    if (!editForm || !originalEditingItem) return false;

    const currentMetaIds =
      editForm.metaIds && editForm.metaIds.length > 0
        ? getOrderedSelectedMetaIds(editForm.metaIds, metas)
        : editForm.metaId
          ? getOrderedSelectedMetaIds([editForm.metaId], metas)
          : [];
    const originalMetaIds =
      originalEditingItem.metaIds && originalEditingItem.metaIds.length > 0
        ? getOrderedSelectedMetaIds(originalEditingItem.metaIds, metas)
        : originalEditingItem.metaId
          ? getOrderedSelectedMetaIds([originalEditingItem.metaId], metas)
          : [];

    return (
      (editForm.descricao ?? '').trim() !== (originalEditingItem.descricao ?? '').trim() ||
      (editForm.webs ?? '').trim() !== (originalEditingItem.webs ?? '').trim() ||
      (editForm.serviceOrder ?? '').trim() !== (originalEditingItem.serviceOrder ?? '').trim() ||
      (editForm.protocol ?? '').trim() !== (originalEditingItem.protocol ?? '').trim() ||
      toPositiveInt(editForm.quantidade, 1) !== toPositiveInt(originalEditingItem.quantidade, 1) ||
      toPositiveInt(editForm.meses, 1) !== toPositiveInt(originalEditingItem.meses, 1) ||
      toMoneyValue(editForm.valorUnitario) !== toMoneyValue(originalEditingItem.valorUnitario) ||
      Boolean(editForm.unlinkedItem) !==
        Boolean(!originalEditingItem.beneficiaryType || !originalEditingItem.beneficiaryReferenceId) ||
      (editForm.beneficiaryType ?? '') !== (originalEditingItem.beneficiaryType ?? '') ||
      (editForm.beneficiaryReferenceId ?? '') !==
        (originalEditingItem.beneficiaryReferenceId ?? '') ||
      (editForm.projectPeopleId ?? '') !== (originalEditingItem.projectPeopleId ?? '') ||
      (editForm.projectCompanyId ?? '') !== (originalEditingItem.projectCompanyId ?? '') ||
      JSON.stringify(currentMetaIds) !== JSON.stringify(originalMetaIds)
    );
  }, [editForm, metas, originalEditingItem]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    if (!Number.isFinite(projectId)) {
      setRubricas([]);
      setMetas([]);
      setProjectPeopleOptions([]);
      setProjectCompanyOptions([]);
      setProjectPartnerOptions([]);
      setAvailablePeople([]);
      setAvailableCompanies([]);
      setRemanejamentos([]);
      setLoadError('ID do contrato inválido para carregar rubricas.');
      setIsLoading(false);
      return;
    }

    try {
      const [
        allCategories,
        allItems,
        allGoals,
        allTransfers,
        allProjectPeople,
        allProjectCompanies,
        allPeople,
        allCompanies,
        summary,
        allProjectPartners,
        allPartners,
      ] = await Promise.all([
        fetchAllPages((query) => listBudgetCategories({ ...query, projectId })),
        fetchAllPages((query) => listBudgetItems({ ...query, projectId })),
        fetchAllPages((query) => listGoals({ ...query, projectId })).catch(
          () => [] as GoalResponseDTO[]
        ),
        fetchAllPages((query) => listBudgetTransfers({ ...query, projectId })),
        fetchAllPages((query) => listProjectPeopleDetailed({ ...query, projectId })),
        fetchAllPages((query) => listProjectCompaniesDetailed({ ...query, projectId })),
        fetchAllPages((query) => listPeople(query)),
        fetchAllPages((query) => listCompanies(query)),
        getProjectBudgetSummary(projectId),
        fetch(`/api/backend/contracts/${projectId}/parceiros?size=200`)
          .then((r) => r.ok ? (r.json() as Promise<{ content: ProjectPartnerData[] }>) : { content: [] })
          .then((d) => d.content)
          .catch(() => [] as ProjectPartnerData[]),
        fetchAllPages((query) => listPartners(query)).catch(() => [] as Awaited<ReturnType<typeof listPartners>>['content']),
      ]);
      setBudgetSummary(summary);

      const projectGoals = (allGoals as GoalResponseDTO[])
        .filter((goal) => goal.projectId === projectId)
        .sort((a, b) => a.numero - b.numero || a.id - b.id);

      setMetas(
        projectGoals.map((goal) => ({
          id: String(goal.id),
          numero: goal.numero,
          titulo: goal.titulo,
        }))
      );

      const projectPeople = allProjectPeople
        .filter((item) => item.projectId === projectId && item.isActive)
        .map((item) => ({
          id: String(item.id),
          label: item.personFullName?.trim() || `Pessoa #${item.personId}`,
          baseAmount:
            typeof item.baseAmount === 'number' && Number.isFinite(item.baseAmount)
              ? item.baseAmount
              : null,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
      setProjectPeopleOptions(projectPeople);

      const projectCompanies = allProjectCompanies
        .filter((item) => item.projectId === projectId && item.isActive)
        .map(buildProjectCompanyOption)
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
      setProjectCompanyOptions(projectCompanies);

      setProjectPartnerOptions(
        allProjectPartners
          .map((pp) => ({
            id: String(pp.id),
            label: pp.partnerTradeName?.trim()
              ? `${pp.partnerTradeName.trim()} — ${pp.partnerName}`
              : pp.partnerName,
            partnerType: pp.partnerType,
          }))
          .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
      );

      const linkedPartnerIds = new Set(allProjectPartners.map((pp) => pp.partnerId));
      setAvailablePartners(
        allPartners
          .filter((p) => p.isActive && !linkedPartnerIds.has(p.id))
          .map((p) => ({
            id: p.id,
            name: p.name,
            tradeName: p.tradeName?.trim() || null,
            partnersType: p.partnersType,
          }))
      );

      const projectPeopleIds = new Set(
        allProjectPeople.filter((item) => item.projectId === projectId).map((item) => item.personId)
      );
      const projectCompanyIds = new Set(
        allProjectCompanies
          .filter((item) => item.projectId === projectId)
          .map((item) => item.companyId)
      );
      setAvailablePeople(
        allPeople.filter((person) => person.isActive && !projectPeopleIds.has(person.id))
      );
      setAvailableCompanies(
        allCompanies.filter((company) => company.isActive && !projectCompanyIds.has(company.id))
      );

      const categories = allCategories
        .filter((category) => category.projectId === projectId)
        .sort((a, b) => {
          const codeA = a.code || '';
          const codeB = b.code || '';
          return codeA.localeCompare(codeB, 'pt-BR') || a.id - b.id;
        });

      const categoryIds = new Set(categories.map((category) => category.id));
      const itemsByCategory = new Map<number, ItemRubrica[]>();

      for (const item of allItems) {
        if (!categoryIds.has(item.categoryId)) continue;

        const quantidade = toPositiveInt(item.quantity ?? 1);
        const meses = toPositiveInt(item.months ?? 1);
        const valorUnitario = toMoneyValue(item.unitCost ?? 0);
        const valorPlanejado = toMoneyValue(item.plannedAmount);
        const valorTotal =
          valorPlanejado > 0
            ? valorPlanejado
            : Number((quantidade * meses * valorUnitario).toFixed(2));
        const parsedNotes = parseBudgetItemMetaNotes(item.notes);
        const selectedMetaIds =
          parsedNotes.metaIds.length > 0
            ? parsedNotes.metaIds
            : item.goalId
              ? [String(item.goalId)]
              : [];

        const mappedItem: ItemRubrica = {
          id: String(item.id),
          descricao: item.description,
          quantidade,
          meses,
          valorUnitario,
          valorTotal,
          metaId: selectedMetaIds[0],
          metaIds: selectedMetaIds,
          notes: parsedNotes.cleanedNotes,
          webs: item.webs ?? undefined,
          serviceOrder: item.serviceOrder ?? undefined,
          protocol: item.protocol ?? undefined,
          projectPeopleId: item.projectPeopleId ? String(item.projectPeopleId) : undefined,
          projectCompanyId: item.projectCompanyId ? String(item.projectCompanyId) : undefined,
          projectPartnerId: item.projectPartnerId ? String(item.projectPartnerId) : undefined,
          beneficiaryType: item.beneficiaryType ?? undefined,
          beneficiaryReferenceId: item.projectPeopleId
            ? String(item.projectPeopleId)
            : item.projectCompanyId
              ? String(item.projectCompanyId)
              : item.projectPartnerId
                ? String(item.projectPartnerId)
                : undefined,
          subitens: [],
        };

        const existing = itemsByCategory.get(item.categoryId) ?? [];
        existing.push(mappedItem);
        itemsByCategory.set(item.categoryId, existing);
      }

      for (const [categoryId, categoryItems] of itemsByCategory.entries()) {
        itemsByCategory.set(
          categoryId,
          [...categoryItems].sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR'))
        );
      }

      setRubricas((previous) => {
        const expandedById = new Map(previous.map((rubrica) => [rubrica.id, rubrica.expanded]));
        return categories.map((category) => ({
          id: String(category.id),
          codigo: category.code || `RUB-${category.id}`,
          nome: category.name,
          itens: itemsByCategory.get(category.id) ?? [],
          expanded: expandedById.get(String(category.id)) ?? true,
        }));
      });

      const projectTransfers = allTransfers.filter((transfer) => transfer.projectId === projectId);
      const transferCreatorNames = await resolveUserNamesById(
        projectTransfers.map((transfer) => transfer.createdBy)
      );

      const transfers = projectTransfers
        .map<Remanejamento>((transfer) => ({
          id: String(transfer.id),
          contratoId: String(transfer.projectId),
          itemOrigemId: String(transfer.fromItemId),
          itemDestinoId: String(transfer.toItemId),
          valor: toSafeNumber(transfer.amount),
          data: transfer.transferDate || '',
          motivo: transfer.reason || '',
          createdBy: transfer.createdBy
            ? (transferCreatorNames[transfer.createdBy] ?? `ID ${transfer.createdBy}`)
            : '-',
          createdAt: transfer.createdAt || '',
          status: normalizeTransferStatus(transfer.status),
        }))
        .sort((a, b) => b.data.localeCompare(a.data));

      setRemanejamentos(transfers);
    } catch (error) {
      setLoadError(toErrorMessage(error, 'Não foi possível carregar as rubricas.'));
      setRubricas([]);
      setMetas([]);
      setProjectPeopleOptions([]);
      setProjectCompanyOptions([]);
      setAvailablePeople([]);
      setAvailableCompanies([]);
      setRemanejamentos([]);
      setBudgetSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const remanejamentosEfetivosTabela = useMemo(() => {
    const remanejamentosComComeback = new Set(
      remanejamentos
        .map((remanejamento) => parseBudgetTransferComeback(remanejamento.motivo).originalTransferId)
        .filter((transferId): transferId is number => transferId !== null)
    );

    return remanejamentos.filter((remanejamento) => {
      const comebackInfo = parseBudgetTransferComeback(remanejamento.motivo);
      if (comebackInfo.isComeback) {
        return false;
      }

      return !remanejamentosComComeback.has(Number.parseInt(remanejamento.id, 10));
    });
  }, [remanejamentos]);

  const calcularRemanejamentosItem = (itemId: string) => {
    const debito = remanejamentosEfetivosTabela
      .filter((rem) => rem.itemOrigemId === itemId)
      .reduce((acc, rem) => acc + rem.valor, 0);

    const credito = remanejamentosEfetivosTabela
      .filter((rem) => rem.itemDestinoId === itemId)
      .reduce((acc, rem) => acc + rem.valor, 0);

    return { debito, credito };
  };

  const calcularValorFinalItem = (item: ItemRubrica) => {
    const { debito, credito } = calcularRemanejamentosItem(item.id);
    return item.valorTotal - debito + credito;
  };

  const calcularTotalRubrica = (rubrica: Rubrica) =>
    rubrica.itens.reduce((acc, item) => acc + calcularValorFinalItem(item), 0);

  const calcularTotalGeral = () =>
    rubricas.reduce((acc, rubrica) => acc + calcularTotalRubrica(rubrica), 0);

  const resolveMetaIdsForDraft = useCallback(
    (draft: Partial<ItemRubrica> | null | undefined) => {
      const metaIds =
        draft?.metaIds && draft.metaIds.length > 0
          ? draft.metaIds
          : draft?.metaId
            ? [draft.metaId]
            : [];

      return getOrderedSelectedMetaIds(metaIds, metas);
    },
    [metas]
  );

  const resolveLinkedMetas = useCallback(
    (item: ItemRubrica) => {
      const selectedMetaIds = resolveMetaIdsForDraft(item);
      return selectedMetaIds
        .map((metaId) => metas.find((meta) => meta.id === metaId) ?? null)
        .filter((meta): meta is MetaOption => meta !== null);
    },
    [metas, resolveMetaIdsForDraft]
  );

  const resolveBeneficiaryLabel = useCallback(
    (item: ItemRubrica) => {
      if (!item.beneficiaryType || !item.beneficiaryReferenceId) {
        return 'Sem vínculo';
      }

      if (item.beneficiaryType === 'person') {
        const personLabel =
          projectPeopleOptions.find((option) => option.id === item.beneficiaryReferenceId)?.label ??
          `Pessoa #${item.beneficiaryReferenceId}`;
        return `Pessoa: ${personLabel}`;
      }

      if (item.beneficiaryType === 'partner') {
        const partnerLabel =
          projectPartnerOptions.find((option) => option.id === item.beneficiaryReferenceId)?.label ??
          `Parceiro #${item.beneficiaryReferenceId}`;
        return `Parceiro: ${partnerLabel}`;
      }

      const company = projectCompanyOptions.find(
        (option) => option.id === item.beneficiaryReferenceId
      );
      if (!company) {
        return `Empresa: #${item.beneficiaryReferenceId}`;
      }

      const cnpj = formatCnpjCompact(company.cnpj);
      return `Empresa: ${company.name}${cnpj ? ` (${cnpj})` : ''}`;
    },
    [projectCompanyOptions, projectPartnerOptions, projectPeopleOptions]
  );

  const resolveProjectCompanyLabel = useCallback(
    (item: ItemRubrica) => {
      if (!item.projectCompanyId) {
        return 'Não definida';
      }

      const company = projectCompanyOptions.find((option) => option.id === item.projectCompanyId);
      if (!company) {
        return `Empresa #${item.projectCompanyId}`;
      }

      const cnpj = formatCnpjCompact(company.cnpj);
      return `${company.name}${cnpj ? ` (${cnpj})` : ''}`;
    },
    [projectCompanyOptions]
  );

  const toggleExpand = (rubricaId: string) => {
    setRubricas((current) =>
      current.map((rubrica) =>
        rubrica.id === rubricaId ? { ...rubrica, expanded: !rubrica.expanded } : rubrica
      )
    );
  };

  const openAddItemModal = (rubricaId: string) => {
    if (!ensureCanManageChildren()) return;

    setActionError(null);
    setItemFieldErrors({});
    setSavedMessage(null);
    setEditingItem(null);
    setEditForm(null);
    setItemPendingDeletion(null);
    setCreateItemAttempted(false);
    setEditItemAttempted(false);
    setNewItem(createEmptyItemDraft());
    setAddingToRubrica(rubricaId);
    setRubricas((current) =>
      current.map((rubrica) =>
        rubrica.id === rubricaId ? { ...rubrica, expanded: true } : rubrica
      )
    );
  };

  const closeAddItemModal = () => {
    setAddingToRubrica(null);
    setNewItem(createEmptyItemDraft());
    setItemFieldErrors({});
    setCreateItemAttempted(false);
  };

  const appendProjectPersonOption = (option: ProjectPersonOption) => {
    setProjectPeopleOptions((current) => {
      const next = current.filter((item) => item.id !== option.id);
      return [...next, option].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
    });
  };

  const appendProjectCompanyOption = (option: ProjectCompanyOption) => {
    setProjectCompanyOptions((current) => {
      const next = current.filter((item) => item.id !== option.id);
      return [...next, option].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
    });
  };

  const appendProjectPartnerOption = (option: ProjectPartnerOption) => {
    setProjectPartnerOptions((current) => {
      const next = current.filter((item) => item.id !== option.id);
      return [...next, option].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
    });
  };

  const handleLinkExistingPartner = async () => {
    if (!selectedPartnerToLink) {
      setLinkPartnerFieldError('Selecione um parceiro para vincular.');
      setLinkPartnerModalError('Selecione um parceiro para vincular.');
      return;
    }
    try {
      setIsSubmitting(true);
      setLinkPartnerFieldError(null);
      setLinkPartnerModalError(null);
      const actorUserId = await requireCurrentUserId();
      const selectedPartner =
        availablePartners.find((p) => String(p.id) === selectedPartnerToLink) ?? null;
      const partnerLabel = selectedPartner?.tradeName || selectedPartner?.name || `Parceiro #${selectedPartnerToLink}`;
      const res = await fetch(`/api/backend/contracts/${projectId}/parceiros`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, partnerId: Number(selectedPartnerToLink), createdBy: actorUserId }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        throw new Error(err.message ?? 'Não foi possível vincular o parceiro.');
      }
      const linked = (await res.json()) as ProjectPartnerData;
      appendProjectPartnerOption({
        id: String(linked.id),
        label: partnerLabel,
        partnerType: selectedPartner?.partnersType ?? 'IF',
      });
      applyBeneficiarySelection('partner', String(linked.id));
      setAvailablePartners((current) => current.filter((p) => String(p.id) !== selectedPartnerToLink));
      setShowLinkPartnerModal(false);
      setSelectedPartnerToLink(undefined);
      showSavedMessage('Parceiro vinculado ao item. Revise os dados e salve a rubrica quando concluir.');
    } catch (error) {
      setLinkPartnerModalError(toErrorMessage(error, 'Não foi possível vincular o parceiro.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkExistingPartnerForEdit = async () => {
    if (!selectedPartnerToLink) {
      setLinkPartnerFieldError('Selecione um parceiro para vincular.');
      setLinkPartnerModalError('Selecione um parceiro para vincular.');
      return;
    }
    try {
      setIsSubmitting(true);
      setLinkPartnerFieldError(null);
      setLinkPartnerModalError(null);
      const actorUserId = await requireCurrentUserId();
      const selectedPartner =
        availablePartners.find((p) => String(p.id) === selectedPartnerToLink) ?? null;
      const partnerLabel = selectedPartner?.tradeName || selectedPartner?.name || `Parceiro #${selectedPartnerToLink}`;
      const res = await fetch(`/api/backend/contracts/${projectId}/parceiros`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, partnerId: Number(selectedPartnerToLink), createdBy: actorUserId }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        throw new Error(err.message ?? 'Não foi possível vincular o parceiro.');
      }
      const linked = (await res.json()) as ProjectPartnerData;
      appendProjectPartnerOption({
        id: String(linked.id),
        label: partnerLabel,
        partnerType: selectedPartner?.partnersType ?? 'IF',
      });
      applyBeneficiarySelectionToEditForm('partner', String(linked.id));
      setAvailablePartners((current) => current.filter((p) => String(p.id) !== selectedPartnerToLink));
      setShowLinkPartnerModal(false);
      setSelectedPartnerToLink(undefined);
      showSavedMessage('Parceiro vinculado ao item. Revise os dados e salve a rubrica quando concluir.');
    } catch (error) {
      setLinkPartnerModalError(toErrorMessage(error, 'Não foi possível vincular o parceiro.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAndLinkPartnerInternal = async (
    formData: Parameters<typeof mapParceiroFormToPartnerRequestDTO>[0],
    applySelection: (type: BeneficiaryType, id: string) => void
  ) => {
    const actorUserId = await requireCurrentUserId();
    const payload = mapParceiroFormToPartnerRequestDTO(formData);
    const created = await createPartner({ ...payload, createdBy: actorUserId });
    const res = await fetch(`/api/backend/contracts/${projectId}/parceiros`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, partnerId: created.id, createdBy: actorUserId }),
    });
    if (!res.ok) {
      const err = (await res.json()) as { message?: string };
      throw new Error(err.message ?? 'Não foi possível vincular o parceiro ao contrato.');
    }
    const linked = (await res.json()) as ProjectPartnerData;
    const partnerLabel = created.tradeName?.trim() || created.name;
    appendProjectPartnerOption({
      id: String(linked.id),
      label: partnerLabel,
      partnerType: created.partnersType,
    });
    applySelection('partner', String(linked.id));
    setShowCreatePartnerModal(false);
    showSavedMessage('Parceiro criado e vinculado ao item. Revise os dados e salve a rubrica quando concluir.');
  };

  const handleCreateAndLinkPartner = async (formData: Parameters<typeof mapParceiroFormToPartnerRequestDTO>[0]) => {
    await handleCreateAndLinkPartnerInternal(formData, applyBeneficiarySelection);
  };

  const handleCreateAndLinkPartnerForEdit = async (formData: Parameters<typeof mapParceiroFormToPartnerRequestDTO>[0]) => {
    await handleCreateAndLinkPartnerInternal(formData, applyBeneficiarySelectionToEditForm);
  };

  const applyBeneficiarySelection = (type: BeneficiaryType, referenceId: string) => {
    setNewItem((current) => ({
      ...current,
      projectPeopleId: type === 'person' ? referenceId : current.projectPeopleId,
      projectCompanyId: type === 'company' ? referenceId : current.projectCompanyId,
      projectPartnerId: type === 'partner' ? referenceId : current.projectPartnerId,
      beneficiaryType: type,
      beneficiaryReferenceId: referenceId,
      unlinkedItem: false,
    }));
  };

  const applyBeneficiarySelectionToEditForm = (type: BeneficiaryType, referenceId: string) => {
    setEditForm((current) =>
      current
        ? {
            ...current,
            projectPeopleId: type === 'person' ? referenceId : current.projectPeopleId,
            projectCompanyId: type === 'company' ? referenceId : current.projectCompanyId,
            projectPartnerId: type === 'partner' ? referenceId : current.projectPartnerId,
            beneficiaryType: type,
            beneficiaryReferenceId: referenceId,
            unlinkedItem: false,
          }
        : current
    );
  };

  const handleLinkExistingPerson = async () => {
    if (!selectedPersonToLink) {
      setLinkPersonFieldError('Selecione uma pessoa para vincular.');
      setLinkPersonModalError('Selecione uma pessoa para vincular.');
      return;
    }
    try {
      setIsSubmitting(true);
      setLinkPersonFieldError(null);
      setLinkPersonModalError(null);
      const actorUserId = await requireCurrentUserId();
      const draftItemTotal = buildDraftItemTotal(newItem);
      const selectedPerson =
        availablePeople.find((person) => String(person.id) === selectedPersonToLink) ?? null;
      const personLabel = selectedPerson?.fullName ?? `Pessoa #${selectedPersonToLink}`;
      const linked = await createProjectPeople({
        projectId,
        personId: Number(selectedPersonToLink),
        baseAmount: draftItemTotal > 0 ? draftItemTotal : undefined,
        createdBy: actorUserId,
      });

      appendProjectPersonOption({
        id: String(linked.id),
        label: personLabel,
        baseAmount: draftItemTotal > 0 ? draftItemTotal : undefined,
      });
      applyBeneficiarySelection('person', String(linked.id));
      setAvailablePeople((current) =>
        current.filter((person) => String(person.id) !== selectedPersonToLink)
      );
      setShowLinkPersonModal(false);
      setSelectedPersonToLink(undefined);
      setLinkPersonFieldError(null);
      showSavedMessage('Pessoa vinculada ao item. Revise os dados e salve a rubrica quando concluir.');
    } catch (error) {
      setLinkPersonModalError(toErrorMessage(error, 'Não foi possível vincular a pessoa.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkExistingPersonForEdit = async () => {
    if (!selectedPersonToLink) {
      setLinkPersonFieldError('Selecione uma pessoa para vincular.');
      setLinkPersonModalError('Selecione uma pessoa para vincular.');
      return;
    }
    try {
      setIsSubmitting(true);
      setLinkPersonFieldError(null);
      setLinkPersonModalError(null);
      const actorUserId = await requireCurrentUserId();
      const draftItemTotal = buildDraftItemTotal(editForm ?? {});
      const selectedPerson =
        availablePeople.find((person) => String(person.id) === selectedPersonToLink) ?? null;
      const personLabel = selectedPerson?.fullName ?? `Pessoa #${selectedPersonToLink}`;
      const linked = await createProjectPeople({
        projectId,
        personId: Number(selectedPersonToLink),
        baseAmount: draftItemTotal > 0 ? draftItemTotal : undefined,
        createdBy: actorUserId,
      });

      appendProjectPersonOption({
        id: String(linked.id),
        label: personLabel,
        baseAmount: draftItemTotal > 0 ? draftItemTotal : undefined,
      });
      applyBeneficiarySelectionToEditForm('person', String(linked.id));
      setAvailablePeople((current) =>
        current.filter((person) => String(person.id) !== selectedPersonToLink)
      );
      setShowLinkPersonModal(false);
      setSelectedPersonToLink(undefined);
      setLinkPersonFieldError(null);
      showSavedMessage('Pessoa vinculada ao item. Revise os dados e salve a rubrica quando concluir.');
    } catch (error) {
      setLinkPersonModalError(toErrorMessage(error, 'Não foi possível vincular a pessoa.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkExistingCompany = async () => {
    if (!selectedCompanyToLink) {
      setLinkCompanyFieldError('Selecione uma empresa para vincular.');
      setLinkCompanyModalError('Selecione uma empresa para vincular.');
      return;
    }
    try {
      setIsSubmitting(true);
      setLinkCompanyFieldError(null);
      setLinkCompanyModalError(null);
      const draftItemTotal = buildDraftItemTotal(newItem);
      const actorUserId = await requireCurrentUserId();
      const selectedCompany =
        availableCompanies.find((company) => String(company.id) === selectedCompanyToLink) ?? null;
      const companyName =
        selectedCompany?.tradeName || selectedCompany?.name || `Empresa #${selectedCompanyToLink}`;
      const linked = await createProjectCompany({
        projectId,
        companyId: Number(selectedCompanyToLink),
        totalValue: draftItemTotal > 0 ? draftItemTotal : undefined,
        status: RUBRICA_DEFAULT_COMPANY_STATUS,
        createdBy: actorUserId,
      });

      appendProjectCompanyOption({
        id: String(linked.id),
        label: [
          companyName,
          selectedCompany?.cnpj ? `CNPJ ${selectedCompany.cnpj}` : 'CNPJ não informado',
          formatContractingStatus(RUBRICA_DEFAULT_COMPANY_STATUS),
          draftItemTotal > 0 ? `Saldo ${formatCurrency(draftItemTotal)}` : null,
        ]
          .filter(Boolean)
          .join(' - '),
        name: companyName,
        cnpj: selectedCompany?.cnpj ?? null,
        status: RUBRICA_DEFAULT_COMPANY_STATUS,
        availableBalance: draftItemTotal > 0 ? draftItemTotal : null,
        totalValue: draftItemTotal > 0 ? draftItemTotal : null,
      });
      applyBeneficiarySelection('company', String(linked.id));
      setAvailableCompanies((current) =>
        current.filter((company) => String(company.id) !== selectedCompanyToLink)
      );
      setShowLinkCompanyModal(false);
      setSelectedCompanyToLink(undefined);
      setLinkCompanyFieldError(null);
      showSavedMessage('Empresa vinculada ao item. Revise os dados e salve a rubrica quando concluir.');
    } catch (error) {
      setLinkCompanyModalError(toErrorMessage(error, 'Não foi possível vincular a empresa.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkExistingCompanyForEdit = async () => {
    if (!selectedCompanyToLink) {
      setLinkCompanyFieldError('Selecione uma empresa para vincular.');
      setLinkCompanyModalError('Selecione uma empresa para vincular.');
      return;
    }
    try {
      setIsSubmitting(true);
      setLinkCompanyFieldError(null);
      setLinkCompanyModalError(null);
      const draftItemTotal = buildDraftItemTotal(editForm ?? {});
      const actorUserId = await requireCurrentUserId();
      const selectedCompany =
        availableCompanies.find((company) => String(company.id) === selectedCompanyToLink) ?? null;
      const companyName =
        selectedCompany?.tradeName || selectedCompany?.name || `Empresa #${selectedCompanyToLink}`;
      const linked = await createProjectCompany({
        projectId,
        companyId: Number(selectedCompanyToLink),
        totalValue: draftItemTotal > 0 ? draftItemTotal : undefined,
        status: RUBRICA_DEFAULT_COMPANY_STATUS,
        createdBy: actorUserId,
      });

      appendProjectCompanyOption({
        id: String(linked.id),
        label: [
          companyName,
          selectedCompany?.cnpj ? `CNPJ ${selectedCompany.cnpj}` : 'CNPJ não informado',
          formatContractingStatus(RUBRICA_DEFAULT_COMPANY_STATUS),
          draftItemTotal > 0 ? `Saldo ${formatCurrency(draftItemTotal)}` : null,
        ]
          .filter(Boolean)
          .join(' - '),
        name: companyName,
        cnpj: selectedCompany?.cnpj ?? null,
        status: RUBRICA_DEFAULT_COMPANY_STATUS,
        availableBalance: draftItemTotal > 0 ? draftItemTotal : null,
        totalValue: draftItemTotal > 0 ? draftItemTotal : null,
      });
      applyBeneficiarySelectionToEditForm('company', String(linked.id));
      setAvailableCompanies((current) =>
        current.filter((company) => String(company.id) !== selectedCompanyToLink)
      );
      setShowLinkCompanyModal(false);
      setSelectedCompanyToLink(undefined);
      setLinkCompanyFieldError(null);
      showSavedMessage('Empresa vinculada ao item. Revise os dados e salve a rubrica quando concluir.');
    } catch (error) {
      setLinkCompanyModalError(toErrorMessage(error, 'Não foi possível vincular a empresa.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAndLinkPerson = async () => {
    if (!hasRequiredMemberFields(newPersonForm)) {
      setCreatePersonFieldErrors({
        nome: newPersonForm.nome.trim() ? '' : 'Informe o nome da pessoa.',
        status: newPersonForm.status ? '' : 'Informe o status da pessoa.',
      });
      setCreatePersonModalError('Preencha os campos obrigatórios da pessoa (nome e status) antes de salvar.');
      return;
    }

    if (newPersonForm.cpf.trim()) {
      const validation = validateCPFComplete(newPersonForm.cpf);
      if (!validation.isValid) {
        setNewPersonCpfError(validation.errorMessage);
        return;
      }
    }

    if (newPersonForm.telefone.trim()) {
      const validation = validatePhoneComplete(newPersonForm.telefone);
      if (!validation.isValid) {
        setNewPersonPhoneError(validation.errorMessage);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setCreatePersonFieldErrors({});
      setCreatePersonModalError(null);
      const draftItemTotal = buildDraftItemTotal(newItem);
      const actorUserId = await requireCurrentUserId();
      const cpf = newPersonForm.cpf ? unformatCPF(newPersonForm.cpf) : undefined;
      const phone = newPersonForm.telefone ? unformatPhone(newPersonForm.telefone) : undefined;
      const peoplePayload = {
        fullName: newPersonForm.nome.trim(),
        cpf: cpf || undefined,
        email: toOptional(newPersonForm.email),
        phone: toOptional(phone),
        birthDate: toOptional(newPersonForm.birthDate),
        address: toOptional(newPersonForm.endereco),
        city: toOptional(newPersonForm.city),
        state: toOptional(newPersonForm.state)?.toUpperCase(),
        notes: toOptional(newPersonForm.notes),
      };

      const person = await createPeople(peoplePayload);
      const linked = await createProjectPeople({
        projectId,
        personId: person.id,
        role: papelToRole(newPersonForm.papel),
        workloadHours: newPersonForm.cargaHoraria,
        institutionalLink: toOptional(newPersonForm.vinculo),
        contractType: newPersonForm.contractType || undefined,
        startDate: toOptional(newPersonForm.startDate),
        endDate: toOptional(newPersonForm.endDate),
        status: newPersonForm.status as StatusProjectPeopleEnum,
        baseAmount:
          typeof newPersonForm.baseAmount === 'number'
            ? newPersonForm.baseAmount
            : draftItemTotal > 0
              ? draftItemTotal
              : undefined,
        notes: toOptional(newPersonForm.notes),
        createdBy: actorUserId,
      });

      if (newPersonAvatarFile) {
        const uploaded = await uploadDocument({
          file: newPersonAvatarFile,
          ownerType: 'PEOPLE',
          ownerId: person.id,
          category: 'FOTO_PERFIL',
        });

        await updatePeople(person.id, {
          ...peoplePayload,
          avatarUrl: uploaded.id,
        });
      }

      appendProjectPersonOption({
        id: String(linked.id),
        label: newPersonForm.nome.trim(),
        baseAmount:
          typeof newPersonForm.baseAmount === 'number'
            ? newPersonForm.baseAmount
            : draftItemTotal > 0
              ? draftItemTotal
              : undefined,
      });
      applyBeneficiarySelection('person', String(linked.id));
      setShowCreatePersonModal(false);
      setNewPersonForm(defaultMemberFormData());
      setNewPersonAvatarFile(null);
      setNewPersonCpfError('');
      setNewPersonPhoneError('');
      setCreatePersonFieldErrors({});
      showSavedMessage('Pessoa criada e vinculada ao item. Revise os dados e salve a rubrica quando concluir.');
    } catch (error) {
      setCreatePersonModalError(
        toErrorMessage(error, 'Não foi possível cadastrar e vincular a pessoa.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAndLinkPersonForEdit = async () => {
    if (!hasRequiredMemberFields(newPersonForm)) {
      setCreatePersonFieldErrors({
        nome: newPersonForm.nome.trim() ? '' : 'Informe o nome da pessoa.',
        status: newPersonForm.status ? '' : 'Informe o status da pessoa.',
      });
      setCreatePersonModalError('Preencha os campos obrigatórios da pessoa (nome e status) antes de salvar.');
      return;
    }

    if (newPersonForm.cpf.trim()) {
      const validation = validateCPFComplete(newPersonForm.cpf);
      if (!validation.isValid) {
        setNewPersonCpfError(validation.errorMessage);
        return;
      }
    }

    if (newPersonForm.telefone.trim()) {
      const validation = validatePhoneComplete(newPersonForm.telefone);
      if (!validation.isValid) {
        setNewPersonPhoneError(validation.errorMessage);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setCreatePersonFieldErrors({});
      setCreatePersonModalError(null);
      const draftItemTotal = buildDraftItemTotal(editForm ?? {});
      const actorUserId = await requireCurrentUserId();
      const cpf = newPersonForm.cpf ? unformatCPF(newPersonForm.cpf) : undefined;
      const phone = newPersonForm.telefone ? unformatPhone(newPersonForm.telefone) : undefined;
      const peoplePayload = {
        fullName: newPersonForm.nome.trim(),
        cpf: cpf || undefined,
        email: toOptional(newPersonForm.email),
        phone: toOptional(phone),
        birthDate: toOptional(newPersonForm.birthDate),
        address: toOptional(newPersonForm.endereco),
        city: toOptional(newPersonForm.city),
        state: toOptional(newPersonForm.state)?.toUpperCase(),
        notes: toOptional(newPersonForm.notes),
      };

      const person = await createPeople(peoplePayload);
      const linked = await createProjectPeople({
        projectId,
        personId: person.id,
        role: papelToRole(newPersonForm.papel),
        workloadHours: newPersonForm.cargaHoraria,
        institutionalLink: toOptional(newPersonForm.vinculo),
        contractType: newPersonForm.contractType || undefined,
        startDate: toOptional(newPersonForm.startDate),
        endDate: toOptional(newPersonForm.endDate),
        status: newPersonForm.status as StatusProjectPeopleEnum,
        baseAmount:
          typeof newPersonForm.baseAmount === 'number'
            ? newPersonForm.baseAmount
            : draftItemTotal > 0
              ? draftItemTotal
              : undefined,
        notes: toOptional(newPersonForm.notes),
        createdBy: actorUserId,
      });

      if (newPersonAvatarFile) {
        const uploaded = await uploadDocument({
          file: newPersonAvatarFile,
          ownerType: 'PEOPLE',
          ownerId: person.id,
          category: 'FOTO_PERFIL',
        });

        await updatePeople(person.id, {
          ...peoplePayload,
          avatarUrl: uploaded.id,
        });
      }

      appendProjectPersonOption({
        id: String(linked.id),
        label: newPersonForm.nome.trim(),
        baseAmount:
          typeof newPersonForm.baseAmount === 'number'
            ? newPersonForm.baseAmount
            : draftItemTotal > 0
              ? draftItemTotal
              : undefined,
      });
      applyBeneficiarySelectionToEditForm('person', String(linked.id));
      setShowCreatePersonModal(false);
      setNewPersonForm(defaultMemberFormData());
      setNewPersonAvatarFile(null);
      setNewPersonCpfError('');
      setNewPersonPhoneError('');
      setCreatePersonFieldErrors({});
      showSavedMessage('Pessoa criada e vinculada ao item. Revise os dados e salve a rubrica quando concluir.');
    } catch (error) {
      setCreatePersonModalError(
        toErrorMessage(error, 'Não foi possível cadastrar e vincular a pessoa.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAndLinkCompany = async () => {
    if (!hasRequiredCompanyFields(newCompanyForm)) {
      setCreateCompanyModalError('Preencha os campos obrigatórios da empresa (razão social, nome fantasia, CNPJ e status).');
      return;
    }
    const cnpjDigits = onlyDigits(newCompanyForm.cnpj);
    if (!newCompanyForm.razaoSocial?.trim() || !newCompanyForm.status) {
      setCreateCompanyFieldErrors({
        razaoSocial: newCompanyForm.razaoSocial?.trim() ? '' : 'Informe a razão social.',
        status: newCompanyForm.status ? '' : 'Informe o status do contrato.',
      });
      setCreateCompanyModalError('Preencha os campos obrigatórios da empresa (razão social, nome fantasia, CNPJ e status).');
      return;
    }
    if (cnpjDigits.length !== 14) {
      setCreateCompanyFieldErrors({
        cnpj: 'Informe um CNPJ válido com 14 dígitos.',
      });
      setCreateCompanyModalError('Informe um CNPJ válido com 14 dígitos.');
      return;
    }
    const draftItemTotal = buildDraftItemTotal(newItem);
    const totalValueForProjectCompany =
      typeof newCompanyForm.valorContrato === 'number' && newCompanyForm.valorContrato > 0
        ? newCompanyForm.valorContrato
        : draftItemTotal > 0
          ? draftItemTotal
          : undefined;
    try {
      setIsSubmitting(true);
      setCreateCompanyFieldErrors({});
      setCreateCompanyModalError(null);
      const actorUserId = await requireCurrentUserId();
      const company = await createCompany({
        name: newCompanyForm.razaoSocial!.trim(),
        tradeName: newCompanyForm.nomeFantasia!.trim(),
        cnpj: cnpjDigits,
        email: toOptional(newCompanyForm.email),
        phone: toOptional(onlyDigits(newCompanyForm.telefone)),
        address: toOptional(newCompanyForm.endereco),
        city: toOptional(newCompanyForm.cidade),
        state: toOptional(newCompanyForm.uf)?.toUpperCase(),
        responsiblePersonId: newCompanyForm.responsavelPersonId
          ? Number(newCompanyForm.responsavelPersonId)
          : undefined,
        createdBy: actorUserId,
      });
      const linked = await createProjectCompany({
        projectId,
        companyId: company.id,
        serviceType: toOptional(newCompanyForm.tipoServico),
        totalValue: totalValueForProjectCompany,
        startDate: toOptional(newCompanyForm.dataInicio),
        endDate: toOptional(newCompanyForm.dataFim),
        notes: toOptional(newCompanyForm.observacao),
        isIncubated: newCompanyForm.tipoEmpresa === 'INCUBADA',
        status: newCompanyForm.status as ContractingStatusEnum,
        createdBy: actorUserId,
      });
      const companyName = newCompanyForm.nomeFantasia!.trim() || newCompanyForm.razaoSocial!.trim();
      const companyStatus = newCompanyForm.status || RUBRICA_DEFAULT_COMPANY_STATUS;
      const formattedCnpj = formatCnpjCompact(cnpjDigits);
      appendProjectCompanyOption({
        id: String(linked.id),
        label: [
          companyName,
          formattedCnpj ? `CNPJ ${formattedCnpj}` : 'CNPJ não informado',
          formatContractingStatus(companyStatus),
          totalValueForProjectCompany != null ? `Saldo ${formatCurrency(totalValueForProjectCompany)}` : null,
        ]
          .filter(Boolean)
          .join(' - '),
        name: companyName,
        cnpj: formattedCnpj,
        status: companyStatus,
        availableBalance: totalValueForProjectCompany ?? null,
        totalValue: totalValueForProjectCompany ?? null,
      });
      applyBeneficiarySelection('company', String(linked.id));
      setShowCreateCompanyModal(false);
      setNewCompanyForm(createEmptyCompanyForm());
      setCreateCompanyFieldErrors({});
      showSavedMessage('Empresa criada e vinculada ao item. Revise os dados e salve a rubrica quando concluir.');
    } catch (error) {
      setCreateCompanyModalError(
        toErrorMessage(error, 'Não foi possível cadastrar e vincular a empresa.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAndLinkCompanyForEdit = async () => {
    if (!hasRequiredCompanyFields(newCompanyForm)) {
      setCreateCompanyModalError('Preencha os campos obrigatórios da empresa (razão social, nome fantasia, CNPJ e status).');
      return;
    }
    const cnpjDigits = onlyDigits(newCompanyForm.cnpj);
    if (!newCompanyForm.razaoSocial?.trim() || !newCompanyForm.status) {
      setCreateCompanyFieldErrors({
        razaoSocial: newCompanyForm.razaoSocial?.trim() ? '' : 'Informe a razão social.',
        status: newCompanyForm.status ? '' : 'Informe o status do contrato.',
      });
      setCreateCompanyModalError('Preencha os campos obrigatórios da empresa (razão social, nome fantasia, CNPJ e status).');
      return;
    }
    if (cnpjDigits.length !== 14) {
      setCreateCompanyFieldErrors({
        cnpj: 'Informe um CNPJ válido com 14 dígitos.',
      });
      setCreateCompanyModalError('Informe um CNPJ válido com 14 dígitos.');
      return;
    }
    const draftItemTotal = buildDraftItemTotal(editForm ?? {});
    const totalValueForProjectCompany =
      typeof newCompanyForm.valorContrato === 'number' && newCompanyForm.valorContrato > 0
        ? newCompanyForm.valorContrato
        : draftItemTotal > 0
          ? draftItemTotal
          : undefined;
    try {
      setIsSubmitting(true);
      setCreateCompanyFieldErrors({});
      setCreateCompanyModalError(null);
      const actorUserId = await requireCurrentUserId();
      const company = await createCompany({
        name: newCompanyForm.razaoSocial!.trim(),
        tradeName: newCompanyForm.nomeFantasia!.trim(),
        cnpj: cnpjDigits,
        email: toOptional(newCompanyForm.email),
        phone: toOptional(onlyDigits(newCompanyForm.telefone)),
        address: toOptional(newCompanyForm.endereco),
        city: toOptional(newCompanyForm.cidade),
        state: toOptional(newCompanyForm.uf)?.toUpperCase(),
        responsiblePersonId: newCompanyForm.responsavelPersonId
          ? Number(newCompanyForm.responsavelPersonId)
          : undefined,
        createdBy: actorUserId,
      });
      const linked = await createProjectCompany({
        projectId,
        companyId: company.id,
        serviceType: toOptional(newCompanyForm.tipoServico),
        totalValue: totalValueForProjectCompany,
        startDate: toOptional(newCompanyForm.dataInicio),
        endDate: toOptional(newCompanyForm.dataFim),
        notes: toOptional(newCompanyForm.observacao),
        isIncubated: newCompanyForm.tipoEmpresa === 'INCUBADA',
        status: newCompanyForm.status as ContractingStatusEnum,
        createdBy: actorUserId,
      });
      const companyName = newCompanyForm.nomeFantasia!.trim() || newCompanyForm.razaoSocial!.trim();
      const companyStatus = newCompanyForm.status || RUBRICA_DEFAULT_COMPANY_STATUS;
      const formattedCnpj = formatCnpjCompact(cnpjDigits);
      appendProjectCompanyOption({
        id: String(linked.id),
        label: [
          companyName,
          formattedCnpj ? `CNPJ ${formattedCnpj}` : 'CNPJ não informado',
          formatContractingStatus(companyStatus),
          totalValueForProjectCompany != null ? `Saldo ${formatCurrency(totalValueForProjectCompany)}` : null,
        ]
          .filter(Boolean)
          .join(' - '),
        name: companyName,
        cnpj: formattedCnpj,
        status: companyStatus,
        availableBalance: totalValueForProjectCompany ?? null,
        totalValue: totalValueForProjectCompany ?? null,
      });
      applyBeneficiarySelectionToEditForm('company', String(linked.id));
      setShowCreateCompanyModal(false);
      setNewCompanyForm(createEmptyCompanyForm());
      setCreateCompanyFieldErrors({});
      showSavedMessage('Empresa criada e vinculada ao item. Revise os dados e salve a rubrica quando concluir.');
    } catch (error) {
      setCreateCompanyModalError(
        toErrorMessage(error, 'Não foi possível cadastrar e vincular a empresa.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddItem = async (rubricaId: string) => {
    if (!ensureCanManageChildren()) return;
    if (!newItem.descricao?.trim()) return;
    if (!isPersistedId(rubricaId)) {
      setActionError('Rubrica inválida para adicionar o item.');
      return;
    }

    if (newItem.quantidade == null || newItem.meses == null) {
      setActionError('Informe quantidade e meses antes de salvar o item.');
      return;
    }
    if (!newItem.unlinkedItem && newItem.beneficiaryType && !newItem.beneficiaryReferenceId) {
      setActionError('Selecione o beneficiário ou marque "Item de rúbrica sem vínculo".');
      return;
    }

    const quantidade = toPositiveInt(newItem.quantidade, 1);
    const meses = toPositiveInt(newItem.meses, 1);
    const valorUnitario = toMoneyValue(newItem.valorUnitario);
    if (valorUnitario <= 0) {
      setActionError('Informe um valor unitário maior que zero.');
      return;
    }
    const valorTotal = Number((quantidade * meses * valorUnitario).toFixed(2));
    const selectedMetaIds = resolveMetaIdsForDraft(newItem);
    const selectedProjectCompanyId =
      !newItem.unlinkedItem && newItem.beneficiaryType === 'company'
        ? (newItem.projectCompanyId ?? newItem.beneficiaryReferenceId)
        : undefined;
    const selectedCompany =
      selectedProjectCompanyId
        ? projectCompanyOptions.find((option) => option.id === selectedProjectCompanyId)
        : null;

    setIsSubmitting(true);
    setActionError(null);
    setItemFieldErrors({});
    setSavedMessage(null);

    try {
      const actorUserId = await requireCurrentUserId();
      const basePayload = {
        categoryId: toPersistedId(rubricaId),
        description: newItem.descricao.trim(),
        quantity: quantidade,
        months: meses,
        unitCost: valorUnitario,
        plannedAmount: valorTotal,
        executedAmount: 0,
        goalId: selectedMetaIds[0] ? toPersistedId(selectedMetaIds[0]) : null,
        projectPeopleId:
          !newItem.unlinkedItem && newItem.projectPeopleId
            ? toPersistedId(newItem.projectPeopleId)
            : null,
        projectCompanyId:
          !newItem.unlinkedItem && newItem.projectCompanyId
            ? toPersistedId(newItem.projectCompanyId)
            : null,
        projectPartnerId:
          !newItem.unlinkedItem && newItem.beneficiaryType === 'partner' && newItem.projectPartnerId
            ? toPersistedId(newItem.projectPartnerId)
            : null,
        notes: buildBudgetItemNotes(newItem.notes, selectedMetaIds),
        webs: toOptional(newItem.webs),
        serviceOrder: toOptional(newItem.serviceOrder),
        protocol: toOptional(newItem.protocol),
        createdBy: actorUserId,
      };

      const selectedProjectPeopleId =
        !newItem.unlinkedItem && newItem.beneficiaryType === 'person'
          ? (newItem.projectPeopleId ?? newItem.beneficiaryReferenceId)
          : undefined;
      const selectedPerson =
        selectedProjectPeopleId
          ? projectPeopleOptions.find((option) => option.id === selectedProjectPeopleId)
          : null;

      if (selectedPerson && selectedProjectPeopleId && isPersistedId(selectedProjectPeopleId)) {
        const currentBaseAmount =
          typeof selectedPerson.baseAmount === 'number' ? selectedPerson.baseAmount : 0;
        const nextBaseAmount = Number((Math.max(0, currentBaseAmount) + valorTotal).toFixed(2));
        await updateProjectPeople(toPersistedId(selectedProjectPeopleId), {
          baseAmount: nextBaseAmount,
          updatedBy: actorUserId,
        });
      }

      if (selectedProjectCompanyId && isPersistedId(selectedProjectCompanyId)) {
        const currentTotalValue =
          selectedCompany && typeof selectedCompany.totalValue === 'number'
            ? selectedCompany.totalValue
            : 0;
        const nextTotalValue = Number((Math.max(0, currentTotalValue) + valorTotal).toFixed(2));
        await updateProjectCompany(toPersistedId(selectedProjectCompanyId), {
          totalValue: nextTotalValue,
          updatedBy: actorUserId,
        });
      }

      const createdItem = await createBudgetItem(basePayload);
      if (
        !newItem.unlinkedItem &&
        newItem.beneficiaryType &&
        newItem.beneficiaryReferenceId
      ) {
        await assignBudgetItemBeneficiary(createdItem.id, {
          beneficiaryType: newItem.beneficiaryType,
          referenceId: toPersistedId(newItem.beneficiaryReferenceId),
          contractedAmount: valorTotal,
        });
      }

      await loadData();
      closeAddItemModal();
      if (selectedMetaIds.length > 1) {
        showSavedMessage(
          areAllMetasSelected(selectedMetaIds, metas)
            ? `Item adicionado com vínculo a todas as metas (${selectedMetaIds.length}).`
            : `Item adicionado com vínculo a ${selectedMetaIds.length} metas.`
        );
      } else {
        showSavedMessage('Item adicionado com sucesso.');
      }
    } catch (error) {
      captureItemFieldErrors(error);
      const conflictMessage = extractCriticalBeneficiaryConflictMessage(error);
      if (conflictMessage) {
        setCriticalConflictMessage(conflictMessage);
        setActionError(null);
      } else {
        setActionError(toErrorMessage(error, 'Não foi possível adicionar o item.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (item: ItemRubrica) => {
    if (!ensureCanManageChildren()) return;
    setActionError(null);
    setItemFieldErrors({});
    setSavedMessage(null);
    setEditingItem(item.id);
    setAddingToRubrica(null);
    setItemPendingDeletion(null);
    setEditItemAttempted(false);
    setEditForm({
      ...item,
      metaIds: resolveMetaIdsForDraft(item),
      unlinkedItem: !item.beneficiaryType || !item.beneficiaryReferenceId,
    });
  };

  const handleSaveEdit = async (rubricaId: string) => {
    if (!ensureCanManageChildren()) return;
    if (!editForm || !editingItem) return;
    if (!editForm.descricao?.trim()) {
      setActionError('Informe a descrição do item.');
      return;
    }
    if (!isPersistedId(editingItem) || !isPersistedId(rubricaId)) {
      setActionError('Item ou rubrica inválido para atualizar.');
      return;
    }

    if (editForm.quantidade == null || editForm.meses == null) {
      setActionError('Informe quantidade e meses antes de salvar o item.');
      return;
    }
    if (!editForm.unlinkedItem && editForm.beneficiaryType && !editForm.beneficiaryReferenceId) {
      setActionError('Selecione o beneficiário ou marque "Item de rúbrica sem vínculo".');
      return;
    }

    const quantidade = toPositiveInt(editForm.quantidade, 1);
    const meses = toPositiveInt(editForm.meses, 1);
    const valorUnitario = toMoneyValue(editForm.valorUnitario);
    if (valorUnitario <= 0) {
      setActionError('Informe um valor unitário maior que zero.');
      return;
    }
    const valorTotal = Number((quantidade * meses * valorUnitario).toFixed(2));
    const selectedMetaIds = resolveMetaIdsForDraft(editForm);
    const hadBeneficiaryBefore = Boolean(
      originalEditingItem?.beneficiaryType && originalEditingItem?.beneficiaryReferenceId
    );
    const shouldBeUnlinked =
      Boolean(editForm.unlinkedItem) ||
      !editForm.beneficiaryType ||
      !editForm.beneficiaryReferenceId;

    setIsSubmitting(true);
    setActionError(null);
    setItemFieldErrors({});
    setSavedMessage(null);

    try {
      const actorUserId = await requireCurrentUserId();
      await updateBudgetItem(toPersistedId(editingItem), {
        categoryId: toPersistedId(rubricaId),
        description: editForm.descricao.trim(),
        quantity: quantidade,
        months: meses,
        unitCost: valorUnitario,
        plannedAmount: valorTotal,
        goalId: selectedMetaIds[0] ? toPersistedId(selectedMetaIds[0]) : null,
        projectPeopleId:
          !editForm.unlinkedItem && editForm.projectPeopleId
            ? toPersistedId(editForm.projectPeopleId)
            : null,
        projectCompanyId:
          !editForm.unlinkedItem && editForm.projectCompanyId
            ? toPersistedId(editForm.projectCompanyId)
            : null,
        projectPartnerId:
          !editForm.unlinkedItem && editForm.beneficiaryType === 'partner' && editForm.projectPartnerId
            ? toPersistedId(editForm.projectPartnerId)
            : null,
        notes: buildBudgetItemNotes(editForm.notes, selectedMetaIds),
        webs: toOptional(editForm.webs),
        serviceOrder: toOptional(editForm.serviceOrder),
        protocol: toOptional(editForm.protocol),
        updatedBy: actorUserId,
      });

      if (shouldBeUnlinked) {
        if (hadBeneficiaryBefore) {
          await removeBudgetItemBeneficiary(toPersistedId(editingItem));
        }
      } else if (editForm.beneficiaryType && editForm.beneficiaryReferenceId) {
        await assignBudgetItemBeneficiary(toPersistedId(editingItem), {
          beneficiaryType: editForm.beneficiaryType,
          referenceId: toPersistedId(editForm.beneficiaryReferenceId),
          contractedAmount: valorTotal,
        });
      }

      await loadData();
      setEditingItem(null);
      setEditForm(null);
      if (selectedMetaIds.length > 1) {
        showSavedMessage(
          areAllMetasSelected(selectedMetaIds, metas)
            ? `Item atualizado com vínculo a todas as metas (${selectedMetaIds.length}).`
            : `Item atualizado com vínculo a ${selectedMetaIds.length} metas.`
        );
      } else {
        showSavedMessage('Item atualizado com sucesso.');
      }
    } catch (error) {
      captureItemFieldErrors(error);
      const conflictMessage = extractCriticalBeneficiaryConflictMessage(error);
      if (conflictMessage) {
        setCriticalConflictMessage(conflictMessage);
        setActionError(null);
      } else {
        setActionError(toErrorMessage(error, 'Não foi possível atualizar o item.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditForm(null);
    setItemFieldErrors({});
    setEditItemAttempted(false);
  };

  const openDeleteItemModal = (rubricaId: string, item: ItemRubrica) => {
    if (!ensureCanManageChildren()) return;

    setActionError(null);
    setSavedMessage(null);
    setAddingToRubrica(null);
    setEditingItem(null);
    setEditForm(null);
    setItemPendingDeletion({
      rubricaId,
      itemId: item.id,
      descricao: item.descricao,
    });
  };

  const closeDeleteItemModal = () => {
    setItemPendingDeletion(null);
  };

  const openDeleteRubricaModal = (rubrica: Rubrica) => {
    if (!ensureCanManageChildren()) return;

    setActionError(null);
    setSavedMessage(null);
    setRubricaPendingDeletion(rubrica);
  };

  const closeDeleteRubricaModal = () => {
    setRubricaPendingDeletion(null);
  };

  const handleRemoveItem = async () => {
    if (!ensureCanManageChildren()) return;
    if (!itemPendingDeletion) return;
    if (
      !isPersistedId(itemPendingDeletion.rubricaId) ||
      !isPersistedId(itemPendingDeletion.itemId)
    ) {
      setActionError('Item inválido para remoção.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setSavedMessage(null);

    try {
      await deleteBudgetItem(toPersistedId(itemPendingDeletion.itemId));
      await loadData();
      closeDeleteItemModal();
      showSavedMessage('Item removido com sucesso.');
    } catch (error) {
      setActionError(toErrorMessage(error, 'Não foi possível remover o item.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRubrica = async () => {
    if (!ensureCanManageChildren()) return;
    if (!newRubrica.nome.trim()) return;
    if (!Number.isFinite(projectId)) {
      setActionError('ID do contrato inválido para criar a rubrica.');
      return;
    }

    const generatedCode = `RUB-${projectId}-${Date.now().toString().slice(-6)}`;

    setIsSubmitting(true);
    setActionError(null);
    setSavedMessage(null);

    try {
      const actorUserId = await requireCurrentUserId();
      await createBudgetCategory({
        projectId,
        code: generatedCode,
        name: newRubrica.nome.trim(),
        createdBy: actorUserId,
      });

      await loadData();
      setNewRubrica({ nome: '' });
      setIsAddingRubrica(false);
      showSavedMessage('Rubrica criada com sucesso.');
    } catch (error) {
      setActionError(toErrorMessage(error, 'Não foi possível criar a rubrica.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEditRubrica = (rubrica: Rubrica) => {
    if (!ensureCanManageChildren()) return;
    setEditingRubrica(rubrica.id);
    setEditRubricaForm({ nome: rubrica.nome });
    setEditingItem(null);
    setEditForm(null);
    setAddingToRubrica(null);
  };

  const handleSaveRubricaEdit = async (rubricaId: string) => {
    if (!ensureCanManageChildren()) return;
    if (!editRubricaForm?.nome.trim()) {
      setActionError('Informe o nome da rubrica.');
      return;
    }

    if (!isPersistedId(rubricaId)) {
      setActionError('Rubrica inválida para atualização.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setSavedMessage(null);

    try {
      const actorUserId = await requireCurrentUserId();
      await updateBudgetCategory(toPersistedId(rubricaId), {
        name: editRubricaForm.nome.trim(),
        updatedBy: actorUserId,
      });

      await loadData();
      setEditingRubrica(null);
      setEditRubricaForm(null);
      showSavedMessage('Rubrica atualizada com sucesso.');
    } catch (error) {
      setActionError(toErrorMessage(error, 'Não foi possível atualizar a rubrica.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAddRubrica = () => {
    setNewRubrica({ nome: '' });
    setIsAddingRubrica(false);
  };

  const handleCancelEditRubrica = () => {
    setEditingRubrica(null);
    setEditRubricaForm(null);
  };

  const handleRemoveRubrica = async (rubricaId: string) => {
    if (!ensureCanManageChildren()) return;
    if (rubricaPendingDeletion?.id === rubricaId) {
      if (!isPersistedId(rubricaId)) {
        setActionError('Rubrica inválida para remoção.');
        return;
      }

      setIsSubmitting(true);
      setActionError(null);
      setSavedMessage(null);

      try {
        await deleteBudgetCategory(toPersistedId(rubricaId));
        await loadData();
        closeDeleteRubricaModal();
        showSavedMessage('Rubrica removida com sucesso.');
      } catch (error) {
        setActionError(toErrorMessage(error, 'Não foi possível remover a rubrica.'));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const rubrica = rubricas.find((item) => item.id === rubricaId);
    if (rubrica) {
      openDeleteRubricaModal(rubrica);
      return;
    }
    if (!isPersistedId(rubricaId)) {
      setActionError('Rubrica inválida para remoção.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setSavedMessage(null);

    try {
      await deleteBudgetCategory(toPersistedId(rubricaId));
      await loadData();
      showSavedMessage('Rubrica removida com sucesso.');
    } catch (error) {
      setActionError(toErrorMessage(error, 'Não foi possível remover a rubrica.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAbrirRemanejamento = (item: ItemRubrica) => {
    if (!ensureCanManageChildren()) return;
    setItemParaRemanejamento(item);
    setRemanejamentoModalOpen(true);
  };

  const handleConfirmarRemanejamento = async (form: {
    itemOrigemId: string;
    itemDestinoId: string;
    valor: number;
    data: string;
    motivo: string;
  }) => {
    if (!ensureCanManageChildren()) return;
    if (!Number.isFinite(projectId)) {
      setActionError('ID do contrato inválido para remanejamento.');
      return;
    }
    if (!isPersistedId(form.itemOrigemId) || !isPersistedId(form.itemDestinoId)) {
      setActionError('Itens inválidos para remanejamento.');
      return;
    }

    const itemOrigemAtual = rubricas.flatMap((rubrica) => rubrica.itens).find(
      (item) => item.id === form.itemOrigemId
    );
    const saldoDisponivel = itemOrigemAtual ? calcularValorFinalItem(itemOrigemAtual) : 0;

    if (form.valor > saldoDisponivel) {
      setActionError(
        `Valor acima do saldo disponível do item de origem (${formatCurrency(saldoDisponivel)}).`
      );
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setSavedMessage(null);

    try {
      const actorUserId = await requireCurrentUserId();
      const payload: BudgetTransferRequestDTO = {
        projectId,
        fromItemId: toPersistedId(form.itemOrigemId),
        toItemId: toPersistedId(form.itemDestinoId),
        amount: toMoneyValue(form.valor),
        transferDate: form.data,
        status: 'APROVADO',
        reason: form.motivo.trim(),
        createdBy: actorUserId,
      };

      await createBudgetTransfer(payload);
      await loadData();
      setRemanejamentoModalOpen(false);
      setItemParaRemanejamento(null);
      showSavedMessage('Remanejamento registrado com sucesso.');
    } catch (error) {
      setActionError(toErrorMessage(error, 'Não foi possível registrar o remanejamento.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComebackRemanejamento = async (remanejamentoId: string) => {
    if (!ensureCanManageChildren()) return;
    if (!Number.isFinite(projectId)) {
      setActionError('ID do contrato inválido para registrar o comeback.');
      return;
    }

    const remanejamento = remanejamentos.find((current) => current.id === remanejamentoId);
    if (!remanejamento) {
      setActionError('Remanejamento não encontrado para registrar o comeback.');
      return;
    }

    const comebackInfo = parseBudgetTransferComeback(remanejamento.motivo);
    if (comebackInfo.isComeback) {
      setActionError('Este remanejamento já é um comeback e não pode receber outro retorno.');
      return;
    }

    const alreadyReverted = remanejamentos.some(
      (current) =>
        parseBudgetTransferComeback(current.motivo).originalTransferId ===
        Number.parseInt(remanejamentoId, 10)
    );
    if (alreadyReverted) {
      setActionError('Este remanejamento já possui um comeback registrado.');
      return;
    }

    if (
      !isPersistedId(remanejamento.itemOrigemId) ||
      !isPersistedId(remanejamento.itemDestinoId)
    ) {
      setActionError('Itens inválidos para registrar o comeback.');
      return;
    }

    const itemRetornoAtual = rubricas
      .flatMap((rubrica) => rubrica.itens)
      .find((item) => item.id === remanejamento.itemDestinoId);
    const saldoDisponivel = itemRetornoAtual ? calcularValorFinalItem(itemRetornoAtual) : 0;
    const valorComeback = toMoneyValue(remanejamento.valor);

    if (valorComeback > saldoDisponivel) {
      setActionError(
        `Não há saldo suficiente no item de retorno para desfazer o remanejamento (${formatCurrency(saldoDisponivel)} disponível).`
      );
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setSavedMessage(null);

    try {
      const actorUserId = await requireCurrentUserId();
      const payload: BudgetTransferRequestDTO = {
        projectId,
        fromItemId: toPersistedId(remanejamento.itemDestinoId),
        toItemId: toPersistedId(remanejamento.itemOrigemId),
        amount: valorComeback,
        transferDate: toInputDateValue(),
        status: 'APROVADO',
        reason: buildBudgetTransferComebackReason(remanejamento.id, remanejamento.motivo),
        createdBy: actorUserId,
      };

      await createBudgetTransfer(payload);
      await loadData();
      showSavedMessage(`Comeback do remanejamento #${remanejamento.id} registrado com sucesso.`);
    } catch (error) {
      setActionError(toErrorMessage(error, 'Não foi possível registrar o comeback.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const remanejamentosComDados = useMemo(() => {
    return remanejamentos.map((remanejamento) => {
      const itemOrigem = rubricas
        .flatMap((rubrica) => rubrica.itens)
        .find((item) => item.id === remanejamento.itemOrigemId);

      const itemDestino = rubricas
        .flatMap((rubrica) => rubrica.itens)
        .find((item) => item.id === remanejamento.itemDestinoId);

      const rubricaOrigem = rubricas.find((rubrica) =>
        rubrica.itens.some((item) => item.id === remanejamento.itemOrigemId)
      );

      const rubricaDestino = rubricas.find((rubrica) =>
        rubrica.itens.some((item) => item.id === remanejamento.itemDestinoId)
      );

      return {
        ...remanejamento,
        itemOrigem: itemOrigem
          ? {
              descricao: itemOrigem.descricao,
              codigo: itemOrigem.codigo,
              rubricaNome: rubricaOrigem?.nome || '',
              rubricaCodigo: rubricaOrigem?.codigo || '',
            }
          : undefined,
        itemDestino: itemDestino
          ? {
              descricao: itemDestino.descricao,
              codigo: itemDestino.codigo,
              rubricaNome: rubricaDestino?.nome || '',
              rubricaCodigo: rubricaDestino?.codigo || '',
            }
          : undefined,
      };
    });
  }, [remanejamentos, rubricas]);

  const isCreateItemModalOpen = Boolean(addingToRubrica && currentCreateRubrica);
  const isEditItemModalOpen = Boolean(editingItem && editForm && currentEditRubrica);
  const isDeleteRubricaModalOpen = Boolean(rubricaPendingDeletion);
  const isDeleteItemModalOpen = Boolean(itemPendingDeletion);
  const isLinkPersonModalOpen = showLinkPersonModal;
  const isLinkCompanyModalOpen = showLinkCompanyModal;
  const isCreatePersonModalOpen = showCreatePersonModal;
  const isCreateCompanyModalOpen = showCreateCompanyModal;
  const isRemanejamentoModalVisible = Boolean(canManageChildren && itemParaRemanejamento);
  const isHistoricoModalVisible = Boolean(canOpenTransferHistory && historicoModalOpen);
  const isCriticalConflictModalOpen = Boolean(criticalConflictMessage);
  const isAnyModalOpen =
    isCreateItemModalOpen ||
    isEditItemModalOpen ||
    isDeleteRubricaModalOpen ||
    isDeleteItemModalOpen ||
    isLinkPersonModalOpen ||
    isLinkCompanyModalOpen ||
    isCreatePersonModalOpen ||
    isCreateCompanyModalOpen ||
    isRemanejamentoModalVisible ||
    isHistoricoModalVisible ||
    isCriticalConflictModalOpen;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <ContractRubricasLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {budgetSummary && (
        <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 p-5 shadow-sm md:p-6">
          <div className="mt-1 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryMetricCard
              label="Contrato"
              value={formatCurrency(budgetSummary.contractValue)}
              description="Base de comparação do planejamento"
              tooltip="Valor total aprovado para este contrato."
              tone="slate"
            />
            <SummaryMetricCard
              label="Planejado"
              value={formatCurrency(budgetSummary.totalBudgetItems)}
              description="Compromisso orçamentário atual"
              tooltip="Soma de todos os itens planejados nas rubricas deste projeto."
              tone="emerald"
            />
            <SummaryMetricCard
              label={budgetSummary.isExceeded ? 'Excedente' : 'Saldo'}
              value={formatCurrency(
                budgetSummary.isExceeded ? budgetSummary.exceededAmount : budgetSummary.remainingAmount
              )}
              description={
                budgetSummary.isExceeded
                  ? 'Planejamento acima do limite do contrato'
                  : 'Ainda pode ser distribuído em rubricas'
              }
              tooltip={
                budgetSummary.isExceeded
                  ? 'Diferença que excede o valor total do contrato.'
                  : 'Diferença entre o valor do contrato e o total planejado em rubricas.'
              }
              tone={budgetSummary.isExceeded ? 'danger' : 'green'}
            />
            <SummaryMetricCard
              label="Planejamento"
              value={`${budgetSummary.plannedPercentage.toFixed(2)}%`}
              description="Percentual do valor do contrato já distribuído nas rubricas"
              tooltip="Mostra quanto do contrato já foi planejado nas rubricas. Exemplo: 35% significa que 35% do valor total já foi distribuído."
              tone={budgetSummary.isExceeded ? 'danger' : 'blue'}
            />
          </div>
        </section>
      )}
      {budgetSummary?.isExceeded && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          As rubricas excedem o valor do contrato em {formatCurrency(budgetSummary.exceededAmount)}.
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Rubricas Orçamentárias</h3>
          <p className="text-sm text-gray-500">
            Cadastre e ajuste os itens de despesa por rubrica, com controle de metas e beneficiários.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {canOpenTransferHistory && (
            <button
              type="button"
              onClick={() => setHistoricoModalOpen(true)}
              disabled={loadingAccess || isLoading}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Histórico de remanejamentos
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {remanejamentos.length}
              </span>
            </button>
          )}
          {canManageChildren && !isAddingRubrica && (
            <button
              onClick={() => setIsAddingRubrica(true)}
              disabled={isSubmitting || isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-[#004225] text-white text-sm font-medium rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Nova Rubrica
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Carregando rubricas...
        </div>
      )}

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div>{loadError}</div>
          <button
            type="button"
            onClick={() => void loadData()}
            className="mt-2 rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!isAnyModalOpen && actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {savedMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {savedMessage}
        </div>
      )}

      {!loadingAccess && !canManageChildren && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Seu perfil pode consultar as rubricas, mas não pode criar, editar, remover ou remanejar itens.
        </div>
      )}

      {canManageChildren && isAddingRubrica && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="w-5 h-5 text-emerald-700" />
            <h4 className="font-medium text-emerald-900">Nova Rubrica</h4>
          </div>
          <div className="mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newRubrica.nome}
                onChange={(e) => setNewRubrica({ ...newRubrica, nome: e.target.value })}
                placeholder="Ex: Material de Consumo"
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                maxLength={100}
                autoFocus
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void handleAddRubrica()}
              disabled={isSubmitting || !newRubrica.nome.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Criar Rubrica
            </button>
            <button
              onClick={handleCancelAddRubrica}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {rubricas.map((rubrica) => (
          <div key={rubrica.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100">
              {editingRubrica === rubrica.id && editRubricaForm ? (
                <div className="flex items-center gap-3 flex-1">
                  {rubrica.expanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="flex-1 max-w-xl">
                    <p className="font-mono text-sm text-gray-500 mb-1">[{rubrica.codigo}]</p>
                    <input
                      type="text"
                      value={editRubricaForm.nome}
                      onChange={(e) => setEditRubricaForm({ nome: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Nome da rubrica"
                      maxLength={100}
                      autoFocus
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {rubrica.itens.length} {rubrica.itens.length === 1 ? 'item cadastrado' : 'itens cadastrados'}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => toggleExpand(rubrica.id)}
                >
                  {rubrica.expanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  <div>
                    <span className="font-mono text-sm text-gray-500 mr-2">[{rubrica.codigo}]</span>
                    <span className="font-medium text-gray-900">{rubrica.nome}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      ({rubrica.itens.length} {rubrica.itens.length === 1 ? 'item' : 'itens'})
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-700">
                  {formatCurrency(calcularTotalRubrica(rubrica))}
                </span>
                {canManageChildren && editingRubrica === rubrica.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void handleSaveRubricaEdit(rubrica.id)}
                      disabled={isSubmitting || !editRubricaForm?.nome.trim()}
                      className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" />
                      Salvar
                    </button>
                    <button
                      onClick={handleCancelEditRubrica}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 px-3 py-1 bg-white text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                ) : canManageChildren ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddItemModal(rubrica.id);
                      }}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 px-3 py-1 bg-[#004225] text-white text-sm rounded-md hover:bg-[#003319] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      Novo Item
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEditRubrica(rubrica);
                      }}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 px-3 py-1 bg-white text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Editar rubrica"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleRemoveRubrica(rubrica.id);
                      }}
                      disabled={isSubmitting}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remover rubrica"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-gray-400">Somente leitura</span>
                )}
              </div>
            </div>

            {rubrica.expanded && (
              <div className="px-4 py-3 bg-white">
                {rubrica.itens.length === 0 ? (
                  <div className="flex items-center gap-2 text-gray-500 py-4 justify-center">
                    <AlertCircle className="w-5 h-5" />
                    <span>Nenhum item cadastrado nesta rubrica</span>
                  </div>
                ) : (
                  <ResizableTable
                    columnCount={14}
                    defaultWidths={[
                      { minWidth: 180, defaultWidth: 220, maxWidth: 420 }, // Descrição
                      { minWidth: 70, defaultWidth: 80, maxWidth: 110 }, // Qtd
                      { minWidth: 70, defaultWidth: 80, maxWidth: 110 }, // Meses
                      { minWidth: 120, defaultWidth: 140, maxWidth: 220 }, // Valor Unit.
                      { minWidth: 120, defaultWidth: 140, maxWidth: 220 }, // Valor Total
                      { minWidth: 110, defaultWidth: 120, maxWidth: 220 }, // Rem. (Deb.)
                      { minWidth: 110, defaultWidth: 120, maxWidth: 220 }, // Rem. (Cred.)
                      { minWidth: 120, defaultWidth: 140, maxWidth: 230 }, // Valor Final
                      { minWidth: 200, defaultWidth: 230, maxWidth: 320 }, // Responsável
                      { minWidth: 120, defaultWidth: 140, maxWidth: 240 }, // WEBS
                      { minWidth: 140, defaultWidth: 160, maxWidth: 280 }, // Ordem de Serviço
                      { minWidth: 120, defaultWidth: 140, maxWidth: 260 }, // Protocolo
                      { minWidth: 220, defaultWidth: 280, maxWidth: 380 }, // Metas
                      { minWidth: 120, defaultWidth: 130, maxWidth: 170 }, // Ações
                    ]}
                    minColumnWidth={70}
                    className="text-sm min-w-max"
                  >
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-medium text-gray-600">Descrição</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">Qtd</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">Meses</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">Valor Unit.</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">Valor Total</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600 text-red-600">Rem. (Deb.)</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600 text-green-600">Rem. (Cred.)</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600 text-blue-600">Valor Final</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">Responsável do item</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">WEBS</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600 whitespace-nowrap">Ordem de Serviço</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">Protocolo</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600">Metas</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-600 whitespace-nowrap">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rubrica.itens.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-2 text-gray-900">{item.descricao}</td>
                          <td className="py-2 px-2 text-center text-gray-700">
                            {item.quantidade}
                          </td>
                          <td className="py-2 px-2 text-center text-gray-700">{item.meses}</td>
                          <td className="py-2 px-2 text-right text-gray-700">
                            {formatCurrency(item.valorUnitario)}
                          </td>
                          <td className="py-2 px-2 text-right font-medium text-gray-900">
                            {formatCurrency(item.valorTotal)}
                          </td>
                          <td className="py-2 px-2 text-right">
                            {(() => {
                              const { debito } = calcularRemanejamentosItem(item.id);
                              return debito > 0 ? (
                                <span className="text-red-600 font-medium">
                                  {formatCurrency(debito)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              );
                            })()}
                          </td>
                          <td className="py-2 px-2 text-right">
                            {(() => {
                              const { credito } = calcularRemanejamentosItem(item.id);
                              return credito > 0 ? (
                                <span className="text-green-600 font-medium">
                                  {formatCurrency(credito)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              );
                            })()}
                          </td>
                          <td className="py-2 px-2 text-right">
                            <span className="font-semibold text-blue-600">
                              {formatCurrency(calcularValorFinalItem(item))}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-gray-700">
                            <span
                              className={
                                item.beneficiaryType ? 'text-gray-700' : 'text-gray-400'
                              }
                            >
                              {resolveBeneficiaryLabel(item)}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-gray-700 text-center">
                            {item.webs?.trim() ? item.webs : <span className="text-gray-400">-</span>}
                          </td>
                          <td className="py-2 px-2 text-gray-700 text-center">
                            {item.serviceOrder?.trim() ? (
                              item.serviceOrder
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-gray-700 text-center">
                            {item.protocol?.trim() ? (
                              item.protocol
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-gray-700">
                            {(() => {
                              const linkedMetas = resolveLinkedMetas(item);

                              if (linkedMetas.length === 0) {
                                return <span className="text-gray-400">Sem vínculo</span>;
                              }

                              if (
                                areAllMetasSelected(
                                  linkedMetas.map((meta) => meta.id),
                                  metas
                                )
                              ) {
                                return (
                                  <div className="min-w-0">
                                    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                      Todas as metas
                                    </span>
                                    <p className="mt-1 text-xs text-gray-500">
                                      {linkedMetas.length} metas vinculadas neste item
                                    </p>
                                  </div>
                                );
                              }

                              if (linkedMetas.length === 1) {
                                const linkedMeta = linkedMetas[0];

                                return (
                                  <div className="min-w-0">
                                    <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                      Meta {linkedMeta.numero}
                                    </span>
                                    <p className="mt-1 truncate text-xs text-gray-500">
                                      {linkedMeta.titulo}
                                    </p>
                                  </div>
                                );
                              }

                              return (
                                <div className="min-w-0">
                                  <div className="flex flex-wrap gap-1">
                                    {linkedMetas.slice(0, 2).map((meta) => (
                                      <span
                                        key={meta.id}
                                        className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
                                      >
                                        Meta {meta.numero}
                                      </span>
                                    ))}
                                    {linkedMetas.length > 2 && (
                                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                                        +{linkedMetas.length - 2}
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 text-xs text-gray-500">
                                    {linkedMetas.length} metas vinculadas neste item
                                  </p>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-2 px-2">
                            {canManageChildren ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleAbrirRemanejamento(item)}
                                  disabled={isSubmitting}
                                  className="p-1 text-[#004225] hover:bg-emerald-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Remanejar"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="lucide lucide-arrow-up-down-icon lucide-arrow-up-down"
                                  >
                                    <path d="m21 16-4 4-4-4" />
                                    <path d="M17 20V4" />
                                    <path d="m3 8 4-4 4 4" />
                                    <path d="M7 4v16" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleStartEdit(item)}
                                  disabled={isSubmitting}
                                  className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Editar"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteItemModal(rubrica.id, item)}
                                  disabled={isSubmitting}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Remover"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="block text-center text-xs text-gray-400">
                                Somente leitura
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </ResizableTable>
                )}

                {canManageChildren && rubrica.itens.length === 0 && (
                  <div className="flex justify-center py-2">
                    <button
                      onClick={() => openAddItemModal(rubrica.id)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 px-4 py-2 text-[#004225] hover:bg-emerald-50 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar primeiro item
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <h4 className="font-medium text-gray-900 mb-3">Resultado por Rubrica</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {rubricas
            .filter((rubrica) => rubrica.itens.length > 0)
            .map((rubrica) => (
              <div key={rubrica.id} className="bg-white p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 font-mono">[{rubrica.codigo}]</p>
                <p className="text-sm font-medium text-gray-700 truncate">{rubrica.nome}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(calcularTotalRubrica(rubrica))}
                </p>
                <p className="text-xs text-gray-500">{rubrica.itens.length} itens</p>
              </div>
            ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-300 flex justify-end">
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Geral de Rubricas</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(calcularTotalGeral())}</p>
          </div>
        </div>
      </div>

      <AppModalShell
        isOpen={Boolean(addingToRubrica && currentCreateRubrica)}
        title="Novo item"
        description={
          currentCreateRubrica
            ? `Cadastre um novo item na rubrica [${currentCreateRubrica.codigo}] ${currentCreateRubrica.nome}.`
            : undefined
        }
        icon={<Plus className="h-5 w-5" />}
        tone="brand"
        onClose={() => {
          if (!isSubmitting) {
            closeAddItemModal();
          }
        }}
        closeDisabled={isSubmitting}
        isDirty={isCreateItemDirty}
      >
        {currentCreateRubrica && (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              setCreateItemAttempted(true);
              void handleAddItem(currentCreateRubrica.id);
            }}
          >
            {actionError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {actionError}
              </div>
            ) : null}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                Rubrica de destino
              </p>
              <p className="mt-1 font-medium text-emerald-950">
                [{currentCreateRubrica.codigo}] {currentCreateRubrica.nome}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Descrição <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newItem.descricao ?? ''}
                  onChange={(event) =>
                    setNewItem((current) => ({
                      ...current,
                      descricao: event.target.value,
                    }))
                  }
                  placeholder="Ex.: Serviço especializado"
                  className={`w-full rounded-xl border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 ${
                    createItemAttempted && !newItem.descricao?.trim()
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                  }`}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">WEBS</label>
                <input
                  type="text"
                  value={newItem.webs ?? ''}
                  onChange={(event) =>
                    setNewItem((current) => ({
                      ...current,
                      webs: event.target.value,
                    }))
                  }
                  placeholder="Opcional"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Ordem de Serviço</label>
                <input
                  type="text"
                  value={newItem.serviceOrder ?? ''}
                  onChange={(event) =>
                    setNewItem((current) => ({
                      ...current,
                      serviceOrder: event.target.value,
                    }))
                  }
                  placeholder="Opcional"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  disabled={isSubmitting}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-700">Protocolo</label>
                <input
                  type="text"
                  value={newItem.protocol ?? ''}
                  onChange={(event) =>
                    setNewItem((current) => ({
                      ...current,
                      protocol: event.target.value,
                    }))
                  }
                  placeholder="Opcional"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Quantidade <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={newItem.quantidade ?? ''}
                  onChange={(event) =>
                    setNewItem((current) => ({
                      ...current,
                      quantidade: parsePositiveIntInput(event.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Meses <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={newItem.meses ?? ''}
                  onChange={(event) =>
                    setNewItem((current) => ({
                      ...current,
                      meses: parsePositiveIntInput(event.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  disabled={isSubmitting}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Valor unitário <span className="text-red-500">*</span>
                </label>
                <MoneyInput
                  valueCents={Math.round(toMoneyValue(newItem.valorUnitario) * 100)}
                  onValueChange={(cents) =>
                    setNewItem((current) => ({
                      ...current,
                      valorUnitario: cents / 100,
                    }))
                  }
                  min={0.01}
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 ${
                    createItemAttempted && toMoneyValue(newItem.valorUnitario) <= 0
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-700">
                <Checkbox
                  checked={Boolean(newItem.unlinkedItem)}
                  onCheckedChange={(checked) =>
                    setNewItem((current) => ({
                      ...current,
                      unlinkedItem: Boolean(checked),
                      projectPeopleId: checked ? undefined : current.projectPeopleId,
                      projectCompanyId: checked ? undefined : current.projectCompanyId,
                      beneficiaryType: checked ? undefined : current.beneficiaryType,
                      beneficiaryReferenceId: checked ? undefined : current.beneficiaryReferenceId,
                    }))
                  }
                  disabled={isSubmitting}
                />
                Item de rúbrica sem vínculo
              </label>

              <div
                className={`space-y-3 transition-opacity ${
                  newItem.unlinkedItem ? 'pointer-events-none opacity-50' : 'opacity-100'
                }`}
              >
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Tipo de vínculo</label>
                  <Dropdown
                    options={[
                      { value: 'person', label: 'Pessoa do projeto' },
                      { value: 'company', label: 'Empresa do projeto' },
                      { value: 'partner', label: 'IF / Fundação' },
                    ]}
                    value={newItem.beneficiaryType}
                    placeholder="Selecione"
                    onChange={(value) =>
                      setNewItem((current) => ({
                        ...current,
                        beneficiaryType: (value as BeneficiaryType | undefined) ?? undefined,
                        beneficiaryReferenceId: undefined,
                        projectPeopleId: undefined,
                        projectCompanyId: undefined,
                        projectPartnerId: undefined,
                      }))
                    }
                    disabled={isSubmitting}
                    className={`w-full ${
                      createItemAttempted &&
                      !newItem.unlinkedItem &&
                      !newItem.beneficiaryType
                        ? 'border border-red-300'
                        : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Beneficiário no projeto
                  </label>
                  <Dropdown
                    searchable
                    options={(newItem.beneficiaryType === 'person'
                      ? projectPeopleOptions
                      : newItem.beneficiaryType === 'company'
                        ? projectCompanyOptions
                        : newItem.beneficiaryType === 'partner'
                          ? projectPartnerOptions
                          : []
                    ).map((option) => ({ value: option.id, label: option.label }))}
                    value={newItem.beneficiaryReferenceId}
                    placeholder={
                      !newItem.beneficiaryType
                        ? 'Selecione primeiro o tipo de vínculo'
                        : newItem.beneficiaryType === 'company'
                          ? 'Selecione a empresa do projeto'
                          : newItem.beneficiaryType === 'partner'
                            ? 'Selecione o IF / Fundação'
                            : 'Selecione a pessoa do projeto'
                    }
                    onChange={(value) =>
                      setNewItem((current) => ({
                        ...current,
                        beneficiaryReferenceId: value ?? undefined,
                        projectPeopleId:
                          current.beneficiaryType === 'person' ? value ?? undefined : current.projectPeopleId,
                        projectCompanyId:
                          current.beneficiaryType === 'company' ? value ?? undefined : current.projectCompanyId,
                        projectPartnerId:
                          current.beneficiaryType === 'partner' ? value ?? undefined : current.projectPartnerId,
                      }))
                    }
                    disabled={isSubmitting || !newItem.beneficiaryType}
                    className={`w-full ${
                      createItemAttempted &&
                      !newItem.unlinkedItem &&
                      Boolean(newItem.beneficiaryType) &&
                      !newItem.beneficiaryReferenceId
                        ? 'border border-red-300'
                        : ''
                    }`}
                  />
                  {!itemFieldErrors.projectCompanyId && !itemFieldErrors.projectPeopleId ? (
                    <p className="mt-1 text-xs text-gray-500">
                      Opcional. Use "sem vínculo" quando o item ainda não tiver responsável definido.
                    </p>
                  ) : null}
                  {itemFieldErrors.projectPeopleId ? (
                    <p className="mt-1 text-xs text-red-600">
                      {itemFieldErrors.projectPeopleId}
                    </p>
                  ) : null}
                  {itemFieldErrors.projectCompanyId ? (
                    <p className="mt-1 text-xs text-red-600">
                      {itemFieldErrors.projectCompanyId}
                    </p>
                  ) : null}
                </div>

                {newItem.beneficiaryType === 'person' ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                        onClick={() => {
                          setBeneficiaryModalContext('create');
                          setLinkPersonModalError(null);
                          setLinkPersonFieldError(null);
                          setLinkPersonAttempted(false);
                          setShowLinkPersonModal(true);
                        }}
                      className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-[#004225]"
                    >
                      Vincular pessoa existente
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBeneficiaryModalContext('create');
                        setNewPersonForm(defaultMemberFormData());
                        setNewPersonAvatarFile(null);
                        setNewPersonCpfError('');
                        setNewPersonPhoneError('');
                        setCreatePersonModalError(null);
                        setCreatePersonFieldErrors({});
                        setShowCreatePersonModal(true);
                      }}
                      className="rounded-lg bg-[#004225] px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Cadastrar nova pessoa
                    </button>
                  </div>
                ) : null}

                {newItem.beneficiaryType === 'company' ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                        onClick={() => {
                          setBeneficiaryModalContext('create');
                          setLinkCompanyModalError(null);
                          setLinkCompanyFieldError(null);
                          setLinkCompanyAttempted(false);
                          setShowLinkCompanyModal(true);
                        }}
                      className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-[#004225]"
                    >
                      Vincular empresa existente
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBeneficiaryModalContext('create');
                        setCreateCompanyModalError(null);
                        setCreateCompanyFieldErrors({});
                        setShowCreateCompanyModal(true);
                      }}
                      className="rounded-lg bg-[#004225] px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Cadastrar nova empresa
                    </button>
                  </div>
                ) : null}

                {newItem.beneficiaryType === 'partner' ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBeneficiaryModalContext('create');
                        setLinkPartnerModalError(null);
                        setLinkPartnerFieldError(null);
                        setLinkPartnerAttempted(false);
                        setShowLinkPartnerModal(true);
                      }}
                      className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-[#004225]"
                    >
                      Vincular IF/Fundação existente
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBeneficiaryModalContext('create');
                        setShowCreatePartnerModal(true);
                      }}
                      className="rounded-lg bg-[#004225] px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Cadastrar novo IF/Fundação
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Valor total calculado
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {formatCurrency(calculateDraftTotal(newItem))}
              </p>
              <p className="text-xs text-gray-500">Quantidade x meses x valor unitário</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Metas</label>
              <MetaSelectionField
                metas={metas}
                selectedMetaIds={resolveMetaIdsForDraft(newItem)}
                onChange={(metaIds) =>
                  setNewItem((current) => ({
                    ...current,
                    metaIds,
                    metaId: metaIds[0],
                  }))
                }
                disabled={isSubmitting}
                tone="accent"
                mode="create"
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => {
                  if (!isSubmitting) {
                    closeAddItemModal();
                  }
                }}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#004225] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#003319] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Criar item
              </button>
            </div>
          </form>
        )}
      </AppModalShell>

      <AppModalShell
        isOpen={Boolean(editingItem && editForm && currentEditRubrica)}
        title="Editar item"
        description={
          currentEditRubrica
            ? `Atualize as informações do item na rubrica [${currentEditRubrica.codigo}] ${currentEditRubrica.nome}.`
            : undefined
        }
        icon={<Edit2 className="h-5 w-5" />}
        tone="info"
        onClose={() => {
          if (!isSubmitting) {
            handleCancelEdit();
          }
        }}
        closeDisabled={isSubmitting}
        isDirty={isEditItemDirty}
      >
        {editForm && currentEditRubrica && (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              setEditItemAttempted(true);
              void handleSaveEdit(currentEditRubrica.id);
            }}
          >
            {actionError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {actionError}
              </div>
            ) : null}
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                Rubrica vinculada
              </p>
              <p className="mt-1 font-medium text-blue-950">
                [{currentEditRubrica.codigo}] {currentEditRubrica.nome}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Descrição <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.descricao ?? ''}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? {
                            ...current,
                            descricao: event.target.value,
                          }
                        : current
                    )
                  }
                  placeholder="Ex.: Serviço especializado"
                  className={`w-full rounded-xl border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 ${
                    editItemAttempted && !editForm.descricao?.trim()
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">WEBS</label>
                <input
                  type="text"
                  value={editForm.webs ?? ''}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? {
                            ...current,
                            webs: event.target.value,
                          }
                        : current
                    )
                  }
                  placeholder="Opcional"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Ordem de Serviço</label>
                <input
                  type="text"
                  value={editForm.serviceOrder ?? ''}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? {
                            ...current,
                            serviceOrder: event.target.value,
                          }
                        : current
                    )
                  }
                  placeholder="Opcional"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  disabled={isSubmitting}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-700">Protocolo</label>
                <input
                  type="text"
                  value={editForm.protocol ?? ''}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? {
                            ...current,
                            protocol: event.target.value,
                          }
                        : current
                    )
                  }
                  placeholder="Opcional"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Quantidade <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={editForm.quantidade ?? ''}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? {
                            ...current,
                            quantidade: parsePositiveIntInput(event.target.value),
                          }
                        : current
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Meses <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={editForm.meses ?? ''}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? {
                            ...current,
                            meses: parsePositiveIntInput(event.target.value),
                          }
                        : current
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  disabled={isSubmitting}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Valor unitário <span className="text-red-500">*</span>
                </label>
                <MoneyInput
                  valueCents={Math.round(toMoneyValue(editForm.valorUnitario) * 100)}
                  onValueChange={(cents) =>
                    setEditForm((current) =>
                      current
                        ? {
                            ...current,
                          valorUnitario: cents / 100,
                        }
                        : current
                    )
                  }
                  min={0.01}
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 ${
                    editItemAttempted && toMoneyValue(editForm.valorUnitario) <= 0
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-700">
                <Checkbox
                  checked={Boolean(editForm.unlinkedItem)}
                  onCheckedChange={(checked) =>
                    setEditForm((current) =>
                      current
                        ? {
                            ...current,
                            unlinkedItem: Boolean(checked),
                            projectPeopleId: checked ? undefined : current.projectPeopleId,
                            projectCompanyId: checked ? undefined : current.projectCompanyId,
                            beneficiaryType: checked ? undefined : current.beneficiaryType,
                            beneficiaryReferenceId: checked ? undefined : current.beneficiaryReferenceId,
                          }
                        : current
                    )
                  }
                  disabled={isSubmitting}
                />
                Item de rúbrica sem vínculo
              </label>

              <div
                className={`space-y-3 transition-opacity ${
                  editForm.unlinkedItem ? 'pointer-events-none opacity-50' : 'opacity-100'
                }`}
              >
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Tipo de vínculo</label>
                  <Dropdown
                    options={[
                      { value: 'person', label: 'Pessoa do projeto' },
                      { value: 'company', label: 'Empresa do projeto' },
                      { value: 'partner', label: 'IF / Fundação' },
                    ]}
                    value={editForm.beneficiaryType}
                    placeholder="Selecione"
                    onChange={(value) =>
                      setEditForm((current) =>
                        current
                          ? {
                              ...current,
                              beneficiaryType: (value as BeneficiaryType | undefined) ?? undefined,
                              beneficiaryReferenceId: undefined,
                              projectPeopleId: undefined,
                              projectCompanyId: undefined,
                              projectPartnerId: undefined,
                            }
                          : current
                      )
                    }
                    disabled={isSubmitting}
                    className={`w-full ${
                      editItemAttempted &&
                      !editForm.unlinkedItem &&
                      !editForm.beneficiaryType
                        ? 'border border-red-300'
                        : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Beneficiário no projeto
                  </label>
                  <Dropdown
                    searchable
                    options={(editForm.beneficiaryType === 'person'
                      ? projectPeopleOptions
                      : editForm.beneficiaryType === 'company'
                        ? projectCompanyOptions
                        : editForm.beneficiaryType === 'partner'
                          ? projectPartnerOptions
                          : []
                    ).map((option) => ({ value: option.id, label: option.label }))}
                    value={editForm.beneficiaryReferenceId}
                    placeholder={
                      !editForm.beneficiaryType
                        ? 'Selecione primeiro o tipo de vínculo'
                        : editForm.beneficiaryType === 'company'
                          ? 'Selecione a empresa do projeto'
                          : editForm.beneficiaryType === 'partner'
                            ? 'Selecione o IF / Fundação'
                            : 'Selecione a pessoa do projeto'
                    }
                    onChange={(value) =>
                      setEditForm((current) =>
                        current
                          ? {
                              ...current,
                              beneficiaryReferenceId: value ?? undefined,
                              projectPeopleId:
                                current.beneficiaryType === 'person'
                                  ? value ?? undefined
                                  : current.projectPeopleId,
                              projectCompanyId:
                                current.beneficiaryType === 'company'
                                  ? value ?? undefined
                                  : current.projectCompanyId,
                              projectPartnerId:
                                current.beneficiaryType === 'partner'
                                  ? value ?? undefined
                                  : current.projectPartnerId,
                            }
                          : current
                      )
                    }
                    disabled={isSubmitting || !editForm.beneficiaryType}
                    className={`w-full ${
                      editItemAttempted &&
                      !editForm.unlinkedItem &&
                      Boolean(editForm.beneficiaryType) &&
                      !editForm.beneficiaryReferenceId
                        ? 'border border-red-300'
                        : ''
                    }`}
                  />
                  {!itemFieldErrors.projectCompanyId && !itemFieldErrors.projectPeopleId ? (
                    <p className="mt-1 text-xs text-gray-500">
                      Opcional. Use "sem vínculo" quando o item ainda não tiver responsável definido.
                    </p>
                  ) : null}
                  {itemFieldErrors.projectPeopleId ? (
                    <p className="mt-1 text-xs text-red-600">{itemFieldErrors.projectPeopleId}</p>
                  ) : null}
                  {itemFieldErrors.projectCompanyId ? (
                    <p className="mt-1 text-xs text-red-600">{itemFieldErrors.projectCompanyId}</p>
                  ) : null}
                </div>

                {editForm.beneficiaryType === 'person' && !editForm.unlinkedItem ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                        onClick={() => {
                          setBeneficiaryModalContext('edit');
                          setLinkPersonModalError(null);
                          setLinkPersonFieldError(null);
                          setLinkPersonAttempted(false);
                          setShowLinkPersonModal(true);
                        }}
                      disabled={isSubmitting}
                      className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-[#004225] hover:bg-emerald-50 disabled:opacity-50"
                    >
                      Vincular pessoa existente
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBeneficiaryModalContext('edit');
                        setNewPersonForm(defaultMemberFormData());
                        setNewPersonAvatarFile(null);
                        setNewPersonCpfError('');
                        setNewPersonPhoneError('');
                        setCreatePersonModalError(null);
                        setCreatePersonFieldErrors({});
                        setShowCreatePersonModal(true);
                      }}
                      disabled={isSubmitting}
                      className="rounded-lg bg-[#004225] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#003319] disabled:opacity-50"
                    >
                      Cadastrar nova pessoa
                    </button>
                  </div>
                ) : null}

                {editForm.beneficiaryType === 'company' && !editForm.unlinkedItem ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                        onClick={() => {
                          setBeneficiaryModalContext('edit');
                          setLinkCompanyModalError(null);
                          setLinkCompanyFieldError(null);
                          setLinkCompanyAttempted(false);
                          setShowLinkCompanyModal(true);
                        }}
                      disabled={isSubmitting}
                      className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-[#004225] hover:bg-emerald-50 disabled:opacity-50"
                    >
                      Vincular empresa existente
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBeneficiaryModalContext('edit');
                        setNewCompanyForm(createEmptyCompanyForm());
                        setCreateCompanyModalError(null);
                        setCreateCompanyFieldErrors({});
                        setShowCreateCompanyModal(true);
                      }}
                      disabled={isSubmitting}
                      className="rounded-lg bg-[#004225] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#003319] disabled:opacity-50"
                    >
                      Cadastrar nova empresa
                    </button>
                  </div>
                ) : null}

                {editForm.beneficiaryType === 'partner' && !editForm.unlinkedItem ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBeneficiaryModalContext('edit');
                        setLinkPartnerModalError(null);
                        setLinkPartnerFieldError(null);
                        setLinkPartnerAttempted(false);
                        setShowLinkPartnerModal(true);
                      }}
                      disabled={isSubmitting}
                      className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-[#004225] hover:bg-emerald-50 disabled:opacity-50"
                    >
                      Vincular IF/Fundação existente
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBeneficiaryModalContext('edit');
                        setShowCreatePartnerModal(true);
                      }}
                      disabled={isSubmitting}
                      className="rounded-lg bg-[#004225] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#003319] disabled:opacity-50"
                    >
                      Cadastrar novo IF/Fundação
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Valor total calculado
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {formatCurrency(calculateDraftTotal(editForm))}
              </p>
              <p className="text-xs text-gray-500">Quantidade x meses x valor unitário</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Metas</label>
              <MetaSelectionField
                metas={metas}
                selectedMetaIds={resolveMetaIdsForDraft(editForm)}
                onChange={(metaIds) =>
                  setEditForm((current) =>
                    current
                      ? {
                          ...current,
                          metaIds,
                          metaId: metaIds[0],
                        }
                      : current
                  )
                }
                disabled={isSubmitting}
                tone="accent"
                mode="edit"
              />
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#004225] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#003319] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Salvar alterações
              </button>
            </div>
          </form>
        )}
      </AppModalShell>

      <AppModalShell
        isOpen={Boolean(rubricaPendingDeletion)}
        title="Excluir rubrica"
        description="Confirme a exclusão da rubrica antes de continuar."
        icon={<Trash2 className="h-5 w-5" />}
        tone="danger"
        onClose={() => {
          if (!isSubmitting) {
            closeDeleteRubricaModal();
          }
        }}
        maxWidthClassName="max-w-lg"
        closeDisabled={isSubmitting}
      >
        {rubricaPendingDeletion && (
          <div className="space-y-5">
            {actionError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {actionError}
              </div>
            ) : null}
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-800">
                Tem certeza de que deseja excluir esta rubrica?
              </p>
              <p className="mt-1 text-sm text-red-700">
                Esta ação remove a rubrica e todos os itens vinculados.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Rubrica</p>
              <p className="mt-1 font-medium text-gray-900">
                [{rubricaPendingDeletion.codigo}] {rubricaPendingDeletion.nome}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {rubricaPendingDeletion.itens.length} item(ns) vinculado(s)
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={closeDeleteRubricaModal}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleRemoveRubrica(rubricaPendingDeletion.id)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Excluir rubrica
              </button>
            </div>
          </div>
        )}
      </AppModalShell>

      <AppModalShell
        isOpen={Boolean(itemPendingDeletion)}
        title="Excluir item"
        description="Confirme a exclusão do item da rubrica."
        icon={<Trash2 className="h-5 w-5" />}
        tone="danger"
        onClose={() => {
          if (!isSubmitting) {
            closeDeleteItemModal();
          }
        }}
        maxWidthClassName="max-w-lg"
        closeDisabled={isSubmitting}
      >
        {itemPendingDeletion && (
          <div className="space-y-5">
            {actionError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {actionError}
              </div>
            ) : null}
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-800">
                Tem certeza de que deseja excluir este item?
              </p>
              <p className="mt-1 text-sm text-red-700">
                Esta ação remove o item da rubrica e não pode ser desfeita.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Item</p>
              <p className="mt-1 font-medium text-gray-900">{itemPendingDeletion.descricao}</p>
              <p className="mt-2 text-xs text-gray-500">
                Rubrica:{' '}
                {rubricas.find((rubrica) => rubrica.id === itemPendingDeletion.rubricaId)?.nome ??
                  '-'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={closeDeleteItemModal}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleRemoveItem()}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Excluir item
              </button>
            </div>
          </div>
        )}
      </AppModalShell>

        <AppModalShell
          isOpen={showLinkPersonModal}
          title="Vincular pessoa existente"
          onClose={() => {
            setShowLinkPersonModal(false);
            setLinkPersonModalError(null);
            setLinkPersonFieldError(null);
            setLinkPersonAttempted(false);
            setSelectedPersonToLink(undefined);
          }}
        >
        <div className="space-y-4">
          {linkPersonModalError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {linkPersonModalError}
            </div>
          ) : null}
            <Dropdown
              searchable
              options={availablePeople.map((person) => ({
                value: String(person.id),
                label: person.fullName,
              }))}
              value={selectedPersonToLink}
              placeholder="Selecione uma pessoa"
              onChange={(value) => setSelectedPersonToLink(value)}
              className={`w-full ${linkPersonAttempted && (!selectedPersonToLink || Boolean(linkPersonFieldError)) ? 'border border-red-300' : ''}`}
            />
            {linkPersonAttempted && (!selectedPersonToLink || linkPersonFieldError) ? (
              <p className="text-xs text-red-600">{linkPersonFieldError || 'Selecione uma pessoa para vincular.'}</p>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowLinkPersonModal(false);
                  setLinkPersonModalError(null);
                  setLinkPersonFieldError(null);
                  setLinkPersonAttempted(false);
                  setSelectedPersonToLink(undefined);
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setLinkPersonAttempted(true);
                  beneficiaryModalContext === 'edit'
                    ? void handleLinkExistingPersonForEdit()
                    : void handleLinkExistingPerson();
                }}
                className="rounded-lg bg-[#004225] px-4 py-2 text-sm font-medium text-white"
              >
                Vincular
              </button>
          </div>
        </div>
      </AppModalShell>

        <AppModalShell
          isOpen={showLinkCompanyModal}
          title="Vincular empresa existente"
          onClose={() => {
            setShowLinkCompanyModal(false);
            setLinkCompanyModalError(null);
            setLinkCompanyFieldError(null);
            setLinkCompanyAttempted(false);
            setSelectedCompanyToLink(undefined);
          }}
        >
        <div className="space-y-4">
          {linkCompanyModalError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {linkCompanyModalError}
            </div>
          ) : null}
            <Dropdown
              searchable
              options={availableCompanies.map((company) => ({
                value: String(company.id),
                label: company.tradeName || company.name,
              }))}
              value={selectedCompanyToLink}
              placeholder="Selecione uma empresa"
              onChange={(value) => setSelectedCompanyToLink(value)}
              className={`w-full ${linkCompanyAttempted && (!selectedCompanyToLink || Boolean(linkCompanyFieldError)) ? 'border border-red-300' : ''}`}
            />
            {linkCompanyAttempted && (!selectedCompanyToLink || linkCompanyFieldError) ? (
              <p className="text-xs text-red-600">{linkCompanyFieldError || 'Selecione uma empresa para vincular.'}</p>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowLinkCompanyModal(false);
                  setLinkCompanyModalError(null);
                  setLinkCompanyFieldError(null);
                  setLinkCompanyAttempted(false);
                  setSelectedCompanyToLink(undefined);
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setLinkCompanyAttempted(true);
                  beneficiaryModalContext === 'edit'
                    ? void handleLinkExistingCompanyForEdit()
                    : void handleLinkExistingCompany();
                }}
                className="rounded-lg bg-[#004225] px-4 py-2 text-sm font-medium text-white"
              >
                Vincular
              </button>
          </div>
        </div>
      </AppModalShell>

      <AppModalShell
        isOpen={showLinkPartnerModal}
        title="Vincular IF / Fundação existente"
        onClose={() => {
          setShowLinkPartnerModal(false);
          setLinkPartnerModalError(null);
          setLinkPartnerFieldError(null);
          setLinkPartnerAttempted(false);
          setSelectedPartnerToLink(undefined);
        }}
      >
        <div className="space-y-4">
          {linkPartnerModalError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {linkPartnerModalError}
            </div>
          ) : null}
          <Dropdown
            searchable
            options={availablePartners.map((p) => ({
              value: String(p.id),
              label: `${p.tradeName || p.name} (${p.partnersType === 'IF' ? 'IF' : 'Fundação'})`,
            }))}
            value={selectedPartnerToLink}
            placeholder="Selecione o IF ou Fundação"
            onChange={(value) => setSelectedPartnerToLink(value)}
            className={`w-full ${linkPartnerAttempted && (!selectedPartnerToLink || Boolean(linkPartnerFieldError)) ? 'border border-red-300' : ''}`}
          />
          {linkPartnerAttempted && (!selectedPartnerToLink || linkPartnerFieldError) ? (
            <p className="text-xs text-red-600">{linkPartnerFieldError || 'Selecione um parceiro para vincular.'}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowLinkPartnerModal(false);
                setLinkPartnerModalError(null);
                setLinkPartnerFieldError(null);
                setLinkPartnerAttempted(false);
                setSelectedPartnerToLink(undefined);
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                setLinkPartnerAttempted(true);
                beneficiaryModalContext === 'edit'
                  ? void handleLinkExistingPartnerForEdit()
                  : void handleLinkExistingPartner();
              }}
              disabled={isSubmitting}
              className="rounded-lg bg-[#004225] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Vincular
            </button>
          </div>
        </div>
      </AppModalShell>

      <NovoParceiroModal
        isOpen={showCreatePartnerModal}
        onClose={() => setShowCreatePartnerModal(false)}
        onSubmit={(data) =>
          beneficiaryModalContext === 'edit'
            ? handleCreateAndLinkPartnerForEdit(data)
            : handleCreateAndLinkPartner(data)
        }
      />

      {showCreatePersonModal ? (
        <MemberFormModal
          formData={newPersonForm}
          setFormData={setNewPersonForm}
          avatarFile={newPersonAvatarFile}
          setAvatarFile={setNewPersonAvatarFile}
          currentAvatarUrl=""
          isSaving={isSubmitting}
          isEditingItem={false}
            onClose={() => {
              setShowCreatePersonModal(false);
              setNewPersonForm(defaultMemberFormData());
              setNewPersonAvatarFile(null);
              setNewPersonCpfError('');
              setNewPersonPhoneError('');
              setCreatePersonModalError(null);
              setCreatePersonFieldErrors({});
            }}
          onSave={() => beneficiaryModalContext === 'edit' ? void handleCreateAndLinkPersonForEdit() : void handleCreateAndLinkPerson()}
          cpfError={newPersonCpfError}
          setCpfError={setNewPersonCpfError}
          phoneError={newPersonPhoneError}
          setPhoneError={setNewPersonPhoneError}
          errorMessage={createPersonModalError}
          fieldErrors={createPersonFieldErrors}
        />
      ) : null}

      <CompanyFormModal
        isOpen={showCreateCompanyModal}
        formData={newCompanyForm}
        setFormData={setNewCompanyForm}
        isSaving={isSubmitting}
        isEditingItem={false}
          onClose={() => {
            setShowCreateCompanyModal(false);
            setNewCompanyForm(createEmptyCompanyForm());
            setCreateCompanyModalError(null);
            setCreateCompanyFieldErrors({});
          }}
        onSave={() => beneficiaryModalContext === 'edit' ? void handleCreateAndLinkCompanyForEdit() : void handleCreateAndLinkCompany()}
        errorMessage={createCompanyModalError}
        fieldErrors={createCompanyFieldErrors}
      />

      {canManageChildren && itemParaRemanejamento && (
        <RemanejamentoModal
          isOpen={remanejamentoModalOpen}
          onClose={() => {
            setRemanejamentoModalOpen(false);
            setItemParaRemanejamento(null);
          }}
          onConfirm={handleConfirmarRemanejamento}
          itemOrigem={itemParaRemanejamento}
          rubricas={rubricas}
        />
      )}

      {canOpenTransferHistory && (
        <HistoricoRemanejamentos
          isOpen={historicoModalOpen}
          onClose={() => setHistoricoModalOpen(false)}
          remanejamentos={remanejamentosComDados}
          canManageChildren={canManageChildren}
          isSubmitting={isSubmitting}
          onComeback={handleComebackRemanejamento}
        />
      )}

      <AppModalShell
        isOpen={Boolean(criticalConflictMessage)}
        title="Conflito de vínculo financeiro"
        description="A mesma pessoa não pode receber duas vezes no mesmo projeto."
        icon={<AlertCircle className="h-5 w-5" />}
        tone="danger"
        onClose={() => setCriticalConflictMessage(null)}
        maxWidthClassName="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-800">Bloqueio de regra de negócio</p>
            <p className="mt-1 text-sm text-red-700">{criticalConflictMessage}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            Ajuste o beneficiário deste item para continuar: selecione outra pessoa ou outra
            empresa sem responsável já vinculado financeiramente neste projeto.
          </div>
          <div className="flex justify-end border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setCriticalConflictMessage(null)}
              className="rounded-xl bg-[#004225] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#00351d]"
            >
              Entendi
            </button>
          </div>
        </div>
      </AppModalShell>
    </div>
  );
}

function SummaryMetricCard({
  label,
  value,
  description,
  tooltip,
  tone = 'slate',
}: {
  label: string;
  value: string;
  description: string;
  tooltip: string;
  tone?: 'emerald' | 'slate' | 'amber' | 'green' | 'blue' | 'danger';
}) {
  const toneStyles = {
    emerald: {
      surface: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-white',
      accent: 'from-emerald-500 to-teal-500',
      eyebrow: 'text-emerald-900/80',
      value: 'text-emerald-950',
      dot: 'bg-emerald-500',
      tooltipButton:
        'border-emerald-200 bg-white/80 text-emerald-700 hover:border-emerald-300 hover:text-emerald-800',
    },
    slate: {
      surface: 'border-slate-200 bg-gradient-to-br from-slate-100 via-white to-white',
      accent: 'from-slate-500 to-slate-700',
      eyebrow: 'text-slate-700',
      value: 'text-slate-950',
      dot: 'bg-slate-500',
      tooltipButton:
        'border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300 hover:text-slate-800',
    },
    amber: {
      surface: 'border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-white',
      accent: 'from-amber-400 to-orange-500',
      eyebrow: 'text-amber-900/80',
      value: 'text-amber-700',
      dot: 'bg-amber-500',
      tooltipButton:
        'border-amber-200 bg-white/80 text-amber-700 hover:border-amber-300 hover:text-amber-800',
    },
    green: {
      surface: 'border-lime-200/80 bg-gradient-to-br from-lime-50 via-white to-white',
      accent: 'from-lime-500 to-emerald-500',
      eyebrow: 'text-lime-900/80',
      value: 'text-emerald-700',
      dot: 'bg-emerald-500',
      tooltipButton:
        'border-lime-200 bg-white/80 text-emerald-700 hover:border-lime-300 hover:text-emerald-800',
    },
    blue: {
      surface: 'border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-white',
      accent: 'from-blue-500 to-indigo-500',
      eyebrow: 'text-blue-900/80',
      value: 'text-blue-700',
      dot: 'bg-blue-500',
      tooltipButton:
        'border-blue-200 bg-white/80 text-blue-700 hover:border-blue-300 hover:text-blue-800',
    },
    danger: {
      surface: 'border-red-200/90 bg-gradient-to-br from-red-50 via-white to-rose-50/80',
      accent: 'from-red-500 to-rose-500',
      eyebrow: 'text-red-900/85',
      value: 'text-red-700',
      dot: 'bg-red-500',
      tooltipButton:
        'border-red-200 bg-white/85 text-red-700 hover:border-red-300 hover:text-red-800',
    },
  }[tone];

  return (
    <div className={`relative overflow-visible rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${toneStyles.surface}`}>
      <div className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${toneStyles.accent}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${toneStyles.dot}`} />
            <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${toneStyles.eyebrow}`}>
              {label}
            </p>
          </div>
          <p className={`mt-3 text-xl font-semibold tracking-tight ${toneStyles.value}`}>{value}</p>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>

        <div className="group/tooltip relative shrink-0">
          <button
            type="button"
            aria-label={`Saiba mais sobre ${label}`}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${toneStyles.tooltipButton}`}
          >
            <Info className="h-4 w-4" />
          </button>
          <div
            role="tooltip"
            className="pointer-events-none absolute right-0 top-full z-30 mt-2 w-56 max-w-[calc(100vw-3rem)] translate-y-1 rounded-xl bg-slate-900 px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-xl transition-all duration-150 invisible group-hover/tooltip:visible group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100 group-focus-within/tooltip:visible group-focus-within/tooltip:translate-y-0 group-focus-within/tooltip:opacity-100"
          >
            {tooltip}
          </div>
        </div>
      </div>
    </div>
  );
}
