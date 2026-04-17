"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Link2, Plus, X } from "lucide-react";
import {
  createProjectCompany,
  getCompanyById,
  listProjectCompaniesDetailed,
  listProjects,
} from "@/src/lib/api/endpoints";
import { requireCurrentUserId } from "@/src/lib/auth/session";
import type { ProjectCompanyDetailedResponseDTO, ProjectResponseDTO } from "@/src/lib/api/types";
import { FornecedorContractsTable } from "../_components";
import { type Fornecedor, type FornecedorContratoVinculado } from "../../types";
import { getFriendlyApiError, mapCompanyToFornecedor } from "../../mappers";

const PAGE_SIZE = 100;

function mapProjectStatusToContratoStatus(
  status: ProjectResponseDTO["projectStatus"] | undefined
): FornecedorContratoVinculado["status"] {
  if (status === "FINALIZADO") return "CONCLUIDO";
  if (status === "SUSPENSO") return "SUSPENSO";
  return "EM_ANDAMENTO";
}

function mapLinkToContrato(
  link: ProjectCompanyDetailedResponseDTO,
  projectMap: Map<number, ProjectResponseDTO>
): FornecedorContratoVinculado {
  const project = projectMap.get(link.projectId);
  const titulo = project?.name || link.description || `Contrato ${link.projectId}`;

  return {
    id: String(link.projectId),
    codigo: project?.code || link.contractNumber || `PRJ-${link.projectId}`,
    titulo,
    status: mapProjectStatusToContratoStatus(project?.projectStatus),
    valorTotal: Number(link.totalValue ?? project?.contractValue ?? 0),
    dataInicio:
      link.startDate ||
      project?.startDate ||
      project?.openingDate ||
      link.createdAt ||
      new Date().toISOString(),
    dataFim: link.endDate || project?.endDate || project?.closingDate || undefined,
    fornecedorId: String(link.companyId),
  };
}

async function fetchAllProjectCompaniesDetailed(): Promise<ProjectCompanyDetailedResponseDTO[]> {
  const first = await listProjectCompaniesDetailed({ page: 0, size: PAGE_SIZE });
  let all = [...first.content];
  for (let page = 1; page < first.totalPages; page += 1) {
    const next = await listProjectCompaniesDetailed({ page, size: PAGE_SIZE });
    all = all.concat(next.content);
  }
  return all;
}

async function fetchAllProjects(): Promise<ProjectResponseDTO[]> {
  const first = await listProjects({ page: 0, size: PAGE_SIZE });
  let all = [...first.content];
  for (let page = 1; page < first.totalPages; page += 1) {
    const next = await listProjects({ page, size: PAGE_SIZE });
    all = all.concat(next.content);
  }
  return all;
}

export default function FornecedorContratosPage() {
  const params = useParams();
  const fornecedorId = params.fornecedorId as string;
  const companyId = Number(fornecedorId);

  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null);
  const [contratos, setContratos] = useState<FornecedorContratoVinculado[]>([]);
  const [projects, setProjects] = useState<ProjectResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">("");

  const loadData = async () => {
    if (!Number.isFinite(companyId) || companyId <= 0) {
      setError("Fornecedor inválido.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setActionError(null);
    try {
      const [company, links, allProjects] = await Promise.all([
        getCompanyById(companyId),
        fetchAllProjectCompaniesDetailed(),
        fetchAllProjects(),
      ]);

      const fornecedorMapped = mapCompanyToFornecedor(company);
      const linksByCompany = links.filter((link) => link.companyId === companyId && link.isActive);
      const projectMap = new Map(allProjects.map((p) => [p.id, p]));
      const mappedContratos = linksByCompany.map((link) => mapLinkToContrato(link, projectMap));

      setFornecedor(fornecedorMapped);
      setContratos(mappedContratos);
      setProjects(allProjects);
    } catch (loadError) {
      setFornecedor(null);
      setContratos([]);
      setProjects([]);
      setError(getFriendlyApiError(loadError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fornecedorId]);

  const linkedProjectIds = useMemo(
    () => new Set(contratos.map((contrato) => Number(contrato.id))),
    [contratos]
  );

  const availableProjects = useMemo(
    () =>
      projects
        .filter((project) => !linkedProjectIds.has(project.id))
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [projects, linkedProjectIds]
  );

  const totalValor = contratos.reduce((sum, c) => sum + c.valorTotal, 0);
  const emAndamento = contratos.filter((c) => c.status === "EM_ANDAMENTO").length;
  const concluidos = contratos.filter((c) => c.status === "CONCLUIDO").length;

  const openLinkModal = () => {
    setActionError(null);
    setSelectedProjectId(availableProjects[0]?.id ?? "");
    setIsLinkModalOpen(true);
  };

  const handleLinkProject = async () => {
    if (!fornecedor || !selectedProjectId || typeof selectedProjectId !== "number") {
      setActionError("Selecione um contrato para vincular.");
      return;
    }
    try {
      setIsLinking(true);
      setActionError(null);
      const actorUserId = await requireCurrentUserId();
      await createProjectCompany({
        projectId: selectedProjectId,
        companyId: Number(fornecedor.id),
        createdBy: actorUserId,
      });
      setIsLinkModalOpen(false);
      setSelectedProjectId("");
      await loadData();
    } catch (linkError) {
      setActionError(getFriendlyApiError(linkError));
    } finally {
      setIsLinking(false);
    }
  };

  if (isLoading) return <div className="text-sm text-gray-500">Carregando fornecedor...</div>;
  if (!fornecedor) return <div className="text-sm text-red-600">{error || "Fornecedor não encontrado."}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Contratos Vinculados</h2>
          <p className="text-sm text-gray-500">Todos os contratos associados a {fornecedor.nome}</p>
        </div>
        <button
          onClick={openLinkModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Vincular contrato
        </button>
      </div>

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {contratos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Total de Contratos</p>
            <p className="text-2xl font-bold text-gray-900">{contratos.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Valor Total</p>
            <p className="text-2xl font-bold text-[#1F4E79]">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                notation: "compact",
              }).format(totalValor)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-sm font-medium text-gray-700">{emAndamento} em andamento</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-gray-700">
                  {concluidos} concluído{concluidos !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <FornecedorContractsTable contratos={contratos} fornecedor={fornecedor} />

      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#004225] to-[#00563A] text-white">
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                <h2 className="text-lg font-bold">Vincular Contrato</h2>
              </div>
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {availableProjects.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Não há contratos disponíveis para vincular.
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Contrato</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                  >
                    <option value="">Selecione...</option>
                    {availableProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.code ? `${project.code} - ` : ""}{project.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleLinkProject()}
                disabled={availableProjects.length === 0 || !selectedProjectId || isLinking}
                className="px-6 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLinking ? "Vinculando..." : "Vincular"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

