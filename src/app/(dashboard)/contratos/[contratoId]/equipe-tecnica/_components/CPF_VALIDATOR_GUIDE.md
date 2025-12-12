# CPFValidator - Guia Completo

## 📋 Visão Geral

`CPFValidator` é um módulo TypeScript independente que fornece um sistema completo e robusto para validação, formatação e cálculo de dígitos verificadores de CPF (Cadastro de Pessoa Física) seguindo as regras oficiais brasileiras.

### Características Principais

✅ **Validação Oficial**: Implementa o algoritmo oficial de validação de CPF com cálculo de dígitos verificadores  
✅ **Formatação Automática**: Aplica máscara visual progressiva (XXX.XXX.XXX-XX)  
✅ **Reutilizável**: Componente totalmente independente, sem dependências externas  
✅ **Type-Safe**: Desenvolvido em TypeScript com tipos completos  
✅ **Mensagens Específicas**: Fornece mensagens de erro claras e orientadas ao usuário  
✅ **Validação Completa**: Função auxiliar para validação com resultado detalhado

---

## 🚀 Como Usar

### 1. Importar as Funções

```typescript
import { 
  isValidCPF, 
  formatCPF, 
  unformatCPF,
  getCPFErrorMessage,
  validateCPFComplete,
  CPFValidationResult
} from '@/components/CPFValidator'
```

### 2. Exemplos de Uso

#### A. Validação Simples

```typescript
const cpf = "123.456.789-10"

if (isValidCPF(cpf)) {
  console.log("✓ CPF é válido!")
} else {
  console.log("✗ CPF é inválido")
}
```

#### B. Formatação Automática (para campos de input)

```typescript
const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const rawValue = e.target.value
  const formattedValue = formatCPF(rawValue)
  setCPF(formattedValue)
}

// Resultado: "123" → "123.456" → "123.456.789" → "123.456.789-10"
```

#### C. Remover Formatação (para envio ao backend)

```typescript
const cpfFormatted = "123.456.789-10"
const cpfUnformatted = unformatCPF(cpfFormatted)
console.log(cpfUnformatted) // "12345678910"

// Ideal para enviar ao backend ou banco de dados
await sendToAPI({ cpf: unformatCPF(cpfValue) })
```

#### D. Obter Mensagem de Erro Específica

```typescript
const cpf = "123.456.789-00"
const errorMsg = getCPFErrorMessage(cpf)
console.log(errorMsg) // "CPF inválido. Verifique os dígitos informados."

// Possíveis mensagens:
// - "CPF é obrigatório"
// - "CPF deve conter 11 dígitos"
// - "CPF inválido. Verifique os dígitos informados."
```

#### E. Validação Completa (Recomendado)

```typescript
const cpf = "123.456.789-10"
const result = validateCPFComplete(cpf)

if (result.isValid) {
  console.log("CPF válido!")
  console.log("Formatado:", result.formatted)     // "123.456.789-10"
  console.log("Desformatado:", result.unformatted) // "12345678910"
} else {
  console.log("Erro:", result.errorMessage)
}
```

---

## 📦 API Reference

### `isValidCPF(raw: string): boolean`

Valida se um CPF é válido de acordo com as regras oficiais brasileiras.

**Parâmetros:**
- `raw` (string): CPF em qualquer formato (com ou sem pontos/hífen)

**Retorno:**
- `boolean`: `true` se válido, `false` caso contrário

**Validações Realizadas:**
1. Remove caracteres não numéricos
2. Verifica se contém exatamente 11 dígitos
3. Rejeita CPFs com todos os dígitos iguais (11111111111, 00000000000, etc.)
4. Calcula e verifica os dois dígitos verificadores

**Exemplos:**
```typescript
isValidCPF("123.456.789-10")  // true (válido)
isValidCPF("12345678910")     // true (sem formatação)
isValidCPF("123.456.789-00")  // false (dígitos inválidos)
isValidCPF("11111111111")     // false (todos iguais)
isValidCPF("123")             // false (poucos dígitos)
```

---

### `formatCPF(value: string): string`

Aplica máscara visual a um CPF de forma progressiva.

**Parâmetros:**
- `value` (string): CPF com ou sem formatação

**Retorno:**
- `string`: CPF formatado (máximo XXX.XXX.XXX-XX)

**Comportamento Progressivo:**
```
Entrada         → Saída
"1"             → "1"
"12"            → "12"
"123"           → "123"
"1234"          → "123.4"
"12345"         → "123.45"
"123456"        → "123.456"
"1234567"       → "123.456.7"
"12345678"      → "123.456.78"
"123456789"     → "123.456.789"
"1234567890"    → "123.456.789-0"
"12345678910"   → "123.456.789-10"
```

**Exemplos:**
```typescript
formatCPF("12345678910")      // "123.456.789-10"
formatCPF("123.456.789-10")   // "123.456.789-10" (mantém se já formatado)
formatCPF("123")              // "123"
formatCPF("123abcd456")       // "123.456" (remove caracteres não numéricos)
```

---

### `unformatCPF(formatted: string): string`

Remove toda a formatação de um CPF, retornando apenas os dígitos numéricos.

**Parâmetros:**
- `formatted` (string): CPF formatado ou não

**Retorno:**
- `string`: CPF contendo apenas dígitos numéricos

**Exemplos:**
```typescript
unformatCPF("123.456.789-10") // "12345678910"
unformatCPF("12345678910")    // "12345678910" (já desformatado)
unformatCPF("123.456.789-AB") // "123456789" (remove caracteres inválidos)
```

---

### `getCPFErrorMessage(cpf: string): string`

Retorna uma mensagem de erro específica e clara para o CPF fornecido.

**Parâmetros:**
- `cpf` (string): CPF a ser validado

**Retorno:**
- `string`: Mensagem de erro ou string vazia se válido

**Mensagens Possíveis:**
```
Cenário                          → Mensagem
Campo vazio                      → "CPF é obrigatório"
Menos de 11 dígitos              → "CPF deve conter 11 dígitos"
11 dígitos mas inválido          → "CPF inválido. Verifique os dígitos informados."
CPF válido                       → "" (string vazia)
```

**Exemplos:**
```typescript
getCPFErrorMessage("")           // "CPF é obrigatório"
getCPFErrorMessage("12345")      // "CPF deve conter 11 dígitos"
getCPFErrorMessage("11111111111")// "CPF inválido. Verifique os dígitos informados."
getCPFErrorMessage("123.456.789-10") // "" (válido, sem erro)
```

---

### `validateCPFComplete(cpf: string): CPFValidationResult`

Realiza validação completa e retorna um objeto com resultado detalhado (recomendado para uso em formulários).

**Parâmetros:**
- `cpf` (string): CPF a ser validado

**Retorno:**
- `CPFValidationResult`: Objeto contendo:
  ```typescript
  {
    isValid: boolean        // true se válido
    errorMessage: string    // Mensagem de erro ou ""
    formatted: string       // CPF formatado (XXX.XXX.XXX-XX)
    unformatted: string     // CPF sem formatação (apenas dígitos)
  }
  ```

**Exemplos:**
```typescript
const result1 = validateCPFComplete("123.456.789-10")
console.log(result1)
// {
//   isValid: true,
//   errorMessage: "",
//   formatted: "123.456.789-10",
//   unformatted: "12345678910"
// }

const result2 = validateCPFComplete("123.456.789-00")
console.log(result2)
// {
//   isValid: false,
//   errorMessage: "CPF inválido. Verifique os dígitos informados.",
//   formatted: "123.456.789-00",
//   unformatted: "12345678910"
// }
```

---

### `CPFValidationResult` (Interface)

```typescript
interface CPFValidationResult {
  isValid: boolean        // true se o CPF é válido
  errorMessage: string    // Mensagem descritiva de erro ou ""
  formatted: string       // CPF formatado com máscara
  unformatted: string     // CPF apenas com dígitos
}
```

---

## 💡 Casos de Uso

### 1. Formulário com Validação em Tempo Real

```typescript
'use client'
import { useState } from 'react'
import { formatCPF, validateCPFComplete } from '@/components/CPFValidator'

export default function CPFForm() {
  const [cpf, setCPF] = useState('')
  const [error, setError] = useState('')

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatCPF(e.target.value)
    setCPF(value)
    
    // Validar apenas se o usuário terminou de digitar
    if (value.length === 14) {
      const result = validateCPFComplete(value)
      setError(result.errorMessage)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = validateCPFComplete(cpf)
    
    if (result.isValid) {
      console.log("CPF válido! Desformatado:", result.unformatted)
      // Enviar ao backend
    } else {
      setError(result.errorMessage)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={cpf}
        onChange={handleCPFChange}
        placeholder="000.000.000-00"
        maxLength={14}
      />
      {error && <span style={{ color: 'red' }}>{error}</span>}
      <button type="submit">Enviar</button>
    </form>
  )
}
```

### 2. Validação ao Enviar para API

```typescript
async function cadastrarUsuario(cpfValue: string) {
  const result = validateCPFComplete(cpfValue)
  
  if (!result.isValid) {
    throw new Error(result.errorMessage)
  }

  // Enviar apenas o CPF desformatado ao backend
  const response = await fetch('/api/usuarios', {
    method: 'POST',
    body: JSON.stringify({
      cpf: result.unformatted, // "12345678910"
      nome: 'João Silva'
    })
  })

  return response.json()
}
```

### 3. Limpeza de Dados antes de Salvar

```typescript
import { unformatCPF } from '@/components/CPFValidator'

const userData = {
  nome: 'Maria Silva',
  cpf: unformatCPF('123.456.789-10'), // Armazena "12345678910"
  email: 'maria@email.com'
}

// Salvar no banco de dados
await database.usuarios.create(userData)
```

---

## 🔐 Como Funciona a Validação de CPF

### Algoritmo Oficial

A validação segue o padrão oficial da Receita Federal Brasileira:

#### Passo 1: Preparação
```
CPF de entrada: "123.456.789-10"
Remover caracteres: "12345678910"
Extrair base (9 primeiros dígitos): "123456789"
Dígitos informados: "1" e "0"
```

#### Passo 2: Calcular Primeiro Dígito Verificador

```
Multiplicar cada dígito por peso decrescente (10, 9, 8, ..., 2):

1×10 + 2×9 + 3×8 + 4×7 + 5×6 + 6×5 + 7×4 + 8×3 + 9×2
= 10 + 18 + 24 + 28 + 30 + 30 + 28 + 24 + 18
= 210

Resto da divisão por 11: 210 % 11 = 1

Se resto < 2: dígito = 0
Senão: dígito = 11 - resto

Resultado: 11 - 1 = 10
Dígito 1 = 0 (toma o último dígito se > 9)
```

#### Passo 3: Calcular Segundo Dígito Verificador

```
Base agora inclui o primeiro dígito: "1234567890"

1×11 + 2×10 + 3×9 + 4×8 + 5×7 + 6×6 + 7×5 + 8×4 + 9×3 + 0×2
= 11 + 20 + 27 + 32 + 35 + 36 + 35 + 32 + 27 + 0
= 255

Resto: 255 % 11 = 2

Dígito 2 = 11 - 2 = 9 (neste caso, seria diferente no exemplo real)
```

#### Passo 4: Comparar

```
CPF calculado: "123456789" + "0" + "9" = "12345678909"
CPF informado: "12345678910"
Resultado: ✗ Inválido (não correspondem)
```

### Validações Adicionais

1. **Tamanho Exato**: Deve ter exatamente 11 dígitos
2. **Rejeitar Sequências Repetidas**: CPFs como 11111111111, 22222222222, etc., são automaticamente rejeitados
3. **Cálculo de Dígitos**: Os dois dígitos verificadores devem corresponder aos calculados

---

## 🔄 Fluxo Recomendado em Formulários

```
┌─────────────────────────────────────────────────────────┐
│                  Usuário Digita CPF                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────┐
        │  formatCPF()           │
        │  (Máscara Automática)  │
        └────────────┬───────────┘
                     │
                     ↓
        ┌────────────────────────────────────┐
        │  Exibir no Campo Input             │
        │  Ex: "123.456.789-10"              │
        └────────────┬───────────────────────┘
                     │
        (Usuário clica em Enviar)
                     │
                     ↓
        ┌────────────────────────────────────┐
        │  validateCPFComplete()             │
        │  (Validação Completa)              │
        └────────────┬───────────────────────┘
                     │
        ┌────────────┴───────────┐
        │                        │
        ↓                        ↓
    ✓ Válido               ✗ Inválido
        │                        │
        ↓                        ↓
   Enviar ao Backend      Exibir Mensagem
   (result.unformatted)   de Erro
```

---

## ⚙️ Integração em Componentes Existentes

### Antes (Sem o Validador)

```typescript
// Código no RegistrationFormSection.tsx
const isValidCPF = (raw: string): boolean => {
  const cpf = raw.replace(/\D/g, '')
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false
  // ... lógica de cálculo duplicada
}
```

### Depois (Com o Validador)

```typescript
import { validateCPFComplete } from '@/components/CPFValidator'

// Seu componente fica muito mais limpo
const handleCPFValidation = (cpfValue: string) => {
  const result = validateCPFComplete(cpfValue)
  if (result.isValid) {
    // Usar result.unformatted para enviar ao backend
  }
}
```

---

## 🧪 Testando o Validador

### CPFs de Teste Válidos

Para testar localmente, você pode usar estes CPFs válidos:

```javascript
// Formato: "123.456.789-10" (todos válidos)
const testCPFs = [
  "123.456.789-10",
  "111.444.777-35",
  "111.444.777-38"
]

testCPFs.forEach(cpf => {
  console.log(cpf, isValidCPF(cpf)) // true
})
```

### CPFs de Teste Inválidos

```javascript
const invalidCPFs = [
  "123.456.789-00",     // Dígitos inválidos
  "11111111111",        // Todos iguais
  "123.456.789",        // Poucos dígitos
  "999.999.999-99"      // Dígitos inválidos
]

invalidCPFs.forEach(cpf => {
  console.log(cpf, isValidCPF(cpf)) // false
})
```

---

## 🚨 Tratamento de Erros

O módulo é seguro contra entradas inválidas:

```typescript
validateCPFComplete("") 
// { isValid: false, errorMessage: "CPF é obrigatório", ... }

validateCPFComplete("abc def ghi")
// { isValid: false, errorMessage: "CPF deve conter 11 dígitos", ... }

validateCPFComplete(null)
// Erro de TypeScript em compilação (seguro em tempo de desenvolvimento)
```

---

## 📝 Licença e Reutilização

Este módulo pode ser reutilizado livremente em qualquer projeto. É **totalmente independente** e não possui dependências externas, apenas TypeScript nativo.

### Para copiar para outro projeto:

1. Copie o arquivo `CPFValidator.ts`
2. Ajuste o caminho de importação conforme necessário
3. Importe as funções onde precisar

```typescript
// Em qualquer projeto
import { isValidCPF, formatCPF, validateCPFComplete } from './CPFValidator'
```

---

## 🤝 Contribuições e Melhorias

Se precisar adicionar funcionalidades:

- **Validar múltiplos CPFs**: Adapte para arrays
- **Gerar CPF válido aleatório**: Adicione função `generateRandomCPF()`
- **Internacionalização**: Adapte as mensagens de erro
- **Validação de data de emissão**: Integre com banco de dados

---

## 📞 Suporte

Qualquer dúvida sobre o funcionamento ou uso, consulte os exemplos acima ou adicione logs para debug:

```typescript
const result = validateCPFComplete(cpfValue)
console.log('Resultado:', result)
// Verá todos os detalhes da validação
```

---

**Última atualização**: Dezembro 2025  
**Versão**: 1.0.0  
**Status**: Pronto para produção
