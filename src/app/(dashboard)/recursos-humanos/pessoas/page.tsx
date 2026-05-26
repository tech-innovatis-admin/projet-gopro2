"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { NavBar } from "@/components/ui/NavBar";
import {
  PeopleTable,
  PersonActionItem,
  PersonManagementActions,
  type PersonActionFeedback,
} from "./_components";
import { fetchPeopleWithProjects, formatDate, formatCurrency } from "./data";
import { type Person, type PersonWithProjects, PROJECT_PERSON_STATUS_CONFIG, CONTRACT_TYPE_LABELS } from "./types";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";
import { formatCPF, formatPhone } from "./person-utils";
import {
  ChevronRight,
  Home,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Clock,
  Building2,
  Briefcase,
  Eye,
  ExternalLink,
  Users,
  UserMinus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// PÁGINA DE PESSOAS EM PROJETOS
// =============================================================================

export default function PessoasPage() {
  // Carrega pessoas com seus vínculos de projetos
  const [people, setPeople] = useState<PersonWithProjects[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<PersonActionFeedback | null>(null);

  // Estado de seleção
  const [selectedPersonId, setSelectedPersonId] = useState<string | undefined>();
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPeople = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchPeopleWithProjects();
        if (isMounted) {
          setPeople(response);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getUserErrorMessage(loadError, "Falha ao carregar pessoas."));
          setPeople([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPeople();

    return () => {
      isMounted = false;
    };
  }, []);
  // Pessoa selecionada
  const selectedPerson = useMemo(() => {
    return selectedPersonId
      ? people.find((p) => p.id === selectedPersonId) ?? null
      : null;
  }, [people, selectedPersonId]);

  // Calcula estatísticas gerais
  const generalStats = useMemo(() => {
    const totalPeople = people.length;
    const peopleWithoutLinks = people.filter((p) => p.totalProjectsCount === 0).length;
    const peopleInActiveProjects = people.filter((p) => p.activeProjectsCount > 0).length;
    const peopleInCompletedProjects = people.filter((p) => p.projects.some((pp) => pp.status === 2)).length;

    return {
      totalPeople,
      peopleWithoutLinks,
      peopleInActiveProjects,
      peopleInCompletedProjects,
    };
  }, [people]);

  // Calcula totais da pessoa selecionada
  const totals = useMemo(() => {
    if (!selectedPerson) return { activeHours: 0, activeAmount: 0 };
    const activeProjects = selectedPerson.projects.filter((p) => p.status === 1);
    return {
      activeHours: activeProjects.reduce((sum, p) => sum + (p.workloadHours || 0), 0),
      activeAmount: activeProjects.reduce((sum, p) => sum + (p.baseAmount || 0), 0),
    };
  }, [selectedPerson]);

  // Ordena projetos: ativos primeiro, depois pendentes, depois encerrados
  const sortedProjects = useMemo(() => {
    if (!selectedPerson) return [];
    return [...selectedPerson.projects].sort((a, b) => {
      const statusOrder = { 1: 0, 0: 1, 2: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [selectedPerson]);

  // Handler: selecionar pessoa
  const handlePersonSelect = useCallback((person: PersonWithProjects) => {
    setSelectedPersonId(person.id);
    setIsProjectsExpanded(false);
  }, []);

  // Handler: fechar seleção
  const handleClose = useCallback(() => {
    setSelectedPersonId(undefined);
    setIsProjectsExpanded(false);
  }, []);

  const handlePersonUpdated = useCallback((updatedPerson: Person) => {
    setPeople((current) =>
      current.map((person) =>
        person.id === updatedPerson.id ? { ...person, ...updatedPerson } : person
      )
    );
  }, []);

  const handlePersonDeactivated = useCallback((personId: string) => {
    setPeople((current) => current.filter((person) => person.id !== personId));
    setSelectedPersonId((current) => (current === personId ? undefined : current));
    setIsProjectsExpanded(false);
  }, []);

  // Função para obter iniciais do nome
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (isLoading) {
    return <PessoasPageLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <NavBar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/home" className="hover:text-gray-700 flex items-center gap-1">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/recursos-humanos" className="hover:text-gray-700">
            Recursos Humanos
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Pessoas em Projetos</span>
        </nav>

        {/* Header da Página */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pessoas em Projetos</h1>
          <p className="text-sm text-gray-600">
            Visualize as pessoas cadastradas e seus vínculos com projetos.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {feedback && (
          <div
            className={cn(
              "mb-6 rounded-lg px-4 py-3 text-sm",
              feedback.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-red-200 bg-red-50 text-red-700"
            )}
          >
            {feedback.message}
          </div>
        )}

        {/* Resumo Rápido - Sempre visível */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-[#004225]/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-[#004225]" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pessoas Cadastradas</p>
                  <p className="text-2xl font-bold text-gray-900">{generalStats.totalPeople}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                  <UserMinus className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pessoas sem vínculos</p>
                  <p className="text-2xl font-bold text-gray-900">{generalStats.peopleWithoutLinks}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pessoas em Projetos Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">{generalStats.peopleInActiveProjects}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-[#004225]/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-[#004225]" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pessoas em Projetos Concluídos</p>
                  <p className="text-2xl font-bold text-gray-900">{generalStats.peopleInCompletedProjects}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layout: Tabela e Informações lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tabela de Pessoas - Ocupa metade da tela */}
          <div className="lg:col-span-1">
            <PeopleTable
              people={people}
              isLoading={isLoading}
              selectedPersonId={selectedPersonId}
              onPersonSelect={handlePersonSelect}
            />
          </div>

          {/* Informações da Pessoa Selecionada - Ocupa metade da tela */}
          <div className="lg:col-span-1">
            {selectedPerson ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full animate-in slide-in-from-right-2 duration-300">
                {/* Linha principal */}
                <div className="mb-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3">
                    {/* Avatar */}
                    <div className="row-span-3 flex h-16 w-16 items-center justify-center self-start rounded-full bg-[#004225]/10">
                      <span className="text-xl font-bold text-[#004225]">
                        {getInitials(selectedPerson.fullName)}
                      </span>
                    </div>

                    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                      <h2 className="min-w-0 text-xl font-bold leading-tight text-[#003319]">
                        {selectedPerson.fullName}
                      </h2>
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50/80 p-1">
                          <PersonActionItem
                            label="Ver página completa"
                            href={`/recursos-humanos/pessoas/${selectedPerson.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            icon={<Eye className="h-4 w-4" />}
                          />
                          <div className="h-5 w-px bg-gray-200" aria-hidden="true" />
                          <PersonManagementActions
                            person={selectedPerson}
                            compact
                            onPersonUpdated={handlePersonUpdated}
                            onPersonDeactivated={handlePersonDeactivated}
                            onFeedback={setFeedback}
                          />
                        </div>
                        <button
                          onClick={handleClose}
                          className="flex-shrink-0 rounded-lg p-2 transition-colors hover:bg-gray-100"
                          title="Fechar"
                        >
                          <X className="h-5 w-5 text-gray-500" />
                        </button>
                      </div>
                    </div>

                    {selectedPerson.cpf && (
                      <p className="text-sm text-gray-500">
                        CPF: {formatCPF(selectedPerson.cpf)}
                      </p>
                    )}

                    {/* Contato inline */}
                    <div className="grid grid-cols-2 gap-2">
                      {selectedPerson.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <a
                            href={`mailto:${selectedPerson.email}`}
                            className="truncate hover:text-[#004225] hover:underline"
                          >
                            {selectedPerson.email}
                          </a>
                        </div>
                      )}
                      {selectedPerson.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{formatPhone(selectedPerson.phone)}</span>
                        </div>
                      )}
                      {selectedPerson.city && selectedPerson.state && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>
                            {selectedPerson.city}, {selectedPerson.state}
                          </span>
                        </div>
                      )}
                      {selectedPerson.birthDate && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(selectedPerson.birthDate)}</span>
                        </div>
                      )}
                    </div>
                </div>

                {/* Cards de resumo */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600 mb-1">Projetos Ativos</p>
                    <p className="text-xl font-bold text-green-700">
                      {selectedPerson.activeProjectsCount}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Total de Projetos</p>
                    <p className="text-xl font-bold text-gray-700">
                      {selectedPerson.totalProjectsCount}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-600 mb-1">Valor Total Ativo</p>
                    <p className="text-lg font-bold text-purple-700">
                      {formatCurrency(totals.activeAmount)}
                    </p>
                  </div>
                </div>

                {/* Seção de Projetos (expansível) */}
                {selectedPerson.totalProjectsCount > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <h3 className="text-sm font-semibold text-gray-700">
                        Vínculos com Projetos ({selectedPerson.totalProjectsCount})
                      </h3>
                      {isProjectsExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      )}
                    </button>

                    {isProjectsExpanded && (
                      <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200 max-h-[400px] overflow-y-auto">
                        {sortedProjects.map((project) => {
                          const statusConfig = PROJECT_PERSON_STATUS_CONFIG[project.status];
                          return (
                            <div
                              key={project.id}
                              className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                            >
                              {/* Header */}
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="min-w-0 flex-1">
                                  <Link
                                    href={`/contratos/${project.projectId}`}
                                    className="group inline-block min-w-0"
                                  >
                                    <p className="truncate text-sm font-medium text-gray-900 group-hover:text-[#004225]">
                                      {project.projectName}
                                    </p>
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#004225] group-hover:underline">
                                      {project.projectCode}
                                      <ExternalLink className="h-3 w-3" />
                                    </span>
                                  </Link>
                                </div>
                                <span
                                  className={cn(
                                    "flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full",
                                    statusConfig.bg,
                                    statusConfig.text
                                  )}
                                >
                                  {statusConfig.label}
                                </span>
                              </div>

                              {/* Info */}
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                {project.role && (
                                  <div className="flex items-center gap-1.5">
                                    <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                                    <span className="truncate">{project.role}</span>
                                  </div>
                                )}
                                {project.institutionalLink && (
                                  <div className="flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-gray-400" />
                                    <span className="truncate">{project.institutionalLink}</span>
                                  </div>
                                )}
                                {project.workloadHours && (
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                                    <span>{project.workloadHours}h/semana</span>
                                  </div>
                                )}
                                {project.contractType && (
                                  <div className="flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5 text-gray-400" />
                                    <span>{CONTRACT_TYPE_LABELS[project.contractType]}</span>
                                  </div>
                                )}
                              </div>

                              {/* Período e valor */}
                              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                                <span className="text-gray-500">
                                  {formatDate(project.startDate)}
                                  {project.endDate ? ` - ${formatDate(project.endDate)}` : " - Atual"}
                                </span>
                                {project.baseAmount !== undefined && project.baseAmount > 0 && (
                                  <span className="font-medium text-gray-700">
                                    {formatCurrency(project.baseAmount)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 h-full flex items-center justify-center">
                <div className="text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    Selecione uma pessoa na tabela para ver suas informações
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PessoasPageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <NavBar />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-80 rounded bg-gray-200" />
          <div>
            <div className="h-9 w-72 rounded bg-gray-200" />
            <div className="mt-2 h-4 w-96 rounded bg-gray-200" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`pessoas-stat-skeleton-${index}`} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 w-28 rounded bg-gray-200" />
                    <div className="mt-2 h-7 w-16 rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="h-5 w-44 rounded bg-gray-200" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={`pessoas-table-skeleton-${index}`} className="h-12 rounded bg-gray-200" />
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="h-7 w-56 rounded bg-gray-200" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="h-20 rounded bg-gray-200" />
                <div className="h-20 rounded bg-gray-200" />
                <div className="h-20 rounded bg-gray-200" />
                <div className="h-20 rounded bg-gray-200" />
              </div>
              <div className="mt-5 space-y-3">
                <div className="h-4 w-full rounded bg-gray-200" />
                <div className="h-4 w-5/6 rounded bg-gray-200" />
                <div className="h-4 w-2/3 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




