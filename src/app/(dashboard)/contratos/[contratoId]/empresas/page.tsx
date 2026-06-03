"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle, Edit2, FileText, Globe, Link2, MapPin, Plus, UserCircle2, X } from "lucide-react";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import {
  CompanyFormModal as SharedCompanyFormModal,
  type CompanyFormData,
  hasRequiredCompanyFields as hasRequiredSharedCompanyFields,
  onlyDigits as onlyDigitsShared,
} from "../_components/CompanyFormModal";
import { ContractLinkedItemsLoadingSkeleton } from "../_components/ContractLoadingSkeleton";
import {
  listBudgetItems,
  listBudgetTransfers,
  listExpenses,
  createCompany,
  createProjectCompany,
  deleteProjectCompany,
  listCompanies,
  listProjectCompaniesDetailed,
  updateCompany,
  updateProjectCompany,
} from "@/src/lib/api/endpoints";
import {
  canManageContractChildren,
  fetchCurrentUser,
  requireCurrentUserId,
} from "@/src/lib/auth/session";
import {
  type BudgetItemResponseDTO,
  type BudgetTransferResponseDTO,
  type CompanyResponseDTO,
  type ExpenseResponseDTO,
  type PageResponseDTO,
} from "@/src/lib/api/types";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";

const BriefcaseBusinessIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-briefcase-business">
    <path d="M12 12h.01" />
    <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <path d="M22 13a18.15 18.15 0 0 1-20 0" />
    <rect width="20" height="14" x="2" y="6" rx="2" />
  </svg>
);

type TipoEmpresa = "INCUBADA" | "INDEPENDENTE";

type ResponsavelEmpresa = {
  id: string;
  nome: string;
  cpf?: string;
  email?: string;
};

type EmpresaProjeto = {
  id: string;
  projectCompanyId?: number;
  companyId?: number;
  contractNumber?: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  email: string;
  telefone: string;
  cep?: string;
  endereco: string;
  cidade: string;
  uf: string;
  tipoServico?: string;
  tipoEmpresa: TipoEmpresa;
  responsavelPersonId?: string;
  responsavel?: ResponsavelEmpresa;
  valorContrato?: number;
  dataInicio?: string;
  dataFim?: string;
  observacao?: string;
  availableBalance?: number;
  executionPercentage?: number;
};

type BeneficiaryFinancialSummary = {
  finalBudgetAmount: number;
  paidAmount: number;
  pendingAmount: number;
};

const DEFAULT_PAGE_SIZE = 100;

function parseProjectId(rawId: string) {
  const parsed = Number(rawId);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function digits(value?: string) {
  return (value || "").replace(/\D/g, "");
}

function formatCnpj(value?: string) {
  const onlyNumbers = digits(value).slice(0, 14);
  if (onlyNumbers.length <= 2) return onlyNumbers;
  if (onlyNumbers.length <= 5) return `${onlyNumbers.slice(0, 2)}.${onlyNumbers.slice(2)}`;
  if (onlyNumbers.length <= 8) return `${onlyNumbers.slice(0, 2)}.${onlyNumbers.slice(2, 5)}.${onlyNumbers.slice(5)}`;
  if (onlyNumbers.length <= 12) {
    return `${onlyNumbers.slice(0, 2)}.${onlyNumbers.slice(2, 5)}.${onlyNumbers.slice(5, 8)}/${onlyNumbers.slice(8)}`;
  }
  return `${onlyNumbers.slice(0, 2)}.${onlyNumbers.slice(2, 5)}.${onlyNumbers.slice(5, 8)}/${onlyNumbers.slice(8, 12)}-${onlyNumbers.slice(12)}`;
}

function toOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function formatCurrency(value?: number) {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDateBr(value?: string) {
  if (!value) return "—";
  const parts = value.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return value;
}

function toSafeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDisplayedCompanyTotal(
  empresa: EmpresaProjeto,
  financialSummary?: BeneficiaryFinancialSummary,
) {
  if (financialSummary) {
    return financialSummary.finalBudgetAmount;
  }

  return typeof empresa.valorContrato === "number" ? empresa.valorContrato : undefined;
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

function getCompanyLabel(company: CompanyResponseDTO) {
  const tradeName = company.tradeName?.trim();
  return tradeName || company.name;
}

function getFormattedCpf(raw?: string | null) {
  const onlyNumbers = digits(raw ?? "").slice(0, 11);
  if (onlyNumbers.length !== 11) return undefined;
  return onlyNumbers.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

function getFormattedCnpj(raw?: string | null) {
  return formatCnpj(raw ?? "");
}

function getCompanyOptionLabel(company: CompanyResponseDTO) {
  const tradeName = company.tradeName?.trim();
  const legalName = company.name?.trim();
  const cnpj = getFormattedCnpj(company.cnpj);
  const nameLabel =
    tradeName && legalName && tradeName.localeCompare(legalName, "pt-BR", { sensitivity: "base" }) !== 0
      ? `${tradeName} - ${legalName}`
      : getCompanyLabel(company);
  return cnpj ? `${nameLabel} - CNPJ ${cnpj}` : nameLabel;
}

function getErrorMessage(error: unknown, fallback: string) {
  return getUserErrorMessage(error, fallback);
}

export default function EmpresasPage() {
  const params = useParams();
  const contratoId = params.contratoId as string;
  const projectId = parseProjectId(contratoId);

  const [empresas, setEmpresas] = useState<EmpresaProjeto[]>([]);
  const [allCompanies, setAllCompanies] = useState<CompanyResponseDTO[]>([]);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [canManageChildren, setCanManageChildren] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<EmpresaProjeto | null>(null);
  const [formData, setFormData] = useState<Partial<CompanyFormData>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | "">("");
  const [isLinking, setIsLinking] = useState(false);
  const [financialSummaryByProjectCompanyId, setFinancialSummaryByProjectCompanyId] = useState<
    Map<number, BeneficiaryFinancialSummary>
  >(new Map());
  const [rubricaUsageCountByProjectCompanyId, setRubricaUsageCountByProjectCompanyId] = useState<
    Map<number, number>
  >(new Map());

  const linkedCompanyIds = useMemo(
    () => new Set(empresas.map((e) => e.companyId).filter((id): id is number => typeof id === "number")),
    [empresas],
  );

  const availableCompanies = useMemo(
    () =>
      allCompanies
        .filter((company) => !linkedCompanyIds.has(company.id))
        .sort((a, b) => getCompanyLabel(a).localeCompare(getCompanyLabel(b), "pt-BR")),
    [allCompanies, linkedCompanyIds],
  );

  const availableCompanyOptions = useMemo<DropdownOption[]>(
    () =>
      availableCompanies.map((company) => ({
        value: String(company.id),
        label: getCompanyOptionLabel(company),
      })),
    [availableCompanies],
  );

  const totalValor = empresas.reduce((acc, empresa) => {
    const financialSummary = empresa.projectCompanyId
      ? financialSummaryByProjectCompanyId.get(empresa.projectCompanyId)
      : undefined;
    return acc + toSafeNumber(getDisplayedCompanyTotal(empresa, financialSummary));
  }, 0);

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

  const loadProjectCompanies = async () => {
    if (!projectId) {
      setLoadError("ID do contrato inválido.");
      setEmpresas([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      setActionError(null);

      const [linksPage, budgetItems, budgetTransfers, expenses] = await Promise.all([
        listProjectCompaniesDetailed({
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

      const links = linksPage.content.filter((item) => item.projectId === projectId);

      const mapped: EmpresaProjeto[] = links.map((link) => {
        return {
          id: String(link.id),
          projectCompanyId: link.id,
          companyId: link.companyId,
          contractNumber: link.contractNumber || undefined,
          razaoSocial: link.companyName || `Empresa #${link.companyId}`,
          nomeFantasia: link.companyTradeName || "",
          cnpj: link.companyCnpj || "",
          email: link.companyEmail || "",
          telefone: link.companyPhone || "",
          endereco: link.companyAddress || "",
          cidade: link.companyCity || "",
          uf: link.companyState || "",
          responsavelPersonId: link.companyResponsiblePersonId
            ? String(link.companyResponsiblePersonId)
            : undefined,
          responsavel: link.companyResponsiblePersonId
            ? {
                id: String(link.companyResponsiblePersonId),
                nome: link.companyResponsiblePersonFullName || `Pessoa #${link.companyResponsiblePersonId}`,
                cpf: getFormattedCpf(link.companyResponsiblePersonCpf),
                email: link.companyResponsiblePersonEmail || undefined,
              }
            : undefined,
          tipoServico: link.serviceType || "",
          tipoEmpresa: link.isIncubated ? "INCUBADA" : "INDEPENDENTE",
          valorContrato: typeof link.totalValue === "number" ? link.totalValue : undefined,
          dataInicio: link.startDate || undefined,
          dataFim: link.endDate || undefined,
          observacao: link.notes || undefined,
          availableBalance: typeof link.availableBalance === "number" ? link.availableBalance : undefined,
          executionPercentage:
            typeof link.executionPercentage === "number" ? link.executionPercentage : undefined,
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

      const summaryByProjectCompanyId = new Map<number, BeneficiaryFinancialSummary>();
      const usageCountByProjectCompanyId = new Map<number, number>();
      for (const item of budgetItems) {
        if (!item.isActive) continue;
        const isCompanyLinkedItem =
          item.projectCompanyId != null &&
          (item.beneficiaryType === "company" || item.beneficiaryType == null);
        if (!isCompanyLinkedItem) continue;

        const finalBudgetAmount =
          toSafeNumber(item.plannedAmount) + toSafeNumber(transferBalanceByItemId.get(item.id));
        const paidAmount = toSafeNumber(paidByBudgetItemId.get(item.id));

        const projectCompanyId = item.projectCompanyId as number;
        const current = summaryByProjectCompanyId.get(projectCompanyId) ?? {
          finalBudgetAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
        };

        const nextFinalBudgetAmount = current.finalBudgetAmount + finalBudgetAmount;
        const nextPaidAmount = current.paidAmount + paidAmount;
        summaryByProjectCompanyId.set(projectCompanyId, {
          finalBudgetAmount: nextFinalBudgetAmount,
          paidAmount: nextPaidAmount,
          pendingAmount: nextFinalBudgetAmount - nextPaidAmount,
        });
        usageCountByProjectCompanyId.set(
          projectCompanyId,
          toSafeNumber(usageCountByProjectCompanyId.get(projectCompanyId)) + 1,
        );
      }

      setFinancialSummaryByProjectCompanyId(summaryByProjectCompanyId);
      setRubricaUsageCountByProjectCompanyId(usageCountByProjectCompanyId);
      setEmpresas(mapped);
    } catch (error) {
      setLoadError(getErrorMessage(error, "Falha ao carregar empresas do projeto."));
      setEmpresas([]);
      setFinancialSummaryByProjectCompanyId(new Map());
      setRubricaUsageCountByProjectCompanyId(new Map());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProjectCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const openNewModal = () => {
    if (!ensureCanManageChildren()) return;
    setActionError(null);
    setEditingEmpresa(null);
    setFormData({
      tipoEmpresa: undefined,
      razaoSocial: "",
      nomeFantasia: "",
      cnpj: "",
      email: "",
      telefone: "",
      cep: "",
      endereco: "",
      cidade: "",
      uf: "",
      responsavelPersonId: "",
      responsavel: undefined,
      responsavelDesconhecido: false,
      tipoServico: "",
      valorContrato: undefined,
      dataInicio: "",
      dataFim: "",
      observacao: "",
      status: "CONTRATADA",
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (empresa: EmpresaProjeto) => {
    if (!ensureCanManageChildren()) return;
    setActionError(null);
    setEditingEmpresa(empresa);
    setFormData({ ...empresa, responsavelDesconhecido: !empresa.responsavelPersonId });
    setIsFormModalOpen(true);
  };

  const openLinkModal = async () => {
    if (!ensureCanManageChildren()) return;
    try {
      setActionError(null);
      let currentCompanies = allCompanies;
      if (allCompanies.length === 0) {
        const page = await listCompanies({ page: 0, size: 500 });
        currentCompanies = page.content;
        setAllCompanies(currentCompanies);
      }
      const selectableCompanies = currentCompanies
        .filter((company) => !linkedCompanyIds.has(company.id))
        .sort((a, b) => getCompanyLabel(a).localeCompare(getCompanyLabel(b), "pt-BR"));
      setSelectedCompanyId(selectableCompanies.length === 1 ? selectableCompanies[0].id : "");
      setIsLinkModalOpen(true);
    } catch (error) {
      setActionError(getErrorMessage(error, "Não foi possível carregar empresas existentes."));
    }
  };

  const saveEmpresa = async () => {
    if (!ensureCanManageChildren()) return;
    if (!projectId) {
      setActionError("ID do contrato inválido.");
      return;
    }
    if (!hasRequiredSharedCompanyFields(formData)) {
      setModalError("Preencha os campos obrigatórios: tipo de empresa, razão social, nome fantasia, CNPJ e responsável.");
      return;
    }

    const cnpjDigits = onlyDigitsShared(formData.cnpj);
    if (cnpjDigits.length !== 14) {
      setModalError("Informe um CNPJ válido com 14 dígitos.");
      return;
    }

    try {
      setIsSaving(true);
      setActionError(null);
      setModalError(null);
      const actorUserId = await requireCurrentUserId();

      const companyPayload = {
        name: formData.razaoSocial!.trim(),
        tradeName: formData.nomeFantasia!.trim(),
        cnpj: cnpjDigits,
        email: formData.email!.trim(),
        phone: formData.telefone!.trim(),
        address: formData.endereco!.trim(),
        city: formData.cidade!.trim(),
        state: formData.uf!.trim().toUpperCase(),
        responsiblePersonId: formData.responsavelPersonId
          ? Number(formData.responsavelPersonId)
          : null,
      };

      if (editingEmpresa?.projectCompanyId && editingEmpresa.companyId) {
        await updateCompany(editingEmpresa.companyId, companyPayload);
        await updateProjectCompany(editingEmpresa.projectCompanyId, {
          serviceType: toOptional(formData.tipoServico),
          totalValue: formData.valorContrato,
          startDate: toOptional(formData.dataInicio),
          endDate: toOptional(formData.dataFim),
          notes: toOptional(formData.observacao),
          isIncubated: formData.tipoEmpresa === "INCUBADA",
          status: formData.status,
          updatedBy: actorUserId,
        });
      } else {
        const company = await createCompany({ ...companyPayload, createdBy: actorUserId });
        await createProjectCompany({
          projectId,
          companyId: company.id,
          serviceType: toOptional(formData.tipoServico),
          totalValue: formData.valorContrato,
          startDate: toOptional(formData.dataInicio),
          endDate: toOptional(formData.dataFim),
          notes: toOptional(formData.observacao),
          isIncubated: formData.tipoEmpresa === "INCUBADA",
          status: formData.status,
          createdBy: actorUserId,
        });
      }

      await loadProjectCompanies();
      setIsFormModalOpen(false);
      setEditingEmpresa(null);
      setFormData({});
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (error) {
      setModalError(getErrorMessage(error, "Não foi possível salvar a empresa."));
    } finally {
      setIsSaving(false);
    }
  };

  const removeEmpresa = async (empresaId: string) => {
    if (!ensureCanManageChildren()) return;
    if (!confirm("Deseja realmente excluir este vínculo da empresa com o projeto?")) return;
    try {
      setActionError(null);
      const empresa = empresas.find((item) => item.id === empresaId);
      if (!empresa?.projectCompanyId) throw new Error("Vínculo da empresa não encontrado.");
      const linkedItemsCount = toSafeNumber(
        rubricaUsageCountByProjectCompanyId.get(empresa.projectCompanyId),
      );
      if (linkedItemsCount > 0) {
        setActionError(
          `Não é possível desvincular a empresa. Existem ${linkedItemsCount} item(ns) de rubrica ativo(s) vinculados a ela neste contrato.`,
        );
        return;
      }
      await deleteProjectCompany(empresa.projectCompanyId);
      await loadProjectCompanies();
    } catch (error) {
      setActionError(getErrorMessage(error, "Não foi possível excluir a empresa."));
    }
  };

  const linkExistingCompany = async () => {
    if (!ensureCanManageChildren()) return;
    if (!projectId) {
      setActionError("ID do contrato inválido.");
      return;
    }
    if (!selectedCompanyId || typeof selectedCompanyId !== "number") {
      setActionError("Selecione uma empresa para vincular.");
      return;
    }

    try {
      setIsLinking(true);
      setActionError(null);
      const actorUserId = await requireCurrentUserId();
      await createProjectCompany({
        projectId,
        companyId: selectedCompanyId,
        status: "CONTRATADA",
        isIncubated: false,
        createdBy: actorUserId,
      });
      await loadProjectCompanies();
      setIsLinkModalOpen(false);
      setSelectedCompanyId("");
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (error) {
      setActionError(getErrorMessage(error, "Não foi possível vincular a empresa."));
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Empresas do Projeto</h2>
          <p className="text-sm text-gray-500">Vincule empresas existentes ou cadastre novas para este projeto.</p>
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
              <button onClick={() => { void openLinkModal(); }} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#004225] bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors">
                <Link2 className="h-4 w-4" />
                Vincular Existente
              </button>
              <button onClick={openNewModal} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors">
                <Plus className="h-4 w-4" />
                Nova Empresa
              </button>
            </>
          )}
        </div>
      </div>

      {loadError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>}
      {actionError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>}
      {!loadingAccess && !canManageChildren && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Seu perfil pode consultar as empresas vinculadas, mas não pode criar, vincular, editar ou remover empresas.
        </div>
      )}

      {isLoading ? (
        <ContractLinkedItemsLoadingSkeleton titleWidthClassName="w-52" />
      ) : empresas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 bg-gray-100 rounded-full mb-4"><div className="h-8 w-8 text-gray-400"><BriefcaseBusinessIcon /></div></div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Nenhuma empresa vinculada</h3>
          <p className="text-sm text-gray-500 mb-4">Vincule uma empresa existente ou cadastre uma nova.</p>
          {canManageChildren && (
            <div className="flex items-center gap-3">
              <button onClick={() => { void openLinkModal(); }} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#004225] bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors"><Link2 className="h-4 w-4" />Vincular Existente</button>
              <button onClick={openNewModal} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"><Plus className="h-4 w-4" />Nova Empresa</button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {empresas.map((empresa) => {
            const financialSummary = empresa.projectCompanyId
              ? financialSummaryByProjectCompanyId.get(empresa.projectCompanyId)
              : undefined;
            const displayedCompanyTotal = getDisplayedCompanyTotal(empresa, financialSummary);
            const executionPercentage =
              typeof empresa.executionPercentage === "number"
                ? empresa.executionPercentage
                : financialSummary && financialSummary.finalBudgetAmount > 0
                  ? (financialSummary.paidAmount / financialSummary.finalBudgetAmount) * 100
                  : 0;
            return (
              <div key={empresa.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded-lg"><div className="h-5 w-5 text-green-600"><BriefcaseBusinessIcon /></div></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{empresa.nomeFantasia || empresa.razaoSocial}</h3>
                    <p className="text-xs text-gray-500">{empresa.razaoSocial}</p>
                    <p className="text-xs text-gray-400 mt-0.5">CNPJ: {empresa.cnpj || "—"}</p>
                    <p className="text-xs text-gray-400">Contrato: {empresa.contractNumber || "—"}</p>
                  </div>
                </div>
                {canManageChildren ? (
                  <button onClick={() => openEditModal(empresa)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#004225] border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors" title="Editar">
                    <Edit2 className="h-4 w-4" />Editar
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">Somente leitura</span>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${empresa.tipoEmpresa === "INCUBADA" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>
                    {empresa.tipoEmpresa === "INCUBADA" ? "Incubada" : "Independente"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600"><FileText className="h-4 w-4 text-gray-400" /><span>{empresa.tipoServico || "—"}</span></div>
                {(empresa.cidade || empresa.uf) && <div className="flex items-center gap-2 text-gray-600"><MapPin className="h-4 w-4 text-gray-400" /><span>{[empresa.cidade, empresa.uf].filter(Boolean).join(" - ")}</span></div>}
                {empresa.email && <div className="flex items-center gap-2 text-gray-600"><Globe className="h-4 w-4 text-gray-400" /><span>{empresa.email}</span></div>}
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2.5">
                  <div className="flex items-start gap-2.5">
                    <UserCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" />
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">
                        Responsável da empresa
                      </p>
                      {empresa.responsavel ? (
                        <>
                          <p className="text-sm font-medium text-gray-900">{empresa.responsavel.nome}</p>
                          {empresa.responsavel.cpf ? (
                            <p className="text-xs text-gray-500">CPF: {empresa.responsavel.cpf}</p>
                          ) : null}
                          {empresa.responsavel.email ? (
                            <p className="text-xs text-gray-500">{empresa.responsavel.email}</p>
                          ) : null}
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">Nenhum responsável definido.</p>
                      )}
                    </div>
                  </div>
                </div>
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
                    <p className="text-sm text-gray-700">
                      Percentual executado:{" "}
                      <strong className="text-blue-700">
                        {Number.isFinite(executionPercentage)
                          ? `${executionPercentage.toFixed(2).replace(".", ",")}%`
                          : "0,00%"}
                      </strong>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-end justify-between mt-4 pt-3 border-t border-gray-100 gap-3">
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-gray-500">{empresa.dataInicio && empresa.dataFim ? `${formatDateBr(empresa.dataInicio)} ate ${formatDateBr(empresa.dataFim)}` : "Período não informado"}</div>
                  {typeof empresa.companyId === "number" ? (
                    <Link
                      href={`/fornecedores/${empresa.companyId}`}
                      className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#004225] border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      Ver fornecedor
                    </Link>
                  ) : (
                    <span className="inline-flex w-fit items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-400 border border-gray-200 bg-gray-50 rounded-lg cursor-not-allowed">
                      <Link2 className="h-3.5 w-3.5" />
                      Fornecedor indisponível
                    </span>
                  )}
                </div>
                <span className="font-semibold text-[#004225]">{formatCurrency(displayedCompanyTotal)}</span>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {empresas.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-sm font-medium text-gray-700">Total: <strong className="text-gray-900">{empresas.length}</strong> empresa{empresas.length !== 1 ? "s" : ""}</span>
          <span className="text-sm text-gray-600">Valor total: <strong className="text-gray-900">{formatCurrency(totalValor)}</strong></span>
        </div>
      )}

      {canManageChildren && isFormModalOpen && (
        <SharedCompanyFormModal
          isOpen={isFormModalOpen}
          formData={formData}
          setFormData={setFormData}
          isSaving={isSaving}
          isEditingItem={!!editingEmpresa}
          onClose={() => { setIsFormModalOpen(false); setEditingEmpresa(null); setFormData({}); setModalError(null); }}
          onSave={() => { void saveEmpresa(); }}
          onDelete={editingEmpresa ? () => { void removeEmpresa(editingEmpresa.id); } : undefined}
          errorMessage={modalError}
        />
      )}

      {canManageChildren && isLinkModalOpen && (
        <LinkExistingCompanyModal
          options={availableCompanyOptions}
          selectedCompanyId={selectedCompanyId}
          setSelectedCompanyId={setSelectedCompanyId}
          isLinking={isLinking}
          onClose={() => { setIsLinkModalOpen(false); setSelectedCompanyId(""); }}
          onConfirm={() => { void linkExistingCompany(); }}
        />
      )}
    </div>
  );
}

function LinkExistingCompanyModal({
  options,
  selectedCompanyId,
  setSelectedCompanyId,
  isLinking,
  onClose,
  onConfirm,
}: {
  options: DropdownOption[];
  selectedCompanyId: number | "";
  setSelectedCompanyId: React.Dispatch<React.SetStateAction<number | "">>;
  isLinking: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#004225] to-[#00563A] text-white">
          <h2 className="text-lg font-bold">Vincular Empresa Existente</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {options.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Não ha empresas disponiveis para vincular.</div>
          ) : (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Empresa</label>
              <Dropdown
                options={options}
                value={selectedCompanyId ? String(selectedCompanyId) : undefined}
                onChange={(value) => setSelectedCompanyId(value ? Number(value) : "")}
                placeholder="Pesquise por nome ou CNPJ"
                searchable
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Digite parte do nome fantasia, razao social ou CNPJ para localizar a empresa.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={onConfirm} disabled={options.length === 0 || !selectedCompanyId || isLinking} className="px-6 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isLinking ? "Vinculando..." : "Vincular"}
          </button>
        </div>
      </div>
    </div>
  );
}



