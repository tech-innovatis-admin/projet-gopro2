import { getPartnerById, listPartners, listProjects } from "@/src/lib/api/endpoints";
import type {
  PageResponseDTO,
  PartnerResponseDTO,
  ProjectResponseDTO,
  ProjectStatusEnum,
} from "@/src/lib/api/types";

const PAGE_SIZE = 100;

export const ACTIVE_PARTNER_PROJECT_STATUSES = new Set<ProjectStatusEnum>([
  "PRE_PROJETO",
  "PLANEJAMENTO",
  "EXECUCAO",
]);

export type PartnerProjectMetrics = {
  linkedProjects: ProjectResponseDTO[];
  totalContracts: number;
  activeContracts: number;
  totalValue: number;
};

export type PartnerOverviewMetric = {
  partnerId: number;
  partnerName: string;
  partnerAcronym: string | null;
  totalContracts: number;
  activeContracts: number;
  totalValue: number;
  isActive: boolean;
};

export async function fetchAllPages<T>(
  fetchPage: (params: { page: number; size: number }) => Promise<PageResponseDTO<T>>,
  pageSize = PAGE_SIZE,
): Promise<T[]> {
  const firstPage = await fetchPage({ page: 0, size: pageSize });
  const allItems = [...firstPage.content];
  const totalPages = Math.max(firstPage.totalPages ?? 1, 1);

  for (let page = 1; page < totalPages; page += 1) {
    const nextPage = await fetchPage({ page, size: pageSize });
    allItems.push(...nextPage.content);
  }

  return allItems;
}

export function isProjectLinkedToPartner(project: ProjectResponseDTO, partnerId: number): boolean {
  return project.primaryPartnerId === partnerId || project.secundaryPartnerId === partnerId;
}

export function getPartnerProjectMetrics(
  partnerId: number,
  projects: ProjectResponseDTO[],
): PartnerProjectMetrics {
  const linkedProjects = projects.filter((project) => isProjectLinkedToPartner(project, partnerId));
  const activeContracts = linkedProjects.filter((project) =>
    ACTIVE_PARTNER_PROJECT_STATUSES.has(project.projectStatus),
  ).length;
  const totalValue = linkedProjects.reduce(
    (sum, project) => sum + Number(project.contractValue ?? 0),
    0,
  );

  return {
    linkedProjects,
    totalContracts: linkedProjects.length,
    activeContracts,
    totalValue,
  };
}

export function buildPartnerOverviewMetrics(
  partners: PartnerResponseDTO[],
  projects: ProjectResponseDTO[],
): PartnerOverviewMetric[] {
  return partners
    .map((partner) => {
      const metrics = getPartnerProjectMetrics(partner.id, projects);

      return {
        partnerId: partner.id,
        partnerName: partner.name,
        partnerAcronym: partner.acronym?.trim() || null,
        totalContracts: metrics.totalContracts,
        activeContracts: metrics.activeContracts,
        totalValue: metrics.totalValue,
        isActive: Boolean(partner.isActive),
      };
    })
    .sort(
      (first, second) =>
        second.totalContracts - first.totalContracts ||
        second.totalValue - first.totalValue ||
        first.partnerName.localeCompare(second.partnerName, "pt-BR"),
    );
}

export async function loadPartnerCatalog() {
  const [partners, projects] = await Promise.all([
    fetchAllPages<PartnerResponseDTO>((params) => listPartners(params)),
    fetchAllPages<ProjectResponseDTO>((params) => listProjects(params)),
  ]);

  return { partners, projects };
}

export async function loadPartnerDetailSnapshot(partnerId: number | string) {
  const [partner, projects] = await Promise.all([
    getPartnerById(partnerId),
    fetchAllPages<ProjectResponseDTO>((params) => listProjects(params)),
  ]);

  return { partner, projects };
}
