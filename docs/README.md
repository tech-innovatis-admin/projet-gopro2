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
├── .cursor/                 # Configurações do Cursor IDE
├── .env                     # Variáveis de ambiente (não versionado)
├── .git/                    # Controle de versão Git
├── .gitignore               # Arquivos ignorados pelo Git
├── .next/                   # Arquivos de build do Next.js (gerado)
├── node_modules/            # Dependências instaladas (gerado)
│
├── components/              # Componentes UI compartilhados (shadcn/ui)
│   └── ui/
│       ├── button.tsx       # Componente de botão
│       ├── card.tsx         # Componente de card
│       ├── checkbox.tsx     # Componente de checkbox
│       ├── input.tsx        # Componente de input
│       ├── label.tsx        # Componente de label
│       ├── NavBar.tsx       # Barra de navegação principal
│       ├── select.tsx       # Componente de select
│       └── separator.tsx    # Componente separador
│
├── components.json          # Configuração do shadcn/ui
│
├── docs/                    # Documentação do projeto
│   └── README.md            # Este arquivo
│
├── EXEMPLO_CSS_LETRAS_BREAK/ # Exemplo de efeito CSS (animação de letras)
│   ├── exemplo1.html
│   ├── exemplo2.css
│   └── exemplo3.js
│
├── lib/                     # Utilitários do shadcn/ui
│   └── utils.ts             # Função cn() para classes condicionais
│
├── prisma/                  # Configuração do Prisma ORM
│   └── schema.prisma        # Schema do banco de dados
│
├── public/                  # Arquivos estáticos públicos
│   ├── Logos/               # Logos da aplicação
│   │   ├── GoPro2_SVG.svg           # Logo GoPro2 SVG
│   │   ├── GoPro2_SVG (2).svg       # Logo GoPro2 SVG (variação)
│   │   ├── logo_innovatis.svg       # Logo Innovatis
│   │   ├── logo_innovatis_oficial.svg # Logo Innovatis oficial
│   │   └── logo_innovatis_preta.svg # Logo Innovatis preta
│   ├── Poppins/             # Fonte Poppins (todas as variações)
│   │   ├── OFL.txt          # Licença da fonte
│   │   ├── Poppins-Regular.ttf
│   │   ├── Poppins-Bold.ttf
│   │   ├── Poppins-Medium.ttf
│   │   ├── Poppins-SemiBold.ttf
│   │   └── ... (demais variações)
│   ├── epitacio.png         # Imagem do fundador
│   ├── epitacio_brito_foto_oficial.jpeg
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── src/                     # Código fonte principal
│   ├── .env                 # Variáveis de ambiente do src
│   │
│   ├── app/                 # App Router do Next.js
│   │   ├── favicon.ico      # Favicon legado (substituído via metadata)
│   │   ├── globals.css      # Estilos globais (Tailwind CSS)
│   │   ├── layout.tsx       # Layout raiz (ícone: logo_innovatis_preta.svg)
│   │   ├── page.tsx         # Página inicial (rota /)
│   │   ├── not-found.tsx/   # Página 404 customizada
│   │   │
│   │   ├── api/             # API Routes (Backend)
│   │   │   └── auth/
│   │   │       ├── login/
│   │   │       │   └── route.ts   # POST /api/auth/login
│   │   │       ├── logout/
│   │   │       │   └── route.ts   # POST /api/auth/logout
│   │   │       └── me/
│   │   │           └── route.ts   # GET /api/auth/me
│   │   │
│   │   ├── (auth)/          # Route Group: Rotas públicas (não autenticadas)
│   │   │   └── login/
│   │   │       ├── page.tsx       # Página de login (/login)
│   │   │       └── _components/   # Componentes específicos do login (vazio)
│   │   │
│   │   └── (dashboard)/     # Route Group: Rotas protegidas (autenticadas)
│   │       │
│   │       ├── home/        # Dashboard principal
│   │       │   ├── page.tsx       # Página home (/home)
│   │       │   └── _components/   # Componentes da dashboard
│   │       │       ├── CategoryPieChart.tsx    # Gráfico de pizza por categoria
│   │       │       ├── ContractsLineChart.tsx  # Gráfico de linha temporal
│   │       │       ├── ContractsMap.tsx        # Mapa geográfico de contratos
│   │       │       ├── MapComponent.tsx        # Componente base do mapa
│   │       │       ├── PartnerBarChart.tsx     # Gráfico de barras por parceiro
│   │       │       └── index.ts                # Exportações centralizadas
│   │       │
│   │       ├── contratos/   # Gestão de contratos
│   │       │   ├── page.tsx       # Listagem de contratos (/contratos)
│   │       │   ├── _components/   # Componentes específicos
│   │       │   │   ├── NovoContratoModal.tsx    # Modal de cadastro de contrato
│   │       │   │   └── index.ts                 # Exportações
│   │       │   │
│   │       │   ├── pre-projetos/  # Pré-projetos e pré-contratos
│   │       │   │   ├── page.tsx       # Listagem de pré-projetos (/contratos/pre-projetos)
│   │       │   │   ├── README.md     # Documentação específica
│   │       │   │   └── _components/   # Componentes específicos
│   │       │   │       ├── NovoPreProjetoModal.tsx  # Modal de cadastro
│   │       │   │       └── index.ts                 # Exportações
│   │       │   │
│   │       │   └── [contratoId]/  # Rotas dinâmicas por contrato
│   │       │       ├── layout.tsx       # Layout compartilhado com tabs
│   │       │       ├── page.tsx         # Visão Geral do contrato (/contratos/[id])
│   │       │       ├── contratacoes/
│   │       │       │   └── page.tsx     # Contratações (/contratos/[id]/contratacoes)
│   │       │       ├── execucao/
│   │       │       │   └── page.tsx     # Execução (/contratos/[id]/execucao)
│   │       │       └── rubricas/
│   │       │           └── page.tsx     # Rubricas (/contratos/[id]/rubricas)
│   │       │
│   │       └── parceiros/   # Gestão de parceiros
│   │           ├── page.tsx       # Listagem de parceiros (/parceiros)
│   │           ├── fundacoes/
│   │           │   └── page.tsx   # Fundações (/parceiros/fundacoes)
│   │           └── ifes/
│   │               └── page.tsx   # IFES (/parceiros/ifes)
│   │
│   ├── components/          # Componentes React reutilizáveis
│   │   ├── ModalListener.tsx    # Sistema de modais globais
│   │   └── ... (outros componentes)
│   │
│   ├── generated/           # Código gerado automaticamente
│   │   └── prisma/          # Cliente Prisma gerado
│   │       ├── client.js
│   │       ├── client.d.ts
│   │       ├── index.js
│   │       ├── index.d.ts
│   │       ├── schema.prisma
│   │       ├── runtime/     # Runtime do Prisma
│   │       │   ├── client.js
│   │       │   ├── client.d.ts
│   │       │   ├── index-browser.js
│   │       │   ├── index-browser.d.ts
│   │       │   └── wasm-compiler-edge.js
│   │       └── ... (demais arquivos gerados)
│   │
│   ├── hooks/               # Hooks customizados React (vazio)
│   │
│   ├── lib/                 # Bibliotecas e utilitários
│   │   ├── auth.ts          # Funções de autenticação
│   │   ├── jwt.ts           # Utilitários JWT
│   │   └── prisma.ts        # Instância do Prisma Client
│   │
│   ├── middleware.ts        # Middleware de autenticação (proteção de rotas)
│   │
│   ├── public/              # Arquivos públicos do src (vazio)
│   │
│   └── utils/               # Utilitários gerais (vazio)
│
├── eslint.config.mjs        # Configuração do ESLint
├── next-env.d.ts            # Tipos do Next.js
├── next.config.ts           # Configuração do Next.js
├── package.json             # Dependências e scripts npm
├── package-lock.json        # Lockfile do npm
├── postcss.config.mjs       # Configuração do PostCSS
├── prisma.config.ts         # Configuração adicional do Prisma
└── tsconfig.json            # Configuração do TypeScript
```

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

4. **Navegação por Tabs:**
   - Visão Geral
   - Contratações
   - Execução
   - Rubricas

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
    ├── layout.tsx                    # Layout com header e tabs
    ├── page.tsx                      # Visão Geral
    ├── contratacoes/
    │   └── page.tsx                  # Gestão de contratações
    ├── execucao/
    │   └── page.tsx                  # Cronograma e marcos
    └── rubricas/
        └── page.tsx                  # Orçamento detalhado
```

**Padrões de Componentes:**
- `NovoContratoModal`: Modal de cadastro de contrato
- `NovoPreProjetoModal`: Modal de cadastro de pré-projeto
- `StatusBadge`: Badge colorido por status
- `TipoBadge`: Badge com ícone por tipo
- `MetricCard`: Card de métrica com ícone e valor
- `Th` / `Td`: Células de tabela padronizadas
- Timeline: Componente de linha do tempo

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
| `/contratos/pre-projetos` | `app/(dashboard)/contratos/pre-projetos/page.tsx` | Gestão de pré-projetos e pré-contratos |
| `/contratos/[id]` | `app/(dashboard)/contratos/[contratoId]/page.tsx` | Visão Geral do contrato (dashboard resumido) |
| `/contratos/[id]/*` | `app/(dashboard)/contratos/[contratoId]/layout.tsx` | Layout compartilhado com header e tabs |
| `/contratos/[id]/contratacoes` | `app/(dashboard)/contratos/[contratoId]/contratacoes/page.tsx` | Gestão de aditivos, OS e subcontratos |
| `/contratos/[id]/execucao` | `app/(dashboard)/contratos/[contratoId]/execucao/page.tsx` | Cronograma, marcos e gestão de riscos |
| `/contratos/[id]/rubricas` | `app/(dashboard)/contratos/[contratoId]/rubricas/page.tsx` | Orçamento e execução financeira por rubrica |
| `/parceiros` | `app/(dashboard)/parceiros/page.tsx` | Listagem de parceiros |
| `/parceiros/fundacoes` | `app/(dashboard)/parceiros/fundacoes/page.tsx` | Fundações parceiras |
| `/parceiros/ifes` | `app/(dashboard)/parceiros/ifes/page.tsx` | IFES parceiras |

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
- Validação de arquivos (tipo, tamanho máximo 10MB)

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
