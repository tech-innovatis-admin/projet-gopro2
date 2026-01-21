# 📊 Análise Profunda - Módulo Funil de Contratos

## 📁 Visão Geral da Estrutura

```
funil/
├── page.tsx                    # Página principal do Kanban (300 linhas)
├── types.ts                    # Tipos TypeScript e dados mock (602 linhas)
├── layout.tsx                  # Layout com Provider de Context (10 linhas)
├── context/
│   └── PipelineStagesContext.tsx  # Context API para gerenciar etapas (47 linhas)
├── edit/
│   └── page.tsx                # Página de configuração de etapas (236 linhas)
└── _components/
    ├── PipelineBoard.tsx       # Componente principal do Kanban (136 linhas)
    ├── ColumnHeader.tsx        # Cabeçalho de cada coluna (41 linhas)
    ├── ContractCard.tsx        # Card de contrato arrastável (152 linhas)
    ├── StageConfigColumn.tsx   # Coluna de configuração de etapa (155 linhas)
    └── index.ts                # Exportações centralizadas (7 linhas)
```

**Total:** ~1.686 linhas de código TypeScript/React

---

## 🎯 Propósito do Módulo

O **Funil de Contratos** é um sistema Kanban inspirado no Pipedrive que permite acompanhar contratos já assinados durante a fase de **preparação até o início da execução**. 

### Escopo Funcional:
- ✅ Apenas contratos assinados cuja execução ainda não começou
- ✅ Acompanhamento visual em etapas de iniciação
- ✅ Gestão de atividades de preparação
- ✅ Alertas de SLA (Service Level Agreement)
- ✅ Histórico completo de movimentação

---

## 📋 Arquitetura e Componentes

### 1. **page.tsx** - Página Principal do Kanban

**Localização:** `src/app/(dashboard)/contratos/funil/page.tsx`

#### Funcionalidades Principais:

**Estado Gerenciado:**
- `columns`: Colunas do pipeline (estágios + contratos)
- `searchQuery`: Busca textual
- `showFilters`: Controle de painel de filtros
- `filters`: Filtros (tipo, coordenador, parceiro)

**Cálculos Agregados:**
- Total de contratos em preparação
- Valor total agregado
- Filtragem dinâmica de contratos

**Handlers Principais:**

1. **`handleMoveContract`** (linhas 71-132):
   - Atualização otimista do estado local
   - Move contrato entre colunas
   - Recalcula totais das colunas
   - Chama API para registrar movimentação
   - Detecta quando contrato chega ao estágio final

2. **`handleStartProject`** (linhas 136-154):
   - Muda status de execução para `EM_EXECUCAO`
   - Remove contrato do pipeline após iniciar

3. **`clearFilters`** (linhas 157-160):
   - Limpa todos os filtros ativos

**UI/UX:**
- Header com métricas agregadas
- Campo de busca com ícone e botão de limpar
- Botão de filtros com indicador visual quando ativo
- Link para página de edição de etapas
- Painel de filtros expandível

**Integração:**
- Usa `usePipelineStages()` do Context para obter etapas
- Renderiza `PipelineBoard` com colunas filtradas

---

### 2. **types.ts** - Tipos e Dados Mock

**Localização:** `src/app/(dashboard)/contratos/funil/types.ts`

#### Tipos TypeScript Definidos:

**1. `ContractExecutionStatus`** (linhas 9-13):
```typescript
type ContractExecutionStatus = 
  | "NAO_INICIADA" 
  | "EM_EXECUCAO" 
  | "CONCLUIDA" 
  | "SUSPENSA";
```

**2. `InitiationStage`** (linhas 16-24):
```typescript
type InitiationStage = {
  id: string;
  name: string;
  description?: string;
  order: number;
  isFinal: boolean;
  isActive: boolean;
  slaDays?: number;
};
```

**3. `PipelineContract`** (linhas 27-41):
```typescript
type PipelineContract = {
  id: string;
  title: string;
  code: string;
  type: "PROJETO" | "PRODUTO";
  partnerName: string | null;
  totalValue: number | null;
  coordinatorName: string | null;
  stageId: string;
  stageEnteredAt: string; // ISO date
  daysInStage: number;
  hasScheduledActivities: boolean;
  warnings: string[];
  executionStatus: ContractExecutionStatus;
};
```

**4. `PipelineColumn`** (linhas 44-48):
```typescript
type PipelineColumn = {
  stage: InitiationStage;
  contracts: PipelineContract[];
  totalValue: number;
};
```

**5. `InitiationActivity`** (linhas 65-80):
- Atividades de preparação (reuniões, documentos, tarefas)

**6. `StageHistoryEntry`** (linhas 83-94):
- Histórico de movimentação entre etapas
- Suporta origem/destino para rastreamento completo

**7. `TimelineEvent`** (linhas 99-107):
- Eventos unificados (atividades + mudanças de etapa)

#### Dados Mock:

**Estágios Padrão** (`MOCK_STAGES` - linhas 114-169):
1. Contrato Assinado (SLA: 5 dias)
2. Documentação Completa (SLA: 7 dias)
3. Equipe Alocada (SLA: 10 dias)
4. Planejamento Aprovado (SLA: 7 dias)
5. Kickoff Realizado (SLA: 3 dias)
6. Pronto para Execução (SLA: 2 dias) - **Final**

**Contratos Mock** (`MOCK_PIPELINE_CONTRACTS` - linhas 172-314):
- 9 contratos distribuídos pelos estágios
- Incluem projetos e produtos
- Dados realistas com valores, coordenadores, parceiros

**Atividades Mock** (`MOCK_INITIATION_ACTIVITIES` - linhas 317-417):
- 6 atividades de exemplo
- Diferentes tipos: MEETING, DOCUMENT, INTERNAL_TASK
- Algumas concluídas, outras pendentes

**Histórico Mock** (`MOCK_STAGE_HISTORY` - linhas 420-493):
- Exemplo completo de movimentação de um contrato
- Mostra jornada completa do estágio 1 ao 6

#### Funções Utilitárias:

- `formatCurrency()`: Formatação monetária brasileira
- `formatDate()`: Formatação de datas
- `formatDateTime()`: Formatação de data/hora
- `getActivityTypeLabel()`: Labels em português
- `getActivityTypeIcon()`: Emojis por tipo
- `getActivityTypeIconComponent()`: Componentes React de ícones
- `buildPipelineColumns()`: Agrupa contratos por estágio
- `getContractActivities()`: Obtém atividades de um contrato
- `getContractStageHistory()`: Obtém histórico de movimentação
- `getContractById()`: Busca contrato por ID
- `getStageById()`: Busca estágio por ID

---

### 3. **layout.tsx** - Layout com Provider

**Localização:** `src/app/(dashboard)/contratos/funil/layout.tsx`

**Função:**
- Envolve todas as páginas do funil com `PipelineStagesProvider`
- Garante que o estado de etapas seja compartilhado entre:
  - Página principal (`/funil`)
  - Página de edição (`/funil/edit`)

**Implementação:**
```typescript
export default function FunilLayout({ children }) {
  return <PipelineStagesProvider>{children}</PipelineStagesProvider>;
}
```

---

### 4. **context/PipelineStagesContext.tsx** - Context API

**Localização:** `src/app/(dashboard)/contratos/funil/context/PipelineStagesContext.tsx`

#### Funcionalidades:

**Estado:**
- `stages`: Array de `InitiationStage[]`
- Inicializado com `MOCK_STAGES`

**Métodos Expostos:**
- `updateStages(newStages)`: Atualiza etapas
- `resetStages()`: Reseta para valores padrão

**Hook Customizado:**
- `usePipelineStages()`: Hook para acessar o context
- Lança erro se usado fora do Provider

**Uso:**
- Permite que página de edição atualize etapas
- Página principal lê etapas atualizadas
- Estado compartilhado entre rotas do funil

---

### 5. **edit/page.tsx** - Configuração de Etapas

**Localização:** `src/app/(dashboard)/contratos/funil/edit/page.tsx`

#### Funcionalidades:

**Estado:**
- `stages`: Cópia local das etapas do context
- `isLoading`: Estado de carregamento
- `isSaving`: Estado de salvamento
- `error`: Mensagens de erro
- `deletedStageIds`: IDs de etapas deletadas

**Handlers:**

1. **`handleUpdateStage`** (linhas 42-46):
   - Atualiza uma etapa específica no estado local

2. **`handleDeleteStage`** (linhas 49-67):
   - Valida se etapa pode ser deletada (não é final)
   - Verifica se há contratos associados
   - Confirmação antes de deletar
   - Adiciona ID à lista de deletados

3. **`handleAddNewStage`** (linhas 70-81):
   - Cria nova etapa com ID temporário
   - Define ordem automaticamente
   - Configuração padrão (não final, ativa, SLA 3 dias)

4. **`handleSaveChanges`** (linhas 84-128):
   - Reordena etapas por `order`
   - Atualiza índices sequenciais
   - TODO: Chamada API (comentada)
   - Atualiza context com novas etapas
   - Redireciona para página principal

5. **`handleCancel`** (linhas 131-133):
   - Volta para página principal sem salvar

**UI:**
- Breadcrumb completo
- Header com título e descrição
- Botões de ação (Cancelar, Salvar)
- Mensagem de erro quando ocorre
- Grid horizontal de colunas de configuração
- Card para adicionar nova etapa

**Validações:**
- Não permite deletar etapa final
- Alerta quando deleta etapa com contratos
- Conta contratos por etapa antes de deletar

---

### 6. **_components/PipelineBoard.tsx** - Kanban Principal

**Localização:** `src/app/(dashboard)/contratos/funil/_components/PipelineBoard.tsx`

#### Funcionalidades:

**Drag & Drop Nativo (HTML5):**

1. **`handleDragStart`** (linhas 28-39):
   - Define contrato sendo arrastado
   - Configura `effectAllowed` como "move"
   - Adiciona ID ao `dataTransfer`
   - Aplica opacidade ao elemento

2. **`handleDragEnd`** (linhas 41-48):
   - Limpa estado de drag
   - Restaura opacidade

3. **`handleDragOver`** (linhas 50-54):
   - Previne comportamento padrão
   - Define `dropEffect` como "move"
   - Marca coluna como destino

4. **`handleDragLeave`** (linhas 56-62):
   - Limpa marcação apenas se realmente saiu da coluna
   - Usa `closest()` para verificar

5. **`handleDrop`** (linhas 64-81):
   - Previne comportamento padrão
   - Valida se contrato existe
   - Ignora se soltar na mesma coluna
   - Chama `onMoveContract` callback

**Renderização:**
- Loop pelas colunas
- Cada coluna é uma área de drop
- Feedback visual quando arrastando sobre
- Mensagem "Solte aqui" quando hover
- Renderiza `ColumnHeader` e `ContractCard`

**Estados Visuais:**
- `dragOverStageId`: ID da coluna sendo hover
- `draggedContract`: Contrato sendo arrastado
- Estilos condicionais baseados em estado

---

### 7. **_components/ColumnHeader.tsx** - Cabeçalho de Coluna

**Localização:** `src/app/(dashboard)/contratos/funil/_components/ColumnHeader.tsx`

#### Estrutura:

**Informações Exibidas:**
- Nome do estágio (centralizado)
- Valor total formatado
- Contagem de contratos
- SLA em dias (se configurado)

**Design:**
- Borda inferior separando header do conteúdo
- Tipografia hierárquica
- Cores neutras (gray)

---

### 8. **_components/ContractCard.tsx** - Card de Contrato

**Localização:** `src/app/(dashboard)/contratos/funil/_components/ContractCard.tsx`

#### Funcionalidades:

**Drag & Drop:**
- `draggable={true}`
- Handlers `onDragStart` e `onDragEnd`
- Feedback visual durante drag (opacidade, rotação, escala)

**Informações Exibidas:**
1. **Handle de Drag**: Ícone `GripVertical` + código do contrato
2. **Título**: Link para página de iniciação
3. **Parceiro**: Ícone `Building2` + nome
4. **Valor**: Formatado em R$
5. **Coordenador**: Ícone `User` + nome
6. **Dias no Estágio**: Ícone `Clock` + contagem
7. **Warnings**: Alertas com ícone `AlertTriangle`
   - Vermelho para SLA expirado
   - Amarelo para outros avisos
8. **Ações**:
   - Link "Ver detalhes"
   - Botão "Iniciar Projeto" (apenas no estágio final)

**Estilos Condicionais:**
- Borda esquerda vermelha: SLA expirado
- Borda esquerda amarela: Outros warnings
- Classe `liquid-glass-card`: Efeito glassmorphism
- Opacidade reduzida durante drag

**Interações:**
- `stopPropagation()` em links para não interferir no drag
- Hover states nos links
- Botão de iniciar projeto apenas no estágio final

---

### 9. **_components/StageConfigColumn.tsx** - Configuração de Etapa

**Localização:** `src/app/(dashboard)/contratos/funil/_components/StageConfigColumn.tsx`

#### Funcionalidades:

**Campos Editáveis:**
1. **Nome da Etapa**: Input de texto
2. **SLA (Estagnação)**: 
   - Toggle para ativar/desativar
   - Input numérico quando ativo
   - Valor padrão: 3 dias

**Informações Exibidas:**
- Número da etapa (ordem)
- Contagem de contratos na etapa
- Botão de excluir (desabilitado se final ou com contratos)

**Handlers:**
- `handleNameChange`: Atualiza nome em tempo real
- `handleToggleSla`: Alterna SLA e mantém valor
- `handleSlaDaysChange`: Valida e atualiza dias de SLA
- `onDelete`: Chama callback de exclusão

**Validações:**
- Não permite excluir etapa final
- Alerta visual quando não pode excluir
- Tooltip explicativo no botão de excluir

**Design:**
- Largura fixa (320px)
- Bordas e separadores visuais
- Cores semânticas (verde para ativo, vermelho para excluir)

---

## 🔄 Fluxos de Dados

### Fluxo 1: Carregamento Inicial

```
1. Usuário acessa /contratos/funil
2. Layout.tsx renderiza PipelineStagesProvider
3. Context inicializa com MOCK_STAGES
4. page.tsx usa usePipelineStages() para obter etapas
5. buildPipelineColumns() agrupa contratos por estágio
6. PipelineBoard renderiza colunas e cards
```

### Fluxo 2: Movimentação de Contrato

```
1. Usuário arrasta card (handleDragStart)
2. Usuário solta em outra coluna (handleDrop)
3. handleMoveContract atualiza estado local (otimista)
4. Recalcula totais das colunas
5. Chama API /api/contratos/:id/iniciacao/move
6. Se erro, TODO: reverter atualização otimista
7. UI atualiza imediatamente
```

### Fluxo 3: Edição de Etapas

```
1. Usuário acessa /contratos/funil/edit
2. Carrega etapas do context
3. Usuário edita nome/SLA de uma etapa
4. handleUpdateStage atualiza estado local
5. Usuário salva (handleSaveChanges)
6. Reordena etapas por order
7. Atualiza context com updateStages()
8. Redireciona para /contratos/funil
9. Página principal lê etapas atualizadas
```

### Fluxo 4: Iniciar Projeto

```
1. Contrato está no estágio final
2. Usuário clica "Iniciar Projeto"
3. handleStartProject atualiza executionStatus
4. Contrato é removido do pipeline
5. TODO: Chamar API para iniciar execução
```

---

## 🎨 Design System Aplicado

### Cores:
- **Primária**: `#004225` (verde institucional)
- **Hover**: `#003319` (verde escuro)
- **Background**: `#F5F6F8` (cinza claro)
- **Cards**: Branco com bordas sutis

### Efeitos Visuais:
- **Liquid Glass**: Classe `liquid-glass-card` nos cards
- **Drag Feedback**: Opacidade, rotação e escala
- **Hover States**: Transições suaves
- **Bordas Coloridas**: Indicadores de warnings

### Tipografia:
- Títulos: `font-bold`, `text-2xl`
- Subtítulos: `font-semibold`, `text-sm`
- Texto secundário: `text-xs`, `text-gray-500`

---

## 🔌 Integrações e APIs

### Endpoints Esperados:

1. **`PATCH /api/contratos/:id/iniciacao/move`** (linha 118):
   - Body: `{ fromStageId, toStageId }`
   - Registra movimentação no histórico

2. **`PUT /api/contracts/initiation/stages`** (linha 98 - comentado):
   - Body: `{ stages: InitiationStage[], deletedIds: string[] }`
   - Salva configuração de etapas

3. **`POST /api/contratos/:id/iniciacao/start`** (não implementado):
   - Inicia execução do projeto
   - Muda status para EM_EXECUCAO

---

## 📊 Métricas e Estatísticas

### Dados Agregados Calculados:
- Total de contratos em preparação
- Valor total agregado
- Contratos por estágio
- Valor por estágio
- Dias no estágio atual
- Alertas de SLA

### Alertas Gerados:
- "SLA expirado" (quando dias > slaDays)
- "Sem atividades agendadas" (quando hasScheduledActivities = false)
- "SLA próximo de expirar" (quando próximo do limite)

---

## 🚀 Funcionalidades Implementadas

✅ **Kanban Board Completo**
- Drag & Drop nativo HTML5
- Colunas dinâmicas baseadas em etapas
- Feedback visual durante drag

✅ **Sistema de Etapas Configurável**
- Edição de nomes
- Configuração de SLA por etapa
- Adicionar/remover etapas
- Reordenação automática

✅ **Filtros e Busca**
- Busca textual (título, código, parceiro, coordenador)
- Filtro por tipo (Projeto/Produto)
- Estrutura preparada para mais filtros

✅ **Alertas e Warnings**
- Detecção de SLA expirado
- Alertas de atividades pendentes
- Indicadores visuais coloridos

✅ **Integração com Context API**
- Estado compartilhado entre páginas
- Atualização em tempo real

✅ **Navegação**
- Links para página de iniciação do contrato
- Breadcrumbs completos
- Botão de iniciar projeto no estágio final

---

## 🔮 Funcionalidades Futuras (TODOs)

1. **Reversão de Atualização Otimista**:
   - Implementar rollback em caso de erro na API

2. **Integração com Backend**:
   - Substituir dados mock por chamadas reais
   - Implementar endpoints de API

3. **Mais Filtros**:
   - Por coordenador
   - Por parceiro
   - Por período

4. **Validações Avançadas**:
   - Não permitir deletar etapa com contratos (em produção)
   - Validação de ordem mínima/máxima de etapas

5. **Histórico Visual**:
   - Timeline de movimentações
   - Gráficos de tempo médio por etapa

6. **Notificações**:
   - Alertas quando SLA está próximo
   - Notificações de movimentação

---

## 📝 Observações Técnicas

### Performance:
- Atualização otimista para UX fluida
- Uso de `useCallback` para evitar re-renders
- Estado local para filtros (não precisa de Context)

### Acessibilidade:
- Atributos `draggable` e `dataTransfer`
- Feedback visual claro
- Tooltips em botões desabilitados

### Manutenibilidade:
- Tipos TypeScript completos
- Componentes bem separados
- Funções utilitárias reutilizáveis
- Exportações centralizadas

### Escalabilidade:
- Estrutura preparada para mais estágios
- Filtros extensíveis
- Context API permite expansão de estado

---

## 🎯 Conclusão

O módulo **Funil de Contratos** é uma implementação completa e bem estruturada de um sistema Kanban para gestão de iniciação de contratos. A arquitetura é sólida, com separação clara de responsabilidades, tipos bem definidos e componentes reutilizáveis.

**Pontos Fortes:**
- ✅ Código limpo e bem organizado
- ✅ TypeScript completo
- ✅ UX polida com feedback visual
- ✅ Arquitetura escalável
- ✅ Integração preparada para backend

**Áreas de Melhoria:**
- ⚠️ Implementar reversão de atualização otimista
- ⚠️ Adicionar mais testes
- ⚠️ Documentar APIs esperadas
- ⚠️ Implementar validações de backend

---

**Última atualização:** Janeiro 2026
**Versão analisada:** Baseada no código atual do repositório
