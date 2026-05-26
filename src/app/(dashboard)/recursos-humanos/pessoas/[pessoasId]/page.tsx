"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/components/ui/NavBar";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Clock,
  Building2,
  Briefcase,
  ExternalLink,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchPersonById, formatDate, formatCurrency } from "../data";
import { PersonManagementActions, type PersonActionFeedback } from "../_components";
import { formatCPF, formatPhone } from "../person-utils";
import {
  PROJECT_PERSON_STATUS_CONFIG,
  CONTRACT_TYPE_LABELS,
  type Person,
  type ProjectPerson,
} from "../types";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";

// =============================================================================
// PÁGINA DE DETALHES DA PESSOA
// =============================================================================

export default function PessoaDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const pessoaId = params.pessoasId as string;

  const [person, setPerson] = useState<Awaited<ReturnType<typeof fetchPersonById>>>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<PersonActionFeedback | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPerson = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchPersonById(pessoaId);
        if (isMounted) {
          setPerson(response);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getUserErrorMessage(loadError, "Falha ao carregar pessoa."));
          setPerson(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPerson();

    return () => {
      isMounted = false;
    };
  }, [pessoaId]);

  // Ordena projetos: ativos primeiro, depois pendentes, depois encerrados
  const sortedProjects = useMemo(() => {
    if (!person) return [];
    return [...person.projects].sort((a, b) => {
      const statusOrder = { 1: 0, 0: 1, 2: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [person]);

  // Calcula totais
  const totals = useMemo(() => {
    if (!person) return { activeHours: 0, activeAmount: 0 };
    const activeProjects = person.projects.filter((p) => p.status === 1);
    return {
      activeHours: activeProjects.reduce((sum, p) => sum + (p.workloadHours || 0), 0),
      activeAmount: activeProjects.reduce((sum, p) => sum + (p.baseAmount || 0), 0),
    };
  }, [person]);

  // Função para obter iniciais do nome
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handlePersonUpdated = useCallback((updatedPerson: Person) => {
    setPerson((current) => (current ? { ...current, ...updatedPerson } : current));
  }, []);

  const handlePersonDeactivated = useCallback(() => {
    router.push("/recursos-humanos/pessoas");
    router.refresh();
  }, [router]);

  if (isLoading) {
    return <PessoaDetalhesLoadingSkeleton />;
  }
  if (!person) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <User className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Pessoa não encontrada
            </h2>
            <p className="text-gray-500 mb-6">
              {error || "A pessoa solicitada não existe ou foi removida."}
            </p>
            <Link
              href="/recursos-humanos/pessoas"
              className="flex items-center gap-2 text-[#004225] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para lista
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Breadcrumb */}
          <Link
            href="/recursos-humanos/pessoas"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para pessoas
          </Link>

          {feedback && (
            <div
              className={cn(
                "rounded-lg px-4 py-3 text-sm",
                feedback.type === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border border-red-200 bg-red-50 text-red-700"
              )}
            >
              {feedback.message}
            </div>
          )}

          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="h-20 w-20 rounded-full bg-[#004225]/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#004225]">
                    {getInitials(person.fullName)}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {person.fullName}
                  </h1>
                  {person.cpf && (
                    <p className="text-sm text-gray-500 mt-1">CPF: {formatCPF(person.cpf)}</p>
                  )}

                  {/* Contato */}
                  <div className="flex flex-wrap gap-4 mt-4">
                    {person.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a
                          href={`mailto:${person.email}`}
                          className="hover:text-[#004225] hover:underline"
                        >
                          {person.email}
                        </a>
                      </div>
                    )}
                    {person.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{formatPhone(person.phone)}</span>
                      </div>
                    )}
                    {person.city && person.state && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>
                          {person.city}, {person.state}
                        </span>
                      </div>
                    )}
                    {person.birthDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(person.birthDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <PersonManagementActions
                person={person}
                onPersonUpdated={handlePersonUpdated}
                onPersonDeactivated={handlePersonDeactivated}
                onFeedback={setFeedback}
              />
            </div>
          </div>

          {/* Cards de resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-green-600 font-medium mb-1">
                Projetos Ativos
              </p>
              <p className="text-2xl font-bold text-green-700">
                {person.activeProjectsCount}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-gray-600 font-medium mb-1">
                Total de Projetos
              </p>
              <p className="text-2xl font-bold text-gray-700">
                {person.totalProjectsCount}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-blue-600 font-medium mb-1">
                Carga Horária Ativa
              </p>
              <p className="text-2xl font-bold text-blue-700">
                {totals.activeHours}h
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-purple-600 font-medium mb-1">
                Valor Total Ativo
              </p>
              <p className="text-xl font-bold text-purple-700">
                {formatCurrency(totals.activeAmount)}
              </p>
            </div>
          </div>

          {/* Tabela de projetos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Vínculos com Projetos
              </h2>
            </div>

            {sortedProjects.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum vínculo com projeto</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Projeto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Função
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Vínculo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Contrato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Carga Horária
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Período
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedProjects.map((project) => (
                      <ProjectRow key={project.id} project={project} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Observações */}
          {person.notes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Observações
              </h2>
              <p className="text-sm text-gray-700">{person.notes}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function PessoaDetalhesLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-48 rounded bg-gray-200" />

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 rounded-full bg-gray-200" />
                <div className="space-y-2">
                  <div className="h-8 w-72 rounded bg-gray-200" />
                  <div className="h-4 w-40 rounded bg-gray-200" />
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="h-4 w-56 rounded bg-gray-200" />
                    <div className="h-4 w-40 rounded bg-gray-200" />
                    <div className="h-4 w-44 rounded bg-gray-200" />
                    <div className="h-4 w-36 rounded bg-gray-200" />
                  </div>
                </div>
              </div>
              <div className="h-10 w-36 rounded bg-gray-200" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`pessoa-resumo-skeleton-${index}`} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="mt-2 h-8 w-16 rounded bg-gray-200" />
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="h-6 w-52 rounded bg-gray-200" />
            </div>
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={`pessoa-projetos-skeleton-${index}`} className="h-12 rounded bg-gray-200" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// =============================================================================
// LINHA DA TABELA DE PROJETOS
// =============================================================================

function ProjectRow({ project }: { project: ProjectPerson }) {
  const statusConfig = PROJECT_PERSON_STATUS_CONFIG[project.status];

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <Link href={`/contratos/${project.projectId}`} className="group block rounded-md -mx-2 px-2 py-1">
          <p className="text-sm font-medium text-gray-900 group-hover:text-[#004225]">
            {project.projectName}
          </p>
          <span className="inline-flex items-center gap-1 text-xs text-[#004225] group-hover:underline">
            {project.projectCode}
            <ExternalLink className="h-3 w-3" />
          </span>
        </Link>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Briefcase className="h-4 w-4 text-gray-400" />
          <span>{project.role || "-"}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Building2 className="h-4 w-4 text-gray-400" />
          <span>{project.institutionalLink || "-"}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-700">
        {project.contractType ? CONTRACT_TYPE_LABELS[project.contractType] : "-"}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Clock className="h-4 w-4 text-gray-400" />
          <span>{project.workloadHours ? `${project.workloadHours}h` : "-"}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-700">
        {formatDate(project.startDate)}
        {project.endDate ? ` - ${formatDate(project.endDate)}` : " - Atual"}
      </td>
      <td className="px-6 py-4 text-sm font-medium text-gray-900">
        {project.baseAmount ? formatCurrency(project.baseAmount) : "-"}
      </td>
      <td className="px-6 py-4">
        <span
          className={cn(
            "inline-flex px-2.5 py-1 text-xs font-medium rounded-full",
            statusConfig.bg,
            statusConfig.text
          )}
        >
          {statusConfig.label}
        </span>
      </td>
    </tr>
  );
}


