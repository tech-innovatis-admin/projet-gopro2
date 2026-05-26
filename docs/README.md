# GoPro 2.0 - Plataforma de Gestão de Contratos

Este é um projeto [Next.js](https://nextjs.org) criado com [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🚀 Getting Started

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

---

## 📁 Estrutura de Pastas do Projeto

```
gopro-2/
├── .cursor/                    # Configurações do Cursor IDE
│   └── commands/               # Comandos customizados do Cursor
│
├── .env                        # Variáveis de ambiente (não versionado)
├── .git/                       # Controle de versão Git
├── .gitignore                  # Arquivos ignorados pelo Git
├── .next/                      # Arquivos de build do Next.js (gerado)
├── node_modules/               # Dependências instaladas (gerado)
│
├── components/                 # Componentes UI compartilhados (shadcn/ui) - Root level
│   └── ui/
│       ├── button.tsx          # Componente de botão
│       ├── card.tsx            # Componente de card
│       ├── checkbox.tsx        # Componente de checkbox
│       ├── dropdown.tsx        # Componente de dropdown customizado (estilo NavBar)
│       ├── dropdown.md         # Documentação do componente Dropdown
│       ├── input.tsx           # Componente de input
│       ├── label.tsx           # Componente de label
│       ├── MiniFooter.tsx      # Mini rodapé reutilizável
│       ├── NavBar.tsx          # Barra de navegação principal
│       ├── resizable-table.tsx # Tabela com colunas redimensionáveis
│       ├── select.tsx          # Componente de select/dropdown
│       └── separator.tsx       # Componente separador visual
│
├── components.json          # Configuração do shadcn/ui
│
├── docs/                       # Documentação do projeto
│   ├── README.md               # Este arquivo (documentação principal)
│   ├── BASE_DADOS.md           # Documentação do banco de dados
│   ├── BASE_NECESSARIA.md      # Dados necessários para inicialização
│   ├── ESTRUTURA_CONTRATO_ID.md # Estrutura específica de IDs de contratos
│   └── Banco de Dados Real/    # Documentação de banco de dados real
│       ├── Dicionário.md       # Dicionário de dados
│       ├── GoPro2_Especificacao_Backend.md
│       └── GoPro2_Especificacao_Backend_Complemento.md
│
├── EXEMPLO_CSS_LETRAS_BREAK/ # Exemplo de efeito CSS (animação de letras)
│   ├── exemplo1.html
│   ├── exemplo2.css
│   └── exemplo3.js
│
├── hooks/                      # Hooks customizados (root level)
│   └── useResizableColumns.ts  # Hook para colunas de tabela redimensionáveis
│
├── lib/                        # Utilitários shadcn/ui (root level)
│   └── utils.ts                # Função cn() para classes condicionais Tailwind
│
├── prisma/                     # Configuração do Prisma ORM
│   └── schema.prisma           # Schema do banco de dados (Prisma Schema)
│
├── public/                     # Arquivos estáticos públicos
│   ├── Logos/                  # Logos e identidade visual
│   │   ├── EXEMPLO_CSS_LETRAS_BREAK/ # Exemplos de CSS para logos animados
│   │   ├── logo_innovatis.svg  # Logo Innovatis padrão
│   │   ├── logo_innovatis_oficial.svg # Logo Innovatis versão oficial
│   │   ├── logo_innovatis_preta.svg # Logo Innovatis preta
│   │   ├── para vitor.svg      # Logo custom
│   │   └── vitor_svg.svg       # Logo custom Vitor
│   ├── Poppins/                # Fonte Poppins (todas as variações)
│   │   └── OFL.txt             # Licença aberta da fonte Poppins
│   ├── epitacio.png            # Imagem de perfil
│   ├── epitacio_brito_foto_oficial.jpeg # Imagem oficial
│   ├── file.svg                # Ícone de arquivo
│   ├── globe.svg               # Ícone de globo
│   ├── next.svg                # Logo Next.js
│   ├── vercel.svg              # Logo Vercel
│   └── window.svg              # Ícone de janela
│
├── src/                        # Código fonte principal
│   ├── .env                    # Variáveis de ambiente do src
│   │
│   ├── app/                    # App Router do Next.js
│   │   ├── globals.css         # Estilos globais (Tailwind CSS + custom)
│   │   ├── layout.tsx          # Layout raiz da aplicação
│   │   ├── page.tsx            # Página inicial pública (rota /)
│   │   ├── not-found.tsx/      # Página 404 customizada
│   │   │
│   │   ├── api/                # API Routes (Backend)
│   │   │   ├── auth/           # Endpoints de autenticação
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts        # POST /api/auth/login
│   │   │   │   ├── logout/
│   │   │   │   │   └── route.ts        # POST /api/auth/logout
│   │   │   │   └── me/
│   │   │   │       └── route.ts        # GET /api/auth/me (user info)
│   │   │   │
│   │   │   └── contratos/      # Endpoints de contratos
│   │   │       └── [contratoId]/ # Rotas dinâmicas por contrato
│   │   │           └── ... (endpoints específicos)
│   │   │
│   │   ├── (auth)/             # Route Group: Rotas públicas (não autenticadas)
│   │   │   └── login/
│   │   │       ├── page.tsx              # Página de login (/login)
│   │   │       └── _components/          # Componentes específicos do login (vazio)
│   │   │
│   │   └── (dashboard)/        # Route Group: Rotas protegidas (autenticadas)
│   │       ├── home/           # Dashboard principal
│   │       │   ├── page.tsx               # Página home (/home)
│   │       │   └── _components/          # Componentes da dashboard
│   │       │       ├── CategoryPieChart.tsx    # Gráfico de pizza por categoria
│   │       │       ├── ContractsLineChart.tsx  # Gráfico de linha - evolução temporal
│   │       │       ├── ContractsMap.tsx        # Mapa geográfico de contratos
│   │       │       ├── MapComponent.tsx        # Componente base do mapa (React-Leaflet)
│   │       │       ├── PartnerBarChart.tsx     # Gráfico de barras - performance por parceiro
│   │       │       └── index.ts                # Exportações centralizadas
│   │       │
│   │       ├── contratos/      # Gestão de contratos (Projetos & Produtos)
│   │       │   ├── page.tsx                    # Listagem de contratos (/contratos)
│   │       │   │                               # Filtros: tipo, status, parceiro, período
│   │       │   │                               # Tabela com paginação e ordenação
│   │       │   │
│   │       │   ├── _components/                # Componentes específicos
│   │       │   │   ├── index.ts                # Exportações centralizadas
│   │       │   │   └── NovoContratoModal.tsx   # Modal para criar novo contrato
│   │       │   │
│   │       │   ├── pre-projetos/               # Pré-projetos e pré-contratos
│   │       │   │   ├── page.tsx                # Listagem (/contratos/pre-projetos)
│   │       │   │   ├── README.md               # Documentação específica
│   │       │   │   └── _components/            # Componentes específicos
│   │       │   │       ├── index.ts            # Exportações
│   │       │   │       └── NovoPreProjetoModal.tsx # Modal de cadastro de pré-projeto
│   │       │   │
│   │       │   └── [contratoId]/               # Rotas dinâmicas por contrato
│   │       │       ├── layout.tsx              # Layout compartilhado com tabs
│   │       │       ├── page.tsx                # Visão Geral (/contratos/[id])
│   │       │       ├── types.ts                # Tipos TypeScript específicos
│   │       │       │
│   │       │       ├── arquivos/               # Documentos e arquivos anexados
│   │       │       │   ├── page.tsx
│   │       │       │   └── _components/        # Componentes de upload/gerenciamento
│   │       │       │
│   │       │       ├── desembolso/             # Gestão de desembolsos
│   │       │       │   ├── page.tsx
│   │       │       │   └── _components/        # Componentes de fluxo de caixa
│   │       │       │
│   │       │       ├── editar/                 # Página centralizada de edição
│   │       │       │   ├── page.tsx            # Container com sidebar vertical
│   │       │       │   └── _components/        # Componentes das abas de edição
│   │       │       │       ├── index.ts        # Exportações
│   │       │       │       ├── InformacoesContratoTab.tsx
│   │       │       │       ├── MetaEtapaFaseTab.tsx
│   │       │       │       ├── EquipeTecnicaTab.tsx
│   │       │       │       ├── IncubadasTab.tsx
│   │       │       │       ├── RubricasTab.tsx
│   │       │       │       ├── DesembolsoTab.tsx
│   │       │       │       └── ArquivosTab.tsx
│   │       │       │
│   │       │       ├── equipe-tecnica/         # Gestão de equipe técnica
│   │       │       │   ├── page.tsx
│   │       │       │   └── _components/        # Componentes de pessoas e funções
│   │       │       │
│   │       │       ├── execucao/               # Acompanhamento de execução
│   │       │       │   ├── page.tsx
│   │       │       │   └── _components/        # Componentes de cronograma
│   │       │       │
│   │       │       ├── incubadas/              # Empresas incubadas pelo projeto
│   │       │       │   └── page.tsx
│   │       │       │
│   │       │       ├── meta-etapa-fase/        # Estrutura de trabalho
│   │       │       │   └── page.tsx            # Metas, Etapas e Fases
│   │       │       │
│   │       │       ├── pagamentos/             # Gestão de pagamentos
│   │       │       │   └── page.tsx
│   │       │       │
│   │       │       └── rubricas/               # Estrutura orçamentária
│   │       │           ├── page.tsx
│   │       │           └── _components/        # Componentes de orçamento
│   │       │
│   │       ├── configuracoes/                  # Página de configurações gerais
│   │       │   └── page.tsx
│   │       │
│   │       ├── fornecedores/                  # Gestão de fornecedores
│   │       │   ├── page.tsx                    # Listagem de fornecedores (/fornecedores)
│   │       │   ├── types.ts                    # Tipos TypeScript do módulo
│   │       │   ├── mockData.ts                 # Dados mock de fornecedores (50+ registros)
│   │       │   ├── _components/                # Componentes da listagem
│   │       │   │   ├── FornecedoresHeader.tsx  # Header com métricas e toggle de visualização
│   │       │   │   ├── FornecedoresFilters.tsx # Sistema de filtros avançados
│   │       │   │   ├── FornecedoresTable.tsx   # Tabela de fornecedores (visualização tabela)
│   │       │   │   ├── FornecedoresGrid.tsx    # Grid de cards (visualização grid)
│   │       │   │   ├── NovoFornecedorModal.tsx # Modal de cadastro de fornecedor
│   │       │   │   └── index.ts                # Exportações centralizadas
│   │       │   └── [fornecedorId]/             # Rotas dinâmicas por fornecedor
│   │       │       ├── layout.tsx              # Layout compartilhado com NavBar
│   │       │       ├── page.tsx                # Página de detalhes do fornecedor
│   │       │       ├── contratos/
│   │       │       │   └── page.tsx            # Contratos vinculados ao fornecedor
│   │       │       ├── editar/
│   │       │       │   └── page.tsx            # Edição de dados do fornecedor
│   │       │       └── _components/             # Componentes de detalhes
│   │       │           ├── FornecedorSummary.tsx    # Resumo do fornecedor
│   │       │           ├── FornecedorInfo.tsx       # Informações detalhadas
│   │       │           ├── FornecedorTags.tsx       # Categorias e serviços (badges)
│   │       │           ├── FornecedorContractsTable.tsx # Tabela de contratos com rubricas
│   │       │           └── index.ts                # Exportações
│   │       │
│   │       └── parceiros/                      # Gestão de parceiros
│   │           ├── page.tsx                    # Listagem geral (/parceiros)
│   │           ├── fundacoes/
│   │           │   └── page.tsx                # Fundações (/parceiros/fundacoes)
│   │           └── ifes/
│   │               └── page.tsx                # IFES (/parceiros/ifes)
│   │
│   ├── components/             # Componentes React reutilizáveis (src level)
│   │   ├── ModalListener.tsx   # Sistema de modais globais
│   │   └── ui/                 # Componentes UI específicos (vazio)
│   │
│   ├── contexts/               # React Context API (vazio - pronto para uso)
│   │
│   ├── generated/              # Código gerado automaticamente
│   │   └── prisma/             # Cliente Prisma gerado
│   │       ├── client.js / client.d.ts
│   │       ├── index.js / index.d.ts
│   │       ├── default.js / default.d.ts
│   │       ├── edge.js / edge.d.ts
│   │       ├── index-browser.js
│   │       ├── package.json
│   │       ├── query_compiler_bg.js
│   │       ├── query_compiler_bg.wasm-base64.js
│   │       ├── schema.prisma
│   │       ├── wasm-edge-light-loader.mjs
│   │       ├── wasm-worker-loader.mjs
│   │       └── runtime/        # Runtime do Prisma
│   │           ├── client.js / client.d.ts
│   │           ├── index-browser.js / index-browser.d.ts
│   │           └── wasm-compiler-edge.js
│   │
│   ├── hooks/                  # Hooks customizados React (vazio - pronto para uso)
│   │
│   ├── lib/                    # Bibliotecas e utilitários
│   │   ├── api.ts              # Cliente HTTP centralizado para consumir BFF
│   │   │                        # - Métodos: get, post, put, patch, delete, upload, download
│   │   │                        # - Tipagem genérica com TS
│   │   │                        # - Tratamento centralizado de erros com ApiException
│   │   │                        # - Suporte a query params, headers customizados, AbortSignal
│   │   │                        # - Auto-redireção para login em 401
│   │   │
│   │   ├── auth.ts             # Funções de autenticação
│   │   ├── jwt.ts              # Utilitários JWT (tokens)
│   │   └── prisma.ts           # Instância singleton do Prisma Client
│   │
│   ├── middleware.ts           # Middleware de autenticação (proteção de rotas)
│   │
│   ├── public/                 # Arquivos públicos do src (vazio)
│   │
│   └── utils/                  # Utilitários gerais (vazio - pronto para uso)
│
├── ANALISE_REQUISITOS_CHEFE.md # Análise de requisitos do projeto
├── RubricasTab.tsx             # Componente de tab de rubricas (root level)
├── MPI - 13 Planos de...xlsx   # Documento de especificação (dados anexos)
│
├── eslint.config.mjs           # Configuração do ESLint
├── next-env.d.ts               # Tipos gerados do Next.js
├── next.config.ts              # Configuração do Next.js
├── package.json                # Dependências e scripts npm
├── package-lock.json           # Lockfile do npm (versões exatas)
├── postcss.config.mjs          # Configuração do PostCSS
├── prisma.config.ts            # Configuração adicional do Prisma
├── tsconfig.json               # Configuração do TypeScript
└── tsconfig.tsbuildinfo        # Cache do TypeScript build info
```

### 📊 Resumo Estrutural

| Nível | Propósito | Localização |
|-------|-----------|------------|
| **Raiz** | Configurações, docs e assets | `/` |
| **Components** | UI reutilizável (shadcn) | `/components/ui` |
| **Src/App** | Rotas e páginas Next.js | `/src/app/` |
| **Src/Components** | Componentes React internos | `/src/components/` |
| **Src/Lib** | Utilitários e serviços | `/src/lib/` |
| **Generated** | Código auto-gerado (Prisma) | `/src/generated/` |
| **API Routes** | Endpoints HTTP | `/src/app/api/` |
| **Dashboard** | Rotas protegidas | `/src/app/(dashboard)/` |

### 🔍 Principais Pastas Vazias (Prontas para Expansão)

- **`src/hooks/`** - Para novos hooks React personalizados
- **`src/contexts/`** - Para gerenciamento de estado global
- **`src/utils/`** - Para funções utilitárias compartilhadas
- **`src/components/ui/`** - Para componentes UI específicos do projeto

## 📋 Conceitos Fundamentais

### 🏗️ **Hierarquia: Contratos → Projetos/Produtos**

Esta plataforma é uma **plataforma de gestão de contratos**, onde **contrato** é a categoria maior que engloba dois tipos específicos: **projetos** e **produtos**.

#### **📄 Contratos (Categoria Principal)**
- **Definição**: Qualquer entrega ou serviço comercializado pela organização
- **Tipos**: Divide-se em Projetos e Produtos
- **Gestão Unificada**: Todos os contratos seguem o mesmo fluxo de gestão
- **Características Comuns**:
  - Possuem valor comercial definido
  - Têm prazo de entrega
  - Envolvem relacionamento com cliente
  - Geram receita para a organização

#### **🔧 Projetos (Subtipo de Contrato)**
- **Definição**: Contratos que envolvem desenvolvimento ou customização sob medida
- **Características Específicas**:
  - Maior flexibilidade de modelagem pelo cliente
  - Podem envolver desenvolvimento customizado
  - Geralmente têm escopo definido conjuntamente
  - Permitem iterações e ajustes durante o desenvolvimento
  - Tempo de entrega mais variável

#### **📦 Produtos (Subtipo de Contrato)**
- **Definição**: Contratos que envolvem soluções prontas e padronizadas
- **Características Específicas**:
  - Já possuem especificações definidas
  - Menor flexibilidade de customização
  - Geralmente têm preço e prazo mais previsíveis
  - Focam em entrega rápida e eficiente
  - Configuração geralmente limitada

### **🎯 Exemplos Práticos**

| Tipo | Exemplo | Classificação |
|------|---------|---------------|
| **Projeto** | Sistema de gestão customizado para empresa X | Contrato → Projeto |
| **Produto** | Licença anual do software GoPro | Contrato → Produto |
| **Contrato** | Ambos os exemplos acima | Categoria que engloba tudo |

### **💡 Por que essa Hierarquia?**

- **Simplificação**: Interface única para gerenciar diferentes tipos de entregas
- **Consistência**: Mesmo fluxo de processos independente do tipo
- **Escalabilidade**: Fácil adição de novos tipos de contratos no futuro
- **Relatórios**: Visão consolidada de todo o portfolio comercial

Esta abordagem permite uma **gestão holística do portfolio**, mantendo a flexibilidade para atender diferentes necessidades dos clientes enquanto mantém processos eficientes e padronizados.

## 🎨 Design System - Paleta de Cores Innovatis

### Cores Institucionais (Verdes)

O projeto utiliza uma paleta de cores verdes institucional da Innovatis, aplicada consistentemente em toda a interface:

```typescript
// Paleta de cores verdes utilizada no projeto
export const innovatisColors = {
  // verdes institucionais
  primary: '#004225',      // verde principal (botões sólidos, bordas principais)
  primaryDark: '#002816',  // hover de botões, bordas mais fortes
  primaryLight: '#0B7A4B', // destaques, links em hover, ícones ativos

  // acento verde-água
  accent: '#00B894',       // gradientes, detalhes arredondados, highlights

  // fundos neutros
  background: '#F5F6F8',   // fundo de página / seções claras
  surface: '#FFFFFF',      // cards, blocos elevados

  // texto
  text: '#1F2933',         // texto principal
  textMuted: '#6B7280',    // subtítulos, descrições

  // bordas / divisores
  border: '#E5E7EB'
};
```

### Aplicação das Cores no Projeto

#### 🎯 **Elementos Principais:**
- **Botões**: Gradientes `primary → accent` com hover `primaryDark → primaryLight`
- **Links**: `textMuted` com hover `primaryLight`
- **Campos de entrada**: Foco com `primary` e `primary/20` para ring
- **Ícones ativos**: `primary` quando em foco/hover

#### 🧭 **Componentes de Navegação:**
- **NavBar**: Logo e avatares com gradientes `primary → accent`
- **Dropdowns**: Comportamento exclusivo (apenas um aberto por vez)
- **Interação**: Fecha automaticamente ao clicar fora ou em outro item

#### 🖼️ **Elementos Visuais:**
- **Avatares**: Gradientes circulares `primary → accent`
- **Ícones de destaque**: Gradientes `primary → primaryLight`
- **Textos em destaque**: Gradientes de texto `primary → accent`
- **Elementos decorativos**: Bordas `primary`

#### 📱 **Consistência:**
- Hierarquia visual clara com tons progressivos
- Contraste adequado para acessibilidade
- Transições suaves entre estados (hover, focus, active)
- **Aplicação completa**: Paleta implementada em login, home e todos os componentes

## 📊 Funcionalidades da Página Home (`/home`)

A página principal do dashboard apresenta um conjunto completo de métricas e visualizações para gestão unificada de todos os contratos:

### 📈 Cards de Estatísticas Rápidas

**Localização:** `src/app/(dashboard)/home/page.tsx` (linhas 35-92)

Quatro cards principais exibindo métricas essenciais de todos os contratos ativos:
- **Total de Contratos**: 116 contratos (ícone azul)
- **Contratos em Andamento**: 42 contratos (ícone verde)
- **Contratos Concluídos**: 58 contratos (ícone roxo)
- **Contratos Suspensos**: 16 contratos (ícone laranja)

**Características:**
- Layout responsivo (1 coluna mobile, 2 tablet, 4 desktop)
- Ícones SVG customizados para cada categoria
- Fundo colorido suave para os ícones
- Tipografia hierárquica com valores destacados

### 📊 Componentes de Visualização

#### 1. **Gráfico de Pizza - Distribuição por Categoria**
**Arquivo:** `src/app/(dashboard)/home/_components/CategoryPieChart.tsx`

- **Propósito**: Visualizar distribuição percentual dos projetos por categoria
- **Tecnologia**: Chart.js / React-Chartjs-2
- **Layout**: Card branco com sombra sutil
- **Interatividade**: Tooltips informativos e legenda

#### 2. **Gráfico de Linha - Evolução Temporal**
**Arquivo:** `src/app/(dashboard)/home/_components/ContractsLineChart.tsx`

- **Propósito**: Mostrar tendência temporal dos contratos (projetos + produtos) ao longo do tempo
- **Tecnologia**: Chart.js / React-Chartjs-2
- **Métricas**: Volume de contratos por período
- **Design**: Curva suave com pontos de dados

#### 3. **Mapa Geográfico de Contratos**
**Arquivo:** `src/app/(dashboard)/home/_components/ContractsMap.tsx`

- **Propósito**: Distribuição geográfica dos contratos ativos
- **Tecnologia**: React-Leaflet com OpenStreetMap
- **Funcionalidades**:
  - Marcadores interativos nos locais dos contratos
  - Popups com informações detalhadas (tipo, valor, status)
  - Controles de zoom e navegação
- **Design**: Mapa integrado em card responsivo

#### 4. **Gráfico de Barras - Performance por Parceiro**
**Arquivo:** `src/app/(dashboard)/home/_components/PartnerBarChart.tsx`

- **Propósito**: Comparar volume de contratos por parceiro
- **Tecnologia**: Chart.js / React-Chartjs-2
- **Visualização**: Barras horizontais/verticaise comparação
- **Interatividade**: Hover para detalhes específicos

### 🏗️ Arquitetura dos Componentes

**Localização:** `src/app/(dashboard)/home/_components/`

```
_components/
├── index.ts                    # Exportações centralizadas
├── CategoryPieChart.tsx        # Distribuição por categoria
├── ContractsLineChart.tsx       # Evolução temporal de contratos
├── ContractsMap.tsx           # Mapa geográfico de contratos
├── PartnerBarChart.tsx        # Performance por parceiro
└── MapComponent.tsx           # Componente base do mapa
```

**Características Técnicas:**
- **Componentização**: Cada gráfico é um componente independente
- **Reutilização**: Possibilidade de usar em outras páginas
- **Responsividade**: Layout adaptável para diferentes telas
- **Performance**: Renderização otimizada com lazy loading
- **Acessibilidade**: Labels e descrições apropriadas

### 🎨 Design e UX

- **Layout Grid**: Sistema de grid responsivo para organização
- **Espaçamento**: Margens consistentes seguindo proporção áurea
- **Hierarquia Visual**: Títulos, subtítulos e métricas bem estruturados
- **Interação**: Hover states e transições suaves
- **Consistência**: Mesmas cores e tipografia do design system

---

## 📑 Módulo de Contratos (`/contratos`)

O módulo de Contratos é o coração da plataforma, oferecendo uma gestão completa do ciclo de vida de todos os contratos (projetos e produtos).

### 📐 Arquitetura de Navegação (3 Níveis)

O módulo implementa uma navegação hierárquica em 3 níveis:

```
Nível 1: /contratos
├── Listagem de todos os contratos
├── Filtros avançados (tipo, status, parceiro, período)
├── Busca textual
└── Cards de métricas resumo

Nível 2: /contratos/[contratoId]
├── Layout compartilhado com header do contrato
├── Tabs de navegação (Visão Geral, Contratações, Execução, Rubricas)
└── Breadcrumb contextual

Nível 3: Sub-páginas do contrato
├── Visão Geral - Dashboard resumido
├── Contratações - Aditivos, OS, subcontratos
├── Execução - Cronograma e marcos
└── Rubricas - Orçamento detalhado
```

### 📋 Listagem de Contratos (`/contratos`)

**Arquivo:** `src/app/(dashboard)/contratos/page.tsx`

#### Funcionalidades:

**Cards de Métricas:**
- Total de Contratos
- Contratos em Andamento
- Valor Total Contratado
- Valor Executado

**Sistema de Filtros:**
- **Tabs de Tipo**: Todos | Projetos | Produtos
- **Filtros Expandíveis**: Status, Parceiro, Período
- **Busca**: Campo de pesquisa por nome, código ou cliente

**Tabela de Dados:**
- Colunas: Código, Nome, Tipo, Cliente, Status, Valor, Progresso, Ações
- **Ordenação**: Clique nas colunas para ordenar
- **Paginação**: Navegação entre páginas de resultados
- **Ações por linha**: Visualizar, Editar, Exportar

**Badges de Status:**
| Status | Cor | Descrição |
|--------|-----|-----------|
| EM_ANDAMENTO | Verde | Contrato ativo em execução |
| CONCLUIDO | Azul | Contrato finalizado |
| SUSPENSO | Amarelo | Contrato temporariamente pausado |
| CANCELADO | Vermelho | Contrato cancelado |
| DRAFT | Cinza | Em elaboração |
| EM_NEGOCIACAO | Roxo | Em fase de negociação |

**Badges de Tipo:**
| Tipo | Cor | Ícone |
|------|-----|-------|
| PROJETO | Verde (#004225) | Ícone de engrenagem |
| PRODUTO | Azul | Ícone de pacote |

### 📄 Layout do Contrato (`/contratos/[contratoId]/layout.tsx`)

**Arquivo:** `src/app/(dashboard)/contratos/[contratoId]/layout.tsx`

Layout compartilhado para todas as sub-páginas de um contrato específico.

**Componentes:**

1. **Breadcrumb Contextual:**
   - Home → Contratos → [Nome do Contrato] → [Aba Atual]

2. **Header do Contrato:**
   - Código e nome do contrato
   - Badges de tipo e status
   - Botões de ação (Editar, Exportar, Menu)

3. **Grid de Informações:**
   - Cliente/Fundação
   - Responsável
   - Período de Execução
   - Valor Total e Executado (com barra de progresso)

4. **Navegação por Tabs (10 tabs):**
   - **Visão Geral** - Dashboard resumido com métricas e movimentações
   - **Contratações** - Aditivos, OS, termos e subcontratos
   - **Execução** - Cronograma, marcos e gestão de riscos
   - **Rubricas** - Orçamento e execução financeira detalhada
   - **Informações** - Dados básicos do contrato (visualização/edição)
   - **Metas** - Estrutura hierárquica de metas, etapas e fases
   - **Equipe** - Membros da equipe técnica e seus papéis
   - **Incubadas** - Empresas incubadas vinculadas ao projeto
   - **Desembolso** - Cronograma de pagamentos e parcelas
   - **Arquivos** - Documentos e arquivos anexados ao contrato

### 📊 Visão Geral (`/contratos/[contratoId]`)

**Arquivo:** `src/app/(dashboard)/contratos/[contratoId]/page.tsx`

Dashboard resumido do contrato com informações essenciais.

**Cards Informativos:**

1. **Resumo Financeiro:**
   - Valor Contratado
   - Valor Empenhado
   - Valor Liquidado
   - Valor Pago
   - Barra de progresso de execução

2. **Cronograma:**
   - Percentual de execução
   - Dias restantes
   - Status de prazo (No prazo/Atrasado/Atrasado crítico)

3. **Riscos Ativos:**
   - Lista de riscos com severidade (Alta/Média/Baixa)
   - Indicador visual por cores

4. **Movimentações Recentes:**
   - Timeline com últimas atividades
   - Tipos: Contratação, Financeiro, Status, Documento
   - Data, descrição e usuário responsável

### 📝 Contratações (`/contratos/[contratoId]/contratacoes`)

**Arquivo:** `src/app/(dashboard)/contratos/[contratoId]/contratacoes/page.tsx`

Gestão de aditivos, ordens de serviço, termos de referência e subcontratos.

**Cards de Resumo:**
- Total de Contratações
- Valor Total
- Contratações Ativas
- Valor Ativo

**Tipos de Contratação:**
| Tipo | Código | Descrição |
|------|--------|-----------|
| ADITIVO | ADT-XXX | Aditivos de prazo ou valor |
| ORDEM_SERVICO | OS-XXX | Ordens de serviço |
| TERMO_REFERENCIA | TR-XXX | Termos de referência |
| SUBCONTRATO | SUB-XXX | Subcontratos |

**Status de Contratação:**
| Status | Cor | Ícone |
|--------|-----|-------|
| ATIVA | Verde | CheckCircle |
| ENCERRADA | Cinza | Clock |
| PLANEJADA | Amarelo | AlertCircle |
| CANCELADA | Vermelho | X |

**Funcionalidades:**
- Filtro por tipo e status
- Ordenação por colunas
- Visualização detalhada
- Botão "Nova Contratação"

### ⏱️ Execução (`/contratos/[contratoId]/execucao`)

**Arquivo:** `src/app/(dashboard)/contratos/[contratoId]/execucao/page.tsx`

Acompanhamento de cronograma, marcos e entregas do contrato.

**Cards de Resumo:**
- Total de Marcos
- Marcos Concluídos
- Marcos Atrasados
- Progresso Geral (%)

**Timeline Visual:**
- Visualização horizontal de fases
- Indicador de progresso por marco
- Cores por status do marco

**Status de Marco:**
| Status | Cor | Descrição |
|--------|-----|-----------|
| PLANEJADO | Azul | Ainda não iniciado |
| EM_ANDAMENTO | Amarelo | Em execução |
| CONCLUIDO | Verde | Finalizado |
| ATRASADO | Vermelho | Prazo ultrapassado |
| CANCELADO | Cinza | Cancelado |

**Tabela de Marcos:**
- Nome e descrição
- Responsável
- Data planejada vs realizada
- Percentual de conclusão
- Status

**Gestão de Riscos:**
- Lista de riscos do contrato
- Severidade (Alta/Média/Baixa)
- Status (Aberto/Em Tratamento/Resolvido)
- Responsável e prazo de mitigação

### 💰 Rubricas (`/contratos/[contratoId]/rubricas`)

**Arquivo:** `src/app/(dashboard)/contratos/[contratoId]/rubricas/page.tsx`

Gestão orçamentária detalhada por natureza de despesa.

**Cards de Resumo:**
- Valor Total Previsto
- Valor Empenhado
- Valor Liquidado
- Valor Pago
- Saldo Disponível

**Gráfico de Distribuição:**
- Pizza mostrando distribuição por categoria
- Categorias: Materiais, Serviços, Equipamentos, Tributos, Pessoal

**Tabela de Rubricas:**
- **Código**: Código da natureza de despesa (ex: 3.3.90.30)
- **Descrição**: Nome da rubrica
- **Natureza**: Custeio ou Capital
- **Categoria**: Agrupamento por tipo
- **Valores**: Previsto, Empenhado, Liquidado, Pago
- **Percentual**: Execução vs Previsto

**Funcionalidades:**
- Linhas expansíveis para detalhes
- Filtro por categoria
- Indicadores visuais de execução
- Alertas de sobrecusto ou subutilização

### 📋 Informações (`/contratos/[contratoId]/informacoes`)

**Arquivo:** `src/app/(dashboard)/contratos/[contratoId]/informacoes/page.tsx`

Visualização e edição dos dados básicos do contrato.

**Campos Exibidos:**
- Código, Título, Tipo, Status
- Coordenador, Parceiro, Órgão Financiador
- Segmentos (múltipla seleção)
- Localidade, Valor Total
- Datas de Início e Término
- Descrição

**Funcionalidades:**
- Modo visualização (read-only)
- Modo edição com validações
- Botão "Editar" para alternar entre modos
- Feedback visual de salvamento

### 🎯 Metas, Etapas e Fases (`/contratos/[contratoId]/meta-etapa-fase`)

**Arquivo:** `src/app/(dashboard)/contratos/[contratoId]/meta-etapa-fase/page.tsx`

Estrutura hierárquica de organização do contrato em três níveis.

**Estrutura:**
- **Metas** → **Etapas** → **Fases**
- Cada nível pode ter múltiplos itens
- Datas de início e fim em cada nível
- Interface expansível/colapsável

**Funcionalidades:**
- Adicionar/remover metas, etapas e fases
- Edição inline de títulos
- Visualização hierárquica aninhada
- Modo edição com salvamento global

### 👥 Equipe Técnica (`/contratos/[contratoId]/equipe-tecnica`)

**Arquivo:** `src/app/(dashboard)/contratos/[contratoId]/equipe-tecnica/page.tsx`

Gestão dos membros da equipe técnica vinculados ao contrato.

**Campos do Membro:**
- Nome completo, CPF
- Papel (Coordenador, Vice-Coordenador, Pesquisador, Bolsista, Técnico, etc)
- Email, Telefone
- Vínculo institucional
- Carga horária
- Avatar (opcional)

**Funcionalidades:**
- Adicionar/remover membros
- Modal de cadastro/edição
- Tabela com informações completas
- Resumo de carga horária total

### 🏢 Incubadas (`/contratos/[contratoId]/incubadas`)

**Arquivo:** `src/app/(dashboard)/contratos/[contratoId]/incubadas/page.tsx`

Gestão de empresas incubadas que realizam serviços no projeto.

**Campos da Empresa:**
- Razão Social, Nome Fantasia, CNPJ
- Tipo de Serviço
- Contato, Email, Telefone
- Endereço, Cidade, UF
- Valor do Contrato
- Datas de Início e Término

**Funcionalidades:**
- Cards visuais por empresa
- Modal de cadastro/edição
- Resumo de valor total contratado
- Visualização em grid responsivo

### 💸 Desembolso (`/contratos/[contratoId]/desembolso`)

**Arquivo:** `src/app/(dashboard)/contratos/[contratoId]/desembolso/page.tsx`

Cronograma de pagamentos e liberação de recursos do contrato.

**Campos da Parcela:**
- Número, Descrição
- Rubrica Vinculada
- Meta Vinculada
- Data Prevista vs Data Efetiva
- Valor Previsto vs Valor Liberado
- Status (Pendente, Liberado, Atrasado, Cancelado)

**Cards de Resumo:**
- Total de Parcelas
- Valor Previsto Total
- Valor Liberado
- Percentual Liberado (com barra de progresso)

**Funcionalidades:**
- Adicionar/editar/remover parcelas
- Edição inline na tabela
- Marcar como liberado
- Filtros e ordenação

### 📁 Arquivos (`/contratos/[contratoId]/arquivos`)

**Arquivo:** `src/app/(dashboard)/contratos/[contratoId]/arquivos/page.tsx`

Gestão de documentos e arquivos anexados ao contrato.

**Tipos de Arquivo:**
- Contrato Assinado
- Plano de Trabalho
- Termo de Referência
- Ata de Reunião
- Relatório Técnico
- Relatório Financeiro
- Comprovante de Despesa
- Outros

**Campos do Arquivo:**
- Nome, Tipo, Formato
- Tamanho, Data de Upload
- Upload por (usuário)
- Descrição

**Funcionalidades:**
- Upload de arquivos (máx. 200MB no backend; proxy configurado para 210MB no BFF)
- Filtro por tipo de documento
- Visualizar e baixar arquivos
- Remover arquivos (modo edição)
- Cards de resumo (total, espaço utilizado, contagem por tipo)

### ✏️ Página de Edição (`/contratos/[contratoId]/editar`)

**Arquivo:** `src/app/(dashboard)/contratos/[contratoId]/editar/page.tsx`

Página centralizada para edição completa do contrato com sidebar de navegação vertical.

**Características:**
- **Não usa o layout.tsx compartilhado** - possui seu próprio layout
- Sidebar vertical com 7 abas de edição
- Estado centralizado do contrato
- Botão "Salvar Alterações" global
- Rastreamento de mudanças (`hasChanges`)

**Abas de Edição:**
1. **Informações** - Dados básicos do contrato
2. **Meta, Etapa e Fase** - Estrutura hierárquica
3. **Equipe Técnica** - Membros da equipe
4. **Incubadas** - Empresas vinculadas
5. **Rubricas** - Orçamento detalhado
6. **Desembolso** - Cronograma de pagamentos
7. **Arquivos** - Documentos anexados

**Componentes:**
- Cada aba é um componente separado em `_components/`
- Componentes recebem props (`contrato`, `onChange`, `contratoId`)
- Salvamento unificado via botão global

### 🏗️ Arquitetura de Componentes do Módulo

```
contratos/
├── page.tsx                          # Listagem principal
├── _components/                      # Componentes reutilizáveis
│   ├── NovoContratoModal.tsx         # Modal de cadastro de contrato
│   └── index.ts                      # Exportações
│
├── pre-projetos/                     # Submódulo de pré-projetos
│   ├── page.tsx                      # Listagem de pré-projetos
│   ├── README.md                     # Documentação específica
│   └── _components/                  # Componentes específicos
│       ├── NovoPreProjetoModal.tsx   # Modal de cadastro
│       └── index.ts                  # Exportações
│
└── [contratoId]/
    ├── layout.tsx                    # Layout compartilhado com header e tabs (10 tabs)
    ├── page.tsx                      # Visão Geral (dashboard resumido)
    ├── contratacoes/
    │   └── page.tsx                  # Gestão de aditivos, OS e subcontratos
    ├── execucao/
    │   └── page.tsx                  # Cronograma, marcos e gestão de riscos
    ├── rubricas/
    │   └── page.tsx                  # Orçamento e execução financeira por rubrica
    ├── informacoes/
    │   └── page.tsx                  # Dados básicos do contrato (visualização/edição)
    ├── meta-etapa-fase/
    │   └── page.tsx                  # Estrutura hierárquica de metas, etapas e fases
    ├── equipe-tecnica/
    │   └── page.tsx                  # Membros da equipe técnica do contrato
    ├── incubadas/
    │   └── page.tsx                  # Empresas incubadas vinculadas
    ├── desembolso/
    │   └── page.tsx                  # Cronograma de pagamentos e parcelas
    ├── arquivos/
    │   └── page.tsx                  # Documentos e arquivos anexados
    └── editar/                        # Página de edição centralizada (NÃO usa layout.tsx)
        ├── page.tsx                  # Container com sidebar vertical de navegação
        └── _components/              # Componentes de cada aba de edição
            ├── InformacoesContratoTab.tsx
            ├── MetaEtapaFaseTab.tsx
            ├── EquipeTecnicaTab.tsx
            ├── IncubadasTab.tsx
            ├── RubricasTab.tsx
            ├── DesembolsoTab.tsx
            ├── ArquivosTab.tsx
            └── index.ts              # Exportações centralizadas
```

**Padrões de Componentes:**
- `NovoContratoModal`: Modal de cadastro de contrato
- `NovoPreProjetoModal`: Modal de cadastro de pré-projeto
- `StatusBadge`: Badge colorido por status
- `TipoBadge`: Badge com ícone por tipo
- `MetricCard`: Card de métrica com ícone e valor
- `Th` / `Td`: Células de tabela padronizadas
- Timeline: Componente de linha do tempo
- Componentes de Tab (`InformacoesContratoTab`, `MetaEtapaFaseTab`, etc): Abas reutilizáveis para página de edição
- Modais de membro/incubada: Modais para cadastro de equipe e empresas

### 🎨 Consistência Visual

O módulo segue rigorosamente o Design System da Innovatis:
- **Cor primária**: `#004225` (verde institucional)
- **Cards**: Fundo branco com borda sutil e sombra
- **Tabelas**: Headers com fundo cinza claro, linhas alternadas
- **Badges**: Cores semânticas por status/tipo
- **Ícones**: Lucide React consistente em toda a interface

## 🎯 Sistema de Modais Globais

A plataforma implementa um **sistema de modais globais** para centralizar a abertura de formulários e diálogos em qualquer lugar da aplicação.

### 🏗️ Arquitetura do Sistema

**Componente Principal:** `src/components/ModalListener.tsx`

O sistema utiliza **Custom Events** do JavaScript para comunicação entre componentes:

```typescript
// Disparar abertura de modal
window.dispatchEvent(new CustomEvent('open-modal', {
  detail: { modalName: 'novo-contrato' }
}));

// Escutar criação de contrato
window.addEventListener('contrato-criado', (event) => {
  const data = event.detail;
  // Atualizar lista de contratos
});
```

### 📋 Modais Disponíveis

| Modal | Evento | Descrição |
|-------|--------|-----------|
| **Novo Contrato** | `open-modal` → `modalName: 'novo-contrato'` | Cadastro de novo contrato |
| **Novo Pré-Projeto** | `open-modal` → `modalName: 'novo-pre-projeto'` | Cadastro de pré-projeto |

### 🔄 Fluxo de Funcionamento

1. **Trigger**: Componente dispara evento `open-modal`
2. **Listener**: `ModalListener` captura e abre modal correspondente
3. **Submit**: Modal processa dados e dispara evento de confirmação
4. **Update**: Páginas escutam eventos e atualizam suas listas
5. **Redirect**: Opcionalmente redireciona para página específica

### 🎯 Benefícios

- **Centralização**: Um único componente gerencia todos os modais
- **Reutilização**: Modais podem ser abertos de qualquer lugar
- **Decoupling**: Componentes não precisam conhecer uns aos outros
- **Escalabilidade**: Fácil adição de novos modais
- **Consistência**: Mesmo comportamento em toda a aplicação

## 📝 Modal de Cadastro de Contrato

**Arquivo:** `src/app/(dashboard)/contratos/_components/NovoContratoModal.tsx`

Modal completo para cadastro de novos contratos com validação avançada e UX polida.

### 📋 Campos do Formulário

**Informações Básicas:**
- **Título** (obrigatório): Nome descritivo do contrato
- **Status** (obrigatório): EM_ANDAMENTO, CONCLUIDO, SUSPENSO, CANCELADO, DRAFT, EM_NEGOCIACAO
- **Coordenador** (obrigatório): Responsável pelo contrato
- **Parceiro** (obrigatório): Cliente ou instituição parceira
- **Tipo** (obrigatório): PROJETO ou PRODUTO
- **Data Início** (obrigatório): Início da vigência
- **Data Fim** (obrigatório): Término da vigência
- **Localidade** (obrigatório): Cidade/Estado de execução

### ✅ Validações Implementadas

- **Campos obrigatórios**: Todos os campos marcados com `*`
- **Datas**: Data fim deve ser posterior à data início
- **Caracteres**: Limite de 200 caracteres no título
- **Formato**: Validação de formato de datas
- **Real-time**: Feedback imediato durante digitação

### 🎨 UX/UI Features

- **Auto-focus**: Cursor automaticamente no primeiro campo
- **ESC para fechar**: Tecla ESC fecha o modal
- **Click-outside**: Clique fora do modal fecha a janela
- **Backdrop blur**: Fundo com efeito de desfoque
- **Gradiente header**: Header com gradiente institucional
- **Ícones Lucide**: Ícones consistentes em toda a interface
- **Responsivo**: Layout adaptável para mobile e desktop

### 🔗 Integração com NavBar

O NavBar foi atualizado para suportar abertura de modais:

```typescript
// No NavBar.tsx
const handleClick = (href: string) => {
  if (href.startsWith('modal:')) {
    const modalName = href.replace('modal:', '');
    window.dispatchEvent(new CustomEvent('open-modal', {
      detail: { modalName }
    }));
  }
};
```

**Menu "Contratos":**
```
Contratos
├── Todos os Contratos (/contratos)
├── Novo Contrato (modal:novo-contrato) ← MODAL
└── Relatórios (/contratos/relatorios)
```

## 📋 Página de Pré-Projetos/Pré-Contratos

**Rota:** `/contratos/pre-projetos`

Página completa para gestão de propostas antes da formalização oficial dos contratos.

### 📊 Funcionalidades Principais

**Cards de Métricas:**
- Total de Pré-Projetos
- Projetos (tipo PROJETO)
- Produtos (tipo PRODUTO)
- Valor Total Estimado

**Sistema de Filtros:**
- **Tabs por Tipo**: Todos / Projetos / Produtos
- **Filtro por Parceiro**: Dropdown com lista de parceiros
- **Busca Textual**: Por título, parceiro ou localidade
- **Filtros Expandidos**: Interface colapsável para filtros avançados

**Tabela de Dados:**
- **Colunas**: Título, Tipo, Parceiro, Localidade, Valor Estimado, Documentos, Data Criação, Ações
- **Ordenação**: Clique nos headers para ordenar qualquer coluna
- **Paginação**: Navegação entre páginas (10 itens por página)
- **Badges**: Tipo (PROJETO/PRODUTO) e quantidade de documentos

### 📝 Modal de Cadastro de Pré-Projeto

**Arquivo:** `src/app/(dashboard)/contratos/pre-projetos/_components/NovoPreProjetoModal.tsx`

**Campos Obrigatórios:**
- **Título do Projeto**: Nome descritivo (máx. 200 caracteres)
- **Tipo de Contrato**: PROJETO ou PRODUTO
- **Parceiro**: Seleção de parceiro cadastrado
- **Localidade**: Cidade/Estado (ex: "Campina Grande - PB")
- **Valor Total Estimado**: Formatação monetária automática

**Uploads Opcionais (4 tipos):**
- **Contrato**: Documento de contrato proposto
- **TR**: Termo de Referência
- **Plano de Trabalho**: Plano detalhado de execução
- **Outro**: Documento adicional

**Validações de Upload:**
- **Tamanho máximo**: 10MB por arquivo
- **Formatos aceitos**: PDF, DOC, DOCX, XLS, XLSX
- **Feedback visual**: Nome do arquivo, botão de remoção
- **Opcional**: Nenhum arquivo é obrigatório

### 💰 Formatação Monetária Inteligente

Campo de valor com formatação automática em tempo real:

```typescript
// Usuário digita: 100000
// Sistema mostra: 1.000,00

// Usuário digita: 250050
// Sistema mostra: 2.500,50
```

**Características:**
- Formato brasileiro (R$ + separadores)
- Atualização conforme digitação
- Validação numérica
- Interface limpa e intuitiva

### 📁 Estrutura de Arquivos

```
contratos/pre-projetos/
├── page.tsx                          # Página principal
├── README.md                         # Documentação específica
└── _components/
    ├── NovoPreProjetoModal.tsx       # Modal de cadastro
    └── index.ts                      # Exportações
```

### 🎯 Integração com Sistema Global

- **Modal Global**: Integrado ao `ModalListener`
- **Eventos**: `pre-projeto-criado` para notificações
- **NavBar**: Item "Pré-Projetos" no submenu de Contratos
- **Redirecionamento**: Automático após criação

### 📈 Dados Mock

A página inclui dados de exemplo para demonstração:
- Sistema de Gestão Acadêmica Integrado (Fapto)
- Licença Software GoPro Enterprise Premium (Fadex)
- Portal de Transparência e Controle Social (IFMA)
- Modernização Infraestrutura TI (Fundação Araucária)

### Estrutura de Páginas (App Router com Route Groups)

O projeto utiliza **Route Groups** (pastas com parênteses) para separar as rotas públicas (autenticação) das protegidas (dashboard). Esses groups **não aparecem na URL** e servem apenas para organização:

#### Rotas Públicas (auth)
| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/login` | `app/(auth)/login/page.tsx` | Página de login |

#### Rotas Protegidas (dashboard)
| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/home` | `app/(dashboard)/home/page.tsx` | Dashboard principal com gráficos |
| `/contratos` | `app/(dashboard)/contratos/page.tsx` | Listagem de contratos com filtros e paginação |
| `/contratos/funil` | `app/(dashboard)/contratos/funil/page.tsx` | Funil de Contratos (Kanban de iniciação) |
| `/contratos/pre-projetos` | `app/(dashboard)/contratos/pre-projetos/page.tsx` | Gestão de pré-projetos e pré-contratos |
| `/contratos/[id]` | `app/(dashboard)/contratos/[contratoId]/page.tsx` | Visão Geral do contrato (dashboard resumido) |
| `/contratos/[id]/*` | `app/(dashboard)/contratos/[contratoId]/layout.tsx` | Layout compartilhado com header e 11 tabs |
| `/contratos/[id]/iniciacao` | `app/(dashboard)/contratos/[contratoId]/iniciacao/page.tsx` | Aba de iniciação do contrato (funil) |
| `/contratos/[id]/contratacoes` | `app/(dashboard)/contratos/[contratoId]/contratacoes/page.tsx` | Gestão de aditivos, OS e subcontratos |
| `/contratos/[id]/execucao` | `app/(dashboard)/contratos/[contratoId]/execucao/page.tsx` | Cronograma, marcos e gestão de riscos |
| `/contratos/[id]/rubricas` | `app/(dashboard)/contratos/[contratoId]/rubricas/page.tsx` | Orçamento e execução financeira por rubrica |
| `/contratos/[id]/informacoes` | `app/(dashboard)/contratos/[contratoId]/informacoes/page.tsx` | Dados básicos do contrato |
| `/contratos/[id]/meta-etapa-fase` | `app/(dashboard)/contratos/[contratoId]/meta-etapa-fase/page.tsx` | Estrutura de metas, etapas e fases |
| `/contratos/[id]/equipe-tecnica` | `app/(dashboard)/contratos/[contratoId]/equipe-tecnica/page.tsx` | Membros da equipe técnica |
| `/contratos/[id]/incubadas` | `app/(dashboard)/contratos/[contratoId]/incubadas/page.tsx` | Empresas incubadas vinculadas |
| `/contratos/[id]/desembolso` | `app/(dashboard)/contratos/[contratoId]/desembolso/page.tsx` | Cronograma de pagamentos |
| `/contratos/[id]/arquivos` | `app/(dashboard)/contratos/[contratoId]/arquivos/page.tsx` | Documentos anexados |
| `/contratos/[id]/editar` | `app/(dashboard)/contratos/[contratoId]/editar/page.tsx` | Página de edição centralizada (sidebar vertical) |
| `/contratos/funil/edit` | `app/(dashboard)/contratos/funil/edit/page.tsx` | Configuração de etapas do funil |
| `/equipe` | `app/(dashboard)/equipe/page.tsx` | Gestão de Equipe e Permissões |
| `/parceiros` | `app/(dashboard)/parceiros/page.tsx` | Listagem de parceiros |
| `/parceiros/fundacoes` | `app/(dashboard)/parceiros/fundacoes/page.tsx` | Fundações parceiras |
| `/parceiros/ifes` | `app/(dashboard)/parceiros/ifes/page.tsx` | IFES parceiras |
| `/fornecedores` | `app/(dashboard)/fornecedores/page.tsx` | Listagem de fornecedores |
| `/fornecedores/[id]` | `app/(dashboard)/fornecedores/[fornecedorId]/page.tsx` | Detalhes do fornecedor |
| `/fornecedores/[id]/contratos` | `app/(dashboard)/fornecedores/[fornecedorId]/contratos/page.tsx` | Contratos vinculados ao fornecedor |
| `/fornecedores/[id]/editar` | `app/(dashboard)/fornecedores/[fornecedorId]/editar/page.tsx` | Edição de fornecedor |

#### API Routes
| Endpoint | Método | Arquivo | Descrição |
|----------|--------|---------|-----------|
| `/api/auth/login` | POST | `app/api/auth/login/route.ts` | Autenticação de usuário |
| `/api/auth/logout` | POST | `app/api/auth/logout/route.ts` | Logout do usuário |
| `/api/auth/me` | GET | `app/api/auth/me/route.ts` | Dados do usuário autenticado |

### Proteção de Rotas (Middleware)

O arquivo `src/middleware.ts` implementa validação de autenticação:

- **Rotas públicas**: `/login` e `/` - não requerem autenticação
- **Rotas protegidas**: Todas as rotas em `(dashboard)` - requerem token JWT/cookie válido
- **Redirecionamento**: Usuários sem autenticação são redirecionados para `/login`

Para validar o token:
1. O middleware verifica se existe um cookie `token` ou header `Authorization: Bearer <token>`
2. Se não houver, redireciona para `/login`
3. TODO: Implementar validação de JWT no middleware para verificar a validade do token

---

## 📊 Dados Fictícios (Mock Data)

**⚠️ IMPORTANTE**: Todos os dados atualmente exibidos na plataforma são fictícios e utilizados apenas para fins de demonstração e desenvolvimento.

### 🎯 Propósito dos Dados Mock
- **Demonstração**: Apresentar funcionalidades da plataforma com dados realistas
- **Desenvolvimento**: Facilitar testes de interface e fluxo de usuário
- **Documentação**: Ilustrar casos de uso e cenários possíveis

### 📋 Dados Incluídos
- **Contratos**: 116 contratos fictícios com valores, status e tipos variados
- **Pré-Projetos**: Propostas em elaboração com dados simulados
- **Parceiros**: Instituições fictícias (IFES, Fundações) para demonstração
- **Métricas**: Valores monetários, percentuais e contadores simulados
- **Gráficos**: Dados estatísticos gerados para visualizações
- **Geolocalização**: Marcadores fictícios no mapa

### 🔄 Próximos Passos
- **Integração com BD**: Substituir mocks por conexão com banco de dados real
- **API Backend**: Implementar endpoints para CRUD de dados reais
- **Seeds**: Criar seeds realistas baseados em dados históricos
- **Validação**: Implementar regras de negócio e validações de dados

### 💡 Como Identificar Dados Fictícios
- Valores monetários seguem padrões previsíveis (ex: R$ 19.247.850,00)
- Nomes de projetos seguem convenções fictícias
- Datas são geradas para demonstração
- Quantidades seguem padrões demonstrativos (116 contratos, 28 pré-projetos)

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Next.js** | 16.x | Framework React com App Router |
| **React** | 19.x | Biblioteca UI |
| **TypeScript** | 5.x | Tipagem estática |
| **Tailwind CSS** | 4.x | Estilização utility-first |
| **Prisma** | 6.x | ORM para banco de dados |
| **shadcn/ui** | - | Componentes UI acessíveis |
| **Recharts** | - | Gráficos e visualizações |
| **React-Leaflet** | - | Mapas interativos |
| **GSAP** | - | Animações avançadas |
| **Lucide React** | - | Ícones |
| **Custom Events** | - | Sistema de comunicação entre componentes |
| **File API** | - | Upload e validação de arquivos |
| **Intl.NumberFormat** | - | Formatação monetária localizada |

---

## 📚 Learn More

Para aprender mais sobre Next.js:

- [Next.js Documentation](https://nextjs.org/docs) - recursos e API do Next.js
- [Learn Next.js](https://nextjs.org/learn) - tutorial interativo

---

## 🚀 Deploy on Vercel

A forma mais fácil de fazer deploy é usar a [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Veja a [documentação de deploy](https://nextjs.org/docs/app/building-your-application/deploying) para mais detalhes.

---

## 📋 Changelog - Atualizações Recentes

### 🎯 v2.1.0 - Sistema de Modais e Pré-Projetos (Dezembro 2025)

#### ✨ Novas Funcionalidades

**🎪 Sistema de Modais Globais**
- Implementação de sistema de eventos customizados para comunicação entre componentes
- Componente `ModalListener` centralizado para gerenciamento de modais
- Suporte a abertura de modais de qualquer lugar da aplicação
- Eventos: `open-modal`, `contrato-criado`, `pre-projeto-criado`

**📝 Modal de Cadastro de Contrato**
- Modal completo com 8 campos obrigatórios (título, status, coordenador, parceiro, tipo, datas, localidade)
- Validações em tempo real e feedback visual
- UX polida: auto-focus, ESC para fechar, click-outside
- Design responsivo com gradiente institucional

**📋 Página de Pré-Projetos/Pré-Contratos**
- Nova rota `/contratos/pre-projetos` para gestão de propostas
- Tabela completa com filtros, busca e ordenação
- Cards de métricas (Total, Projetos, Produtos, Valor Estimado)
- Modal de cadastro com formatação monetária automática
- Upload opcional de 4 tipos de documento (Contrato, TR, Plano de Trabalho, Outro)
- Validação de arquivos (tipo, tamanho máximo 200MB)

**🧭 Integração com NavBar**
- Suporte a links `modal:*` no menu de navegação
- Item "Pré-Projetos" adicionado ao submenu de Contratos
- Evento customizado para abertura de modais via navegação

#### 🏗️ Arquitetura e Componentes

**Novos Componentes Criados:**
- `src/components/ModalListener.tsx` - Sistema global de modais
- `src/app/(dashboard)/contratos/_components/NovoContratoModal.tsx` - Modal de contrato
- `src/app/(dashboard)/contratos/pre-projetos/page.tsx` - Página de pré-projetos
- `src/app/(dashboard)/contratos/pre-projetos/_components/NovoPreProjetoModal.tsx` - Modal de pré-projeto

**Arquivos Atualizados:**
- `components/ui/NavBar.tsx` - Suporte a modais e novo item de menu
- `src/app/layout.tsx` - Integração do ModalListener global

#### 🎨 Melhorias de UX/UI

- Formatação monetária automática em tempo real (R$ 1.000,00)
- Validação visual com cores e ícones de erro
- Badges coloridos para tipos e status
- Sistema de upload com preview e remoção de arquivos
- Design responsivo mantendo consistência visual
- Animações suaves e feedback imediato

#### 🔧 Tecnologias Integradas

- **Custom Events API** - Comunicação desacoplada entre componentes
- **File API** - Upload e validação de arquivos
- **Intl.NumberFormat** - Formatação monetária localizada
- **Event-driven Architecture** - Arquitetura orientada a eventos

#### 📚 Documentação

- README específico para o módulo de pré-projetos
- Atualização completa da documentação principal
- Estrutura de pastas atualizada
- Tabela de rotas protegidas expandida

---

Esta versão estabelece as bases para um sistema modular e escalável de gestão de contratos, com foco em usabilidade e manutenibilidade do código.

---

## 🎯 Funil de Contratos (Pipeline de Iniciação)

O **Funil de Contratos** é um recurso inspirado no Pipedrive que permite acompanhar contratos já fechados/assinados durante a fase de preparação até o início da execução.

### 📋 Conceito Funcional

- **Escopo**: Apenas contratos assinados cuja execução ainda não começou
- **Objetivo**: Acompanhar em qual etapa de preparação cada contrato está
- **Resultado**: Visão Kanban das etapas de iniciação + aba de detalhes por contrato

### 🏗️ Estrutura de Arquivos

```
contratos/
├── funil/                              # Página do Funil (Kanban)
│   ├── page.tsx                        # Board Kanban principal
│   ├── types.ts                        # Tipos e dados mock
│   └── _components/
│       ├── PipelineBoard.tsx           # Container do Kanban com DnD
│       ├── ColumnHeader.tsx            # Cabeçalho de cada coluna
│       ├── ContractCard.tsx            # Card de contrato arrastável
│       └── index.ts                    # Exportações
│
└── [contratoId]/
    ├── layout.tsx                      # Atualizado com aba "Iniciação"
    └── iniciacao/                      # Nova aba de iniciação
        ├── page.tsx                    # Página de iniciação do contrato
        └── _components/
            ├── InitiationProgressBar.tsx   # Barra de progresso dos estágios
            ├── InitiationSummary.tsx       # Resumo do contrato
            ├── InitiationActivities.tsx    # Lista de atividades
            └── index.ts                    # Exportações
```

### 🎨 Board Kanban (`/contratos/funil`)

**Características:**
- **Header**: Título, contadores agregados (nº contratos, valor total), busca e filtros
- **Colunas**: 6 estágios de iniciação ordenados
- **Cards**: Contratos arrastáveis com informações resumidas
- **Drag & Drop**: Arrastar cards entre colunas atualiza o estágio
- **Layout Flexível**: Colunas com largura uniforme (estilo Pipedrive)
  - Todas as colunas têm a mesma largura
  - Largura determinada pela coluna com mais conteúdo
  - Sem largura fixa ou scroll interno
  - Altura dinâmica baseada no conteúdo
- **Página de Configuração**: `/contratos/funil/edit`
  - Editar nome das etapas
  - Configurar SLA (prazo de estagnação) por etapa
  - Adicionar/remover etapas
  - Reordenar etapas
  - Validação: não permite excluir etapas com contratos associados

**Estágios Padrão:**
1. Contrato Assinado
2. Documentação Completa
3. Equipe Alocada
4. Planejamento Aprovado
5. Kickoff Realizado
6. Pronto para Execução (Final)

**Informações no Card:**
- Código e título do contrato
- Parceiro
- Valor total (formatado)
- Badge de tipo (Projeto/Produto)
- Coordenador
- Dias no estágio atual
- Alertas (SLA expirado, sem atividades agendadas)

### 📊 Aba Iniciação (`/contratos/[id]/iniciacao`)

**Layout com 3 seções:**

1. **Barra de Progresso (topo) - Estilo Pipedrive**
   - Barra horizontal minimalista segmentada
   - Altura reduzida (32-40px)
   - Cada segmento mostra apenas "X dias"
   - Estágios concluídos e atual em verde (`#004225`)
   - Estágios futuros em cinza claro
   - Tooltip com nome da etapa ao passar o mouse
   - Rótulo abaixo mostrando etapa atual e dias no estágio
   - Permite voltar para etapas anteriores (clique em qualquer etapa)

2. **Resumo do Contrato (esquerda)**
   - Código, título, tipo
   - Valor total
   - Parceiro e coordenador
   - Estágio atual e tempo no estágio
   - Botão "Iniciar Projeto" (quando no estágio final)

3. **Atividades de Iniciação (direita)**
   - Tabs: Todas / Pendentes / Concluídas
   - Lista de atividades com tipo, título, data, responsável
   - Formulário inline para criar nova atividade
   - Marcar atividade como concluída

### 📝 Tipos de Atividade

| Tipo | Ícone | Descrição |
|------|-------|-----------|
| MEETING | 👥 | Reunião |
| CALL | 📞 | Ligação |
| EMAIL | 📧 | E-mail |
| DOCUMENT | 📄 | Documento |
| INTERNAL_TASK | ✅ | Tarefa Interna |

### 🔄 Status de Atividade

| Status | Descrição |
|--------|-----------|
| PLANNED | Atividade planejada/pendente |
| DONE | Atividade concluída |
| CANCELED | Atividade cancelada |

### ⚙️ Modelo de Dados (Mock)

**Tipos principais:**
```typescript
// Estágio do Funil
type InitiationStage = {
  id: string;
  name: string;
  order: number;
  isFinal: boolean;
  slaDays?: number;
};

// Contrato no Pipeline
type PipelineContract = {
  id: string;
  title: string;
  code: string;
  type: "PROJETO" | "PRODUTO";
  stageId: string;
  daysInStage: number;
  warnings: string[];
  executionStatus: "NAO_INICIADA" | "EM_EXECUCAO" | "CONCLUIDA" | "SUSPENSA";
};

// Atividade de Iniciação
type InitiationActivity = {
  id: string;
  contractId: string;
  title: string;
  type: InitiationActivityType;
  status: InitiationActivityStatus;
  dueAt: string | null;
  ownerName: string;
};
```

### 🚀 Fluxo de Uso

1. Usuário acessa `/contratos/funil` para ver o board Kanban
2. Arrasta um contrato para outra coluna → atualiza o estágio
3. Clica no card → abre `/contratos/[id]/iniciacao`
4. Na aba Iniciação, visualiza progresso e gerencia atividades
5. Quando no estágio final e sem pendências → botão "Iniciar Projeto" fica habilitado
6. Ao clicar em "Iniciar Projeto" → muda `executionStatus` para `EM_EXECUCAO`

### 🎯 Próximos Passos (Backend)

Quando implementar o backend, criar:

**Endpoints:**
- `GET /api/contracts/initiation/pipeline` - Listar funil completo
- `PATCH /api/contracts/:id/initiation/move` - Mover contrato de estágio
- `GET /api/contracts/:id/initiation/activities` - Listar atividades
- `POST /api/contracts/:id/initiation/activities` - Criar atividade
- `PATCH /api/contracts/:id/initiation/activities/:activityId` - Atualizar atividade

**Modelos Prisma:**
- `ContractInitiationStage` - Estágios do funil
- `ContractInitiationStageHistory` - Histórico de movimentação
- `ContractInitiationActivity` - Atividades de iniciação
- Adicionar campo `initiationStageId` em `Contract`

---

## 🏢 Módulo de Fornecedores (`/fornecedores`)

O módulo de **Fornecedores** permite gerenciar empresas fornecedoras que prestam serviços ou fornecem produtos para os projetos da plataforma.

### 📋 Objetivos do Módulo

O módulo responde a três perguntas principais:

1. **Quais fornecedores estão cadastrados?** - Visualização completa do cadastro de fornecedores
2. **Quais contratos estão vinculados a cada fornecedor?** - Rastreamento de relacionamentos comerciais
3. **Quais rubricas estão vinculadas aos fornecedores?** - Visualização de itens orçamentários por fornecedor

### 🏗️ Estrutura de Arquivos

```
fornecedores/
├── page.tsx                    # Página principal (/fornecedores)
├── types.ts                    # Tipos TypeScript (fornecedor, categorias, serviços)
├── mockData.ts                 # Dados mock (50+ fornecedores, contratos, rubricas)
└── _components/                # Componentes da listagem
    ├── FornecedoresHeader.tsx  # Header com métricas e toggle de visualização
    ├── FornecedoresFilters.tsx # Sistema de filtros avançados
    ├── FornecedoresTable.tsx   # Tabela de fornecedores (visualização tabela)
    ├── FornecedoresGrid.tsx    # Grid de cards (visualização grid)
    ├── NovoFornecedorModal.tsx # Modal de cadastro de fornecedor
    └── index.ts                # Exportações centralizadas

└── [fornecedorId]/             # Rotas dinâmicas por fornecedor
    ├── layout.tsx              # Layout compartilhado com NavBar
    ├── page.tsx                # Página de detalhes do fornecedor
    ├── contratos/
    │   └── page.tsx            # Contratos vinculados ao fornecedor
    ├── editar/
    │   └── page.tsx            # Edição de dados do fornecedor
    └── _components/            # Componentes de detalhes
        ├── FornecedorSummary.tsx       # Resumo do fornecedor
        ├── FornecedorInfo.tsx          # Informações detalhadas
        ├── FornecedorTags.tsx          # Categorias e serviços (badges)
        ├── FornecedorContractsTable.tsx # Tabela de contratos com rubricas expandíveis
        └── index.ts                    # Exportações
```

### 📊 Página Principal (`/fornecedores`)

**Arquivo:** `src/app/(dashboard)/fornecedores/page.tsx`

#### Funcionalidades:

**Header com Métricas:**
- Total de Fornecedores
- Total Ativos
- Total Inativos
- Total Filtrados (quando há filtros ativos)
- Toggle de visualização (Tabela/Grid)
- Botão "Novo Fornecedor"

**Sistema de Filtros Avançados:**
- **Busca textual**: Por nome, razão social ou CNPJ
- **Filtro por UF**: Dropdown com todas as UFs brasileiras
- **Filtro por Município**: Dropdown dinâmico baseado na UF selecionada
- **Filtro por Status**: Ativo / Inativo
- **Filtro por Categorias**: Múltipla seleção (OR - fornecedor precisa ter pelo menos uma)
- **Filtro por Serviços**: Múltipla seleção (OR - fornecedor precisa ter pelo menos um)

**Visualização Dupla:**

1. **Visualização em Tabela** (`FornecedoresTable`):
   - Colunas: Fornecedor (nome + CNPJ), Categorias, Localização, Contratos, Status
   - Cabeçalho fixo (sticky) para facilitar navegação
   - Ordenação por colunas (nome, município, status)
   - Colunas redimensionáveis (`ResizableTable`)
   - Paginação com navegação entre páginas
   - Links para detalhes do fornecedor

2. **Visualização em Grid** (`FornecedoresGrid`):
   - Cards com efeito Liquid Glass
   - Layout responsivo (1-4 colunas conforme tamanho da tela)
   - Informações: Avatar, nome, CNPJ, status, localização, categorias, contratos
   - Botão "Ver detalhes" em cada card
   - Paginação compartilhada com tabela

**Modal de Cadastro:**
- Formulário completo com validações
- Campos: Nome, Razão Social, CNPJ, Email, Telefone, UF, Município, Endereço
- Seleção múltipla de categorias e serviços
- Status inicial (Ativo/Inativo)

### 📄 Página de Detalhes (`/fornecedores/[fornecedorId]`)

**Arquivo:** `src/app/(dashboard)/fornecedores/[fornecedorId]/page.tsx`

#### Componentes:

1. **FornecedorSummary** - Resumo:
   - Avatar com iniciais
   - Nome e razão social
   - CNPJ formatado
   - Status (badge colorido)
   - Contato (email, telefone)

2. **FornecedorInfo** - Informações:
   - Localização completa (UF, município, endereço)
   - Data de cadastro
   - Última atualização

3. **FornecedorTags** - Categorias e Serviços:
   - Badges de categorias (cinza neutro)
   - Badges de serviços
   - Layout responsivo com wrap

### 📋 Contratos Vinculados (`/fornecedores/[fornecedorId]/contratos`)

**Arquivo:** `src/app/(dashboard)/fornecedores/[fornecedorId]/contratos/page.tsx`

#### Funcionalidades:

**Métricas:**
- Total de Contratos
- Valor Total
- Status (em andamento, concluídos)

**Tabela de Contratos:**
- Colunas: Código, Título, Status, Valor Total, Período, Ações
- Links para página do contrato
- **Rubricas Expandíveis**: 
  - Clique no contrato para expandir
  - Exibe itens de rubricas vinculados ao fornecedor
  - Mostra subitens com lançamentos por parcela
  - Total geral vinculado ao fornecedor

**Componente `FornecedorContractsTable`:**
- Linhas expansíveis com animação
- Ícone de expansão (chevron) quando há rubricas vinculadas
- Componente `RubricasVinculadas` para exibir detalhes
- Busca de rubricas por CNPJ ou nome do fornecedor

### 🎨 Características Visuais

**Efeito Liquid Glass:**
- Cards do grid com efeito glassmorphism
- Background translúcido com blur
- Bordas sutis com alpha
- Highlights internos para refração
- Fundo com gradiente para realçar o efeito

**Badges e Status:**
- Status: Verde (Ativo) / Vermelho (Inativo)
- Categorias: Badges neutros cinza
- Contratos: Links azuis institucionais

**Responsividade:**
- Grid adaptável (1-4 colunas)
- Tabela com scroll horizontal quando necessário
- Layout mobile-first

### 📝 Tipos de Dados

```typescript
// Fornecedor
interface Fornecedor {
  id: string;
  nome: string;
  razaoSocial?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  uf: string;
  municipio: string;
  endereco?: string;
  categorias: FornecedorCategoria[];
  servicos: FornecedorServico[];
  status: FornecedorStatus;
  observacoes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Contrato vinculado
interface FornecedorContratoVinculado {
  id: string;
  codigo: string;
  titulo: string;
  status: "EM_ANDAMENTO" | "CONCLUIDO" | "SUSPENSO" | "CANCELADO";
  valorTotal: number;
  dataInicio: string;
  dataFim?: string;
  fornecedorId: string;
}

// Item de rubrica vinculado
interface ItemRubricaVinculado {
  id: string;
  rubricaId: string;
  rubricaCodigo: string;
  rubricaNome: string;
  codigo?: string;
  descricao: string;
  quantidade: number;
  meses: number;
  valorUnitario: number;
  valorTotal: number;
  meta?: string;
  subitens?: SubitemRubrica[];
}
```

### 🔍 Categorias e Serviços

#### **Categorias Disponíveis:**
- Consultoria
- Tecnologia
- Serviços Gerais
- Equipamentos
- Laboratório
- Capacitação
- Comunicação
- Transporte
- Alimentação
- Infraestrutura

#### **Serviços Disponíveis:**
- Consultoria Técnica
- Desenvolvimento de Software
- Manutenção de Equipamentos
- Treinamento
- Pesquisa
- Análises Laboratoriais
- Assessoria Jurídica
- Contabilidade
- Design Gráfico
- Marketing Digital
- Logística
- Eventos
- Tradução
- Auditoria

### 🎯 Funcionalidades Implementadas

✅ **Listagem completa** - Tabela e grid de fornecedores  
✅ **Filtros avançados** - Por UF, município, status, categorias, serviços e busca textual  
✅ **Visualização dupla** - Alternância entre tabela e grid de cards  
✅ **Efeito Liquid Glass** - Cards com glassmorphism premium  
✅ **Ordenação** - Por nome, município e status  
✅ **Paginação** - Navegação entre páginas de resultados  
✅ **Detalhes do fornecedor** - Página completa com informações  
✅ **Contratos vinculados** - Visualização de contratos por fornecedor  
✅ **Rubricas expandíveis** - Visualização de itens orçamentários vinculados  
✅ **Modal de cadastro** - Formulário completo com validações  
✅ **Cabeçalho fixo** - Títulos de colunas sempre visíveis na tabela  

### 🔗 Integração com Rubricas

O módulo integra-se com o sistema de rubricas para mostrar:
- Itens de rubricas vinculados a fornecedores dentro de contratos
- Subitens com lançamentos por parcela
- Totais vinculados ao fornecedor
- Busca por CNPJ ou nome do fornecedor

**Função de Busca:**
- `getRubricasByFornecedor(contratoId, fornecedor)` - Busca rubricas vinculadas
- Normalização de CNPJ para comparação
- Busca por nome ou razão social
- Filtragem de subitens relevantes

### 🚀 Próximos Passos (Backend)

Quando implementar o backend, criar:

**Endpoints:**
- `GET /api/fornecedores` - Listar fornecedores com filtros
- `GET /api/fornecedores/:id` - Detalhes do fornecedor
- `POST /api/fornecedores` - Criar novo fornecedor
- `PATCH /api/fornecedores/:id` - Atualizar fornecedor
- `GET /api/fornecedores/:id/contratos` - Contratos vinculados
- `GET /api/fornecedores/:id/rubricas` - Rubricas vinculadas

**Modelos Prisma:**
- `Supplier` - Fornecedores
- `SupplierCategory` - Categorias de fornecedores
- `SupplierService` - Serviços oferecidos
- `SupplierContract` - Contratos vinculados
- `SupplierRubricaItem` - Itens de rubricas vinculados

---

## 👥 Módulo de Equipe e Permissões (`/equipe`)

O módulo de **Equipe e Permissões** é uma página de governança de acesso que permite gerenciar usuários, níveis de permissão e visualizar a estrutura da equipe de execução.

### 📋 Objetivos da Página

A página responde a três perguntas principais:

1. **Quem é quem na equipe de execução?** - Visualização da estrutura organizacional
2. **Quem tem acesso a quê na plataforma?** - Perfis e níveis de permissão
3. **Quem está ativo/inativo/com acesso sensível?** - Governança e segurança

### 🏗️ Estrutura de Arquivos

```
equipe/
├── page.tsx                    # Página principal (/equipe)
├── types.ts                    # Tipos TypeScript (usuários, permissões, níveis)
├── mockData.ts                 # Dados mock da equipe (7 usuários exemplo)
└── _components/
    ├── UsersTable.tsx          # Tabela de usuários com filtros avançados
    ├── UserDetails.tsx         # Painel de detalhes do usuário
    └── index.ts                # Exportações centralizadas
```

### 🎨 Layout da Página

**Estrutura em 2 colunas:**

1. **Tabela de Usuários (esquerda - flexível)**
   - Lista completa de usuários com filtros
   - Colunas: Nome, Função, Equipe, Nível, Situação, Último acesso
   - Sistema de filtros avançados
   - Busca textual

2. **Detalhes do Usuário (direita - 400px)**
   - Painel lateral com informações detalhadas
   - Matriz de permissões por módulo
   - Histórico de mudanças de acesso
   - Controles de edição

### 📊 Componentes Principais

#### **UsersTable** - Tabela de Usuários

**Funcionalidades:**
- **Filtros Avançados:**
  - Por função (Coordenador, Analista, etc.) - Dropdown customizado
  - Por nível de permissão (Nível 1, 2, 3) - Dropdown customizado
  - Por situação (Ativo/Inativo) - Dropdown customizado
  - Por equipe (Execução, Financeiro, etc.)
  - Busca textual (nome, email, função)

- **Ações Rápidas:**
  - Dropdown customizado para alterar nível de permissão (componente `Dropdown`)
  - Toggle para ativar/desativar usuário
  - Clique na linha para ver detalhes no painel lateral

- **Visualização:**
  - Avatares com iniciais
  - Badges coloridos por nível de permissão (verde/azul/roxo)
  - Formatação de último acesso (Hoje, Ontem, X dias atrás)
  - Contador de resultados filtrados

#### **UserDetails** - Detalhes do Usuário

**Seções:**

1. **Resumo:**
   - Avatar, nome, email
   - Função e equipe
   - Nível de permissão atual (dropdown customizado)
   - Situação (ativo/inativo) com toggle
   - Último acesso formatado

2. **Permissões por Módulo:**
   - Matriz visual de permissões
   - Módulos: Contratos, Funil, Iniciação, Execução, Relatórios, Configurações
   - Níveis de acesso: Ver, Criar, Editar, Excluir, Configurar, Nenhum
   - Badges coloridos por tipo de permissão

3. **Histórico de Mudanças:**
   - Registro de alterações de nível de permissão
   - Data, usuário que alterou, motivo (opcional)
   - Visualização em cards com borda verde

### 🔐 Sistema de Permissões

#### **Níveis Globais:**

| Nível | Nome | Descrição | Cor |
|-------|------|-----------|-----|
| **LEVEL_1** | Nível 1 | Operacional - Enxerga apenas projetos alocados | Verde (`bg-green-500`) |
| **LEVEL_2** | Nível 2 | Coordenador - Enxerga todos os projetos da equipe | Azul (`bg-blue-500`) |
| **LEVEL_3** | Nível 3 | Administrador - Acesso completo a todos os módulos | Roxo (`bg-purple-500`) |

#### **Permissões por Módulo:**

Cada nível tem permissões específicas por módulo:

- **Contratos**: Ver / Criar / Editar / Excluir / Configurar
- **Funil de Contratos**: Ver / Editar / Configurar
- **Iniciação de Projetos**: Ver / Editar / Configurar
- **Execução de Projetos**: Ver / Editar / Configurar
- **Relatórios / Dashboards**: Ver / Editar
- **Configurações da Plataforma**: Nenhum / Configurar

### 🎯 Funcionalidades Implementadas

✅ **Visualização da equipe** - Tabela completa com todos os usuários  
✅ **Filtros avançados** - Por função, nível, situação, equipe e busca textual  
✅ **Dropdowns customizados** - Componente reutilizável estilo NavBar  
✅ **Alteração de nível** - Dropdown customizado para mudar nível de permissão  
✅ **Ativação/Desativação** - Toggle para ativar/inativar usuários  
✅ **Detalhes do usuário** - Painel lateral com informações completas  
✅ **Matriz de permissões** - Visualização clara do que cada usuário pode fazer  
✅ **Histórico de mudanças** - Auditoria completa de alterações de acesso  

### 🎨 Componente Dropdown Customizado

**Localização:** `components/ui/dropdown.tsx`

Componente reutilizável com o mesmo estilo visual do NavBar:

- **Características:**
  - Animações suaves de abertura/fechamento
  - Fechamento automático ao clicar fora
  - Suporte a ícones nas opções
  - Type-safe com TypeScript
  - Documentação completa em `components/ui/dropdown.md`

- **Uso na Página de Equipe:**
  - Filtros da tabela (função, nível, situação)
  - Seleção de nível de permissão na tabela
  - Seleção de nível de permissão no painel de detalhes
  - Pode ser usado em qualquer lugar da aplicação

### 📝 Tipos de Dados

```typescript
// Usuário da equipe
type TeamUser = {
  id: string;
  name: string;
  email: string;
  role: Role;                    // COORDENADOR_PROJETOS, ANALISTA_EXECUCAO, etc.
  team: Team;                    // EXECUCAO, COMERCIAL, FINANCEIRO
  permissionLevel: PermissionLevel; // LEVEL_1, LEVEL_2, LEVEL_3
  status: UserStatus;            // ATIVO, INATIVO
  modulePermissions: ModulePermissions[];
  lastAccessAt?: string;
};

// Histórico de mudanças
type PermissionHistoryEntry = {
  id: string;
  userId: string;
  fromLevel: PermissionLevel | null;
  toLevel: PermissionLevel;
  changedAt: string;
  changedByUserId: string;
  changedByName: string;
  reason?: string;
};
```

### 🚀 Próximos Passos (Backend)

Quando implementar o backend, criar:

**Endpoints:**
- `GET /api/admin/team` - Listar estrutura da equipe
- `GET /api/admin/users/:id` - Detalhes do usuário + permissões
- `PATCH /api/admin/users/:id/permission-level` - Alterar nível
- `PATCH /api/admin/users/:id/status` - Ativar/Inativar usuário

**Modelos Prisma:**
- `User` - Usuários da equipe (integração com Nexus)
- `PermissionLevel` - Configuração de níveis
- `UserPermissionHistory` - Histórico de mudanças
- `ModulePermission` - Permissões por módulo

---

## 👥 Módulo de Equipe e Permissões (`/equipe`)

O módulo de **Equipe e Permissões** é uma página de governança de acesso que permite gerenciar usuários, níveis de permissão e visualizar a estrutura da equipe de execução.

### 📋 Objetivos da Página

A página responde a três perguntas principais:

1. **Quem é quem na equipe de execução?** - Visualização da estrutura organizacional
2. **Quem tem acesso a quê na plataforma?** - Perfis e níveis de permissão
3. **Quem está ativo/inativo/com acesso sensível?** - Governança e segurança

### 🏗️ Estrutura de Arquivos

```
equipe/
├── page.tsx                    # Página principal (/equipe)
├── types.ts                    # Tipos TypeScript (usuários, permissões, níveis)
├── mockData.ts                 # Dados mock da equipe (7 usuários exemplo)
└── _components/
    ├── UsersTable.tsx          # Tabela de usuários com filtros avançados
    ├── UserDetails.tsx         # Painel de detalhes do usuário
    └── index.ts                # Exportações centralizadas
```

### 🎨 Layout da Página

**Estrutura em 2 colunas:**

1. **Tabela de Usuários (esquerda - flexível)**
   - Lista completa de usuários com filtros
   - Colunas: Nome, Função, Equipe, Nível, Situação, Último acesso
   - Sistema de filtros avançados
   - Busca textual

2. **Detalhes do Usuário (direita - 400px)**
   - Painel lateral com informações detalhadas
   - Matriz de permissões por módulo
   - Histórico de mudanças de acesso
   - Controles de edição

### 📊 Componentes Principais

#### **UsersTable** - Tabela de Usuários

**Funcionalidades:**
- **Filtros Avançados:**
  - Por função (Coordenador, Analista, etc.) - Dropdown customizado
  - Por nível de permissão (Nível 1, 2, 3) - Dropdown customizado
  - Por situação (Ativo/Inativo) - Dropdown customizado
  - Por equipe (Execução, Financeiro, etc.)
  - Busca textual (nome, email, função)

- **Ações Rápidas:**
  - Dropdown customizado para alterar nível de permissão (componente `Dropdown`)
  - Toggle para ativar/desativar usuário
  - Clique na linha para ver detalhes no painel lateral

- **Visualização:**
  - Avatares com iniciais
  - Badges coloridos por nível de permissão (verde/azul/roxo)
  - Formatação de último acesso (Hoje, Ontem, X dias atrás)
  - Contador de resultados filtrados

#### **UserDetails** - Detalhes do Usuário

**Seções:**

1. **Resumo:**
   - Avatar, nome, email
   - Função e equipe
   - Nível de permissão atual (dropdown customizado)
   - Situação (ativo/inativo) com toggle
   - Último acesso formatado

2. **Permissões por Módulo:**
   - Matriz visual de permissões
   - Módulos: Contratos, Funil, Iniciação, Execução, Relatórios, Configurações
   - Níveis de acesso: Ver, Criar, Editar, Excluir, Configurar, Nenhum
   - Badges coloridos por tipo de permissão

3. **Histórico de Mudanças:**
   - Registro de alterações de nível de permissão
   - Data, usuário que alterou, motivo (opcional)
   - Visualização em cards com borda verde

### 🔐 Sistema de Permissões

#### **Níveis Globais:**

| Nível | Nome | Descrição | Cor |
|-------|------|-----------|-----|
| **LEVEL_1** | Nível 1 | Operacional - Enxerga apenas projetos alocados | Verde (`bg-green-500`) |
| **LEVEL_2** | Nível 2 | Coordenador - Enxerga todos os projetos da equipe | Azul (`bg-blue-500`) |
| **LEVEL_3** | Nível 3 | Administrador - Acesso completo a todos os módulos | Roxo (`bg-purple-500`) |

#### **Permissões por Módulo:**

Cada nível tem permissões específicas por módulo:

- **Contratos**: Ver / Criar / Editar / Excluir / Configurar
- **Funil de Contratos**: Ver / Editar / Configurar
- **Iniciação de Projetos**: Ver / Editar / Configurar
- **Execução de Projetos**: Ver / Editar / Configurar
- **Relatórios / Dashboards**: Ver / Editar
- **Configurações da Plataforma**: Nenhum / Configurar

### 🎯 Funcionalidades Implementadas

✅ **Visualização da equipe** - Tabela completa com todos os usuários  
✅ **Filtros avançados** - Por função, nível, situação, equipe e busca textual  
✅ **Dropdowns customizados** - Componente reutilizável estilo NavBar  
✅ **Alteração de nível** - Dropdown customizado para mudar nível de permissão  
✅ **Ativação/Desativação** - Toggle para ativar/inativar usuários  
✅ **Detalhes do usuário** - Painel lateral com informações completas  
✅ **Matriz de permissões** - Visualização clara do que cada usuário pode fazer  
✅ **Histórico de mudanças** - Auditoria completa de alterações de acesso  

### 🎨 Componente Dropdown Customizado

**Localização:** `components/ui/dropdown.tsx`

Componente reutilizável com o mesmo estilo visual do NavBar:

- **Características:**
  - Animações suaves de abertura/fechamento
  - Fechamento automático ao clicar fora
  - Suporte a ícones nas opções
  - Type-safe com TypeScript
  - Documentação completa em `components/ui/dropdown.md`

- **Uso na Página de Equipe:**
  - Filtros da tabela (função, nível, situação)
  - Seleção de nível de permissão na tabela
  - Seleção de nível de permissão no painel de detalhes
  - Pode ser usado em qualquer lugar da aplicação

### 📝 Tipos de Dados

```typescript
// Usuário da equipe
type TeamUser = {
  id: string;
  name: string;
  email: string;
  role: Role;                    // COORDENADOR_PROJETOS, ANALISTA_EXECUCAO, etc.
  team: Team;                    // EXECUCAO, COMERCIAL, FINANCEIRO
  permissionLevel: PermissionLevel; // LEVEL_1, LEVEL_2, LEVEL_3
  status: UserStatus;            // ATIVO, INATIVO
  modulePermissions: ModulePermissions[];
  lastAccessAt?: string;
};

// Histórico de mudanças
type PermissionHistoryEntry = {
  id: string;
  userId: string;
  fromLevel: PermissionLevel | null;
  toLevel: PermissionLevel;
  changedAt: string;
  changedByUserId: string;
  changedByName: string;
  reason?: string;
};
```

### 🚀 Próximos Passos (Backend)

Quando implementar o backend, criar:

**Endpoints:**
- `GET /api/admin/team` - Listar estrutura da equipe
- `GET /api/admin/users/:id` - Detalhes do usuário + permissões
- `PATCH /api/admin/users/:id/permission-level` - Alterar nível
- `PATCH /api/admin/users/:id/status` - Ativar/Inativar usuário

**Modelos Prisma:**
- `User` - Usuários da equipe (integração com Nexus)
- `PermissionLevel` - Configuração de níveis
- `UserPermissionHistory` - Histórico de mudanças
- `ModulePermission` - Permissões por módulo

---

## 👥 Módulo de Equipe e Permissões (`/equipe`)

O módulo de **Equipe e Permissões** é uma página de governança de acesso que permite gerenciar usuários, níveis de permissão e visualizar a estrutura da equipe de execução.

### 📋 Objetivos da Página

A página responde a três perguntas principais:

1. **Quem é quem na equipe de execução?** - Visualização da estrutura organizacional
2. **Quem tem acesso a quê na plataforma?** - Perfis e níveis de permissão
3. **Quem está ativo/inativo/com acesso sensível?** - Governança e segurança

### 🏗️ Estrutura de Arquivos

```
equipe/
├── page.tsx                    # Página principal (/equipe)
├── types.ts                    # Tipos TypeScript (usuários, permissões, níveis)
├── mockData.ts                 # Dados mock da equipe (7 usuários exemplo)
└── _components/
    ├── UsersTable.tsx          # Tabela de usuários com filtros avançados
    ├── UserDetails.tsx         # Painel de detalhes do usuário
    └── index.ts                # Exportações centralizadas
```

### 🎨 Layout da Página

**Estrutura em 2 colunas:**

1. **Tabela de Usuários (esquerda - flexível)**
   - Lista completa de usuários com filtros
   - Colunas: Nome, Função, Equipe, Nível, Situação, Último acesso
   - Sistema de filtros avançados
   - Busca textual

2. **Detalhes do Usuário (direita - 400px)**
   - Painel lateral com informações detalhadas
   - Matriz de permissões por módulo
   - Histórico de mudanças de acesso
   - Controles de edição

### 📊 Componentes Principais

#### **UsersTable** - Tabela de Usuários

**Funcionalidades:**
- **Filtros Avançados:**
  - Por função (Coordenador, Analista, etc.)
  - Por nível de permissão (Nível 1, 2, 3)
  - Por situação (Ativo/Inativo)
  - Por equipe (Execução, Financeiro, etc.)
  - Busca textual (nome, email, função)

- **Ações Rápidas:**
  - Dropdown para alterar nível de permissão (componente Dropdown customizado)
  - Toggle para ativar/desativar usuário
  - Clique na linha para ver detalhes

- **Visualização:**
  - Avatares com iniciais
  - Badges coloridos por nível de permissão
  - Formatação de último acesso (Hoje, Ontem, X dias atrás)
  - Contador de resultados

#### **UserDetails** - Detalhes do Usuário

**Seções:**

1. **Resumo:**
   - Avatar, nome, email
   - Função e equipe
   - Nível de permissão atual (dropdown customizado)
   - Situação (ativo/inativo)
   - Último acesso

2. **Permissões por Módulo:**
   - Matriz visual de permissões
   - Módulos: Contratos, Funil, Iniciação, Execução, Relatórios, Configurações
   - Níveis de acesso: Ver, Criar, Editar, Excluir, Configurar, Nenhum
   - Badges coloridos por tipo de permissão

3. **Histórico de Mudanças:**
   - Registro de alterações de nível de permissão
   - Data, usuário que alterou, motivo (opcional)
   - Visualização em cards com borda verde

### 🔐 Sistema de Permissões

#### **Níveis Globais:**

| Nível | Nome | Descrição | Cor |
|-------|------|-----------|-----|
| **LEVEL_1** | Nível 1 | Operacional - Enxerga apenas projetos alocados | Verde (`bg-green-500`) |
| **LEVEL_2** | Nível 2 | Coordenador - Enxerga todos os projetos da equipe | Azul (`bg-blue-500`) |
| **LEVEL_3** | Nível 3 | Administrador - Acesso completo a todos os módulos | Roxo (`bg-purple-500`) |

#### **Permissões por Módulo:**

Cada nível tem permissões específicas por módulo:

- **Contratos**: Ver / Criar / Editar / Excluir / Configurar
- **Funil de Contratos**: Ver / Editar / Configurar
- **Iniciação de Projetos**: Ver / Editar / Configurar
- **Execução de Projetos**: Ver / Editar / Configurar
- **Relatórios / Dashboards**: Ver / Editar
- **Configurações da Plataforma**: Nenhum / Configurar

### 🎯 Funcionalidades Implementadas

✅ **Visualização da equipe** - Tabela completa com todos os usuários  
✅ **Filtros avançados** - Por função, nível, situação, equipe e busca textual  
✅ **Alteração de nível** - Dropdown customizado para mudar nível de permissão  
✅ **Ativação/Desativação** - Toggle para ativar/inativar usuários  
✅ **Detalhes do usuário** - Painel lateral com informações completas  
✅ **Matriz de permissões** - Visualização clara do que cada usuário pode fazer  
✅ **Histórico de mudanças** - Auditoria de alterações de acesso  
✅ **Componente Dropdown** - Reutilizável em toda a aplicação  

### 🎨 Componente Dropdown Customizado

**Localização:** `components/ui/dropdown.tsx`

Componente reutilizável com o mesmo estilo visual do NavBar:

- **Características:**
  - Animações suaves de abertura/fechamento
  - Fechamento automático ao clicar fora
  - Suporte a ícones nas opções
  - Type-safe com TypeScript
  - Documentação completa em `components/ui/dropdown.md`

- **Uso:**
  - Filtros da tabela de usuários
  - Seleção de nível de permissão na tabela
  - Seleção de nível de permissão no painel de detalhes
  - Pode ser usado em qualquer lugar da aplicação

### 📝 Tipos de Dados

```typescript
// Usuário da equipe
type TeamUser = {
  id: string;
  name: string;
  email: string;
  role: Role;                    // COORDENADOR_PROJETOS, ANALISTA_EXECUCAO, etc.
  team: Team;                    // EXECUCAO, COMERCIAL, FINANCEIRO
  permissionLevel: PermissionLevel; // LEVEL_1, LEVEL_2, LEVEL_3
  status: UserStatus;            // ATIVO, INATIVO
  modulePermissions: ModulePermissions[];
  lastAccessAt?: string;
};

// Histórico de mudanças
type PermissionHistoryEntry = {
  id: string;
  userId: string;
  fromLevel: PermissionLevel | null;
  toLevel: PermissionLevel;
  changedAt: string;
  changedByUserId: string;
  changedByName: string;
  reason?: string;
};
```

### 🚀 Próximos Passos (Backend)

Quando implementar o backend, criar:

**Endpoints:**
- `GET /api/admin/team` - Listar estrutura da equipe
- `GET /api/admin/users/:id` - Detalhes do usuário + permissões
- `PATCH /api/admin/users/:id/permission-level` - Alterar nível
- `PATCH /api/admin/users/:id/status` - Ativar/Inativar usuário

**Modelos Prisma:**
- `User` - Usuários da equipe (integração com Nexus)
- `PermissionLevel` - Configuração de níveis
- `UserPermissionHistory` - Histórico de mudanças
- `ModulePermission` - Permissões por módulo
