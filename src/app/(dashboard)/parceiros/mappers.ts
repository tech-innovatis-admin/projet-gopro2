import type {
  PartnerRequestDTO,
  PartnerResponseDTO,
  ProjectResponseDTO,
  ProjectStatusEnum,
} from '@/src/lib/api/types';
import { getPartnerProjectMetrics } from '@/src/lib/partners/metrics';
import { getUserErrorMessage } from '@/src/lib/feedback/user-messages';
import type {
  Parceiro,
  ParceiroContratoVinculado,
  ParceiroStatus,
  ParceiroTipo,
} from './types';

export { isProjectLinkedToPartner } from '@/src/lib/partners/metrics';

function sanitizeCnpj(raw?: string): string {
  return (raw ?? '').replace(/\D/g, '');
}

function formatCnpj(raw?: string): string | undefined {
  const digits = sanitizeCnpj(raw);
  if (digits.length !== 14) {
    return raw;
  }

  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

function mapPartnerType(partnersType: PartnerResponseDTO['partnersType']): ParceiroTipo {
  return partnersType === 'IF' ? 'IFES' : 'FUNDACAO';
}

function mapPartnerStatus(isActive: boolean): ParceiroStatus {
  return isActive ? 'ATIVO' : 'INATIVO';
}

function mapProjectStatus(projectStatus: ProjectStatusEnum): string {
  if (projectStatus === 'EXECUCAO') return 'EM_ANDAMENTO';
  if (projectStatus === 'FINALIZADO') return 'CONCLUIDO';
  if (projectStatus === 'PRE_PROJETO') return 'PRE_PROJETO';
  if (projectStatus === 'PLANEJAMENTO') return 'PLANEJAMENTO';
  return 'SUSPENSO';
}

export function mapProjectToParceiroContrato(
  project: ProjectResponseDTO
): ParceiroContratoVinculado {
  return {
    id: String(project.id),
    titulo: project.name,
    status: mapProjectStatus(project.projectStatus),
    valor: Number(project.contractValue ?? 0),
    dataInicio: project.startDate ?? project.openingDate ?? '',
    dataFim: project.endDate ?? project.closingDate ?? undefined,
  };
}

export function mapPartnerToParceiro(
  partner: PartnerResponseDTO,
  projects: ProjectResponseDTO[]
): Parceiro {
  const metrics = getPartnerProjectMetrics(partner.id, projects);

  return {
    id: String(partner.id),
    nome: partner.name,
    sigla: partner.acronym ?? undefined,
    tipo: mapPartnerType(partner.partnersType),
    cnpj: formatCnpj(partner.cnpj),
    email: partner.email ?? undefined,
    telefone: partner.phone ?? undefined,
    site: partner.site ?? undefined,
    uf: partner.state ?? '',
    municipio: partner.city ?? '',
    endereco: partner.address ?? undefined,
    status: mapPartnerStatus(Boolean(partner.isActive)),
    totalContratos: metrics.totalContracts,
    contratosAtivos: metrics.activeContracts,
    valorTotalContratos: metrics.totalValue,
    createdAt: partner.createdAt ?? new Date().toISOString(),
    updatedAt: partner.updatedAt ?? undefined,
  };
}

export function mapParceiroFormToPartnerRequestDTO(
  parceiro: Omit<
    Parceiro,
    'id' | 'createdAt' | 'updatedAt' | 'totalContratos' | 'contratosAtivos' | 'valorTotalContratos'
  >
): PartnerRequestDTO {
  return {
    acronym: parceiro.sigla?.trim() || undefined,
    name: parceiro.nome.trim(),
    tradeName: parceiro.nome.trim(),
    partnersType: parceiro.tipo === 'IFES' ? 'IF' : 'FUNDACAO',
    cnpj: sanitizeCnpj(parceiro.cnpj),
    email: parceiro.email?.trim() || undefined,
    phone: parceiro.telefone?.trim() || undefined,
    address: parceiro.endereco?.trim() || undefined,
    site: parceiro.site?.trim() || undefined,
    city: parceiro.municipio.trim(),
    state: parceiro.uf.trim(),
    isActive: parceiro.status === 'ATIVO',
  };
}

export function getFriendlyApiError(error: unknown): string {
  return getUserErrorMessage(error, 'Não foi possível concluir a operação. Tente novamente.');
}
