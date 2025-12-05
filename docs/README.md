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
│   │   ├── favicon.ico
│   │   ├── globals.css      # Estilos globais (Tailwind CSS)
│   │   ├── layout.tsx       # Layout raiz da aplicação
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
│   │       │   ├── _components/   # Componentes específicos (vazio)
│   │       │   │
│   │       │   └── [contratoId]/  # Rotas dinâmicas por contrato
│   │       │       ├── page.tsx         # Detalhes do contrato (/contratos/[id])
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
│   ├── components/          # Componentes React reutilizáveis (vazio)
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
| `/contratos` | `app/(dashboard)/contratos/page.tsx` | Listagem de contratos |
| `/contratos/[id]` | `app/(dashboard)/contratos/[contratoId]/page.tsx` | Detalhes do contrato |
| `/contratos/[id]/contratacoes` | `app/(dashboard)/contratos/[contratoId]/contratacoes/page.tsx` | Contratações do contrato |
| `/contratos/[id]/execucao` | `app/(dashboard)/contratos/[contratoId]/execucao/page.tsx` | Execução do contrato |
| `/contratos/[id]/rubricas` | `app/(dashboard)/contratos/[contratoId]/rubricas/page.tsx` | Rubricas do contrato |
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

---

## 📚 Learn More

Para aprender mais sobre Next.js:

- [Next.js Documentation](https://nextjs.org/docs) - recursos e API do Next.js
- [Learn Next.js](https://nextjs.org/learn) - tutorial interativo

---

## 🚀 Deploy on Vercel

A forma mais fácil de fazer deploy é usar a [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Veja a [documentação de deploy](https://nextjs.org/docs/app/building-your-application/deploying) para mais detalhes.
