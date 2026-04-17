import type {
  CompanyRequestDTO,
  CompanyResponseDTO,
  CompanyUpdateDTO,
} from "@/src/lib/api/types";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";
import type { Fornecedor } from "./types";

function onlyDigits(value?: string): string {
  return (value ?? "").replace(/\D/g, "");
}

function formatCnpj(raw?: string): string | undefined {
  const digits = onlyDigits(raw);
  if (digits.length !== 14) return raw;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

export function mapCompanyToFornecedor(company: CompanyResponseDTO): Fornecedor {
  return {
    id: String(company.id),
    nome: company.name,
    razaoSocial: company.tradeName || undefined,
    cnpj: formatCnpj(company.cnpj) || undefined,
    email: company.email || undefined,
    telefone: company.phone || undefined,
    endereco: company.address || undefined,
    municipio: company.city || "",
    uf: company.state || "",
    status: company.isActive ? "ATIVO" : "INATIVO",
    createdAt: company.createdAt ?? new Date().toISOString(),
    updatedAt: company.updatedAt ?? undefined,
  };
}

export function mapFornecedorFormToCompanyRequestDTO(
  fornecedor: Omit<Fornecedor, "id" | "createdAt" | "updatedAt">
): CompanyRequestDTO {
  return {
    name: fornecedor.nome.trim(),
    tradeName: fornecedor.razaoSocial?.trim() || fornecedor.nome.trim(),
    cnpj: onlyDigits(fornecedor.cnpj),
    email: fornecedor.email?.trim() || "",
    phone: fornecedor.telefone?.trim() || "",
    address: fornecedor.endereco?.trim() || "",
    city: fornecedor.municipio.trim(),
    state: fornecedor.uf.trim().toUpperCase(),
    createdBy: 1,
  };
}

export function mapFornecedorFormToCompanyUpdateDTO(
  fornecedor: Omit<Fornecedor, "id" | "createdAt" | "updatedAt">
): CompanyUpdateDTO {
  return {
    ...mapFornecedorFormToCompanyRequestDTO(fornecedor),
    updatedBy: 1,
  };
}

export function getFriendlyApiError(error: unknown): string {
  return getUserErrorMessage(error, "Não foi possível concluir a operação. Tente novamente.");
}

