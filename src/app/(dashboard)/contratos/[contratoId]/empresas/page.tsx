"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle, Edit2, FileText, Globe, Link2, MapPin, Plus, Trash2, X } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import {
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
import { type CompanyResponseDTO } from "@/src/lib/api/types";
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
  valorContrato?: number;
  dataInicio?: string;
  dataFim?: string;
  observacao?: string;
};

const DEFAULT_PAGE_SIZE = 100;

function parseProjectId(rawId: string) {
  const parsed = Number(rawId);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function digits(value?: string) {
  return (value || "").replace(/\D/g, "");
}

function formatZipCode(value?: string) {
  const onlyNumbers = digits(value).slice(0, 8);
  if (onlyNumbers.length <= 5) return onlyNumbers;
  return `${onlyNumbers.slice(0, 5)}-${onlyNumbers.slice(5)}`;
}

function formatPhone(value?: string) {
  const onlyNumbers = digits(value).slice(0, 11);
  if (!onlyNumbers) return "";
  if (onlyNumbers.length <= 2) return `(${onlyNumbers}`;
  if (onlyNumbers.length <= 6) return `(${onlyNumbers.slice(0, 2)}) ${onlyNumbers.slice(2)}`;
  if (onlyNumbers.length <= 10) {
    return `(${onlyNumbers.slice(0, 2)}) ${onlyNumbers.slice(2, 6)}-${onlyNumbers.slice(6)}`;
  }
  return `(${onlyNumbers.slice(0, 2)}) ${onlyNumbers.slice(2, 7)}-${onlyNumbers.slice(7)}`;
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

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

async function fetchViaCep(zipCode: string) {
  const normalizedZipCode = digits(zipCode);
  if (normalizedZipCode.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${normalizedZipCode}/json/`);
  if (!response.ok) {
    throw new Error("Não foi possível consultar o CEP.");
  }

  const data = (await response.json()) as ViaCepResponse;
  if (data.erro) return null;
  return data;
}

function isBlank(value?: string) {
  return !value || value.trim().length === 0;
}

function hasRequiredCompanyFields(formData: Partial<EmpresaProjeto>) {
  return (
    !isBlank(formData.razaoSocial) &&
    !isBlank(formData.nomeFantasia) &&
    !isBlank(formData.cnpj) &&
    !isBlank(formData.email) &&
    !isBlank(formData.telefone) &&
    !isBlank(formData.endereco) &&
    !isBlank(formData.cidade) &&
    !isBlank(formData.uf)
  );
}

function toOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function formatDateBr(value?: string) {
  if (!value) return "—";
  const parts = value.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return value;
}

function formatCurrency(value?: number) {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatCurrencyInput(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function parseCurrencyInput(input: string) {
  const onlyDigits = input.replace(/\D/g, "");
  if (!onlyDigits) return undefined;
  const cents = Number(onlyDigits);
  if (!Number.isFinite(cents)) return undefined;
  return cents / 100;
}

function getCompanyLabel(company: CompanyResponseDTO) {
  const tradeName = company.tradeName?.trim();
  return tradeName || company.name;
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
  const [savedMessage, setSavedMessage] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<EmpresaProjeto | null>(null);
  const [formData, setFormData] = useState<Partial<EmpresaProjeto>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | "">("");
  const [isLinking, setIsLinking] = useState(false);

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

  const totalValor = empresas.reduce((acc, empresa) => acc + (empresa.valorContrato || 0), 0);

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

      const linksPage = await listProjectCompaniesDetailed({
        page: 0,
        size: DEFAULT_PAGE_SIZE,
        projectId,
      });

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
          tipoServico: link.serviceType || "",
          tipoEmpresa: link.isIncubated ? "INCUBADA" : "INDEPENDENTE",
          valorContrato: typeof link.totalValue === "number" ? link.totalValue : undefined,
          dataInicio: link.startDate || undefined,
          dataFim: link.endDate || undefined,
          observacao: link.notes || undefined,
        };
      });

      setEmpresas(mapped);
    } catch (error) {
      setLoadError(getErrorMessage(error, "Falha ao carregar empresas do projeto."));
      setEmpresas([]);
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
      razaoSocial: "",
      nomeFantasia: "",
      cnpj: "",
      email: "",
      telefone: "",
      cep: "",
      endereco: "",
      cidade: "",
      uf: "",
      tipoServico: "",
      tipoEmpresa: "INDEPENDENTE",
      valorContrato: undefined,
      dataInicio: "",
      dataFim: "",
      observacao: "",
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (empresa: EmpresaProjeto) => {
    if (!ensureCanManageChildren()) return;
    setActionError(null);
    setEditingEmpresa(empresa);
    setFormData({ ...empresa });
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
      setSelectedCompanyId(selectableCompanies[0]?.id ?? "");
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
    if (!hasRequiredCompanyFields(formData)) {
      setActionError("Preencha os campos obrigatórios: razão social, nome fantasia, CNPJ, e-mail, telefone, endereço, cidade e UF.");
      return;
    }

    const cnpjDigits = digits(formData.cnpj);
    if (cnpjDigits.length !== 14) {
      setActionError("Informe um CNPJ válido com 14 dígitos.");
      return;
    }

    try {
      setIsSaving(true);
      setActionError(null);
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
      setActionError(getErrorMessage(error, "Não foi possível salvar a empresa."));
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
        <div className="flex flex-col items-center justify-center py-12 text-center"><p className="text-sm text-gray-500">Carregando empresas do projeto...</p></div>
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
          {empresas.map((empresa) => (
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
                <span className="font-semibold text-[#004225]">{formatCurrency(empresa.valorContrato)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {empresas.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-sm font-medium text-gray-700">Total: <strong className="text-gray-900">{empresas.length}</strong> empresa{empresas.length !== 1 ? "s" : ""}</span>
          <span className="text-sm text-gray-600">Valor total: <strong className="text-gray-900">{formatCurrency(totalValor)}</strong></span>
        </div>
      )}

      {canManageChildren && isFormModalOpen && (
        <CompanyFormModal
          formData={formData}
          setFormData={setFormData}
          isSaving={isSaving}
          isEditingItem={!!editingEmpresa}
          onClose={() => { setIsFormModalOpen(false); setEditingEmpresa(null); setFormData({}); }}
          onSave={() => { void saveEmpresa(); }}
          onDelete={editingEmpresa ? () => { void removeEmpresa(editingEmpresa.id); } : undefined}
        />
      )}

      {canManageChildren && isLinkModalOpen && (
        <LinkExistingCompanyModal
          companies={availableCompanies}
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

function CompanyFormModal({
  formData,
  setFormData,
  isSaving,
  isEditingItem,
  onSave,
  onClose,
  onDelete,
}: {
  formData: Partial<EmpresaProjeto>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<EmpresaProjeto>>>;
  isSaving: boolean;
  isEditingItem: boolean;
  onSave: () => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [isResolvingZipCode, setIsResolvingZipCode] = useState(false);
  const [zipCodeLookupError, setZipCodeLookupError] = useState<string | null>(null);

  const handleLookupZipCode = async (rawZipCode?: string) => {
    const normalizedZipCode = digits(rawZipCode ?? formData.cep);
    if (normalizedZipCode.length !== 8) {
      setZipCodeLookupError("CEP deve conter 8 dígitos.");
      return;
    }

    try {
      setZipCodeLookupError(null);
      setIsResolvingZipCode(true);
      const viaCepData = await fetchViaCep(normalizedZipCode);

      if (!viaCepData) {
        setZipCodeLookupError("CEP não encontrado.");
        return;
      }

      setFormData((prev) => {
        if (digits(prev.cep) !== normalizedZipCode) {
          return prev;
        }

        return {
          ...prev,
          cep: formatZipCode(normalizedZipCode),
          endereco: viaCepData.logradouro || prev.endereco,
          cidade: viaCepData.localidade || prev.cidade,
          uf: (viaCepData.uf || prev.uf || "").toUpperCase(),
        };
      });
    } catch {
      setZipCodeLookupError("Não foi possível consultar o CEP.");
    } finally {
      setIsResolvingZipCode(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#004225] to-[#00563A] text-white">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6"><BriefcaseBusinessIcon /></div>
            <h2 className="text-lg font-bold">{isEditingItem ? "Editar Empresa" : "Nova Empresa"}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Razão Social" required>
              <input type="text" value={formData.razaoSocial || ""} onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]" placeholder="Razão social da empresa" />
            </Field>
            <Field label="Nome Fantasia" required>
              <input type="text" value={formData.nomeFantasia || ""} onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]" placeholder="Nome fantasia" />
            </Field>
            <Field label="CNPJ" required>
              <input
                type="text"
                value={formData.cnpj || ""}
                onChange={(e) => setFormData({ ...formData, cnpj: formatCnpj(e.target.value) })}
                maxLength={18}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="00.000.000/0000-00"
              />
            </Field>
            <Field label="E-mail" required>
              <input type="email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]" placeholder="email@empresa.com.br" />
            </Field>
            <Field label="Telefone" required>
              <input
                type="text"
                value={formData.telefone || ""}
                onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                maxLength={15}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="(00) 00000-0000"
              />
            </Field>
            <Field label="CEP">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.cep || ""}
                    onChange={(e) => {
                      const formattedZipCode = formatZipCode(e.target.value);
                      setFormData({ ...formData, cep: formattedZipCode });
                      if (digits(formattedZipCode).length === 8) {
                        void handleLookupZipCode(formattedZipCode);
                      } else {
                        setZipCodeLookupError(null);
                      }
                    }}
                    onBlur={() => {
                      if (digits(formData.cep).length === 8) {
                        void handleLookupZipCode();
                      }
                    }}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void handleLookupZipCode();
                    }}
                    className="px-3 py-2 text-xs font-medium text-[#004225] border border-emerald-300 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isResolvingZipCode}
                  >
                    {isResolvingZipCode ? "Buscando..." : "Buscar CEP"}
                  </button>
                </div>
                {zipCodeLookupError ? (
                  <p className="text-xs text-red-600">{zipCodeLookupError}</p>
                ) : null}
              </div>
            </Field>
            <Field label="Endereço" required className="md:col-span-2">
              <input type="text" value={formData.endereco || ""} onChange={(e) => setFormData({ ...formData, endereco: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]" placeholder="Rua, número e bairro" />
            </Field>
            <Field label="Cidade" required>
              <input type="text" value={formData.cidade || ""} onChange={(e) => setFormData({ ...formData, cidade: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]" placeholder="Cidade" />
            </Field>
            <Field label="UF" required>
              <input
                type="text"
                value={formData.uf || ""}
                onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase().slice(0, 2) })}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="UF"
                maxLength={2}
              />
            </Field>
            <Field label="Tipo de Serviço" className="md:col-span-2">
              <input type="text" value={formData.tipoServico || ""} onChange={(e) => setFormData({ ...formData, tipoServico: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]" placeholder="Ex: Desenvolvimento de software" />
            </Field>
            <Field label="Tipo de Empresa">
              <select value={formData.tipoEmpresa || "INDEPENDENTE"} onChange={(e) => setFormData({ ...formData, tipoEmpresa: e.target.value as TipoEmpresa })} className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]">
                <option value="INDEPENDENTE">Independente</option>
                <option value="INCUBADA">Incubada</option>
              </select>
            </Field>
            <Field label="Valor do Contrato (R$)">
              <input type="text" inputMode="numeric" value={formatCurrencyInput(formData.valorContrato)} onChange={(e) => setFormData({ ...formData, valorContrato: parseCurrencyInput(e.target.value) })} className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]" placeholder="R$ 0,00" />
            </Field>
            <Field label="Data de Início">
              <DatePicker value={formData.dataInicio || ""} onChange={(value) => setFormData({ ...formData, dataInicio: value })} />
            </Field>
            <Field label="Data de Término">
              <DatePicker value={formData.dataFim || ""} onChange={(value) => setFormData({ ...formData, dataFim: value })} />
            </Field>
            <Field label="Observações" className="md:col-span-2">
              <textarea value={formData.observacao || ""} onChange={(e) => setFormData({ ...formData, observacao: e.target.value })} rows={3} className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] resize-none" placeholder="Observações adicionais" />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div>
            {isEditingItem && onDelete && (
              <button onClick={() => { if (confirm("Deseja realmente excluir esta empresa do projeto?")) { onDelete(); onClose(); } }} className="px-4 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 className="h-4 w-4 inline-block mr-2" />Excluir Vínculo
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
            <button onClick={onSave} disabled={isSaving || !hasRequiredCompanyFields(formData) || digits(formData.cnpj).length !== 14} className="px-6 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isSaving ? "Salvando..." : isEditingItem ? "Salvar Alterações" : "Adicionar Empresa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkExistingCompanyModal({
  companies,
  selectedCompanyId,
  setSelectedCompanyId,
  isLinking,
  onClose,
  onConfirm,
}: {
  companies: CompanyResponseDTO[];
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
          {companies.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Não ha empresas disponiveis para vincular.</div>
          ) : (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Empresa</label>
              <select value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(e.target.value ? Number(e.target.value) : "")} className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]">
                <option value="">Selecione...</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{getCompanyLabel(company)} - CNPJ {company.cnpj}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={onConfirm} disabled={companies.length === 0 || !selectedCompanyId || isLinking} className="px-6 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
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
