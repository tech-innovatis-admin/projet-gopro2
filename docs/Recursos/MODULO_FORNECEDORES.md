# 📦 Módulo de Fornecedores - Documentação Completa

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Módulo](#arquitetura-do-módulo)
3. [Estrutura de Pastas e Arquivos](#estrutura-de-pastas-e-arquivos)
4. [Tipos e Definições](#tipos-e-definições)
5. [Dados Mock](#dados-mock)
6. [Páginas](#páginas)
7. [Componentes](#componentes)
8. [Fluxo de Dados e Estados](#fluxo-de-dados-e-estados)
9. [Funcionalidades](#funcionalidades)
10. [Padrões de Design e Estilos](#padrões-de-design-e-estilos)
11. [Rotas Disponíveis](#rotas-disponíveis)
12. [Próximas Etapas](#próximas-etapas)

---

## 🎯 Visão Geral

O módulo de **Fornecedores** é um sistema completo de gerenciamento de fornecedores para a plataforma GoPro 2.0. Ele permite:

- 📊 Visualizar lista completa de fornecedores com filtros avançados
- 🔍 Buscar e filtrar por múltiplos critérios (UF, município, categoria, serviço, status)
- ➕ Adicionar novos fornecedores via modal
- 👁️ Visualizar detalhes completos de cada fornecedor
- ✏️ Editar informações de fornecedores
- 📄 Ver contratos vinculados a cada fornecedor
- 📊 Visualizar métricas de contratos (total, valor, status)

**Tecnologias:** Next.js 15 + React 18 + TypeScript + Tailwind CSS + Radix UI

**Status:** MVP completo com mock data (pronto para integração com API real)

---

## 🏗️ Arquitetura do Módulo

```
FRONTEND (CLIENT)
    ↓
[Páginas - Page.tsx]
    ↓
[Componentes - _components]
    ↓
[Estados & Filtros - React Hooks]
    ↓
[Dados Mock - mockData.ts]
    ↓
[Tipos TypeScript - types.ts]
```

### Princípios Arquiteturais

1. **Modular**: Componentes reutilizáveis e responsáveis por uma tarefa
2. **Client-Side Rendering**: Toda lógica de filtro, busca e paginação ocorre no cliente
3. **Type-Safe**: TypeScript garante segurança de tipos em todo o código
4. **Composable**: Componentes combinam-se para formar páginas complexas
5. **Centralized Types**: Um único arquivo `types.ts` define todas as interfaces e enums
6. **Separation of Concerns**: Dados (mock), tipos (types), e apresentação (componentes) separados

---

## 📁 Estrutura de Pastas e Arquivos

```
src/app/(dashboard)/fornecedores/
│
├── 📄 page.tsx                          # Página principal (listagem)
├── 📄 types.ts                          # Tipos e enums do módulo
├── 📄 mockData.ts                       # Dados mock (50 fornecedores + 18 contratos)
│
├── 📁 _components/                      # Componentes da listagem
│   ├── 📄 FornecedoresHeader.tsx        # Cabeçalho com título e contadores
│   ├── 📄 FornecedoresFilters.tsx       # Sistema de filtros avançados
│   ├── 📄 FornecedoresTable.tsx         # Tabela com paginação e ordenação
│   ├── 📄 FornecedorRowActions.tsx      # Menu dropdown por linha
│   ├── 📄 NovoFornecedorModal.tsx       # Modal para criar novo fornecedor
│   └── 📄 index.ts                      # Exports dos componentes
│
├── 📁 [fornecedorId]/                   # Rotas dinâmicas por fornecedor
│   ├── 📄 layout.tsx                    # Layout compartilhado (header + tabs)
│   ├── 📄 page.tsx                      # Visão geral do fornecedor
│   │
│   ├── 📁 _components/                  # Componentes de detalhe
│   │   ├── 📄 FornecedorSummary.tsx     # Card de resumo
│   │   ├── 📄 FornecedorInfo.tsx        # Informações cadastrais
│   │   ├── 📄 FornecedorTags.tsx        # Categorias e serviços
│   │   ├── 📄 FornecedorContractsTable.tsx  # Tabela de contratos
│   │   └── 📄 index.ts                  # Exports dos componentes
│   │
│   ├── 📁 editar/
│   │   └── 📄 page.tsx                  # Página de edição
│   │
│   └── 📁 contratos/
│       └── 📄 page.tsx                  # Página de contratos do fornecedor
```

---

## 📝 Tipos e Definições

### Arquivo: `types.ts` (177 linhas)

Define toda a estrutura de tipos do módulo.

#### Tipos Principais

```typescript
// Status do fornecedor
type FornecedorStatus = "ATIVO" | "INATIVO"

// Categorias de fornecedores (10 tipos)
type FornecedorCategoria = 
  | "CONSULTORIA" 
  | "TECNOLOGIA"
  | "SERVICOS_GERAIS"
  | "EQUIPAMENTOS"
  | "LABORATORIO"
  | "CAPACITACAO"
  | "COMUNICACAO"
  | "TRANSPORTE"
  | "ALIMENTACAO"
  | "INFRAESTRUTURA"

// Serviços oferecidos (14 tipos)
type FornecedorServico = 
  | "CONSULTORIA_TECNICA"
  | "DESENVOLVIMENTO_SOFTWARE"
  | "MANUTENCAO_EQUIPAMENTOS"
  // ... 11 mais
```

#### Interface Fornecedor

```typescript
interface Fornecedor {
  id: string                           // ID único (UUID)
  nome: string                         # Nome do fornecedor
  razaoSocial?: string                 # Razão social
  cnpj?: string                        # CNPJ
  email?: string                       # Email
  telefone?: string                    # Telefone
  uf: string                           # Estado (UF)
  municipio: string                    # Município
  endereco?: string                    # Endereço completo
  categorias: FornecedorCategoria[]    # Categorias (1+)
  servicos: FornecedorServico[]        # Serviços (0+)
  status: FornecedorStatus             # ATIVO ou INATIVO
  observacoes?: string                 # Notas internas
  createdAt: string                    # Data de criação (ISO)
}
```

#### Interface de Filtros

```typescript
interface FornecedoresFiltersState {
  q: string                    # Busca por texto
  uf?: string                  # Filtro por estado
  municipio?: string           # Filtro por município
  categorias: string[]         # Filtro múltiplos (OR logic)
  servicos: string[]          # Filtro múltiplos (OR logic)
  status?: string             # Filtro por status
  sortBy: "nome" | "uf" | "municipio" | "status" | "dataCadastro"
  sortDir: "asc" | "desc"
  page: number                # Número da página (1-indexed)
  pageSize: number            # Itens por página
}
```

#### Mapeamentos de Cores

```typescript
// Exemplo: Cores para cada categoria
CATEGORIA_COLORS: {
  CONSULTORIA: { bg: "bg-blue-100", text: "text-blue-700" },
  TECNOLOGIA: { bg: "bg-purple-100", text: "text-purple-700" },
  // ... restante das categorias
}

// Configuração de status
STATUS_CONFIG: {
  ATIVO: { bg: "bg-green-100", text: "text-green-700", label: "Ativo" },
  INATIVO: { bg: "bg-gray-100", text: "text-gray-700", label: "Inativo" },
}
```

---

## 📊 Dados Mock

### Arquivo: `mockData.ts` (483 linhas)

Fornece dados realistas para desenvolvimento e testes sem API.

#### 50 Fornecedores Mock

```typescript
MOCK_FORNECEDORES: Fornecedor[] = [
  {
    id: "forn_001",
    nome: "TechSolutions Brasil",
    cnpj: "12.345.678/0001-90",
    uf: "SP",
    municipio: "São Paulo",
    // ... propriedades adicionais
  },
  // ... 49 fornecedores mais
]
```

**Características dos dados:**
- ✅ Distribuição geográfica (27 estados brasileiros)
- ✅ Múltiplas categorias por fornecedor (1-3)
- ✅ Múltiplos serviços (0-5 por fornecedor)
- ✅ Mix de status (ATIVO/INATIVO)
- ✅ Dados realistas de contato (email, telefone)

#### 18 Contratos Mock

```typescript
MOCK_CONTRATOS_POR_FORNECEDOR: Record<string, FornecedorContratoVinculado[]> = {
  "forn_001": [
    {
      id: "cont_001",
      codigo: "CTR-2024-001",
      titulo: "Desenvolvimento de Portal Web",
      status: "EM_ANDAMENTO",
      valorTotal: 125000,
      dataInicio: "2024-01-15",
      dataFim: "2024-06-30"
    },
    // ... mais contratos
  ]
}
```

#### Funções Utilitárias

```typescript
// Buscar fornecedor por ID
getFornecedorById(id: string): Fornecedor | undefined

// Buscar contratos de um fornecedor
getContratosByFornecedor(fornecedorId: string): FornecedorContratoVinculado[]

// Contar contratos de um fornecedor
getContratosCountByFornecedor(fornecedorId: string): number

// Buscar municípios de um estado
getMunicipiosByUF(uf: string): string[]

// Listar de UFs disponíveis
UF_LIST: string[] = ["AC", "AL", "AP", "AM", ..., "TO"]
```

---

## 📄 Páginas

### 1️⃣ Página Principal: `/fornecedores` - `page.tsx` (167 linhas)

**Responsabilidades:**
- Orquestração de componentes
- Gerenciamento de estado global (fornecedores, filtros, modal)
- Lógica de filtragem e ordenação
- Cálculo de métricas

**Componentes Utilizados:**
- `NavBar` - Navegação global
- `FornecedoresHeader` - Título e contadores
- `FornecedoresFilters` - Filtros avançados
- `FornecedoresTable` - Tabela com paginação
- `NovoFornecedorModal` - Modal de criação

**Estados:**

```typescript
const [fornecedores, setFornecedores] = useState<Fornecedor[]>(MOCK_FORNECEDORES)
const [filters, setFilters] = useState<FornecedoresFiltersState>(INITIAL_FILTERS_STATE)
const [isModalOpen, setIsModalOpen] = useState(false)
```

**Métricas Calculadas:**

```typescript
const totalFornecedores = fornecedores.length
const totalAtivos = fornecedores.filter(f => f.status === "ATIVO").length
const totalInativos = fornecedores.filter(f => f.status === "INATIVO").length
const totalFiltrados = filteredFornecedores.length
```

**Layout:**

```
┌─────────────────────────────────────────┐
│        NavBar (Navegação Global)        │
├─────────────────────────────────────────┤
│  FornecedoresHeader (Título + Contadores) │
├─────────────────────────────────────────┤
│  FornecedoresFilters (Sistema de Filtros) │
├─────────────────────────────────────────┤
│  FornecedoresTable (Tabela + Paginação)  │
└─────────────────────────────────────────┘
```

### 2️⃣ Layout Dinâmico: `/fornecedores/[fornecedorId]/` - `layout.tsx` (136 linhas)

**Responsabilidades:**
- Carregar dados do fornecedor
- Exibir header com informações básicas
- Renderizar navegação com abas
- Validar existência do fornecedor (404)

**Estrutura:**

```
┌─────────────────────────────────────────┐
│        NavBar (Navegação Global)        │
├─────────────────────────────────────────┤
│  Header: Breadcrumb + Avatar + Status   │
├─────────────────────────────────────────┤
│  Tabs: [Visão Geral] [Editar] [Contratos] │
├─────────────────────────────────────────┤
│  children (rendered page content)       │
└─────────────────────────────────────────┘
```

**Tabs Disponíveis:**
- 👁️ Visão Geral → `/fornecedores/[id]`
- ✏️ Editar → `/fornecedores/[id]/editar`
- 📄 Contratos → `/fornecedores/[id]/contratos`

### 3️⃣ Visão Geral: `/fornecedores/[fornecedorId]/` - `page.tsx` (89 linhas)

**Conteúdo:**
1. **Card de Resumo** - Informações principais
2. **Informações Cadastrais** - CNPJ, endereço, datas
3. **Categorias e Serviços** - Tags coloridas
4. **Preview de Contratos** - 3 primeiros contratos com link para ver todos

**Exemplo de Layout:**

```
┌─────────────────────────────────────┐
│  [Avatar] TechSolutions Brasil      │
│  Status: ATIVO  | 5 Contratos       │
└─────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  INFORMAÇÕES CADASTRAIS      │  CATEGORIAS E SERVIÇOS       │
│  CNPJ: 12.345.678/0001-90    │  • Consultoria (blue)        │
│  Endereço: Av. Paulista, 1000│  • Tecnologia (purple)       │
│  São Paulo - SP              │  • Desenvolvimento Software  │
│  Cadastro: 15/01/2024        │  • Consultoria Técnica       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐
│  CONTRATOS VINCULADOS         Ver todos (5) │
│  • CTR-2024-001: Portal Web    R$ 125.000   │
│  • CTR-2024-005: App Mobile    R$ 85.000    │
│  • CTR-2024-008: API REST      R$ 60.000    │
└─────────────────────────────────────┘
```

### 4️⃣ Edição: `/fornecedores/[fornecedorId]/editar/` - `page.tsx` (387 linhas)

**Funcionalidades:**
- Formulário completo com validação
- Detecção de mudanças (hasChanges)
- Alerta de alterações não salvas
- Dependência UF → Município
- Multi-select para categorias e serviços
- Mock persistence com delay simulado

**Campos do Formulário:**
- Nome *
- CNPJ
- Razão Social
- Email
- Telefone
- UF *
- Município *
- Endereço
- Categorias * (multi-select)
- Serviços (multi-select)
- Status
- Observações

**Validação:**
- Nome é obrigatório
- UF é obrigatório
- Município é obrigatório
- Ao menos uma categoria é obrigatória

### 5️⃣ Contratos: `/fornecedores/[fornecedorId]/contratos/` - `page.tsx` (89 linhas)

**Conteúdo:**
- Métricas em cards (Total, Valor Total, Status breakdown)
- Tabela completa de contratos com todas as informações

**Métricas Exibidas:**
```
┌──────────────────────────────────────────────────────────────┐
│ Total Contratos: 5  │  Valor Total: R$ 270.000  │  Em Anda-  │
│                     │                            │  mento: 3  │
└──────────────────────────────────────────────────────────────┘
```

**Tabela de Contratos:**
- Código do contrato
- Título
- Status (badge colorida)
- Valor total
- Período (data início - data fim)
- Ações (link externo)

---

## 🧩 Componentes

### Componentes da Listagem (`_components/`)

#### 1. `FornecedoresHeader.tsx` (68 linhas)

**Props:**
```typescript
interface FornecedoresHeaderProps {
  totalFornecedores: number
  totalAtivos: number
  totalInativos: number
  totalFiltrados: number
  onNovoFornecedor: () => void
}
```

**Renderiza:**
- 🏢 Ícone + Título "Fornecedores"
- 📊 Contadores em chips (Total / Ativos / Inativos / Filtrados)
- 🔘 Botão "Novo Fornecedor"
- 📥 Botão "Exportar" (placeholder)

**Responsividade:**
- Mobile: Contadores em coluna
- Desktop: Contadores em linha

#### 2. `FornecedoresFilters.tsx` (386 linhas)

**Props:**
```typescript
interface FornecedoresFiltersProps {
  filters: FornecedoresFiltersState
  onFiltersChange: (newFilters: FornecedoresFiltersState) => void
}
```

**Filtros Disponíveis:**

1. **Busca por Texto** (Debounce 300ms)
   - Busca em: nome, razão social, CNPJ
   - Ícone: 🔍

2. **Estado (UF)**
   - Select dropdown com 27 UFs
   - Independente

3. **Município**
   - Dinâmico baseado em UF selecionado
   - Desabilitado se nenhum UF selecionado
   - Limpa ao mudar UF

4. **Status**
   - Select: Todos / Ativo / Inativo

5. **Categorias** (Multi-select com chips)
   - Toggle buttons para cada categoria
   - Exibe chips dos selecionados

6. **Serviços** (Multi-select com chips)
   - Toggle buttons para cada serviço
   - Exibe chips dos selecionados

7. **Botão "Limpar Todos"**
   - Reset de todos os filtros

**Lógica de Filtro:**
- **Busca**: AND (nome OU razão social OU CNPJ)
- **Múltiplos**: OR logic (categoria1 OU categoria2)
- **UF + Município**: AND (UF E município)

#### 3. `FornecedoresTable.tsx` (323 linhas)

**Props:**
```typescript
interface FornecedoresTableProps {
  fornecedores: Fornecedor[]
  filters: FornecedoresFiltersState
  onFiltersChange: (newFilters: FornecedoresFiltersState) => void
}
```

**Colunas:**

| Coluna | Tipo | Ordenável | Descrição |
|--------|------|-----------|-----------|
| Nome | Avatar + Link | ✅ | Clicável → detalhes |
| Categorias | Badges | ❌ | Cores diferentes |
| Localização | Texto | ✅ | UF - Município |
| Contratos | Link | ❌ | Quantidade com link |
| Status | Badge | ✅ | Verde/Cinza |
| Ações | Dropdown | ❌ | Ver/Editar/Contratos |

**Recursos:**
- ✅ Ordenação por coluna (clique no header com ícones de seta)
- ✅ Paginação (números + Anterior/Próxima)
- ✅ 10 itens por página
- ✅ Estado vazio ("Nenhum fornecedor encontrado")
- ✅ Avatar com iniciais do nome

#### 4. `FornecedorRowActions.tsx` (62 linhas)

**Props:**
```typescript
interface FornecedorRowActionsProps {
  fornecedor: Fornecedor
}
```

**Menu Dropdown:**
1. 👁️ Ver detalhes → `/fornecedores/[id]`
2. ✏️ Editar → `/fornecedores/[id]/editar`
3. 📄 Ver contratos → `/fornecedores/[id]/contratos`

**UI:**
- Ícone de 3 pontos (⋮)
- Dropdown ao clicar
- Icons descriptivos para cada ação

#### 5. `NovoFornecedorModal.tsx` (321 linhas)

**Props:**
```typescript
interface NovoFornecedorModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (fornecedor: Omit<Fornecedor, "id" | "createdAt">) => void
}
```

**Campos:**
- Nome * (input text)
- CNPJ (input text com mask)
- Razão Social (input text)
- Email (input email)
- Telefone (input tel)
- UF * (select)
- Município * (select dinâmico)
- Endereço (textarea)
- Categorias * (toggle buttons multi-select)
- Serviços (toggle buttons multi-select)
- Observações (textarea)

**Validação:**
- Campo obrigatório vazio = ícone ⚠️ vermelho
- Submit desabilitado até preencher obrigatórios
- Mensagem de sucesso ao submeter

**Mock Behavior:**
- Simula 800ms de delay
- Adiciona à lista local (não persiste)
- Gera ID único: `forn_${timestamp}`

### Componentes de Detalhe (`[fornecedorId]/_components/`)

#### 1. `FornecedorSummary.tsx` (86 linhas)

**Props:**
```typescript
interface FornecedorSummaryProps {
  fornecedor: Fornecedor
  contratosCount: number
}
```

**Renderiza:**
- 👤 Avatar com iniciais (bg colorido)
- Nome do fornecedor
- Status badge (ATIVO/INATIVO)
- Localização (UF - Município)
- Email (link mailto)
- Telefone (link tel)
- Data de cadastro
- Quantidade de contratos (canto direito)

**Responsividade:**
- Mobile: Layout em coluna
- Desktop: Informações em linha + contratos à direita

#### 2. `FornecedorInfo.tsx` (73 linhas)

**Props:**
```typescript
interface FornecedorInfoProps {
  fornecedor: Fornecedor
}
```

**Renderiza:**
- Ícone + Campo + Valor:
  - 🏢 Nome
  - #️⃣ CNPJ
  - 📍 Endereço
  - 🗺️ Localização (UF, Município)
  - 📅 Data cadastro
  - 🕐 Última atualização
  - 📝 Observações (se houver)

#### 3. `FornecedorTags.tsx` (74 linhas)

**Props:**
```typescript
interface FornecedorTagsProps {
  fornecedor: Fornecedor
}
```

**Renderiza:**
- **Categorias**: Badges coloridas (10 cores diferentes)
- **Serviços**: Badges teal (padrão)
- Estados vazios: "Nenhuma categoria" / "Nenhum serviço"

#### 4. `FornecedorContractsTable.tsx` (169 linhas)

**Props:**
```typescript
interface FornecedorContractsTableProps {
  contratos: FornecedorContratoVinculado[]
}
```

**Tabela de Contratos:**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| Código | Texto | CTR-2024-001 |
| Título | Link | Título do contrato |
| Status | Badge | Colorida (EM_ANDAMENTO/CONCLUÍDO) |
| Valor Total | Formatado | R$ 125.000,00 |
| Período | Texto | dd/mm/yyyy - dd/mm/yyyy |
| Ações | Link | Abre em nova aba |

**Footer:**
- Total: X contratos
- Valor total: Soma de todos os valores

**Formatação:**
- Moeda: Intl.NumberFormat("pt-BR", currency: "BRL")
- Data: dd/mm/yyyy

---

## 🔄 Fluxo de Dados e Estados

### Fluxo de Dados Principal

```
┌──────────────────────────────────┐
│      MOCK_FORNECEDORES           │ (dados imutáveis)
└─────────────────────────────────┬┘
                                  │
                          useState setFornecedores
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   fornecedores State    │ (lista local)
                    └────────┬────────────────┘
                             │
                    useMemo & filtros.q
                    filtros.uf, etc
                             │
                             ▼
                    ┌─────────────────────────┐
                    │ filteredFornecedores    │ (dados filtrados)
                    └─────────────────────────┘
                             │
                        FornecedoresTable
                        FornecedoresFilters
                             │
                             ▼
                    ┌─────────────────────────┐
                    │      Renderização       │
                    └─────────────────────────┘
```

### Estado da Página Principal

```typescript
// Estado de dados
const [fornecedores, setFornecedores] = useState(MOCK_FORNECEDORES)

// Estado de filtros
const [filters, setFilters] = useState({
  q: "",
  uf: undefined,
  municipio: undefined,
  categorias: [],
  servicos: [],
  status: undefined,
  sortBy: "nome",
  sortDir: "asc",
  page: 1,
  pageSize: 10
})

// Estado do modal
const [isModalOpen, setIsModalOpen] = useState(false)

// Callbacks
const handleFiltersChange = useCallback(...)
const handleNovoFornecedor = useCallback(...)
```

### Fluxo de Edição

```
Usuário clica "Editar"
        │
        ▼
  editar/page.tsx carrega
  getFornecedorById(id)
        │
        ▼
  useState com dados originais
  setState para form data
        │
        ▼
  Usuário modifica campos
        │
        ▼
  useEffect detecta mudanças
  hasChanges = true
        │
        ▼
  Usuário clica "Salvar"
        │
        ▼
  Validação & Simulação API
  (800ms delay)
        │
        ▼
  Push para /fornecedores/[id]
```

---

## ✨ Funcionalidades

### 1. Listagem com Filtros Avançados

**Filtros Disponíveis:**
- ✅ Busca por texto (nome, razão social, CNPJ)
- ✅ Filtro por UF (27 estados)
- ✅ Filtro por Município (dinâmico)
- ✅ Filtro por Status (Ativo/Inativo)
- ✅ Filtro por Categorias (multi-select, OR logic)
- ✅ Filtro por Serviços (multi-select, OR logic)
- ✅ Botão "Limpar Todos" para reset

**Performance:**
- Debounce de busca (300ms)
- useMemo para filtragem otimizada
- useCallback para handlers

### 2. Ordenação

**Ordenação por coluna:**
- Nome (A-Z ou Z-A)
- UF (A-Z ou Z-A)
- Município (A-Z ou Z-A)
- Status (A-Z ou Z-A)

**UI:**
- Clique no header da coluna
- Ícone mostra direção (↑ ↓ ⇅)

### 3. Paginação

- 10 itens por página
- Números de página clicáveis
- Botões Anterior/Próxima
- Informação: "Mostrando X-Y de Z"

### 4. Criar Novo Fornecedor

**Modal com:**
- Validação de campos obrigatórios
- Feedback visual de erros
- Toggle buttons para categorias/serviços
- Seleção dinâmica de município por UF
- Mock persistence (adiciona ao estado local)

### 5. Visualizar Detalhes

**Página de Visão Geral com:**
- Card de resumo (avatar, status, localização)
- Informações cadastrais (CNPJ, endereço, datas)
- Categorias e serviços (badges coloridas)
- Preview de contratos (3 primeiros com link)

### 6. Editar Fornecedor

**Formulário completo com:**
- Todos os campos editáveis
- Validação em tempo real
- Detecção de mudanças (alerta "Você tem alterações não salvas")
- Dependência UF → Município
- Mock persistence com delay simulado (800ms)

### 7. Visualizar Contratos

**Página dedicada com:**
- Métricas: Total, Valor Total, Status breakdown
- Tabela completa de contratos
- Formatação de moeda (R$ x.xxx,xx)
- Links para abrir contrato em nova aba

### 8. Navegação Integrada

**Links Internos:**
- Navbar: "Fornecedores" → `/fornecedores`
- Tabela: Nome → `/fornecedores/[id]`
- Contratos count → `/fornecedores/[id]/contratos`
- Row actions dropdown

---

## 🎨 Padrões de Design e Estilos

### Paleta de Cores

```css
/* Cores Institucionais */
Primary Blue: #1F4E79
Accent Turquoise: #00C48B

/* Neutrals */
Slate-50: #f8fafc (backgrounds)
White: #ffffff (cards)
Gray-900: #111827 (text)

/* Status Colors */
ATIVO: bg-green-100 / text-green-700
INATIVO: bg-gray-100 / text-gray-700
```

### Tipografia

- **Font**: Poppins (Google Fonts)
- **Weights**: 400 (normal), 600 (semibold), 700 (bold)
- **Sizes**:
  - Titles: 24px bold
  - Subtitles: 16px semibold
  - Body: 14px normal
  - Small: 12px normal

### Componentes UI

- **Card**: `rounded-xl shadow-sm border border-gray-200 p-6`
- **Button**: Variants (default, outline, ghost)
- **Badge**: Inline-flex `px-3 py-1 rounded-full text-sm`
- **Input**: `px-3 py-2 border rounded-lg focus:ring`
- **Table**: Striped background, hover effect

### Espaçamento

Segue proporção áurea (~1.618):
- 4px (gap-1)
- 6px (gap-1.5)
- 10px (gap-2.5)
- 16px (gap-4)
- 24px (gap-6)
- 34px (gap-8)

### Responsividade

- **Mobile**: `sm` (640px) - layouts em coluna
- **Tablet**: `md` (768px) - grid com 2 colunas
- **Desktop**: `lg` (1024px) - layout completo

---

## 🛣️ Rotas Disponíveis

| Rota | Página | Descrição |
|------|--------|-----------|
| `/fornecedores` | Listagem | Lista todos com filtros |
| `/fornecedores/[id]` | Visão Geral | Detalhes completos |
| `/fornecedores/[id]/editar` | Edição | Formulário de edição |
| `/fornecedores/[id]/contratos` | Contratos | Tabela de contratos |

### Navegação entre Rotas

```
┌─────────────────────────────────────────┐
│         /fornecedores (Listagem)        │
│  [Tabela com links por linha]            │
│  ├─ Clique no nome ──────────────────────┐
│  ├─ "Ver detalhes" (dropdown) ────────────┤
│  └─ Contratos count (link) ───────────────┤
└─────────────────────────────────────────┘│
                                            │
                    ┌───────────────────────┴─┐
                    │                         │
                    ▼                         ▼
        ┌──────────────────────┐  ┌──────────────────────┐
        │ /fornecedores/[id]   │  │ /fornecedores/[id]/  │
        │ (Visão Geral)        │  │ contratos (Contratos)│
        │ [Tabs: V / E / C]    │  │ [Tabs: V / E / C]    │
        └──────┬──────┬────────┘  └──────────────────────┘
               │      │
        "Editar" tab   │
               │      │
               ▼      ▼
        ┌──────────────────────────┐
        │ /fornecedores/[id]/      │
        │ editar (Edição)          │
        │ [Tabs: V / E / C]        │
        └──────────────────────────┘
```

---

## 🚀 Próximas Etapas

### 1. Integração com API Real

**Substituir mock data por chamadas reais:**

```typescript
// Antes (mock)
const fornecedores = MOCK_FORNECEDORES

// Depois (API)
const [fornecedores, setFornecedores] = useState([])
useEffect(() => {
  fetch('/api/fornecedores')
    .then(r => r.json())
    .then(setFornecedores)
}, [])
```

### 2. Criar Rotas API

**Endpoints necessários:**
- `GET /api/fornecedores` - Listar com filtros
- `POST /api/fornecedores` - Criar novo
- `GET /api/fornecedores/[id]` - Detalhes
- `PUT /api/fornecedores/[id]` - Atualizar
- `DELETE /api/fornecedores/[id]` - Deletar

### 3. Persistência com Prisma

**Modelar entidade:**
```prisma
model Fornecedor {
  id            String   @id @default(cuid())
  nome          String
  cnpj          String?  @unique
  email         String?
  telefone      String?
  uf            String
  municipio     String
  endereco      String?
  categorias    String[]
  servicos      String[]
  status        String   @default("ATIVO")
  observacoes   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  contratos     ContratoFornecedor[]
}
```

### 4. Testes e Validação

- ✅ Testes unitários (Jest)
- ✅ Testes de integração (React Testing Library)
- ✅ E2E (Cypress/Playwright)
- ✅ Testes de acessibilidade (Axe)

### 5. Otimizações

- ✅ Infinite scroll (ao invés de paginação)
- ✅ Cached queries (React Query/SWR)
- ✅ Busca server-side (melhor performance)
- ✅ Exportação (CSV/Excel)
- ✅ Importação em massa

### 6. Recursos Adicionais

- ✅ Anexos/Documentos por fornecedor
- ✅ Histórico de alterações
- ✅ Sistema de avaliação/ratings
- ✅ Dashboard com KPIs
- ✅ Relatórios personalizados

---

## 📊 Sumário de Arquivos

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `types.ts` | 177 | Tipos, enums, mapeamentos |
| `mockData.ts` | 483 | 50 fornecedores + 18 contratos |
| `page.tsx` | 167 | Orquestração principal |
| `_components/FornecedoresHeader.tsx` | 68 | Cabeçalho e contadores |
| `_components/FornecedoresFilters.tsx` | 386 | Sistema de filtros |
| `_components/FornecedoresTable.tsx` | 323 | Tabela com paginação |
| `_components/FornecedorRowActions.tsx` | 62 | Menu dropdown |
| `_components/NovoFornecedorModal.tsx` | 321 | Modal de criação |
| `[fornecedorId]/layout.tsx` | 136 | Layout dinâmico com tabs |
| `[fornecedorId]/page.tsx` | 89 | Visão geral do fornecedor |
| `[fornecedorId]/_components/FornecedorSummary.tsx` | 86 | Card de resumo |
| `[fornecedorId]/_components/FornecedorInfo.tsx` | 73 | Info cadastrais |
| `[fornecedorId]/_components/FornecedorTags.tsx` | 74 | Categorias e serviços |
| `[fornecedorId]/_components/FornecedorContractsTable.tsx` | 169 | Tabela de contratos |
| `[fornecedorId]/editar/page.tsx` | 387 | Formulário de edição |
| `[fornecedorId]/contratos/page.tsx` | 89 | Página de contratos |
| **TOTAL** | **3,167** | **Código completo do módulo** |

---

## 🎓 Convenções de Código

### Nomeação
- Arquivos de página: `page.tsx`
- Arquivos de layout: `layout.tsx`
- Componentes: PascalCase `FornecedoresHeader.tsx`
- Tipos: PascalCase `Fornecedor`, `FornecedoresFiltersState`
- Variáveis: camelCase `fornecedores`, `setFilters`
- Constantes: UPPER_CASE `MOCK_FORNECEDORES`, `CATEGORIA_COLORS`

### Estrutura de Componentes
```typescript
"use client"  // Se usa hooks

import { ... }  // Imports

interface ComponentProps { ... }  // Types

export default function ComponentName(props: ComponentProps) {
  // Hooks
  const [state, setState] = useState(...)
  
  // Handlers
  const handleClick = useCallback(...)
  
  // Render
  return <div>...</div>
}
```

### Ordenação de Imports
1. React imports
2. Next.js imports
3. UI components
4. Types & enums
5. Utilities & data

---

## 📝 Notas Importantes

1. **Mock Data**: Todos os dados são mock. Não há persistência real. Ao recarregar a página, voltam aos dados originais.

2. **Client-Side**: Todo o módulo é `"use client"`. Filtragem, ordenação e paginação ocorrem no navegador.

3. **Performance**: Usa `useMemo` e `useCallback` para otimizar renders.

4. **Acessibilidade**: Componentes seguem padrões WCAG, com labels e ARIA attributes.

5. **Responsividade**: Design mobile-first, funciona em todos os tamanhos de tela.

6. **Design System**: Segue a paleta de cores, tipografia e espaçamento definidos em `frontend_expert.md`.

---

## 🤝 Contribuindo

Ao adicionar novas funcionalidades:
1. Mantenha os tipos centralizados em `types.ts`
2. Use componentes reutilizáveis de `_components/`
3. Siga a paleta de cores estabelecida
4. Adicione comentários explicativos
5. Teste em múltiplos tamanhos de tela

---

**Documento gerado:** Janeiro 2026  
**Status:** MVP Completo  
**Próxima fase:** Integração com API Real
