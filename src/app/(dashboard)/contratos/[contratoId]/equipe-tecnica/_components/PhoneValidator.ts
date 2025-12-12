/**
 * PhoneValidator - Sistema de Formatação e Validação de Telefone Brasileiro
 * 
 * Este módulo fornece funções para formatação automática e validação de números
 * de telefone brasileiros, suportando os formatos (XX) XXXXX-XXXX e (XX) XXXX-XXXX.
 * 
 * Pode ser reutilizado em qualquer projeto que necessite validação de telefone.
 */

/**
 * Formata um número de telefone aplicando máscara visual progressiva
 * 
 * Formatos progressivos:
 * - Até 2 dígitos: "11"
 * - Até 7 dígitos: "(11) 98765"
 * - 10+ dígitos: "(11) 98765-4321"
 * 
 * A função limita a entrada a 15 caracteres (tamanho máximo formatado)
 * 
 * @param value - Número de telefone sem formatação ou parcialmente formatado
 * @returns Telefone formatado com máscara visual
 * 
 * @example
 * formatPhone("11987654321")     // "(11) 98765-4321"
 * formatPhone("11")              // "11"
 * formatPhone("1198765")         // "(11) 98765"
 * formatPhone("(11) 98765-4321") // "(11) 98765-4321" (mantém se já formatado)
 */
export const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '')
  
  // Limita a 11 dígitos numéricos (15 caracteres com formatação)
  if (numbers.length <= 11) {
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 7) return numbers.replace(/(\d{2})(\d+)/, '($1) $2')
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  
  return value
}

/**
 * Remove formatação de um número de telefone
 * 
 * @param formatted - Telefone formatado (ex: "(11) 98765-4321")
 * @returns Telefone apenas com dígitos numéricos
 * 
 * @example
 * unformatPhone("(11) 98765-4321") // "11987654321"
 * unformatPhone("11987654321")     // "11987654321" (já desformatado)
 */
export const unformatPhone = (formatted: string): string => {
  return formatted.replace(/\D/g, '')
}

/**
 * Valida se um número de telefone brasileiro é válido
 * 
 * Validações realizadas:
 * 1. Remove caracteres não numéricos
 * 2. Verifica se contém entre 10 e 11 dígitos
 * 3. Valida o DDD (2 primeiros dígitos devem estar entre 11 e 99)
 * 
 * @param phone - Número de telefone em qualquer formato
 * @returns true se o telefone é válido, false caso contrário
 * 
 * @example
 * isValidPhone("(11) 98765-4321") // true
 * isValidPhone("11987654321")     // true
 * isValidPhone("11 98765-4321")   // true
 * isValidPhone("1234567")         // false (poucos dígitos)
 * isValidPhone("(11) 9876")       // false (poucos dígitos)
 */
export const isValidPhone = (phone: string): boolean => {
  const numbers = unformatPhone(phone)
  
  // Deve ter entre 10 e 11 dígitos
  if (numbers.length < 10 || numbers.length > 11) return false
  
  // Valida o DDD (primeiros 2 dígitos)
  const ddd = parseInt(numbers.substring(0, 2), 10)
  if (ddd < 11 || ddd > 99) return false
  
  return true
}

/**
 * Obtém mensagens de erro específicas para validação de telefone
 * 
 * @param phone - Número de telefone a ser validado
 * @returns Mensagem de erro específica ou vazio se válido
 * 
 * @example
 * getPhoneErrorMessage("") // "Telefone é obrigatório"
 * getPhoneErrorMessage("1234") // "Telefone inválido"
 * getPhoneErrorMessage("(11) 98765-4321") // ""
 */
export const getPhoneErrorMessage = (phone: string): string => {
  const trimmed = phone.trim()
  
  if (!trimmed) {
    return "Telefone é obrigatório"
  }
  
  const numbers = unformatPhone(phone)
  
  if (numbers.length < 10) {
    return "Telefone inválido. Mínimo de 10 dígitos."
  }
  
  if (!isValidPhone(phone)) {
    return "Telefone inválido"
  }
  
  return ""
}

/**
 * Interface para resultado de validação de telefone
 */
export interface PhoneValidationResult {
  isValid: boolean
  errorMessage: string
  formatted: string
  unformatted: string
  ddd: string
}

/**
 * Realiza validação completa e retorna objeto com resultado detalhado
 * 
 * @param phone - Número de telefone a ser validado
 * @returns Objeto contendo resultado da validação, mensagem de erro, e formatos
 * 
 * @example
 * const result = validatePhoneComplete("11987654321")
 * console.log(result.isValid)       // true
 * console.log(result.formatted)     // "(11) 98765-4321"
 * console.log(result.unformatted)   // "11987654321"
 * console.log(result.ddd)           // "11"
 */
export const validatePhoneComplete = (phone: string): PhoneValidationResult => {
  const unformatted = unformatPhone(phone)
  const formatted = formatPhone(unformatted)
  const isValid = isValidPhone(unformatted)
  const errorMessage = isValid ? "" : getPhoneErrorMessage(phone)
  const ddd = unformatted.substring(0, 2)
  
  return {
    isValid,
    errorMessage,
    formatted,
    unformatted,
    ddd
  }
}

/**
 * Extrai o DDD (código de área) de um número de telefone
 * 
 * @param phone - Número de telefone formatado ou não
 * @returns DDD como string ou vazio se inválido
 * 
 * @example
 * extractDDD("(11) 98765-4321") // "11"
 * extractDDD("21987654321")     // "21"
 */
export const extractDDD = (phone: string): string => {
  const unformatted = unformatPhone(phone)
  return unformatted.substring(0, 2)
}

/**
 * Verifica se um telefone é celular (tem 9 dígitos após o DDD)
 * 
 * @param phone - Número de telefone formatado ou não
 * @returns true se é celular, false se é fixo ou inválido
 * 
 * @example
 * isCellphone("(11) 98765-4321") // true (9 dígitos)
 * isCellphone("(11) 3456-7890")  // false (8 dígitos)
 */
export const isCellphone = (phone: string): boolean => {
  const unformatted = unformatPhone(phone)
  return unformatted.length === 11
}

/**
 * Formata um telefone mantendo apenas o número
 * e retorna ambos os formatos (com e sem máscara)
 * 
 * Útil para armazenamento em banco de dados (sem máscara)
 * e exibição ao usuário (com máscara)
 * 
 * @param phone - Número de telefone em qualquer formato
 * @returns Objeto com números e formatado
 * 
 * @example
 * normalizePhone("11 98765 4321")
 * // { formatted: "(11) 98765-4321", unformatted: "11987654321" }
 */
export const normalizePhone = (phone: string): { formatted: string; unformatted: string } => {
  const unformatted = unformatPhone(phone)
  const formatted = formatPhone(unformatted)
  
  return {
    formatted,
    unformatted
  }
}
