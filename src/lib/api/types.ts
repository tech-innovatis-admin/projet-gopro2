export interface PageResponseDTO<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export type BackendFieldErrors = Record<string, string>;
export type BackendFieldError = {
  field: string;
  message: string;
};

export interface BackendErrorResponse {
  status?: number;
  message?: string;
  fieldErrors?: BackendFieldErrors;
  timestamp?: string;
  path?: string;
}

export interface BffErrorEnvelope {
  error: {
    status?: number;
    message: string;
    code?: string;
    details?: unknown;
    fieldErrors?: BackendFieldErrors;
    timestamp?: string;
    path?: string;
  };
}

export class HttpError extends Error {
  status: number;
  details?: unknown;
  code?: string;
  timestamp?: string;
  path?: string;
  fieldErrors?: BackendFieldErrors;

  constructor(
    message: string,
    status: number,
    details?: unknown,
    meta?: {
      code?: string;
      timestamp?: string;
      path?: string;
      fieldErrors?: BackendFieldErrors;
    }
  ) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
    this.code = meta?.code;
    this.timestamp = meta?.timestamp;
    this.path = meta?.path;
    this.fieldErrors = meta?.fieldErrors;
  }
}

export type PartnersTypeEnum = 'FUNDACAO' | 'IF';
export type PublicAgencyTypeEnum =
  | 'PREFEITURA'
  | 'GOVERNO_ESTADUAL'
  | 'MINISTERIO'
  | 'EMPRESA_PUBLICA'
  | 'EMPRESA_PRIVADA';
export type ProjectGovIfEnum = 'GOV' | 'IF';
export type ProjectTypeEnum = 'PROJETO' | 'PRODUTO';
export type ProjectStatusEnum =
  | 'PRE_PROJETO'
  | 'EXECUCAO'
  | 'FINALIZADO'
  | 'SUSPENSO'
  | 'PLANEJAMENTO';
export type ExpensePaymentStatusEnum = 'PAGO' | 'RESERVADO' | 'PAGAMENTO_RECEBIDO';
export type ExpensePaidByEnum = 'INNOVATIS' | 'EXECUCAO';
export type StatusProjectPeopleEnum = 'PENDENTE' | 'ATIVO' | 'ENCERRADO';
export type ContractTypeEnum = 'BOLSA' | 'RPA' | 'CLT';
export type RoleProjectPeopleEnum = 'DIRETOR' | 'BOLSISTA';
export type DocumentOwnerTypeEnum =
  | 'PROJECT'
  | 'EXPENSE'
  | 'BUDGET_ITEM'
  | 'BUDGET_TRANSFER'
  | 'INCOME'
  | 'GOAL'
  | 'STAGE'
  | 'PHASE'
  | 'PROJECT_PEOPLE'
  | 'PROJECT_COMPANY'
  | 'PARTNER'
  | 'PUBLIC_AGENCY'
  | 'SECRETARY'
  | 'PEOPLE'
  | 'ORGANIZATION'
  | 'COMPANY'
  | 'USER';
export type DocumentStatusEnum = 'UPLOADING' | 'AVAILABLE' | 'DELETED';
export type UserRoleEnum = 'OWNER' | 'SUPERADMIN' | 'ADMIN' | 'ANALISTA' | 'ESTAGIARIO';
export type UserStatusEnum = 'ACTIVE' | 'DISABLED' | 'PENDING';
export type AllowedRegistrationStatusEnum = 'PENDING' | 'USED' | 'EXPIRED' | 'CANCELLED';
export type AuditScopeEnum = 'SYSTEM' | 'CONTRACTS' | 'USERS' | 'PEOPLE_COMPANIES';

export interface AuthUserResponseDTO {
  id: number;
  email: string;
  username: string | null;
  fullName: string;
  role: UserRoleEnum;
  status: UserStatusEnum;
  avatarUrl: string | null;
  lastLoginAt: string | null;
}

export type AuthNotificationCategory = "CREATED" | "STATUS_CHANGE" | "EXPIRING";
export type AuthNotificationSeverity = "INFO" | "DANGER";

export interface AuthNotificationResponseDTO {
  id: string;
  category: AuthNotificationCategory;
  severity: AuthNotificationSeverity;
  title: string;
  message: string;
  href: string;
  contractId: number | null;
  occurredAt: string | null;
}

export interface AuthLoginRequestDTO {
  login: string;
  password: string;
}

export interface AuthLoginResponseDTO {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: AuthUserResponseDTO;
}

export interface AuthForgotPasswordRequestDTO {
  email: string;
}

export interface AuthForgotPasswordResponseDTO {
  message: string;
}

export interface AuthResetPasswordRequestDTO {
  token: string;
  newPassword: string;
}

export interface AuthResetPasswordResponseDTO {
  message: string;
}

export interface AllowedRegistrationCreateRequestDTO {
  email: string;
  role: UserRoleEnum;
  expiresAt?: string;
}

export interface AllowedRegistrationReissueRequestDTO {
  expiresAt?: string;
}

export interface AllowedRegistrationResponseDTO {
  id: number;
  email: string;
  role: UserRoleEnum;
  status: AllowedRegistrationStatusEnum;
  invitedByUserId: number | null;
  invitedAt: string;
  expiresAt: string;
  usedAt: string | null;
  inviteLink: string | null;
}

export interface AllowedRegistrationValidationResponseDTO {
  email: string;
  role: UserRoleEnum;
  expiresAt: string;
}

export interface RegisterCompleteRequestDTO {
  token: string;
  fullName: string;
  username: string;
  password: string;
}

export interface RegisterCompleteResponseDTO {
  message: string;
  auth: AuthLoginResponseDTO | null;
}

export interface AdminUserUpdateRequestDTO {
  role?: UserRoleEnum;
  status?: UserStatusEnum;
}

export interface AdminUserResponseDTO {
  id: number;
  username: string | null;
  email: string;
  fullName: string;
  role: UserRoleEnum;
  status: UserStatusEnum;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UserLookupResponseDTO {
  id: number;
  fullName: string;
  email: string;
  username: string | null;
}

export interface AuditLogResponseDTO {
  id: number;
  auditId?: string | null;
  dataHora?: string | null;
  tipoAuditoria?: AuditScopeEnum | null;
  modulo?: string | null;
  feature?: string | null;
  entidadePrincipal?: string | null;
  aba?: string | null;
  subsecao?: string | null;
  resumo?: string | null;
  descricao?: string | null;
  resultado?: string | null;
  correlacaoId?: string | null;
  usuarioResponsavelId?: number | null;
  usuarioResponsavelNome?: string | null;
  usuarioResponsavelEmail?: string | null;
  usuarioResponsavelRole?: string | null;
  alteracoesJson?: string | null;
  detalhesTecnicosJson?: string | null;
  actorUserId: number | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  contractId?: number | null;
  contractCode?: string | null;
  contractName?: string | null;
  beforeJson: string | null;
  afterJson: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface PartnerResponseDTO {
  id: number;
  acronym: string | null;
  name: string;
  tradeName: string;
  partnersType: PartnersTypeEnum;
  cnpj: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  site: string | null;
  city: string | null;
  state: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number | null;
  updatedBy: number | null;
}

export interface PartnerRequestDTO {
  acronym?: string;
  name: string;
  tradeName?: string;
  partnersType: PartnersTypeEnum;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  site?: string;
  city?: string;
  state?: string;
  isActive?: boolean;
  createdBy?: number;
}

export interface PartnerUpdateDTO extends Partial<PartnerRequestDTO> {
  updatedBy?: number;
}

export interface PublicAgencyResponseDTO {
  id: number;
  code: string | null;
  sigla: string | null;
  name: string;
  cnpj: string;
  isClient: boolean;
  publicAgencyType: PublicAgencyTypeEnum;
  email: string | null;
  phone: string | null;
  address: string | null;
  contactPerson: string | null;
  city: string | null;
  state: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number | null;
  updatedBy: number | null;
}

export interface PublicAgencyRequestDTO {
  code?: string;
  sigla?: string;
  name: string;
  cnpj: string;
  isClient: boolean;
  publicAgencyType: PublicAgencyTypeEnum;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  city?: string;
  state?: string;
  isActive?: boolean;
  createdBy?: number;
}

export interface PublicAgencyUpdateDTO extends Partial<PublicAgencyRequestDTO> {
  updatedBy?: number;
}

export interface SecretaryResponseDTO {
  id: number;
  code: string | null;
  sigla: string | null;
  publicAgency: PublicAgencyResponseDTO | null;
  name: string;
  cnpj: string | null;
  isClient: boolean;
  email: string | null;
  phone: string | null;
  address: string | null;
  contactPerson: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number | null;
  updatedBy: number | null;
}

export interface SecretaryRequestDTO {
  code?: string;
  sigla?: string;
  publicAgencyId: number;
  name: string;
  cnpj?: string;
  isClient: boolean;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  isActive?: boolean;
  createdBy?: number;
}

export interface SecretaryUpdateDTO extends Partial<SecretaryRequestDTO> {
  updatedBy?: number;
}

export interface CompanyResponseDTO {
  id: number;
  name: string;
  tradeName: string;
  cnpj: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  responsiblePerson: CompanyResponsiblePersonDTO | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number | null;
  updatedBy: number | null;
}

export interface CompanyResponsiblePersonDTO {
  id: number;
  fullName: string;
  cpf: string | null;
  email: string | null;
}

export interface CompanyRequestDTO {
  name: string;
  tradeName: string;
  cnpj: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  responsiblePersonId?: number | null;
  createdBy?: number;
}

export interface CompanyUpdateDTO extends Partial<CompanyRequestDTO> {
  updatedBy?: number;
}

export interface PeopleResponseDTO {
  id: number;
  fullName: string;
  cpf: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  birthDate: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number | null;
  updatedBy: number | null;
}

export interface PeopleRequestDTO {
  fullName: string;
  cpf?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  birthDate?: string;
  address?: string;
  city?: string;
  state?: string;
  notes?: string;
}

export interface ProjectResponseDTO {
  id: number;
  name: string;
  code: string;
  projectStatus: ProjectStatusEnum;
  areaSegmento: string | null;
  object: string;
  primaryPartnerId: number | null;
  secundaryPartnerId: number | null;
  primaryClientId: number | null;
  secundaryClientId: number | null;
  cordinatorId: number | null;
  projectGovIf: ProjectGovIfEnum | null;
  projectType: ProjectTypeEnum | null;
  contractValue: number | null;
  startDate: string | null;
  endDate: string | null;
  openingDate: string | null;
  closingDate: string | null;
  city: string | null;
  state: string | null;
  executionLocation: string | null;
  projectBankAccount: string | null;
  executedByInnovatis: boolean | null;
  isActive: boolean;
  totalReceived: number | null;
  totalExpenses: number | null;
  totalReserved: number | null;
  saldoReal: number | null;
  saldo: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number | null;
  updatedBy: number | null;
}

export interface ProjectRequestDTO {
  name: string;
  code: string;
  projectStatus: ProjectStatusEnum;
  areaSegmento?: string;
  object: string;
  primaryPartnerId: number;
  secundaryPartnerId?: number;
  primaryClientId: number;
  secundaryClientId?: number;
  cordinatorId?: number;
  projectGovIf?: ProjectGovIfEnum;
  projectType?: ProjectTypeEnum;
  contractValue?: number;
  startDate?: string;
  endDate?: string;
  openingDate?: string;
  closingDate?: string;
  city?: string;
  state?: string;
  executionLocation?: string;
  projectBankAccount?: string;
  executedByInnovatis: boolean;
  createdBy?: number;
}

export interface ProjectUpdateDTO extends Partial<ProjectRequestDTO> {
  updatedBy?: number;
}

export interface ProjectTotalsDTO {
  projectId: number;
  totalIncome: number;
  totalExpense: number;
  totalReserved: number;
  saldoReal: number;
  saldo: number;
}

export interface ProjectDashboardFiltersDTO {
  projectStatus: ProjectStatusEnum | null;
  projectType: ProjectTypeEnum | null;
  projectGovIf: ProjectGovIfEnum | null;
  executedByInnovatis: boolean | null;
  month: number | null;
  year: number | null;
  location: string | null;
  partnerId: number | null;
}

export interface ProjectDashboardSummaryDTO {
  totalContracts: number;
  totalValue: number;
}

export interface ProjectDashboardStatusMetricDTO {
  status: ProjectStatusEnum;
  contracts: number;
  totalValue: number;
}

export interface ProjectDashboardTypeMetricDTO {
  type: ProjectTypeEnum;
  contracts: number;
  totalValue: number;
  percentageOfTypeTotal: number;
}

export interface ProjectDashboardMonthMetricDTO {
  month: number;
  label: string;
  contracts: number;
  totalValue: number;
}

export interface ProjectDashboardLocationMetricDTO {
  location: string;
  city: string | null;
  state: string | null;
  contracts: number;
  totalValue: number;
}

export interface ProjectDashboardPartnerMetricDTO {
  partnerId: number | null;
  partnerAcronym?: string | null;
  partnerName: string;
  contracts: number;
  totalValue: number;
}

export interface ProjectDashboardExpiringContractDTO {
  projectId: number;
  projectName: string;
  projectCode: string | null;
  primaryClientName: string | null;
  endDate: string;
  daysToExpiration: number;
  projectStatus: ProjectStatusEnum;
  contractValue: number | null;
}

export interface ProjectDashboardExpiringContractsDTO {
  referenceDate: string;
  upToOneMonth: number;
  upToThreeMonths: number;
  upToSixMonths: number;
  upToOneYear: number;
  contracts: ProjectDashboardExpiringContractDTO[];
}

export interface ProjectDashboardResponseDTO {
  filters: ProjectDashboardFiltersDTO;
  availableYears: number[];
  summary: ProjectDashboardSummaryDTO;
  byStatus: ProjectDashboardStatusMetricDTO[];
  byType: ProjectDashboardTypeMetricDTO[];
  byMonth: ProjectDashboardMonthMetricDTO[];
  byLocation: ProjectDashboardLocationMetricDTO[];
  byPartner: ProjectDashboardPartnerMetricDTO[];
  expiringContracts: ProjectDashboardExpiringContractsDTO;
}

export interface ProjectCategoryMetricDTO {
  type: ProjectTypeEnum;
  contracts: number;
  totalValue: number;
  percentageOfTotal: number;
}

export interface ProjectStatusCategoryResponseDTO {
  projectStatus: ProjectStatusEnum;
  totalContracts: number;
  totalValue: number;
  categories: ProjectCategoryMetricDTO[];
}

export interface ProjectTypeDistributionResponseDTO {
  requestedType: ProjectTypeEnum;
  totalContracts: number;
  totalValue: number;
  requestedTypePercentage: number;
  categories: ProjectCategoryMetricDTO[];
}

export interface ProjectMonthMetricDTO {
  month: number;
  label: string;
  contracts: number;
  totalValue: number;
}

export interface ProjectMonthResponseDTO {
  requestedMonth: number;
  requestedYear: number;
  totalContracts: number;
  totalValue: number;
  availableYears: number[];
  months: ProjectMonthMetricDTO[];
}

export interface ProjectLocationMetricDTO {
  location: string;
  city: string | null;
  state: string | null;
  contracts: number;
  totalValue: number;
}

export interface ProjectLocationResponseDTO {
  requestedLocation: string;
  totalContracts: number;
  totalValue: number;
  locations: ProjectLocationMetricDTO[];
}

export interface ProjectPartnerMetricDTO {
  partnerId: number | null;
  partnerName: string;
  contracts: number;
  totalValue: number;
}

export interface ProjectPartnerResponseDTO {
  requestedPartnerId: number;
  requestedPartnerName: string;
  totalContracts: number;
  totalValue: number;
  partners: ProjectPartnerMetricDTO[];
}

export type StatusDisbursementScheduleEnum =
  | 'PREVISTO'
  | 'PARCIAL'
  | 'RECEBIDO'
  | 'CANCELADO';

export interface DisbursementScheduleResponseDTO {
  id: number;
  projectId: number;
  numero: number;
  expectedMonth: string;
  expectedAmount: number;
  status: StatusDisbursementScheduleEnum;
  notes: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number | null;
  updatedBy: number | null;
}

export interface DisbursementScheduleRequestDTO {
  projectId: number;
  numero: number;
  expectedMonth: string;
  expectedAmount: number;
  status?: StatusDisbursementScheduleEnum;
  notes?: string;
  createdBy?: number;
}

export interface DisbursementScheduleUpdateDTO
  extends Omit<Partial<DisbursementScheduleRequestDTO>, "status"> {
  updatedBy?: number;
}

export interface GoalResponseDTO {
  id: number;
  projectId: number;
  numero: number;
  titulo: string;
  descricao: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  dataConclusao: string | null;
  hasFinancialValue: boolean;
  financialAmount: number | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number | null;
  updatedBy: number | null;
}

export interface GoalRequestDTO {
  projectId: number;
  numero: number;
  titulo: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  dataConclusao?: string;
  hasFinancialValue?: boolean;
  financialAmount?: number;
  createdBy?: number;
}

export interface GoalUpdateDTO extends Partial<GoalRequestDTO> {
  updatedBy?: number;
}

export interface StageResponseDTO {
  id: number;
  goalId: number;
  numero: number;
  titulo: string;
  descricao: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  dataConclusao: string | null;
  hasFinancialValue: boolean;
  financialAmount: number | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number | null;
  updatedBy: number | null;
}

export interface StageRequestDTO {
  goalId: number;
  numero: number;
  titulo: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  dataConclusao?: string;
  hasFinancialValue?: boolean;
  financialAmount?: number;
  createdBy?: number;
}

export interface StageUpdateDTO extends Partial<StageRequestDTO> {
  updatedBy?: number;
}

export interface PhaseResponseDTO {
  id: number;
  stageId: number;
  numero: number;
  titulo: string;
  descricao: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  dataConclusao: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number | null;
  updatedBy: number | null;
}

export interface PhaseRequestDTO {
  stageId: number;
  numero: number;
  titulo: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  dataConclusao?: string;
  createdBy?: number;
}

export interface PhaseUpdateDTO extends Partial<PhaseRequestDTO> {
  updatedBy?: number;
}

export interface ProjectPeopleResponseDTO {
  id: number;
  projectId: number;
  personId: number;
  role: RoleProjectPeopleEnum | null;
  workloadHours: number | null;
  institutionalLink: string | null;
  contractType: ContractTypeEnum | null;
  startDate: string | null;
  endDate: string | null;
  status: StatusProjectPeopleEnum | null;
  baseAmount: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number | null;
  updatedBy: number | null;
}

export interface ProjectPeopleDetailedResponseDTO extends ProjectPeopleResponseDTO {
  personFullName: string | null;
  personCpf: string | null;
  personEmail: string | null;
  personPhone: string | null;
  personAvatarUrl: string | null;
  personBirthDate: string | null;
  personAddress: string | null;
  personCity: string | null;
  personState: string | null;
  totalPago?: number | null;
  totalReservado?: number | null;
}

export interface ProjectPeopleRequestDTO {
  projectId: number;
  personId: number;
  role?: RoleProjectPeopleEnum;
  workloadHours?: number;
  institutionalLink?: string;
  contractType?: ContractTypeEnum;
  startDate?: string;
  endDate?: string;
  status: StatusProjectPeopleEnum;
  baseAmount?: number;
  notes?: string;
  createdBy?: number;
}

export interface ProjectPeopleUpdateDTO extends Partial<ProjectPeopleRequestDTO> {
  updatedBy?: number;
}

export interface ProjectBudgetSummaryDTO {
  projectId: number;
  contractValue: number;
  totalBudgetItems: number;
  difference: number;
  remainingAmount: number;
  exceededAmount: number;
  isExceeded: boolean;
  plannedPercentage: number;
}

export interface ProjectDisbursementInstallmentSummaryDTO {
  disbursementScheduleId: number;
  expectedMonth: string;
  expectedAmount: number;
  invoicedAmount: number;
  receivedAmount: number;
  difference: number;
  status: 'PENDENTE' | 'PARCIAL' | 'RECEBIDA' | 'EXCEDIDA';
}

export interface ProjectDisbursementSummaryDTO {
  projectId: number;
  totalExpected: number;
  totalInvoiced: number;
  totalReceived: number;
  difference: number;
  differenceInvoicedVsReceived: number;
  expectedInstallments: number;
  receivedInstallments: number;
  partialInstallments: number;
  pendingInstallments: number;
  installments: ProjectDisbursementInstallmentSummaryDTO[];
  unlinkedInvoicedAmount: number;
  unlinkedReceivedAmount: number;
}

export type IncomeStatusEnum = 'FATURADO' | 'RECEBIDO' | 'CANCELADO';

export type ContractingStatusEnum =
  | 'EM_CADASTRO'
  | 'EM_CONTRATACAO'
  | 'CONTRATADA'
  | 'EM_EXECUCAO'
  | 'CONCLUIDA'
  | 'CANCELADA';

export interface ProjectCompanyResponseDTO {
  id: number;
  projectId: number;
  companyId: number;
  contractNumber: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: ContractingStatusEnum | null;
  totalValue: number | null;
  totalPago?: number | null;
  totalReservado?: number | null;
  notes: string | null;
  isIncubated: boolean | null;
  serviceType: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number | null;
  updatedBy: number | null;
}

export interface ProjectCompanyDetailedResponseDTO extends ProjectCompanyResponseDTO {
  companyName: string | null;
  companyTradeName: string | null;
  companyCnpj: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
  companyAddress: string | null;
  companyCity: string | null;
  companyState: string | null;
  companyResponsiblePersonId: number | null;
  companyResponsiblePersonFullName: string | null;
  companyResponsiblePersonCpf: string | null;
  companyResponsiblePersonEmail: string | null;
}

export interface ProjectCompanyRequestDTO {
  projectId: number;
  companyId: number;
  contractNumber?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: ContractingStatusEnum;
  totalValue?: number;
  notes?: string;
  isIncubated?: boolean;
  serviceType?: string;
  createdBy?: number;
}

export interface ProjectCompanyUpdateDTO extends Partial<ProjectCompanyRequestDTO> {
  updatedBy?: number;
}

export interface DocumentResponseDTO {
  id: string;
  ownerType: DocumentOwnerTypeEnum;
  ownerId: number;
  category: string | null;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  sha256: string | null;
  bucket: string;
  s3Key: string;
  status: DocumentStatusEnum;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number | null;
  deletedAt: string | null;
}

export interface DocumentDownloadUrlDTO {
  url: string;
  expiresAt: string;
}

export interface IncomeResponseDTO {
  id: number;
  projectId: number;
  disbursementScheduleId?: number | null;
  numero: number;
  amount: number;
  receivedAt: string;
  status: IncomeStatusEnum;
  source: string | null;
  invoiceNumber: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number | null;
  updatedBy: number | null;
}

export interface IncomeRequestDTO {
  projectId: number;
  disbursementScheduleId?: number | null;
  numero: number;
  amount: number;
  receivedAt: string;
  status: IncomeStatusEnum;
  source?: string;
  invoiceNumber?: string;
  notes?: string;
  createdBy?: number;
}

export interface IncomeUpdateDTO extends Partial<IncomeRequestDTO> {
  updatedBy?: number;
}

export interface ExpenseResponseDTO {
  id: number;
  projectId: number | null;
  budgetItemId: number;
  categoryId: number;
  incomeId: number | null;
  expenseDate: string;
  quantity: number;
  amount: number;
  paymentStatus: ExpensePaymentStatusEnum;
  paidBy: ExpensePaidByEnum;
  personId: number | null;
  organizationId: number | null;
  projectCompanyId: number | null;
  description: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  documentId: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number | null;
  updatedBy: number | null;
}

export interface ExpenseRequestDTO {
  projectId: number;
  budgetItemId: number;
  categoryId: number;
  incomeId?: number | null;
  expenseDate: string;
  quantity: number;
  amount: number;
  paymentStatus: ExpensePaymentStatusEnum;
  paidBy?: ExpensePaidByEnum;
  personId?: number;
  organizationId?: number;
  projectCompanyId?: number;
  description?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  documentId?: string;
  createdBy?: number;
}

export interface ExpenseUpdateDTO extends Partial<ExpenseRequestDTO> {
  updatedBy?: number;
}

export type BudgetTransferStatusEnum = 'APROVADO' | 'REPEROVADO';

export interface BudgetCategoryResponseDTO {
  id: number;
  projectId: number | null;
  code: string | null;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number | null;
  updatedBy: number | null;
}

export interface BudgetCategoryRequestDTO {
  projectId?: number;
  code?: string;
  name: string;
  description?: string;
  createdBy?: number;
}

export interface BudgetCategoryUpdateDTO extends Partial<BudgetCategoryRequestDTO> {
  updatedBy?: number;
}

export interface BudgetItemResponseDTO {
  id: number;
  categoryId: number;
  description: string;
  quantity: number | null;
  months: number | null;
  unitCost: number | null;
  plannedAmount: number;
  executedAmount: number | null;
  goalId: number | null;
  projectPeopleId: number | null;
  projectCompanyId: number | null;
  projectPartnerId: number | null;
  beneficiaryType: 'person' | 'company' | 'partner' | null;
  contractedAmount: number | null;
  notes: string | null;
  webs: string | null;
  serviceOrder: string | null;
  protocol: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number | null;
  updatedBy: number | null;
}

export interface BudgetItemRequestDTO {
  categoryId: number;
  description: string;
  quantity?: number;
  months?: number;
  unitCost?: number;
  plannedAmount: number;
  executedAmount?: number;
  goalId?: number | null;
  contractedAmount?: number | null;
  notes?: string;
  webs?: string;
  serviceOrder?: string;
  protocol?: string;
  createdBy?: number;
}

export interface BudgetItemUpdateDTO extends Partial<BudgetItemRequestDTO> {
  updatedBy?: number;
}

export interface BudgetItemBeneficiaryAssignRequestDTO {
  beneficiaryType: 'person' | 'company' | 'partner';
  referenceId: number;
  contractedAmount: number;
}

export interface BudgetTransferResponseDTO {
  id: number;
  projectId: number;
  fromItemId: number;
  toItemId: number;
  amount: number;
  transferDate: string;
  status: BudgetTransferStatusEnum | null;
  reason: string | null;
  documentId: string | null;
  approvedAt: string | null;
  approvedBy: number | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number | null;
  updatedBy: number | null;
}

export interface BudgetTransferRequestDTO {
  projectId: number;
  fromItemId: number;
  toItemId: number;
  amount: number;
  transferDate: string;
  status?: BudgetTransferStatusEnum;
  reason?: string;
  documentId?: string;
  createdBy?: number;
}

export interface BudgetTransferUpdateDTO extends Partial<BudgetTransferRequestDTO> {
  approvedAt?: string;
  approvedBy?: number;
  updatedBy?: number;
}
