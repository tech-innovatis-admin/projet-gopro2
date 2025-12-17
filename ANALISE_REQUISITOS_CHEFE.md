# 📋 ANÁLISE DE REQUISITOS - Solicitação da Liderança

**Data**: 16 de Dezembro de 2025  
**Projeto**: GoPro 2.0 - Plataforma de Gestão de Contratos  
**Status Atual**: ~70% do Frontend Implementado | Backend Parcial

---

## 📊 SUMÁRIO EXECUTIVO

| Requisito | Status | Progresso | Prioridade |
|-----------|--------|-----------|-----------|
| 1. Cadastro de Projetos | 🟡 PARCIAL | 70% | 🔴 ALTA |
| 2. Cadastro de Rubricas | 🟢 COMPLETO | 100% | 🔴 ALTA |
| 3. Controle de Saldos | 🟢 COMPLETO | 100% | 🔴 ALTA |
| 4. Gestão de PF e PJ | 🟡 PARCIAL | 40% | 🟡 MÉDIA |
| 5. Consulta de Execução | 🔴 NÃO INICIADO | 0% | 🟡 MÉDIA |
| 6. Consulta de PJs | 🟡 PARCIAL | 20% | 🟡 MÉDIA |

**Percentual de Conformidade**: 53% (5 de 9.5 funcionalidades)

---

## 🟢 1. CADASTRO DE PROJETOS

### ✅ O QUE JÁ EXISTE

#### 1.1 Estrutura de Status
**Arquivo**: [`src/app/(dashboard)/contratos/[contratoId]/types.ts`](src/app/(dashboard)/contratos/[contratoId]/types.ts )

```typescript
type ContratoStatus = 
  | "EM_ANDAMENTO"    // ✅ Contrato ativo
  | "CONCLUIDO"       // ✅ Finalizado
  | "SUSPENSO"        // ✅ Pausado
  | "CANCELADO"       // ✅ Cancelado
  | "DRAFT"           // ✅ Em elaboração
  | "EM_NEGOCIACAO"   // ✅ Negociando
```

**Análise**: 
- ✅ Sistema de status existe
- ❌ **FALTA**: Status "PRÉ-PROJETO" não está explicitado como opção de status
- ✅ Existe entidade separada `pre_projetos` que funciona como pré-projeto
- ⚠️ **PROBLEMA**: Pré-projetos são uma tabela separada, não um status de contrato

#### 1.2 Campo Área/Segmento
**Encontrado em**: [`docs/BASE_DADOS.md`](docs/BASE_DADOS.md ) - Schema Prisma

```sql
segmentos TEXT[], -- Array de segmentos
```

**UI Atual**: [Não implementada na interface visual]

**Análise**:
- ✅ Campo existe no banco de dados
- ✅ Campo existe no tipo Contrato
- ❌ **FALTA**: Campo não está visível na UI de cadastro/edição

#### 1.3 Campo Órgão Financiador
**Encontrado em**: 
- Schema: `orgao_financiador VARCHAR(200)`
- UI: [`src/app/(dashboard)/home/page.tsx`](src/app/(dashboard)/home/page.tsx )

**Análise**:
- ✅ Campo existe no banco de dados
- ✅ Campo está implementado na UI
- ✅ Está em uso nas listagens

#### 1.4 Upload de Documentos
**Arquivo**: [`src/app/(dashboard)/contratos/[contratoId]/arquivos/page.tsx`](src/app/(dashboard)/contratos/[contratoId]/arquivos/page.tsx )

**Tipos Suportados**:
```
✅ CONTRATO_ASSINADO
✅ PLANO_TRABALHO
✅ TERMO_REFERENCIA  (TR)
❌ TED                (FALTA)
❌ PROCESSO_ADMINISTRATIVO (FALTA)
✅ RELATORIO_TECNICO
✅ RELATORIO_FINANCEIRO
✅ COMPROVANTE_DESPESA
✅ OUTROS
```

**Análise**:
- ✅ Sistema de upload existe
- ✅ 6 de 8 tipos solicitados estão implementados
- ❌ **FALTA**: Tipo "TED" (Termo de Execução Descentralizada)
- ❌ **FALTA**: Tipo "PROCESSO_ADMINISTRATIVO"
- ✅ Interface de upload com modal existe
- ⚠️ **LIMITAÇÃO**: Upload é apenas UI, backend não persiste os arquivos

### ❌ O QUE FALTA IMPLEMENTAR

#### 🔴 CRÍTICO - Status "Pré-Projeto"

**Problema**: Pré-projetos são entidade separada, não um status de projeto
```
Estrutura Atual:
contratos (tabela)
  └── statuses: [EM_ANDAMENTO, CONCLUIDO, SUSPENSO, ...]

pre_projetos (tabela SEPARADA)
  └── (sem status)
```

**Solução Necessária**:
```typescript
// Opção 1: Adicionar status PRE_PROJETO à tabela contratos
type ContratoStatus = 
  | "PRE_PROJETO"      // 🆕 Novo
  | "EM_NEGOCIACAO"
  | "EM_ANDAMENTO"
  | ...

// Opção 2: Unificar com pre_projetos (refatoração maior)
// Recomendação: Opção 1 (menos invasiva)
```

**Implementação Necessária**:
1. ✏️ Atualizar enum no backend (Prisma schema)
2. 📝 Atualizar tipo TypeScript
3. 🎨 Adicionar cor/badge para "PRÉ-PROJETO"
4. 🔄 Adicionar transição automática PRE_PROJETO → EM_NEGOCIACAO → EM_ANDAMENTO
5. 💾 Migração do banco: atualizar tabela `contratos`

---

## 🟢 2. CADASTRO DE RUBRICAS

### ✅ O QUE JÁ EXISTE

**Arquivo**: [`src/app/(dashboard)/contratos/[contratoId]/rubricas/page.tsx`](src/app/(dashboard)/contratos/[contratoId]/rubricas/page.tsx )  
**Componente Edição**: [`RubricasTab.tsx`](RubricasTab.tsx )

#### 2.1 Estrutura de Rubricas
```typescript
interface Rubrica {
  id: string;
  codigo: string;        // ✅ MC, PP, OST-PJ, VD, EQUIP, OP
  nome: string;          // ✅ Nome descritivo
  itens: ItemRubrica[];  // ✅ Subitens
  expanded: boolean;
}

interface ItemRubrica {
  id: string;
  descricao: string;     // ✅ Descrição
  cnpjDestinacao: string;// ✅ Vinculação a PJ
  quantidade: number;    // ✅ Quantidade
  meses: number;         // ✅ Meses
  valorUnitario: number; // ✅ Valor unitário
  valorTotal: number;    // ✅ Valor total (calculado)
  remanejamentoDebito?: number;  // ✅ Saídas
  remanejamentoCredito?: number; // ✅ Entradas
  valorFinal?: number;   // ✅ Valor final
}
```

#### 2.2 Funcionalidades Implementadas
- ✅ Visualização de rubricas em tabela expansível
- ✅ Subitens com valores unitários e totalizações
- ✅ Cálculo dinâmico de valores finais
- ✅ Interface de edição inline
- ✅ Remanejamento de valores (Débito/Crédito)
- ✅ Limites orçamentários definidos
- ✅ Histórico de remanejamentos

#### 2.3 Dados Mock
```javascript
const rubricas = [
  {
    codigo: "MC",
    nome: "Materiais e Custeio",
    itens: [
      {
        descricao: "Equipamentos de TI",
        cnpjDestinacao: "12.345.678/0001-00",
        quantidade: 5,
        meses: 12,
        valorUnitario: 2500,
        valorTotal: 150000
      }
      // ... mais itens
    ]
  }
  // ... mais rubricas
]
```

### ✅ STATUS: COMPLETO

**Recomendação**: Implementar persistência no backend via Prisma

---

## 🟢 3. CONTROLE DE SALDOS POR RUBRICA

### ✅ O QUE JÁ EXISTE

**Arquivo**: [`src/app/(dashboard)/contratos/[contratoId]/rubricas/page.tsx`](src/app/(dashboard)/contratos/[contratoId]/rubricas/page.tsx )

#### 3.1 Painel de Acompanhamento Financeiro

```typescript
// Dados Visualizados:
Valor Autorizado (valorTotal)      ✅
Valor Executado (remanejamentoDebito) ✅
Valor Comprometido (inferível)     ✅
Saldo Remanescente (calculado)     ✅
```

#### 3.2 Funcionalidades Implementadas
- ✅ Tabela com valores por rubrica e subitem
- ✅ Cálculo automático de totalizações
- ✅ Visualização de saldos por linha
- ✅ Histórico de remanejamentos
- ✅ Interface para decisões de remanejamento
- ✅ Conformidade financeira (verificação de limites)

#### 3.3 Componentes Auxiliares
- ✅ [`RemanejamentoModal.tsx`](src/app/(dashboard)/contratos/[contratoId]/rubricas/_components/RemanejamentoModal.tsx ) - Modal para remanejamentos
- ✅ [`HistoricoRemanejamentos.tsx`](src/app/(dashboard)/contratos/[contratoId]/rubricas/_components/HistoricoRemanejamentos.tsx ) - Histórico de movimentações

### ✅ STATUS: COMPLETO

**Visualização em Tempo Real**: ✅ Implementada com estado React

---

## 🟡 4. CADASTRO E GESTÃO DE PF E PJ

### ⚠️ STATUS: PARCIALMENTE IMPLEMENTADO (40%)

#### 4.1 PESSOAS FÍSICAS (PF)

**Implementação Parcial**: [`src/app/(dashboard)/contratos/[contratoId]/equipe-tecnica/page.tsx`](src/app/(dashboard)/contratos/[contratoId]/equipe-tecnica/page.tsx )

**O QUE JÁ EXISTE**:
- ✅ Cadastro de dados pessoais (nome, email, CPF)
- ✅ Função no projeto (papel: Coordenador, Vice, Pesquisador, Bolsista, Técnico)
- ✅ Vinculação ao projeto
- ✅ Validação de CPF com [`CPFValidator.ts`](src/app/(dashboard)/contratos/[contratoId]/equipe-tecnica/_components/CPFValidator.ts )
- ✅ Validação de telefone com [`PhoneValidator.ts`](src/app/(dashboard)/contratos/[contratoId]/equipe-tecnica/_components/PhoneValidator.ts )
- ✅ Carga horária
- ✅ Vinculação profissional (Professor, Doutorando, etc)
- ✅ Avatar com cores por papel

**O QUE FALTA**:
- ❌ Vinculação explícita a rubrica/tipo de despesa
- ❌ Upload de documentos obrigatórios (Contrato, TR, Comprovantes, Relatórios)
- ❌ Vigência da contratação (data início/fim)
- ❌ Histórico de participação em projetos anteriores
- ❌ Status de contratação (Ativo, Concluído, Pendente)
- ❌ Tipo de contratação (RPA, Bolsa, CLT, PJ, etc)

#### 4.2 PESSOAS JURÍDICAS (PJ)

**Implementação Parcial**: [`src/app/(dashboard)/contratos/[contratoId]/incubadas/page.tsx`](src/app/(dashboard)/contratos/[contratoId]/incubadas/page.tsx )

**O QUE JÁ EXISTE**:
- ✅ Cadastro completo (CNPJ, Razão Social, Nome Fantasia)
- ✅ Tipo de serviço
- ✅ Contato e email
- ✅ Endereço completo (Rua, Cidade, UF)
- ✅ Valor do contrato
- ✅ Datas (início/fim)
- ✅ Observações

**O QUE FALTA**:
- ❌ Associação de despesas à rubrica correspondente
- ❌ Upload de documentos (Contratos, OS, Notas Fiscais, Comprovantes)
- ❌ Histórico de contratações anteriores com valores
- ❌ Status da contratação (Ativo, Concluído, Pendente, Suspenso)
- ❌ Consulta unificada de projetos vinculados
- ❌ Rastreabilidade completa

#### 4.3 Análise do Banco de Dados

**Tabela `equipe_tecnica` (Prisma schema)**:
```sql
CREATE TABLE equipe_tecnica (
  id UUID PRIMARY KEY,
  contrato_id UUID REFERENCES contratos(id),
  usuario_id UUID REFERENCES usuarios(id),
  papel VARCHAR(30),          -- ✅ Coordenador, Pesquisador, etc
  carga_horaria INTEGER,      -- ✅ Horas
  vinculo VARCHAR(200),       -- ✅ Professor Associado
  endereco VARCHAR(300),      -- ✅ Endereço
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**FALTA**: Campos não presentes no schema
- ❌ `rubrica_id` - Vinculação a rubrica
- ❌ `tipo_contratacao` - RPA, Bolsa, CLT, PJ
- ❌ `vigencia_inicio` - Data início
- ❌ `vigencia_fim` - Data fim
- ❌ `status` - Ativo/Concluído/Pendente
- ❌ `documento_url` - URL de documentos

**Tabela `incubadas` (Prisma schema)**:
```sql
CREATE TABLE incubadas (
  id UUID PRIMARY KEY,
  contrato_id UUID REFERENCES contratos(id),
  razao_social VARCHAR(200),  -- ✅
  cnpj VARCHAR(18),           -- ✅
  tipo_servico VARCHAR(200),  -- ✅
  contato VARCHAR(200),       -- ✅
  email VARCHAR(100),         -- ✅
  telefone VARCHAR(20),       -- ✅
  valor_contrato DECIMAL,     -- ✅
  data_inicio DATE,           -- ✅
  data_fim DATE,              -- ✅
  observacao TEXT             -- ✅
);
```

**FALTA**: Campos não presentes no schema
- ❌ `rubrica_id` - Vinculação a rubrica
- ❌ `status` - Ativo/Concluído/Pendente
- ❌ `documento_url` - URL de documentos (múltiplos)
- ❌ `documento_tipo` - Tipo de documento

### ❌ O QUE PRECISA SER IMPLEMENTADO

**Prioridade ALTA**:

1. **Schema - Atualizar tabela `equipe_tecnica`**:
   ```sql
   ALTER TABLE equipe_tecnica ADD COLUMN (
     rubrica_id UUID REFERENCES rubricas(id),
     tipo_contratacao VARCHAR(30) CHECK (tipo_contratacao IN ('RPA', 'BOLSA', 'CLT', 'PJ', 'OUTRO')),
     vigencia_inicio DATE,
     vigencia_fim DATE,
     status VARCHAR(20) CHECK (status IN ('ATIVO', 'CONCLUIDO', 'PENDENTE', 'SUSPENSO')),
     UNIQUE(contrato_id, usuario_id)
   );
   ```

2. **Schema - Criar tabela `documentos_pf`** (para PF):
   ```sql
   CREATE TABLE documentos_pf (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     equipe_tecnica_id UUID REFERENCES equipe_tecnica(id) ON DELETE CASCADE,
     tipo VARCHAR(30) CHECK (tipo IN ('CONTRATO', 'TR', 'COMPROVANTE', 'RELATORIO', 'OUTRO')),
     nome VARCHAR(255),
     url VARCHAR(500),
     data_upload DATE DEFAULT CURRENT_DATE,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. **Schema - Criar tabela `documentos_pj`** (para PJ):
   ```sql
   CREATE TABLE documentos_pj (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     incubada_id UUID REFERENCES incubadas(id) ON DELETE CASCADE,
     tipo VARCHAR(30) CHECK (tipo IN ('CONTRATO', 'ORDEM_SERVICO', 'NOTA_FISCAL', 'COMPROVANTE', 'OUTRO')),
     nome VARCHAR(255),
     url VARCHAR(500),
     data_upload DATE DEFAULT CURRENT_DATE,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

4. **UI - Expandir `equipe-tecnica/page.tsx`**:
   - Adicionar campos: Tipo de Contratação, Vigência (Início/Fim), Status
   - Adicionar seção de upload de documentos
   - Adicionar campo de vinculação a rubrica
   - Adicionar badge de status

5. **UI - Expandir `incubadas/page.tsx`**:
   - Adicionar campo de status
   - Adicionar seção de upload de documentos
   - Adicionar vinculação a rubrica
   - Adicionar histórico de contratações

6. **Componente Novo - `DocumentoUploadModal.tsx`**:
   - Modal compartilhado para upload de documentos
   - Suporte a múltiplos tipos de arquivo
   - Validação de tamanho e tipo

---

## 🔴 5. CONSULTA DA EXECUÇÃO

### ❌ STATUS: NÃO IMPLEMENTADO (0%)

**O QUE FOI SOLICITADO**:
- ❌ Área de consulta avançada
- ❌ Filtro por Projeto
- ❌ Filtro por Tipo de Despesa
- ❌ Filtro por Pessoa Física ou Jurídica
- ❌ Filtro por Período
- ❌ Filtro por Rubrica ou Subitem
- ❌ Visualização unificada de execução
- ❌ Relatórios de acompanhamento

### 🔴 O QUE PRECISA SER IMPLEMENTADO

**Nova Página**: `src/app/(dashboard)/contratos/consulta-execucao/page.tsx`

**Componentes Necessários**:
1. **FiltrosAvancados.tsx**
   - Select: Projeto (multi-select)
   - Select: Tipo de Despesa (Rubrica)
   - Radio: PF ou PJ
   - DateRange: Período
   - Select: Rubrica/Subitem

2. **TabelaExecucao.tsx**
   - Colunas: Projeto, Tipo Despesa, Beneficiário, Valor, Data, Status
   - Paginação
   - Ordenação
   - Exportação CSV/XLSX

3. **ResumoExecucao.tsx**
   - Cards de totalizações (Valor Total, Pago, Pendente)
   - Gráficos de tendência
   - Taxa de execução

**Implementação Necessária**:
```typescript
// src/app/(dashboard)/contratos/consulta-execucao/page.tsx

export default function ConsultaExecucao() {
  const [filtros, setFiltros] = useState({
    projetos: [],
    tipoDespesa: '',
    tipoContratado: 'PF', // PF | PJ
    periodo: { inicio: '', fim: '' },
    rubrica: ''
  });

  // Query ao banco: JOINs entre:
  // - contratos
  // - equipe_tecnica (PF) + incubadas (PJ)
  // - rubricas
  // - documentos_pf/pj
  // - desembolsos

  return (
    <div>
      <FiltrosAvancados onChange={setFiltros} />
      <TabelaExecucao filtros={filtros} />
      <ResumoExecucao filtros={filtros} />
    </div>
  );
}
```

**Esforço Estimado**: 40-50 horas de desenvolvimento

---

## 🟡 6. CONSULTA DE PJs CONTRATADAS

### ⚠️ STATUS: PARCIALMENTE IMPLEMENTADO (20%)

#### 6.1 O QUE JÁ EXISTE

**Página**: [`src/app/(dashboard)/parceiros/page.tsx`](src/app/(dashboard)/parceiros/page.tsx ) [VAZIA]

**Componentes**: Nenhum implementado ainda

**Estrutura em `BASE_DADOS.md`**:
```sql
CREATE TABLE parceiros (
  id UUID PRIMARY KEY,
  nome VARCHAR(200),
  tipo VARCHAR(20),      -- FUNDACAO, IFES, ORGAO_PUBLICO, EMPRESA, OUTRO
  cnpj VARCHAR(18),
  razao_social VARCHAR(200),
  nome_fantasia VARCHAR(200),
  telefone VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(200),
  created_at TIMESTAMP
);
```

#### 6.2 Relacionamento com Contratos

**Problema**: Parceiros é uma entidade separada de "Incubadas"

```
Estrutura Atual:
- parceiros (tabela)     → Clientes/Fundações
- incubadas (tabela)     → Empresas contratadas DENTRO de um projeto
```

**Confusão**: A solicitação pede "Consulta de PJs Contratadas" mas está sob "Parceiros"

**Interpretação**: Provavelmente refere-se a "Incubadas" (empresas vinculadas aos projetos)

#### 6.3 O QUE PRECISA SER IMPLEMENTADO

**Página 1**: `src/app/(dashboard)/pj-contratadas/page.tsx` (Novo)
- Listagem de todas as PJs contratadas
- Busca por nome/CNPJ
- Filtros por projeto, status, período
- Cards mostrando: Projetos vinculados, Valor total contratado, Status

**Página 2**: `src/app/(dashboard)/pj-contratadas/[pjId]/page.tsx` (Novo)
- Detalhes completos da PJ
- Histórico de contratações (todos os projetos)
- Valores pagos por período
- Documentação associada (Contratos, OS, NFe, Comprovantes)
- Estatísticas (Total gasto, Número de atividades)

**Componentes Necessários**:
1. **ListaPJContratadas.tsx** - Tabela com filtros
2. **DetalhePJ.tsx** - Visão detalhada
3. **HistoricoContratacoes.tsx** - Timeline de projetos
4. **GestaoDocumental.tsx** - Upload e gerenciamento de arquivos

**Funcionalidades Necessárias**:
- ✅ Busca por nome da empresa
- ✅ Visualização dos projetos contratados
- ✅ Histórico de valores, OS e atividades
- ✅ Upload e gestão documental
- ✅ Integração com time de Compras/Financeiro

**Esforço Estimado**: 35-40 horas de desenvolvimento

---

## 📊 RESUMO GERAL - O QUE FALTA

### 🔴 CRÍTICO (Bloqueante)

| Item | Esforço | Impacto | Status |
|------|---------|--------|--------|
| 1.1 - Status "Pré-Projeto" | 4h | Alto | Schema + UI |
| 1.2 - Tipos de doc (TED, Proc Admin) | 1h | Médio | UI apenas |
| 4.1 - PF: Documentos + Vigência | 12h | Alto | Schema + UI |
| 4.2 - PJ: Documentos + Status | 12h | Alto | Schema + UI |

**Subtotal**: 29 horas

### 🟡 IMPORTANTE (Funcional)

| Item | Esforço | Impacto | Status |
|------|---------|--------|--------|
| 5 - Consulta de Execução | 50h | Alto | Nova página |
| 6 - Consulta de PJs | 40h | Médio | Nova página |
| 4.3 - Histórico PF/PJ | 15h | Médio | UI + Query |
| 3.1 - Persistência Rubricas | 8h | Alto | Backend |

**Subtotal**: 113 horas

### 🟢 NICE-TO-HAVE (Otimizações)

- Relatórios em PDF/Excel
- Dashboard analítico
- Notificações de vencimentos
- Integrações externas

---

## 🎯 ROADMAP RECOMENDADO

### **FASE 1 - FUNDAÇÃO (Semana 1-2)** [33 horas]
- ✅ Atualizar schema Prisma (tabelas e campos)
- ✅ Criar migrações do banco de dados
- ✅ Implementar status "Pré-Projeto"
- ✅ Expandir equipe-tecnica com documentos e vigência
- ✅ Expandir incubadas com documentos e status

### **FASE 2 - GESTÃO (Semana 3-4)** [40 horas]
- ✅ Criar componente DocumentoUploadModal.tsx
- ✅ Implementar endpoints API para documentos
- ✅ Criar página de consulta de PJs contratadas
- ✅ Adicionar histórico de contratações

### **FASE 3 - INTELIGÊNCIA (Semana 5-6)** [50 horas]
- ✅ Criar página "Consulta de Execução"
- ✅ Implementar filtros avançados
- ✅ Criar relatórios de acompanhamento
- ✅ Testes e otimizações

**Total**: ~123 horas | ~3 semanas com 40h/semana

---

## 💾 ARQUIVOS NECESSÁRIOS

### Backend (Prisma Schema)
```prisma
// Novos campos em equipe_tecnica
rubrica_id UUID? @relation("RubricaEquipeTecnica", fields: [rubrica_id], references: [id])
tipo_contratacao String? // RPA, BOLSA, CLT, PJ, OUTRO
vigencia_inicio DateTime?
vigencia_fim DateTime?
status String? // ATIVO, CONCLUIDO, PENDENTE, SUSPENSO
```

### Novas Tabelas
- `documentos_pf` - Documentos de pessoas físicas
- `documentos_pj` - Documentos de pessoas jurídicas
- `consulta_execucao_view` - View para relatórios (opcional)

### Novos Endpoints API
- `POST /api/documentos/upload` - Upload de arquivos
- `GET /api/pj-contratadas` - Lista de PJs
- `GET /api/pj-contratadas/[pjId]` - Detalhes de PJ
- `GET /api/execucao/consulta` - Consulta de execução com filtros

### Novas Páginas
- `src/app/(dashboard)/pj-contratadas/page.tsx`
- `src/app/(dashboard)/pj-contratadas/[pjId]/page.tsx`
- `src/app/(dashboard)/contratos/consulta-execucao/page.tsx`

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Requisito 1: Cadastro de Projetos
- [ ] Adicionar status "PRE_PROJETO" ao schema
- [ ] Adicionar badge visual para PRE_PROJETO
- [ ] Implementar transição automática de statuses
- [ ] Adicionar tipos de documento TED e Processo Administrativo
- [ ] Atualizar campos Área/Segmento na UI de edição

### Requisito 2: Cadastro de Rubricas
- [ ] ✅ JÁ COMPLETO - Apenas implementar persistência

### Requisito 3: Controle de Saldos
- [ ] ✅ JÁ COMPLETO - Apenas refinar visualizações

### Requisito 4: Gestão de PF e PJ
- [ ] Criar tabelas `documentos_pf` e `documentos_pj`
- [ ] Expandir schema `equipe_tecnica` com campos obrigatórios
- [ ] Expandir schema `incubadas` com campos obrigatórios
- [ ] Criar componente `DocumentoUploadModal.tsx`
- [ ] Implementar endpoints de upload
- [ ] Atualizar UI de equipe-tecnica
- [ ] Atualizar UI de incubadas
- [ ] Adicionar histórico de contratações

### Requisito 5: Consulta de Execução
- [ ] Criar página `consulta-execucao/page.tsx`
- [ ] Criar filtros avançados
- [ ] Implementar queries complexas ao banco
- [ ] Criar visualizações (tabela, gráficos)
- [ ] Adicionar exportação de relatórios

### Requisito 6: Consulta de PJs
- [ ] Criar página `pj-contratadas/page.tsx`
- [ ] Criar página `pj-contratadas/[pjId]/page.tsx`
- [ ] Implementar busca e filtros
- [ ] Adicionar visualização de histórico
- [ ] Integrar com gestão documental

---

## 📌 OBSERVAÇÕES IMPORTANTES

### 1. **Pré-Projetos: Estrutura Confusa**

Atualmente existem 2 formas de representar pré-projetos:
- ✅ Tabela `pre_projetos` (entidade separada)
- ❌ Status "PRE_PROJETO" em `contratos` (não existe)

**Recomendação**: Unificar usando a tabela `pre_projetos` como primeiro estágio, que depois se converte em contrato (status EM_ANDAMENTO).

### 2. **Gestão de Pessoas: Duplicação**

Há 2 tabelas para armazenar contratados:
- `equipe_tecnica` (PF) - Usuários do sistema
- `incubadas` (PJ) - Empresas

**Problema**: Não há integração clara entre elas

**Recomendação**: Criar view ou query JOIN para consulta unificada

### 3. **Documentos: Falta Persistência**

Upload funciona na UI mas não persiste no banco

**Recomendação**: Implementar com AWS S3 ou armazenamento local

### 4. **Performance: Consultas Complexas**

"Consulta de Execução" exigirá múltiplos JOINs

**Recomendação**: Criar índices e considerar materialização de view

---

## 🚀 PRÓXIMOS PASSOS

1. **Reunião de Priorização**: Definir se é crítico implementar tudo ou fazer MVP
2. **Planejamento Sprint**: Agrupar tarefas por semana
3. **Infraestrutura**: Configurar S3 ou storage de arquivos
4. **CI/CD**: Preparar para testes e deploys
5. **Documentação**: Atualizar diagrama de banco de dados

---

**Documento criado em**: 16 de Dezembro de 2025  
**Versão**: 1.0  
**Status**: Análise Completa ✅
