# PhoneValidator - Guia de Uso

## 📋 Visão Geral

`PhoneValidator` é um módulo TypeScript compacto e independente que fornece funções para formatação automática e validação de números de telefone brasileiros.

### Características

✅ **Formatação Progressiva**: Aplica máscara visual automaticamente ((XX) XXXXX-XXXX)  
✅ **Validação Oficial**: Valida DDDs e quantidade de dígitos  
✅ **Reutilizável**: Sem dependências externas  
✅ **Type-Safe**: Totalmente tipado em TypeScript  
✅ **Múltiplas Funções**: Extração de DDD, validação de celular, e mais

---

## 🚀 Como Usar

### Importar Funções

```typescript
import {
  formatPhone,
  unformatPhone,
  isValidPhone,
  getPhoneErrorMessage,
  validatePhoneComplete,
  extractDDD,
  isCellphone,
  normalizePhone,
  PhoneValidationResult
} from '@/components/PhoneValidator'
```

### Exemplos Rápidos

#### 1. Formatação Automática em Input

```typescript
const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const formatted = formatPhone(e.target.value)
  setPhone(formatted) // Resultado: "(11) 98765-4321"
}
```

#### 2. Validação Simples

```typescript
if (isValidPhone(phoneValue)) {
  console.log("✓ Telefone válido!")
} else {
  console.log("✗ Telefone inválido")
}
```

#### 3. Validação Completa (Recomendado)

```typescript
const result = validatePhoneComplete("11987654321")

if (result.isValid) {
  console.log("Formatado:", result.formatted)   // "(11) 98765-4321"
  console.log("Desformatado:", result.unformatted) // "11987654321"
  console.log("DDD:", result.ddd)               // "11"
} else {
  console.log("Erro:", result.errorMessage)
}
```

#### 4. Extrair DDD

```typescript
const ddd = extractDDD("(11) 98765-4321") // "11"
```

#### 5. Identificar Celular

```typescript
const isMobile = isCellphone("(11) 98765-4321") // true (11 dígitos)
const isLandline = isCellphone("(11) 3456-7890") // false (10 dígitos)
```

---

## 📦 API Reference

### `formatPhone(value: string): string`

Aplica máscara visual progressiva a um telefone.

**Comportamento Progressivo:**
```
Entrada     → Saída
"1"         → "1"
"11"        → "11"
"119"       → "(11) 9"
"1198765"   → "(11) 98765"
"11987654"  → "(11) 98765-4"
"11987654321" → "(11) 98765-4321"
```

**Exemplos:**
```typescript
formatPhone("11987654321")      // "(11) 98765-4321"
formatPhone("21912345678")      // "(21) 91234-5678"
formatPhone("11 98765 4321")    // "(11) 98765-4321" (limpa e formata)
```

---

### `unformatPhone(formatted: string): string`

Remove toda a formatação, retornando apenas dígitos.

**Exemplos:**
```typescript
unformatPhone("(11) 98765-4321") // "11987654321"
unformatPhone("11 9876-5432")    // "119876543"
```

---

### `isValidPhone(phone: string): boolean`

Valida se um telefone é válido.

**Critérios de Validação:**
- Deve ter entre 10 e 11 dígitos
- DDD (primeiros 2 dígitos) deve estar entre 11 e 99

**Exemplos:**
```typescript
isValidPhone("(11) 98765-4321")  // true
isValidPhone("11987654321")      // true
isValidPhone("(21) 3456-7890")   // true
isValidPhone("123")              // false (poucos dígitos)
isValidPhone("(01) 98765-4321")  // false (DDD inválido)
```

---

### `getPhoneErrorMessage(phone: string): string`

Retorna mensagem de erro específica.

**Mensagens Possíveis:**
```
Campo vazio              → "Telefone é obrigatório"
Poucos dígitos (< 10)    → "Telefone inválido. Mínimo de 10 dígitos."
Telefone inválido        → "Telefone inválido"
Telefone válido          → "" (string vazia)
```

**Exemplos:**
```typescript
getPhoneErrorMessage("")                // "Telefone é obrigatório"
getPhoneErrorMessage("1234")            // "Telefone inválido. Mínimo de 10 dígitos."
getPhoneErrorMessage("(11) 98765-4321") // ""
```

---

### `validatePhoneComplete(phone: string): PhoneValidationResult`

Realiza validação completa com resultado detalhado.

**Retorno:**
```typescript
interface PhoneValidationResult {
  isValid: boolean        // true se válido
  errorMessage: string    // Mensagem de erro ou ""
  formatted: string       // Formato com máscara
  unformatted: string     // Apenas números
  ddd: string            // Código de área
}
```

**Exemplos:**
```typescript
const result = validatePhoneComplete("11987654321")
console.log(result)
// {
//   isValid: true,
//   errorMessage: "",
//   formatted: "(11) 98765-4321",
//   unformatted: "11987654321",
//   ddd: "11"
// }
```

---

### `extractDDD(phone: string): string`

Extrai apenas o código de área (DDD).

**Exemplos:**
```typescript
extractDDD("(11) 98765-4321") // "11"
extractDDD("21912345678")     // "21"
extractDDD("8733456789")      // "87"
```

---

### `isCellphone(phone: string): boolean`

Verifica se é celular (11 dígitos) ou fixo (10 dígitos).

**Exemplos:**
```typescript
isCellphone("(11) 98765-4321") // true (11 dígitos = celular)
isCellphone("(11) 3456-7890")  // false (10 dígitos = fixo)
isCellphone("21987654321")     // true
```

---

### `normalizePhone(phone: string): { formatted: string; unformatted: string }`

Normaliza um telefone retornando ambos os formatos.

**Exemplos:**
```typescript
normalizePhone("11 98765 4321")
// { formatted: "(11) 98765-4321", unformatted: "11987654321" }

normalizePhone("(21) 912345678")
// { formatted: "(21) 91234-5678", unformatted: "21912345678" }
```

---

## 💡 Casos de Uso

### 1. Formulário com Validação em Tempo Real

```typescript
'use client'
import { useState } from 'react'
import { formatPhone, validatePhoneComplete } from '@/components/PhoneValidator'

export default function PhoneForm() {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatPhone(e.target.value)
    setPhone(value)
    
    // Validar enquanto digita
    if (value.replace(/\D/g, '').length === 11) {
      const result = validatePhoneComplete(value)
      setError(result.errorMessage)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = validatePhoneComplete(phone)
    
    if (result.isValid) {
      console.log("Telefone desformatado:", result.unformatted)
      // Enviar ao backend
    } else {
      setError(result.errorMessage)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="tel"
        value={phone}
        onChange={handlePhoneChange}
        placeholder="(00) 00000-0000"
        maxLength={15}
      />
      {error && <span style={{ color: 'red' }}>{error}</span>}
      <button type="submit">Enviar</button>
    </form>
  )
}
```

### 2. Enviar ao Backend

```typescript
import { validatePhoneComplete } from '@/components/PhoneValidator'

async function cadastrarTelefone(phoneValue: string) {
  const result = validatePhoneComplete(phoneValue)
  
  if (!result.isValid) {
    throw new Error(result.errorMessage)
  }

  // Enviar desformatado ao backend
  const response = await fetch('/api/usuarios', {
    method: 'POST',
    body: JSON.stringify({
      phone: result.unformatted, // "11987654321"
      ddd: result.ddd            // "11"
    })
  })

  return response.json()
}
```

### 3. Exibir DDD do Usuário

```typescript
import { extractDDD, isCellphone } from '@/components/PhoneValidator'

function UserPhoneInfo(phone: string) {
  const ddd = extractDDD(phone)
  const isMobile = isCellphone(phone)
  
  return (
    <div>
      <p>DDD: {ddd}</p>
      <p>Tipo: {isMobile ? 'Celular' : 'Telefone Fixo'}</p>
    </div>
  )
}
```

### 4. Filtrar por Região (DDD)

```typescript
import { extractDDD } from '@/components/PhoneValidator'

function getUsersByRegion(phones: string[], dddTarget: string) {
  return phones.filter(phone => extractDDD(phone) === dddTarget)
}

// Exemplo: Filtrar usuários de São Paulo
const spUsers = getUsersByRegion(userPhones, "11")
```

---

## 🔢 DDDs Brasileiros Válidos

| Região | DDD | Região | DDD |
|--------|-----|--------|-----|
| São Paulo | 11 | Paraná | 41, 42, 43, 44, 45, 46 |
| Rio de Janeiro | 21, 24 | Santa Catarina | 47, 48, 49 |
| Minas Gerais | 31, 32, 33, 34, 35, 37, 38 | Rio Grande do Sul | 51, 53, 54, 55 |
| Bahia | 71, 73, 74, 75, 77 | Distrito Federal | 61 |
| Pernambuco | 81, 87 | Goiás | 62, 64 |
| Ceará | 85, 88 | Mato Grosso | 65, 66 |
| Pará | 91, 93, 94 | Mato Grosso do Sul | 67 |
| Amazonas | 92, 97 | Tocantins | 63 |
| Maranhão | 98, 99 | Rondônia | 69 |
| Piauí | 86, 89 | Roraima | 95 |
| Alagoas | 82 | Amapá | 96 |
| Sergipe | 79 | Acre | 68 |
| Espírito Santo | 27, 28 |  |  |

> **Nota**: A validação atual aceita qualquer DDD entre 11 e 99. Para validação mais rigorosa por região específica, adicione uma lista de DDDs válidos.

---

## 📝 Integração no Código Existente

### Antes (Sem o Validador)

```typescript
// Dentro de RegistrationFormSection.tsx
const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 11) {
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 7) return numbers.replace(/(\d{2})(\d+)/, '($1) $2')
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return value
}
```

### Depois (Com o Validador)

```typescript
import { formatPhone, validatePhoneComplete } from '@/components/PhoneValidator'

// Seu código fica mais limpo e reutilizável
const handlePhoneValidation = (phoneValue: string) => {
  const result = validatePhoneComplete(phoneValue)
  if (result.isValid) {
    // Usar result.unformatted para enviar ao backend
  }
}
```

---

## 🧪 Testando

### Telefones de Teste Válidos

```javascript
const validPhones = [
  "(11) 98765-4321", // São Paulo - Celular
  "(21) 99876-5432", // Rio de Janeiro - Celular
  "(11) 3456-7890",  // São Paulo - Fixo
  "21912345678",     // Rio de Janeiro (sem formatação)
]

validPhones.forEach(phone => {
  console.log(phone, isValidPhone(phone)) // true
})
```

### Telefones de Teste Inválidos

```javascript
const invalidPhones = [
  "1234567",         // Poucos dígitos
  "(01) 98765-4321", // DDD inválido
  "00987654321",     // DDD inválido
]

invalidPhones.forEach(phone => {
  console.log(phone, isValidPhone(phone)) // false
})
```

---

## 🔄 Fluxo Recomendado

```
┌─────────────────────────────┐
│   Usuário Digita Telefone   │
└────────────┬────────────────┘
             │
             ↓
┌────────────────────────────┐
│    formatPhone()           │
│  (Máscara Automática)      │
└────────────┬───────────────┘
             │
             ↓
┌────────────────────────────┐
│  Exibir no Input           │
│  Ex: "(11) 98765-4321"     │
└────────────┬───────────────┘
             │
  (Usuário clica em Enviar)
             │
             ↓
┌────────────────────────────┐
│  validatePhoneComplete()   │
│  (Validação Completa)      │
└────────┬───────────────────┘
         │
    ┌────┴────┐
    │          │
    ↓          ↓
  ✓ Válido   ✗ Inválido
    │          │
    ↓          ↓
Enviar       Mostrar Erro
Desformatado (result.unformatted)
```

---

## 🚨 Tratamento de Erros

```typescript
validatePhoneComplete("") 
// { isValid: false, errorMessage: "Telefone é obrigatório", ... }

validatePhoneComplete("123") 
// { isValid: false, errorMessage: "Telefone inválido. Mínimo de 10 dígitos.", ... }

validatePhoneComplete("(01) 98765-4321")
// { isValid: false, errorMessage: "Telefone inválido", ... }
```

---

## 📞 Diferenças: Celular vs Fixo

| Tipo | Dígitos | Exemplo | isCellphone() |
|------|---------|---------|---------------|
| Celular | 11 | (11) 98765-4321 | true |
| Fixo | 10 | (11) 3456-7890 | false |

---

## 💾 Para Usar em Outro Projeto

1. Copie o arquivo `PhoneValidator.ts`
2. Ajuste o caminho de importação conforme necessário

```typescript
import { formatPhone, validatePhoneComplete } from './PhoneValidator'
```

---

**Última atualização**: Dezembro 2025  
**Versão**: 1.0.0  
**Status**: Pronto para produção
