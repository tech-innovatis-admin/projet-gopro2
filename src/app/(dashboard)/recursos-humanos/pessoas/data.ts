import {
  getPeopleById,
  listPeople,
  listProjectPeople,
  listProjects,
} from "@/src/lib/api/endpoints";
import { resolveUserNamesById } from "@/src/lib/audit/userLookup";
import type {
  ContractTypeEnum,
  PeopleResponseDTO,
  ProjectPeopleResponseDTO,
  ProjectResponseDTO,
  StatusProjectPeopleEnum,
} from "@/src/lib/api/types";
import {
  type Person,
  type PersonWithProjects,
  type ProjectPerson,
  type ProjectPersonStatus,
} from "./types";

type UserNameMap = Record<number, string>;

function mapStatus(status: StatusProjectPeopleEnum | null): ProjectPersonStatus {
  if (status === "ATIVO") return 1;
  if (status === "ENCERRADO") return 2;
  return 0;
}

function mapContractType(
  contractType: ContractTypeEnum | null
): ProjectPerson["contractType"] {
  if (contractType === "BOLSA" || contractType === "RPA" || contractType === "CLT") {
    return contractType;
  }
  return undefined;
}

function mapAuditUser(
  userId: number | null | undefined,
  userNamesById: UserNameMap
): string | undefined {
  if (!userId) {
    return undefined;
  }
  return userNamesById[userId] ?? `ID ${userId}`;
}

function mapPerson(dto: PeopleResponseDTO, userNamesById: UserNameMap): Person {
  return {
    id: String(dto.id),
    fullName: dto.fullName,
    cpf: dto.cpf ?? undefined,
    email: dto.email ?? undefined,
    phone: dto.phone ?? undefined,
    birthDate: dto.birthDate ?? undefined,
    address: dto.address ?? undefined,
    city: dto.city ?? undefined,
    state: dto.state ?? undefined,
    notes: dto.notes ?? undefined,
    createdAt: dto.createdAt ?? new Date().toISOString(),
    updatedAt: dto.updatedAt ?? undefined,
    createdBy: mapAuditUser(dto.createdBy, userNamesById),
    updatedBy: mapAuditUser(dto.updatedBy, userNamesById),
  };
}

function mapProjectPeople(
  dto: ProjectPeopleResponseDTO,
  projectsById: Map<number, ProjectResponseDTO>,
  userNamesById: UserNameMap
): ProjectPerson {
  const project = projectsById.get(dto.projectId);

  return {
    id: String(dto.id),
    projectId: String(dto.projectId),
    projectName: project?.name ?? `Projeto ${dto.projectId}`,
    projectCode: project?.code ?? `PROJ-${dto.projectId}`,
    personId: String(dto.personId),
    role: dto.role ?? undefined,
    workloadHours: dto.workloadHours ?? undefined,
    institutionalLink: dto.institutionalLink ?? undefined,
    contractType: mapContractType(dto.contractType),
    startDate: dto.startDate ?? undefined,
    endDate: dto.endDate ?? undefined,
    status: mapStatus(dto.status),
    baseAmount: dto.baseAmount !== null ? Number(dto.baseAmount) : undefined,
    notes: dto.notes ?? undefined,
    createdAt: dto.createdAt ?? new Date().toISOString(),
    updatedAt: dto.updatedAt ?? undefined,
    createdBy: mapAuditUser(dto.createdBy, userNamesById),
    updatedBy: mapAuditUser(dto.updatedBy, userNamesById),
  };
}

function buildPeopleWithProjects(
  peopleDtos: PeopleResponseDTO[],
  projectPeopleDtos: ProjectPeopleResponseDTO[],
  projectsDtos: ProjectResponseDTO[],
  userNamesById: UserNameMap
): PersonWithProjects[] {
  const projectsById = new Map(projectsDtos.map((project) => [project.id, project]));

  const projectLinksByPersonId = new Map<string, ProjectPerson[]>();

  for (const projectPeople of projectPeopleDtos) {
    if (!projectPeople.isActive) {
      continue;
    }

    const personId = String(projectPeople.personId);
    const currentLinks = projectLinksByPersonId.get(personId) ?? [];
    currentLinks.push(mapProjectPeople(projectPeople, projectsById, userNamesById));
    projectLinksByPersonId.set(personId, currentLinks);
  }

  return peopleDtos.map((dto) => {
    const person = mapPerson(dto, userNamesById);
    const projects = projectLinksByPersonId.get(person.id) ?? [];
    const activeProjectsCount = projects.filter((project) => project.status === 1).length;

    return {
      ...person,
      projects,
      activeProjectsCount,
      totalProjectsCount: projects.length,
    };
  });
}

export async function fetchPeopleWithProjects(): Promise<PersonWithProjects[]> {
  const [peopleResponse, projectPeopleResponse, projectsResponse] = await Promise.all([
    listPeople({ page: 0, size: 20 }),
    listProjectPeople({ page: 0, size: 20 }),
    listProjects({ page: 0, size: 20 }),
  ]);

  const userNamesById = await resolveUserNamesById([
    ...peopleResponse.content.map((person) => person.createdBy),
    ...peopleResponse.content.map((person) => person.updatedBy),
    ...projectPeopleResponse.content.map((item) => item.createdBy),
    ...projectPeopleResponse.content.map((item) => item.updatedBy),
  ]);

  return buildPeopleWithProjects(
    peopleResponse.content,
    projectPeopleResponse.content,
    projectsResponse.content,
    userNamesById
  );
}

export async function fetchPersonById(personId: string): Promise<PersonWithProjects | null> {
  const personIdNumber = Number(personId);
  if (Number.isNaN(personIdNumber)) {
    return null;
  }

  const [peopleDto, projectPeopleResponse, projectsResponse] = await Promise.all([
    getPeopleById(personIdNumber),
    listProjectPeople({ page: 0, size: 20 }),
    listProjects({ page: 0, size: 20 }),
  ]);

  const userNamesById = await resolveUserNamesById([
    peopleDto.createdBy,
    peopleDto.updatedBy,
    ...projectPeopleResponse.content.map((item) => item.createdBy),
    ...projectPeopleResponse.content.map((item) => item.updatedBy),
  ]);

  const peopleWithProjects = buildPeopleWithProjects(
    [peopleDto],
    projectPeopleResponse.content,
    projectsResponse.content,
    userNamesById
  );

  return peopleWithProjects[0] ?? null;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("pt-BR");
}

