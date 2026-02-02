"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Clock,
  Building2,
  Briefcase,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type PersonWithProjects,
  type ProjectPerson,
  PROJECT_PERSON_STATUS_CONFIG,
  CONTRACT_TYPE_LABELS,
} from "../types";
import { formatDate, formatCurrency } from "../data";

// =============================================================================
// PAINEL DE DETALHES DA PESSOA
// =============================================================================

interface PersonDetailsProps {
  person: PersonWithProjects | null;
  onClose: () => void;
}

export function PersonDetails({ person, onClose }: PersonDetailsProps) {
  // Ordena projetos: ativos primeiro, depois pendentes, depois encerrados
  const sortedProjects = useMemo(() => {
    if (!person) return [];
    return [...person.projects].sort((a, b) => {
      // Status: 1 (ativo) > 0 (pendente) > 2 (encerrado)
      const statusOrder = { 1: 0, 0: 1, 2: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [person]);

  // Calcula valor total ativo
  const totalActiveAmount = useMemo(() => {
    if (!person) return 0;
    return person.projects
      .filter((p) => p.status === 1)
      .reduce((sum, p) => sum + (p.baseAmount || 0), 0);
  }, [person]);

  // Calcula carga horária total ativa
  const totalActiveHours = useMemo(() => {
    if (!person) return 0;
    return person.projects
      .filter((p) => p.status === 1)
      .reduce((sum, p) => sum + (p.workloadHours || 0), 0);
  }, [person]);

  if (!person) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col items-center justify-center text-gray-500">
        <FileText className="h-12 w-12 mb-4 text-gray-300" />
        <p className="text-sm text-center">
          Selecione uma pessoa para ver os detalhes
        </p>
      </div>
    );
  }

  // Função para obter iniciais do nome
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-[#004225]/10 flex items-center justify-center">
            <span className="text-lg font-semibold text-[#004225]">
              {getInitials(person.fullName)}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{person.fullName}</h3>
            {person.cpf && (
              <p className="text-xs text-gray-500">CPF: {person.cpf}</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        {/* Contato */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Contato
          </h4>
          <div className="space-y-2">
            {person.email && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
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
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{person.phone}</span>
              </div>
            )}
            {person.city && person.state && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>
                  {person.city}, {person.state}
                </span>
              </div>
            )}
            {person.birthDate && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{formatDate(person.birthDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Resumo de projetos */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Resumo
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600 mb-1">Projetos Ativos</p>
              <p className="text-xl font-bold text-green-700">
                {person.activeProjectsCount}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Total de Projetos</p>
              <p className="text-xl font-bold text-gray-700">
                {person.totalProjectsCount}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 mb-1">Horas Ativas</p>
              <p className="text-xl font-bold text-blue-700">{totalActiveHours}h</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-600 mb-1">Valor Ativo</p>
              <p className="text-lg font-bold text-purple-700">
                {formatCurrency(totalActiveAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de projetos */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Vínculos com Projetos ({person.totalProjectsCount})
          </h4>
          <div className="space-y-3">
            {sortedProjects.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhum vínculo com projeto
              </p>
            ) : (
              sortedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))
            )}
          </div>
        </div>

        {/* Observações */}
        {person.notes && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Observações
            </h4>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
              {person.notes}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Link
          href={`/recursos-humanos/pessoas/${person.id}`}
          className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-[#004225] bg-[#004225]/10 rounded-lg hover:bg-[#004225]/20 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Ver página completa
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// CARD DE PROJETO
// =============================================================================

interface ProjectCardProps {
  project: ProjectPerson;
}

function ProjectCard({ project }: ProjectCardProps) {
  const statusConfig = PROJECT_PERSON_STATUS_CONFIG[project.status];

  return (
    <div className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {project.projectName}
          </p>
          <p className="text-xs text-[#004225] font-medium">{project.projectCode}</p>
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
}
