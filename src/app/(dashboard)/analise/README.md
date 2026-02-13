# Dashboard de Análise - Documentação

## 📋 Visão Geral

A página de **Dashboard de Análise** é um painel executivo responsivo que apresenta métricas macro e indicadores de performance dos projetos. Ela foi desenvolvida como um dashboard multi-página onde o usuário pode navegar entre diferentes visualizações de dados sem necessidade de scroll, mantendo todos os elementos visíveis na tela.

## 🎯 Funcionalidades Principais

### 1. **Sistema de Navegação Multi-Página**
- O dashboard conta com **3 páginas** distintas
- Navegação através de:
  - Botões seta para página anterior/próxima (com navegação circular)
  - Botões numerados para acesso direto a uma página específica
  - Indicador de página atual no rodapé

### 2. **Layout Responsivo sem Scroll**
- Utiliza `height: 100vh` (height screen) para ocupar exatamente a altura da viewport
- `overflow: hidden` para prevenir scroll vertical
- Elementos flexíveis que se adaptam ao espaço disponível
- Todos os dados permanecem visíveis sem necessidade de rolagem

### 3. **Páginas do Dashboard**

#### **Página 1: Métricas Principais**
- 4 cards com KPIs principais:
  - Total de Projetos
  - Projetos Ativos
  - Valor Total
  - Equipe Ativa
- 2 gráficos placeholder:
  - Evolução Mensal (gráfico de barras)
  - Status dos Projetos (gráfico de pizza)

#### **Página 2: Performance e KPIs Detalhados**
- 3 cards com KPIs secundários:
  - Duração Média dos Projetos
  - Taxa de Sucesso
  - ROI Médio
- 1 gráfico grande de performance por período

#### **Página 3: Análise Complementar**
- 4 cards com métricas calculadas:
  - Projetos Concluídos
  - Média por Projeto
  - Pessoas por Projeto
  - Índice de Eficiência
- 2 gráficos:
  - Distribuição de Recursos
  - Tendência de Crescimento

## 🏗️ Estrutura de Pastas

```
src/app/(dashboard)/analise/
├── page.tsx              # Arquivo principal do dashboard
├── data.ts               # Dados mockados e interfaces TypeScript
├── _components/          # Pasta para componentes reutilizáveis (vazia)
└── README.md            # Este arquivo
```

### Descrição dos Arquivos

#### **page.tsx**
- Componente React principal que renderiza o dashboard
- Gerencia o estado de navegação entre páginas usando `useState`
- Contém toda a lógica de layout com Tailwind CSS
- Implementa formatação de moeda e percentuais
- Define constante `TOTAL_PAGES = 3` para número de páginas

#### **data.ts**
- Contém dados mockados (simulados) do dashboard
- Define interfaces TypeScript para type safety:
  - `mockMetrics`: objeto com todas as métricas principais
  - `mockRecentProjects`: array de projetos (para uso futuro)
  - `mockChartData`: dados para gráficos (para uso futuro)
- Não está conectado a nenhuma API real (pode ser integrado depois)

#### **_components/**
- Pasta reservada para componentes reutilizáveis do dashboard
- Atualmente vazia, pronta para receber componentes futuros
- Sugestões de componentes a criar:
  - `MetricCard.tsx`: Card genérico de métrica
  - `ChartPlaceholder.tsx`: Componente para gráficos
  - `PaginationControls.tsx`: Controles de navegação

## 💻 Tecnologias Utilizadas

### **Frontend Framework**
- **Next.js 14+**: Framework React com renderização híbrida
  - App Router para roteamento
  - Server Components e Client Components

### **Linguagem**
- **TypeScript**: Tipagem estática completa para JavaScript

### **Styling**
- **Tailwind CSS**: Framework CSS utility-first
  - Classes como `grid`, `flex`, `gap-4`, `rounded-xl`, etc.
  - Sistema de cores customizadas (ex: `#004225` para verde primário)

### **Ícones**
- **Lucide React**: Biblioteca de ícones
  - Ícones utilizados:
    - `TrendingUp`, `TrendingDown`: Indicadores de tendência
    - `DollarSign`: Valor
    - `Users`: Pessoas
    - `FolderOpen`: Projetos
    - `Calendar`: Datas
    - `Crosshair`: Metas
    - `BarChart3`: Gráficos de barras
    - `PieChart`: Gráficos de pizza
    - `Activity`: Atividade/Projetos ativos
    - `ChevronLeft`, `ChevronRight`: Navegação

### **Estado**
- **React Hooks**:
  - `useState`: Gerencia a página atual do dashboard

## 📊 Dados e Métricas

### Estrutura de Dados do Dashboard

```typescript
mockMetrics = {
  totalProjects: 47,        // Total de projetos no sistema
  activeProjects: 32,       // Projetos em execução
  completedProjects: 15,    // Projetos finalizados
  totalValue: 12500000,     // R$ 12.5M valor total
  activeValue: 8750000,     // R$ 8.75M valor ativo
  monthlyGrowth: 12.5,      // 12.5% crescimento mensal
  avgProjectDuration: 18,   // Duração média em meses
  totalPeople: 156,         // Total de pessoas
  activePeople: 89,         // Pessoas ativas
}
```

## 🎨 Sistema de Cores

O dashboard utiliza um sistema de cores consistente:

- **Verde primário** (`#004225`): Cor principal da aplicação, botões ativos
- **Azul** (`bg-blue-100`, `text-blue-600`): Cards de projetos
- **Verde** (`bg-green-100`, `text-green-600`): Atividade/Sucesso
- **Roxo** (`bg-purple-100`, `text-purple-600`): Valores financeiros
- **Laranja** (`bg-orange-100`, `text-orange-600`): Equipe
- **Cinza** (`bg-gray-*`, `text-gray-*`): Backgrounds e textos secundários

## 🔄 Fluxo de Navegação

```
Página 1 (Métricas)
↓
Página 2 (Performance)
↓
Página 3 (Análise)
↓ (volta ao início)
Página 1
```

### Ações de Navegação

| Ação | Resultado |
|------|-----------|
| Clique no botão seta esquerda | Página anterior (circular) |
| Clique no botão seta direita | Próxima página (circular) |
| Clique no número da página | Vai direto para essa página |

## 🚀 Como Adicionar Novas Funcionalidades

### Adicionar Nova Página

1. **Atualize a constante `TOTAL_PAGES`:**
```typescript
const TOTAL_PAGES = 4; // Antes era 3
```

2. **Adicione novo bloco condicional no render:**
```typescript
{currentPage === 4 && (
  <div className="h-full flex flex-col gap-4">
    {/* Seu conteúdo aqui */}
  </div>
)}
```

### Integrar com API Real

Substitua `mockMetrics` no `data.ts`:

```typescript
// Antes (dados simulados)
export const mockMetrics = { ... }

// Depois (dados da API)
export async function getMetrics() {
  const response = await fetch('/api/metrics');
  return response.json();
}
```

Em `page.tsx`, use `useEffect` para buscar dados:

```typescript
useEffect(() => {
  fetchMetrics();
}, []);
```

### Criar Componentes Reutilizáveis

Crie arquivo `_components/MetricCard.tsx`:

```typescript
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
  bgColor: string;
  iconColor: string;
}

export function MetricCard({ title, value, icon, ...props }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      {/* Component implementation */}
    </div>
  );
}
```

### Adicionar Gráficos Reais

Atualmente os gráficos são placeholders. Para adicionar gráficos reais:

1. Instale biblioteca de gráficos (ex: `recharts`):
```bash
npm install recharts
```

2. Importe e use em `page.tsx`:
```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
```

## 📱 Responsividade

O dashboard usa breakpoints Tailwind para adaptabilidade:

- **Mobile** (< 640px): 1 coluna
- **Tablet** (640px - 1024px): 2 colunas
- **Desktop** (> 1024px): 3-4 colunas

Grid classes utilizadas:
- `grid-cols-1`: Mobile
- `md:grid-cols-2`: Tablet e acima
- `lg:grid-cols-3` ou `lg:grid-cols-4`: Desktop

## ⚙️ Configurações Importantes

### Altura do Viewport
```typescript
<div className="h-screen flex flex-col overflow-hidden">
```
- `h-screen`: Altura de 100% da viewport
- `overflow-hidden`: Previne scroll

### Flex Layout Principal
```typescript
<div className="flex-1 flex flex-col ... overflow-hidden">
```
- `flex-1`: Ocupa espaço disponível
- `flex flex-col`: Layout vertical
- `overflow-hidden`: Mantém conteúdo sem scroll

## 🔍 Dicas de Manutenção

1. **Adicionar novo card**: Copie a estrutura de um card existente e ajuste os valores
2. **Mudar cores**: Atualize as classes Tailwind (`bg-*`, `text-*`)
3. **Ajustar espaçamento**: Modifique classes `gap-*`, `p-*`, `mb-*`
4. **Atualizar dados**: Modifique `mockMetrics` em `data.ts`
5. **Adicionar ícones**: Importe de `lucide-react` e use como componente React

## 📝 Próximos Passos Sugeridos

- [ ] Integrar com API real para dados dinâmicos
- [ ] Implementar gráficos reais com Recharts ou Chart.js
- [ ] Criar componentes reutilizáveis em `_components/`
- [ ] Adicionar filtros por período (ex: semana, mês, ano)
- [ ] Implementar export de dados (PDF, CSV)
- [ ] Adicionar modo escuro
- [ ] Criar testes unitários e E2E
- [ ] Adicionar animações nas transições de página

## 📞 Suporte e Questões

Para questões sobre o dashboard, verifique:
1. Este README.md
2. Comentários no código em `page.tsx`
3. Estrutura de dados em `data.ts`
