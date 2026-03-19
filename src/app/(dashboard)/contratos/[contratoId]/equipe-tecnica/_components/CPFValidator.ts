/**
 * CPF validator utilities.
 *
 * By default CPF is optional. When needed, use { required: true }.
 */

const calcCPFDigit = (base: string, factorStart: number): number => {
  let sum = 0

  for (let i = 0; i < base.length; i++) {
    const digit = parseInt(base[i], 10)
    const factor = factorStart - i
    sum += digit * factor
  }

  const rest = sum % 11
  return rest < 2 ? 0 : 11 - rest
}

export const isValidCPF = (raw: string): boolean => {
  const cpf = raw.replace(/\D/g, '')

  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  const base = cpf.slice(0, 9)
  const d1 = calcCPFDigit(base, 10)
  const d2 = calcCPFDigit(base + d1.toString(), 11)
  const cpfCalculated = base + d1.toString() + d2.toString()

  return cpf === cpfCalculated
}

export const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '')

  if (numbers.length <= 11) {
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return numbers.replace(/(\d{3})(\d+)/, '$1.$2')
    if (numbers.length <= 9) return numbers.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3')
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  return value
}

export const unformatCPF = (formatted: string): string => {
  return formatted.replace(/\D/g, '')
}

export interface CPFValidationOptions {
  required?: boolean
}

export const getCPFErrorMessage = (
  cpf: string,
  options: CPFValidationOptions = {}
): string => {
  const trimmed = cpf.trim()
  const required = options.required ?? false

  if (!trimmed) {
    return required ? 'CPF é obrigatório' : ''
  }

  const numbers = unformatCPF(cpf)

  if (numbers.length !== 11) {
    return 'CPF deve conter 11 dígitos'
  }

  if (!/^(\d)\1{10}$/.test(numbers)) {
    if (!isValidCPF(cpf)) {
      return 'CPF inválido. Verifique os dígitos informados.'
    }
  }

  return ''
}

export interface CPFValidationResult {
  isValid: boolean
  errorMessage: string
  formatted: string
  unformatted: string
}

export const validateCPFComplete = (
  cpf: string,
  options: CPFValidationOptions = {}
): CPFValidationResult => {
  const unformatted = unformatCPF(cpf)
  const formatted = formatCPF(unformatted)
  const required = options.required ?? false

  if (!unformatted) {
    return {
      isValid: !required,
      errorMessage: required ? 'CPF é obrigatório' : '',
      formatted,
      unformatted,
    }
  }

  const isValid = isValidCPF(unformatted)
  const errorMessage = isValid ? '' : getCPFErrorMessage(cpf, options)

  return {
    isValid,
    errorMessage,
    formatted,
    unformatted,
  }
}
