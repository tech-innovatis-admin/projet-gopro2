This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:
```
gopro-2/
├── .git/                    # Controle de versão Git
├── .gitignore              # Arquivos ignorados pelo Git
├── .next/                  # Arquivos de build do Next.js
├── node_modules/           # Dependências instaladas
├── components/             # Componentes UI (raiz) - shadcn/ui + customizados
│   └── ui/                 # Componentes UI (button, input, card, NavBar...)
├── components.json         # Configuração do shadcn/ui
├── docs/                   # Documentação do projeto
│   └── README.md           # Este arquivo
├── lib/                    # Utilitários criados pelo shadcn (`lib/utils.ts`)
├── public/                 # Arquivos estáticos públicos
│   ├── epitacio.png        # Imagem do fundador
│   ├── epitacio_brito_foto_oficial.jpeg # Foto oficial do fundador
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/                    # Código fonte da aplicação
│   ├── app/                # App Router do Next.js (route groups usados)
│   │   ├── api/            # API Routes do Next.js
│   │   │   └── auth/       # Endpoints de autenticação
│   │   │       ├── login/  # POST /api/auth/login
│   │   │       └── logout/ # POST /api/auth/logout
│   │   ├── favicon.ico
│   │   ├── globals.css     # Estilos globais (Tailwind)
│   │   ├── layout.tsx      # Layout global da aplicação
│   │   ├── not-found.tsx   # Página 404
│   │   ├── page.tsx        # Página inicial (rota /)
│   │   ├── (auth)/         # Route group para rotas públicas (não aparece na URL)
│   │   │   └── login/
│   │   │       ├── _components/ # Componentes específicos da página login
│   │   │       └── page.tsx    # Página de login (rota /login)
│   │   └── (dashboard)/    # Route group para rotas autenticadas (não aparece na URL)
│   │       ├── home/
│   │       │   ├── _components/ # Componentes da dashboard (gráficos, mapas)
│   │       │   │   ├── CategoryPieChart.tsx   # Gráfico de pizza
│   │       │   │   ├── ContractsLineChart.tsx  # Gráfico de linhas
│   │       │   │   ├── ContractsMap.tsx       # Mapa de contratos
│   │       │   │   ├── MapComponent.tsx       # Componente base do mapa
│   │       │   │   ├── PartnerBarChart.tsx    # Gráfico de barras
│   │       │   │   └── index.ts               # Exportações
│   │       │   └── page.tsx    # Dashboard home (rota /home)
│   │       └── projetos/
│   │           ├── _components/ # Componentes da página projetos
│   │           ├── page.tsx    # Listagem de projetos (rota /projetos)
│   │           └── [projectId]/ # Rotas dinâmicas por projeto
│   │               ├── page.tsx          # Detalhes do projeto (/projetos/[id])
│   │               ├── rubricas/
│   │               │   └── page.tsx      # Rubricas e orçamento (/projetos/[id]/rubricas)
│   │               ├── execucao/
│   │               │   └── page.tsx      # Execução do projeto (/projetos/[id]/execucao)
│   │               └── contratacoes/
│   │                   └── page.tsx      # Contratações (/projetos/[id]/contratacoes)
│   ├── components/         # Componentes React customizados
│   ├── hooks/              # Hooks customizados React
│   ├── middleware.ts       # Middleware para proteger rotas (auth JWT/cookies)
│   └── utils/              # Utilitários da aplicação
├── eslint.config.mjs       # Configuração do ESLint
├── next-env.d.ts           # Tipos do Next.js
├── next.config.ts          # Configuração do Next.js
├── package.json            # Dependências e scripts
├── package-lock.json       # Lockfile do npm
├── postcss.config.mjs      # Configuração do PostCSS
└── tsconfig.json           # Configuração do TypeScript
```
│   │   │   │   ├── page.tsx    # Página home (rota /home)
│   │   │   │   └── _components/ # Componentes específicos da página home (vazio)
│   │   │   └── projetos/
│   │   │       ├── page.tsx    # Página de projetos (rota /projetos)
│   │   │       └── _components/ # Componentes específicos da página projetos (vazio)
│   ├── middleware.ts       # Middleware para proteger rotas (auth JWT/cookies)
│   ├── components/         # Componentes reutilizáveis (vazio)
│   ├── hooks/              # Hooks customizados (vazio)
│   └── utils/              # Utilitários (vazio)
├── eslint.config.mjs       # Configuração do ESLint
├── next-env.d.ts           # Tipos do Next.js
├── next.config.ts          # Configuração do Next.js
├── package.json            # Dependências e scripts
├── package-lock.json       # Lockfile do npm
├── postcss.config.mjs      # Configuração do PostCSS
├── README.md               # Este arquivo
└── tsconfig.json           # Configuração do TypeScript
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

### Estrutura de Páginas (App Router com Route Groups)

O projeto utiliza **Route Groups** (pastas com parênteses) para separar as rotas públicas (autenticação) das protegidas (dashboard). Esses groups **não aparecem na URL** e servem apenas para organização:

#### Rotas Públicas (auth)
- **`/login`** - Página de login (`app/(auth)/login/page.tsx`)

#### Rotas Protegidas (dashboard)
- **`/home`** - Página home - requer autenticação (`app/(dashboard)/home/page.tsx`)
- **`/projetos`** - Página de projetos - requer autenticação (`app/(dashboard)/projetos/page.tsx`)

### Proteção de Rotas (Middleware)

O arquivo `src/middleware.ts` implementa validação de autenticação:

- **Rotas públicas**: `/login` e `/` - não requerem autenticação
- **Rotas protegidas**: Todas as rotas em `(dashboard)` - requerem token JWT/cookie válido
- **Redirecionamento**: Usuários sem autenticação são redirecionados para `/login`

Para validar o token:
1. O middleware verifica se existe um cookie `token` ou header `Authorization: Bearer <token>`
2. Se não houver, redireciona para `/login`
3. TODO: Implementar validação de JWT no middleware para verificar a validade do token

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
