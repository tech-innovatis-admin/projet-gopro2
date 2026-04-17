"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";
import { getCompanyById, listProjectCompaniesDetailed, listProjects } from "@/src/lib/api/endpoints";
import type { ProjectCompanyDetailedResponseDTO, ProjectResponseDTO } from "@/src/lib/api/types";
import { StarRating } from "@/components/ui/StarRating";
import { FornecedorSummary, FornecedorInfo } from "./_components";
import { type Fornecedor, type FornecedorContratoVinculado } from "../types";
import { getFriendlyApiError, mapCompanyToFornecedor } from "../mappers";

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
  return {
    id: String(link.projectId),
    codigo: project?.code || link.contractNumber || `PRJ-${link.projectId}`,
    titulo: project?.name || link.description || `Contrato ${link.projectId}`,
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

export default function FornecedorPage() {
  const params = useParams();
  const fornecedorId = params.fornecedorId as string;
  const companyId = Number(fornecedorId);

  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null);
  const [contratos, setContratos] = useState<FornecedorContratoVinculado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!Number.isFinite(companyId) || companyId <= 0) {
        setError("Fornecedor inválido.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const [company, links, projects] = await Promise.all([
          getCompanyById(companyId),
          fetchAllProjectCompaniesDetailed(),
          fetchAllProjects(),
        ]);
        if (!mounted) return;
        const fornecedorMapped = mapCompanyToFornecedor(company);
        const linksByCompany = links.filter((link) => link.companyId === companyId && link.isActive);
        const projectMap = new Map(projects.map((p) => [p.id, p]));
        const contratosMapped = linksByCompany.map((link) => mapLinkToContrato(link, projectMap));

        setFornecedor(fornecedorMapped);
        setContratos(contratosMapped);
      } catch (loadError) {
        if (!mounted) return;
        setFornecedor(null);
        setContratos([]);
        setError(getFriendlyApiError(loadError));
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [companyId]);

  if (isLoading) return <div className="text-sm text-gray-500">Carregando fornecedor...</div>;
  if (!fornecedor) return <div className="text-sm text-red-600">{error || "Fornecedor não encontrado."}</div>;

  return (
    <div className="space-y-6">
      <FornecedorSummary fornecedor={fornecedor} contratosCount={contratos.length} />
      <FornecedorInfo fornecedor={fornecedor} />

      {contratos.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Contratos Vinculados</h3>
            </div>
            <Link
              href={`/fornecedores/${fornecedorId}/contratos`}
              className="text-sm font-medium text-[#1F4E79] hover:underline"
            >
              Ver todos ({contratos.length})
            </Link>
          </div>

          <div className="space-y-3">
            {contratos.slice(0, 3).map((contrato) => {
              const avaliacaoNota = contrato.avaliacao?.nota || 0;
              return (
                <div
                  key={contrato.id}
                  className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[#1F4E79]">{contrato.codigo}</span>
                      <span className="text-sm text-gray-900 truncate">{contrato.titulo}</span>
                    </div>
                    {avaliacaoNota > 0 && (
                      <div className="mt-1.5">
                        <StarRating nota={avaliacaoNota} readonly size="sm" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 ml-4">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(contrato.valorTotal)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

