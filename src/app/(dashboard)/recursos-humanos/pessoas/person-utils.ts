import type { PeopleRequestDTO, PeopleResponseDTO } from "@/src/lib/api/types";
import type { Person } from "./types";

export type PersonFormData = {
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  address: string;
  city: string;
  state: string;
  notes: string;
};

const calcCPFDigit = (base: string, factorStart: number): number => {
  let sum = 0;

  for (let index = 0; index < base.length; index += 1) {
    const digit = Number.parseInt(base[index] ?? "0", 10);
    const factor = factorStart - index;
    sum += digit * factor;
  }

  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
};

export const unformatCPF = (formatted: string): string => formatted.replace(/\D/g, "");

export const unformatPhone = (formatted: string): string => formatted.replace(/\D/g, "");

export const formatCPF = (value?: string): string => {
  const numbers = unformatCPF(value ?? "");

  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return numbers.replace(/(\d{3})(\d+)/, "$1.$2");
  if (numbers.length <= 9) return numbers.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
  return numbers.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

export const formatPhone = (value?: string): string => {
  const numbers = unformatPhone(value ?? "");

  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return numbers.replace(/(\d{2})(\d+)/, "($1) $2");
  if (numbers.length <= 10) return numbers.replace(/(\d{2})(\d{4})(\d+)/, "($1) $2-$3");
  return numbers.slice(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};

export const isValidCPF = (raw: string): boolean => {
  const cpf = unformatCPF(raw);

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const base = cpf.slice(0, 9);
  const firstDigit = calcCPFDigit(base, 10);
  const secondDigit = calcCPFDigit(`${base}${firstDigit}`, 11);

  return cpf === `${base}${firstDigit}${secondDigit}`;
};

export const getCPFValidationMessage = (cpf: string): string => {
  const numbers = unformatCPF(cpf);

  if (!numbers) {
    return "";
  }

  if (numbers.length !== 11) {
    return "CPF deve conter 11 dígitos.";
  }

  if (!isValidCPF(numbers)) {
    return "CPF inválido. Verifique os dígitos informados.";
  }

  return "";
};

export const mapPeopleResponseToPerson = (
  dto: PeopleResponseDTO,
  fallback?: Partial<Person>,
): Person => ({
  id: String(dto.id),
  fullName: dto.fullName,
  isActive: dto.isActive,
  cpf: dto.cpf ?? undefined,
  email: dto.email ?? undefined,
  phone: dto.phone ?? undefined,
  avatarUrl: dto.avatarUrl ?? fallback?.avatarUrl,
  birthDate: dto.birthDate ?? undefined,
  address: dto.address ?? undefined,
  city: dto.city ?? undefined,
  state: dto.state ?? undefined,
  notes: dto.notes ?? undefined,
  createdAt: dto.createdAt ?? fallback?.createdAt ?? new Date().toISOString(),
  updatedAt: dto.updatedAt ?? fallback?.updatedAt ?? undefined,
  createdBy: fallback?.createdBy,
  updatedBy: fallback?.updatedBy,
});

export const createPersonFormData = (person: Partial<Person>): PersonFormData => ({
  fullName: person.fullName ?? "",
  cpf: formatCPF(person.cpf),
  email: person.email ?? "",
  phone: formatPhone(person.phone),
  birthDate: person.birthDate?.slice(0, 10) ?? "",
  address: person.address ?? "",
  city: person.city ?? "",
  state: person.state ?? "",
  notes: person.notes ?? "",
});

const toOptional = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

export const buildPeopleRequestPayload = (form: PersonFormData): PeopleRequestDTO => {
  const cpf = unformatCPF(form.cpf);
  const phone = unformatPhone(form.phone);

  return {
    fullName: form.fullName.trim(),
    cpf: cpf || undefined,
    email: toOptional(form.email)?.toLowerCase(),
    phone: phone || undefined,
    birthDate: toOptional(form.birthDate),
    address: toOptional(form.address),
    city: toOptional(form.city),
    state: toOptional(form.state)?.toUpperCase(),
    notes: toOptional(form.notes),
  };
};
