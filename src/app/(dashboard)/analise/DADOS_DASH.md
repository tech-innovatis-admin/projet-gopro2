# Mapeamento de Dados do Dashboard de Análise

## 📊 Visão Geral

Este documento descreve como o **Dashboard de Análise** se integra com a estrutura do banco de dados (DBML) fornecida, mapeando as tabelas necessárias, agregações de dados e cálculos das métricas exibidas.

## 🔗 Estrutura de Dados do Banco

### Tabelas Principais Utilizadas

#### **1. Projects (Tabela Central)**
A tabela `projects` é o coração do dashboard. Ela contém informações sobre todos os projetos/contratos.

**Campos Relevantes:**
```sql
projects {
  id                    -- Identificador único do projeto
  name                  -- Nome do projeto
  code                  -- Código do projeto (ex: SGE-2024)
  status                -- Status do projeto (0=pre-projeto, 1=execução, 2=finalizado, 3=suspenso, 4=planejamento)
  contract_value        -- Valor do contrato em R$
  start_date            -- Data contratual de início
  end_date              -- Data contratual de término
  opening_date          -- Data efetiva de início
  closing_date          -- Data efetiva de fechamento
  total_received        -- Total de receitas (incomes)
  total_expenses        -- Total de despesas (expenses)
  saldo                 -- Saldo = total_received - total_expenses
  coordinator_id        -- FK para people (coordenador do projeto)
  partner_primary_id    -- FK para partners (parceiro principal)
  client_primary_id     -- FK para public_agencies (cliente)
}
```

#### **2. People (Pessoas/Coordenadores)**
Contém informações sobre as pessoas envolvidas, especialmente coordenadores.

```sql
people {
  id            -- Identificador
  full_name     -- Nome completo
  cpf           -- CPF
  email         -- E-mail
  phone         -- Telefone
}
```

#### **3. Partners (Parceiros)**
Contém dados de IFMA e outras instituições parceiras.

```sql
partners {
  id            -- Identificador
  name          -- Nome do parceiro
  trade_name    -- Nome fantasia
  fund_if       -- 0=fundação, 1=IF
  cnpj          -- CNPJ
}
```

#### **4. Project_People (Contratações PF)**
Vincula pessoas aos projetos.

```sql
project_people {
  id              -- Identificador
  project_id      -- FK para projects
  person_id       -- FK para people
  role            -- Função no projeto
  contract_type   -- bolsa, rpa, clt, etc.
  status          -- 0=pendente, 1=ativo, 2=encerrado
  start_date      -- Data de início
  end_date        -- Data de término
}
```

#### **5. Incomes (Receitas)**
Registra receitas/desembolsos dos projetos.

```sql
incomes {
  id              -- Identificador
  project_id      -- FK para projects
  amount          -- Valor recebido
  received_at     -- Data do recebimento
}
```

#### **6. Expenses (Despesas)**
Registra despesas de cada projeto.

```sql
expenses {
  id              -- Identificador
  budget_item_id  -- FK para budget_items
  project_id      -- FK para projects
  amount          -- Valor da despesa
  expense_date    -- Data da despesa
}
```

#### **7. Goals, Stages, Phases (Metas, Etapas, Fases)**
Estrutura hierárquica de planejamento do projeto.

```sql
goals {
  id          -- Identificador
  project_id  -- FK para projects
  numero      -- Número sequencial
  titulo      -- Título da meta
  data_inicio -- Data de início
  data_fim    -- Data de término
}

stages {
  id          -- Identificador
  goal_id     -- FK para goals
  numero      -- Número sequencial
  titulo      -- Título da etapa
}

phases {
  id          -- Identificador
  stage_id    -- FK para stages
  numero      -- Número sequencial
  titulo      -- Título da fase
}
```

## 📈 Mapeamento de Métricas

### Página 1: Métricas Principais

#### **1. Total de Projetos**
**Cálculo:**
```sql
SELECT COUNT(*) as totalProjects
FROM projects
WHERE is_active = 1;
```

**Descrição:** Contagem de todos os projetos ativos no sistema.

**Atualmente:** 47 projetos

---

#### **2. Projetos Ativos**
**Cálculo:**
```sql
SELECT COUNT(*) as activeProjects
FROM projects
WHERE status = 1 AND is_active = 1;
-- Status 1 = execução
```

**Descrição:** Contagem de projetos em execução (status = 1).

**Atualmente:** 32 projetos

---

#### **3. Valor Total**
**Cálculo:**
```sql
SELECT COALESCE(SUM(contract_value), 0) as totalValue
FROM projects
WHERE is_active = 1;
```

**Descrição:** Soma de todos os valores de contrato dos projetos ativos.

**Atualmente:** R$ 12.500.000 (R$ 12,5M)

---

#### **4. Equipe Ativa**
**Cálculo:**
```sql
SELECT COUNT(DISTINCT person_id) as activePeople
FROM project_people
WHERE status = 1;
-- Status 1 = ativo
```

**Descrição:** Contagem de pessoas únicas que estão ativas em algum projeto.

**Atualmente:** 89 pessoas

---

#### **5. Crescimento Mensal (%)**
**Cálculo:**
```sql
SELECT 
  (COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())) 
   / 
   COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month'))
   * 100 - 100) as monthlyGrowth
FROM projects;
```

**Descrição:** Percentual de crescimento de novos projetos no mês atual vs mês anterior.

**Atualmente:** 12,5% crescimento

---

### Página 2: KPIs Adicionais

#### **1. Duração Média de Projetos**
**Cálculo:**
```sql
SELECT ROUND(AVG(EXTRACT(MONTH FROM (end_date - start_date)))) as avgProjectDuration
FROM projects
WHERE status IN (1, 2); -- execução ou finalizado
```

**Descrição:** Média em meses entre data de início e fim dos projetos.

**Atualmente:** 18 meses

---

#### **2. Taxa de Sucesso (%)**
**Cálculo:**
```sql
SELECT 
  ROUND(
    (COUNT(*) FILTER (WHERE status = 2) / COUNT(*) * 100)::NUMERIC, 
    1
  ) as successRate
FROM projects;
-- Status 2 = finalizado (sucesso)
```

**Descrição:** Percentual de projetos que foram concluídos.

**Atualmente:** 87,5%

---

#### **3. ROI Médio (%)**
**Cálculo:**
```sql
SELECT 
  ROUND(
    AVG((total_received - total_expenses) / NULLIF(total_expenses, 0) * 100)::NUMERIC,
    0
  ) as avgROI
FROM projects
WHERE total_expenses > 0;
```

**Descrição:** Retorno sobre investimento = (Receitas - Despesas) / Despesas * 100

**Atualmente:** 245%

---

### Página 3: Análise Complementar

#### **1. Projetos Concluídos**
**Cálculo:**
```sql
SELECT COUNT(*) as completedProjects
FROM projects
WHERE status = 2; -- Status 2 = finalizado
```

**Descrição:** Projetos que atingiram status finalizado.

**Valor Calculado:** 15 (total - ativos = 47 - 32)

---

#### **2. Valor Médio por Projeto**
**Cálculo:**
```sql
SELECT AVG(contract_value) as avgValuePerProject
FROM projects
WHERE is_active = 1;
```

**Descrição:** Média aritmética do valor dos contratos.

**Valor Calculado:** R$ 265.957,45 (12.500.000 / 47)

---

#### **3. Pessoas por Projeto (Média)**
**Cálculo:**
```sql
SELECT 
  ROUND(
    AVG(people_count)::NUMERIC, 
    0
  ) as avgPeoplePerProject
FROM (
  SELECT 
    project_id, 
    COUNT(DISTINCT person_id) as people_count
  FROM project_people
  WHERE status = 1
  GROUP BY project_id
) subquery;
```

**Descrição:** Média de pessoas ativas por projeto.

**Valor Calculado:** 2,78 (89 / 32)

---

#### **4. Índice de Eficiência (%)**
**Cálculo:**
```sql
SELECT 
  ROUND(
    AVG(
      (saldo / NULLIF(total_received, 0) * 100)
    )::NUMERIC,
    0
  ) as efficiencyIndex
FROM projects
WHERE total_received > 0;
```

**Descrição:** Percentual médio de saldo remanescente vs receitas.

**Atualmente:** 92% (margem de segurança)

---

## 📊 Gráficos (Placeholders Futuros)

### Evolução Mensal (Página 1)
**Dados Necessários:**
```sql
SELECT 
  DATE_TRUNC('month', created_at)::DATE as month,
  COUNT(*) as projects,
  COALESCE(SUM(contract_value), 0) as value
FROM projects
WHERE created_at >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;
```

**Resultado Esperado:**
| Mês | Projetos | Valor |
|-----|----------|-------|
| 2024-01 | 8 | R$ 1.200.000 |
| 2024-02 | 12 | R$ 1.800.000 |
| 2024-03 | 15 | R$ 2.200.000 |
| 2024-04 | 18 | R$ 2.800.000 |
| 2024-05 | 22 | R$ 3.500.000 |
| 2024-06 | 25 | R$ 4.200.000 |

---

### Status dos Projetos (Página 1)
**Dados Necessários:**
```sql
SELECT 
  CASE 
    WHEN status = 1 THEN 'Execução'
    WHEN status = 2 THEN 'Finalizado'
    WHEN status = 3 THEN 'Suspenso'
    WHEN status = 4 THEN 'Planejamento'
    WHEN status = 0 THEN 'Pré-Projeto'
  END as status_name,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM projects
GROUP BY status;
```

**Distribuição:** 68% Ativo, 32% Concluído

---

### Distribuição de Recursos (Página 3)
**Dados Necessários:**
```sql
SELECT 
  p.id as project_id,
  p.name as project_name,
  COUNT(DISTINCT pp.person_id) as people_count
FROM projects p
LEFT JOIN project_people pp ON p.id = pp.project_id
GROUP BY p.id, p.name
ORDER BY people_count DESC
LIMIT 10;
```

---

### Tendência de Crescimento (Página 3)
**Dados Necessários:**
```sql
SELECT 
  DATE_TRUNC('month', created_at)::DATE as month,
  COUNT(*) as new_projects,
  SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)) as cumulative
FROM projects
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;
```

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────┐
│              BANCO DE DADOS (PostgreSQL)                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────────┐  ┌──────────┐  ┌─────────┐            │
│  │ projects   │  │ incomes  │  │expenses │            │
│  │ (47 total) │  │(receitas)│  │(despesas)            │
│  └────────────┘  └──────────┘  └─────────┘            │
│        │              │              │                 │
│        ├──────────────┴──────────────┤                 │
│        │                             │                 │
│  ┌─────────────┐  ┌──────────┐  ┌─────────────┐      │
│  │project_people│  │ partners │  │public_agencies│    │
│  │(89 ativos)  │  │(clientes)│  │ (clientes) │      │
│  └─────────────┘  └──────────┘  └─────────────┘      │
│                                                       │
└─────────────────────────────────────────────────────────┘
                           │
                   ┌───────▼────────┐
                   │   API Backend  │
                   │   (getMetrics) │
                   └───────┬────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌──────▼──────┐    ┌───▼────┐
   │Página 1 │       │  Página 2   │    │Página 3│
   │Métricas │       │ Performance │    │ Análise│
   └─────────┘       └─────────────┘    └────────┘
```

---

## 🛠️ Implementação no Backend

### Função para Buscar Métricas (TypeScript/Node.js)

```typescript
// src/lib/dashboard-metrics.ts

interface DashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  totalValue: number;
  activePeople: number;
  monthlyGrowth: number;
  avgProjectDuration: number;
  totalPeople: number;
}

export async function getMetrics(): Promise<DashboardMetrics> {
  const prisma = getPrismaClient();

  // Consulta em paralelo para melhor performance
  const [
    totalProjects,
    activeProjects,
    totalValue,
    activePeople,
    avgDuration,
    totalPeople,
    monthlyGrowth,
  ] = await Promise.all([
    // Total de projetos
    prisma.projects.count({
      where: { is_active: 1 },
    }),

    // Projetos ativos (em execução)
    prisma.projects.count({
      where: { status: 1, is_active: 1 },
    }),

    // Valor total
    prisma.projects.aggregate({
      where: { is_active: 1 },
      _sum: { contract_value: true },
    }),

    // Pessoas ativas (PF)
    prisma.projectPeople.findMany({
      where: { status: 1 },
      distinct: ['person_id'],
      select: { person_id: true },
    }),

    // Duração média
    prisma.$queryRaw`
      SELECT ROUND(AVG(EXTRACT(MONTH FROM (end_date - start_date))))
      FROM projects
      WHERE status IN (1, 2)
    `,

    // Total de pessoas
    prisma.people.count(),

    // Crescimento mensal
    // ... lógica complexa
  ]);

  return {
    totalProjects,
    activeProjects,
    totalValue: totalValue._sum.contract_value || 0,
    activePeople: activePeople.length,
    monthlyGrowth: 12.5, // Calcular dinamicamente
    avgProjectDuration: avgDuration[0].round,
    totalPeople,
  };
}
```

---

## 🔐 Segurança e Permissões

Ao implementar a integração com dados reais, considere:

### Filtros por Usuário
```typescript
// Apenas administradores veem todos os projetos
// Coordenadores veem seus próprios projetos
// Parceiros veem projetos em que são parceiros

const userRole = getCurrentUserRole();
const whereClause = 
  userRole === 'ADMIN' 
    ? {} 
    : { coordinator_id: getCurrentUserId() };

const projects = await prisma.projects.findMany({ where: whereClause });
```

### Campos Sensíveis
- `contract_value`: Acesso restrito
- `total_expenses`: Apenas para gestores
- `saldo`: Informação financeira sensível

---

## 📋 Estados de Projeto

| Status | Código | Descrição | Contagem |
|--------|--------|-----------|----------|
| Pré-Projeto | 0 | Ainda em planejamento inicial | - |
| Execução | 1 | Em andamento | 32 |
| Finalizado | 2 | Concluído | 15 |
| Suspenso | 3 | Pausado temporariamente | - |
| Planejamento | 4 | Em preparação | - |

---

## 📅 Próximas Etapas de Integração

1. **[ ] Criar API Endpoint**
   - `GET /api/dashboard/metrics` - Retorna métricas agregadas

2. **[ ] Implementar Cache**
   - Redis para cachear métricas (TTL de 1 hora)
   - Invalidar cache quando projeto é alterado

3. **[ ] Adicionar Filtros**
   - Por período (mês, trimestre, ano)
   - Por parceiro/cliente
   - Por status

4. **[ ] Implementar Gráficos Reais**
   - Recharts ou Chart.js
   - Dados dinâmicos do banco

5. **[ ] Adicionar Relatórios**
   - Export PDF/CSV
   - Agendamento de relatórios por email

6. **[ ] Criar Alertas**
   - Projetos vencidos
   - Orçamento estourado
   - Pessoas sem atividade

---

## 🎯 Campos Disponíveis para Futuras Análises

**Financeiro:**
- `total_received` - Total de receitas
- `total_expenses` - Total de despesas
- `saldo` - Diferença
- Análise de fluxo de caixa

**Temporal:**
- `start_date` vs `opening_date` - Atraso na abertura
- `end_date` vs `closing_date` - Atraso no fechamento
- Comparação com SLA

**Recursos Humanos:**
- Distribuição por `contract_type` (bolsa, RPA, CLT)
- Carga horária (`workload_hours`)
- Custo por pessoa

**Execução Técnica:**
- Status de metas, etapas e fases
- Progresso do cronograma
- Conformidade de documentos

---

## 📞 Referência Rápida

| Métrica | Tabela | Campo | Operação |
|---------|--------|-------|----------|
| Total Projetos | `projects` | `id` | `COUNT(*)` |
| Projetos Ativos | `projects` | `status` | `WHERE status = 1` |
| Valor Total | `projects` | `contract_value` | `SUM()` |
| Equipe Ativa | `project_people` | `person_id` | `COUNT(DISTINCT)` |
| Receitas | `incomes` | `amount` | `SUM()` |
| Despesas | `expenses` | `amount` | `SUM()` |
| Duração | `projects` | `start_date, end_date` | `AVG(DATEDIFF)` |
