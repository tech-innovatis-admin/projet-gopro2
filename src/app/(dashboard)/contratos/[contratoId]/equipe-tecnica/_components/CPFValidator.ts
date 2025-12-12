/**
 * CPFValidator - Sistema Completo de Validação de CPF
 * 
 * Este módulo fornece funções utilitárias para validação, formatação e cálculo
 * de dígitos verificadores de CPF seguindo as regras oficiais brasileiras.
 * 
 * Pode ser reutilizado em qualquer projeto que necessite validação de CPF.
 */

/**
 * Calcula o dígito verificador de um CPF
 * 
 * @param base - String contendo os dígitos base para o cálculo
 * @param factorStart - Fator inicial para a multiplicação (10 ou 11)
 * @returns O dígito verificador calculado
 * 
 * @example
 * calcCPFDigit("123456789", 10) // Calcula o primeiro dígito verificador
 */
const calcCPFDigit = (base: string, factorStart: number): number => {
  let sum = 0

  // Multiplica cada dígito pelo peso decrescente
  for (let i = 0; i < base.length; i++) {
    const digit = parseInt(base[i], 10)
    const factor = factorStart - i // ex.: 10,9,8... ou 11,10,9...
    sum += digit * factor
  }

  const rest = sum % 11
  // Regra do CPF: resto menor que 2 resulta em 0, senão 11 - resto
  return rest < 2 ? 0 : 11 - rest
}

/**
 * Valida se um CPF é válido de acordo com as regras oficiais brasileiras
 * 
 * Validações realizadas:
 * 1. Remove caracteres não numéricos
 * 2. Verifica se contém exatamente 11 dígitos
 * 3. Rejeita CPFs com todos os dígitos iguais (inválidos por padrão)
 * 4. Calcula e verifica os dígitos verificadores
 * 
 * @param raw - CPF em qualquer formato (com ou sem pontos/hífen)
 * @returns true se o CPF é válido, false caso contrário
 * 
 * @example
 * isValidCPF("123.456.789-10") // com formatação
 * isValidCPF("12345678910") // sem formatação
 */
export const isValidCPF = (raw: string): boolean => {
  // 1) Remove tudo que não for número
  const cpf = raw.replace(/\D/g, '')

  // 2) Checa tamanho (tem que ter 11 dígitos)
  if (cpf.length !== 11) return false

  // 3) Rejeita CPFs com todos os dígitos iguais (ex.: 11111111111)
  if (/^(\d)\1{10}$/.test(cpf)) return false

  // 4) Pega os 9 primeiros dígitos
  const base = cpf.slice(0, 9)

  // 5) Calcula o primeiro dígito verificador
  const d1 = calcCPFDigit(base, 10)

  // 6) Calcula o segundo dígito verificador (usando base + d1)
  const d2 = calcCPFDigit(base + d1.toString(), 11)

  // 7) Monta o CPF calculado e compara com o informado
  const cpfCalculated = base + d1.toString() + d2.toString()
  return cpf === cpfCalculated
}

/**
 * Formata um CPF aplicando máscara visual
 * 
 * Formatos progressivos:
 * - Até 3 dígitos: "123"
 * - Até 6 dígitos: "123.456"
 * - Até 9 dígitos: "123.456.789"
 * - 11 dígitos: "123.456.789-10"
 * 
 * A função limita a entrada a 14 caracteres (tamanho máximo formatado)
 * 
 * @param value - CPF sem formatação ou parcialmente formatado
 * @returns CPF formatado com máscara visual
 * 
 * @example
 * formatCPF("12345678910") // "123.456.789-10"
 * formatCPF("123") // "123"
 * formatCPF("123456") // "123.456"
 */
export const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '')
  
  // Limita a 11 dígitos numéricos (14 caracteres com formatação)
  if (numbers.length <= 11) {
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return numbers.replace(/(\d{3})(\d+)/, '$1.$2')
    if (numbers.length <= 9) return numbers.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3')
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  
  return value
}

/**
 * Remove formatação de um CPF
 * 
 * @param formatted - CPF formatado (ex: "123.456.789-10")
 * @returns CPF apenas com dígitos numéricos
 * 
 * @example
 * unformatCPF("123.456.789-10") // "12345678910"
 */
export const unformatCPF = (formatted: string): string => {
  return formatted.replace(/\D/g, '')
}

/**
 * Obtém mensagens de erro específicas para validação de CPF
 * 
 * @param cpf - CPF a ser validado
 * @returns Mensagem de erro específica ou vazio se válido
 * 
 * @example
 * getCPFErrorMessage("") // "CPF é obrigatório"
 * getCPFErrorMessage("12345") // "CPF deve conter 11 dígitos"
 * getCPFErrorMessage("11111111111") // "CPF inválido. Verifique os dígitos informados."
 */
export const getCPFErrorMessage = (cpf: string): string => {
  const trimmed = cpf.trim()

  if (!trimmed) {
    return "CPF é obrigatório"
  }

  const numbers = unformatCPF(cpf)

  if (numbers.length !== 11) {
    return "CPF deve conter 11 dígitos"
  }

  if (!/^(\d)\1{10}$/.test(numbers)) {
    if (!isValidCPF(cpf)) {
      return "CPF inválido. Verifique os dígitos informados."
    }
  }

  return ""
}

/**
 * Interface para resultado de validação de CPF
 */
export interface CPFValidationResult {
  isValid: boolean
  errorMessage: string
  formatted: string
  unformatted: string
}

/**
 * Realiza validação completa e retorna objeto com resultado detalhado
 * 
 * @param cpf - CPF a ser validado
 * @returns Objeto contendo resultado da validação, mensagem de erro, e formatos
 * 
 * @example
 * const result = validateCPFComplete("123.456.789-10")
 * console.log(result.isValid) // true ou false
 * console.log(result.errorMessage) // Mensagem de erro se houver
 * console.log(result.formatted) // "123.456.789-10"
 * console.log(result.unformatted) // "12345678910"
 */
export const validateCPFComplete = (cpf: string): CPFValidationResult => {
  const unformatted = unformatCPF(cpf)
  const formatted = formatCPF(unformatted)
  const isValid = isValidCPF(unformatted)
  const errorMessage = isValid ? "" : getCPFErrorMessage(cpf)

  return {
    isValid,
    errorMessage,
    formatted,
    unformatted
  }
}
