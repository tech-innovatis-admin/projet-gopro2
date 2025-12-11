# 📊 Estrutura de Base de Dados - GoPro 2.0

Este documento mapeia todas as variáveis e estruturas de dados fictícias encontradas no projeto para criar a estrutura real de banco de dados.

---

## 🗄️ Entidades Principais

### 1. **Contratos** (`contratos`)

**Onde é usado:**
- `/contratos` - Listagem principal
- `/contratos/[id]` - Detalhes do contrato
- `/contratos/[id]/informacoes` - Informações básicas
- `/contratos/[id]/editar` - Edição completa
- `/home` - Cards de estatísticas

**Colunas sugeridas:**

```sql
CREATE TABLE contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nome VARCHAR(200) NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('PROJETO', 'PRODUTO')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('EM_ANDAMENTO', 'CONCLUIDO', 'SUSPENSO', 'DRAFT', 'CANCELADO', 'EM_NEGOCIACAO')),
  cliente VARCHAR(200),
  parceiro_id UUID REFERENCES parceiros(id),
  coordenador_id UUID REFERENCES usuarios(id),
  categoria VARCHAR(100),
  orgao_financiador VARCHAR(200),
  segmentos TEXT[], -- Array de segmentos
  localidade VARCHAR(200),
  uf VARCHAR(2),
  valor_total DECIMAL(15,2) DEFAULT 0,
  valor_executado DECIMAL(15,2) DEFAULT 0,
  valor_contratado DECIMAL(15,2) DEFAULT 0,
  valor_empenhado DECIMAL(15,2) DEFAULT 0,
  valor_liquidado DECIMAL(15,2) DEFAULT 0,
  valor_pago DECIMAL(15,2) DEFAULT 0,
  data_inicio DATE,
  data_termino DATE,
  descricao TEXT,
  unidade VARCHAR(100), -- IFES-SP, etc
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 2. **Pré-Projetos** (`pre_projetos`)

**Onde é usado:**
- `/contratos/pre-projetos` - Listagem de pré-projetos
- Modal de cadastro de pré-projeto

**Colunas sugeridas:**

```sql
CREATE TABLE pre_projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(200) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('PROJETO', 'PRODUTO')),
  parceiro_id UUID REFERENCES parceiros(id),
  localidade VARCHAR(200),
  valor_total DECIMAL(15,2) DEFAULT 0,
  data_criacao DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 3. **Parceiros** (`parceiros`)

**Onde é usado:**
- `/parceiros` - Listagem geral
- `/parceiros/fundacoes` - Fundações parceiras
- `/parceiros/ifes` - IFES parceiras
- Filtros em contratos e pré-projetos

**Colunas sugeridas:**

```sql
CREATE TABLE parceiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(200) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('FUNDACAO', 'IFES', 'ORGAO_PUBLICO', 'EMPRESA', 'OUTRO')),
  cnpj VARCHAR(18) UNIQUE,
  razao_social VARCHAR(200),
  nome_fantasia VARCHAR(200),
  endereco VARCHAR(300),
  cidade VARCHAR(100),
  uf VARCHAR(2),
  cep VARCHAR(10),
  telefone VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 4. **Contratações** (`contratacoes`)

**Onde é usado:**
- `/contratos/[id]/contratacoes` - Gestão de aditivos, OS, termos e subcontratos

**Colunas sugeridas:**

```sql
CREATE TABLE contratacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  codigo VARCHAR(50) NOT NULL,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('ADITIVO', 'ORDEM_SERVICO', 'TERMO_REFERENCIA', 'SUBCONTRATO')),
  descricao VARCHAR(500),
  objeto TEXT,
  valor DECIMAL(15,2) NOT NULL DEFAULT 0,
  data_inicio DATE,
  data_fim DATE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('ATIVA', 'ENCERRADA', 'PLANEJADA', 'CANCELADA')),
  fornecedor VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 5. **Marcos** (`marcos`)

**Onde é usado:**
- `/contratos/[id]/execucao` - Cronograma e marcos de entrega

**Colunas sugeridas:**

```sql
CREATE TABLE marcos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  responsavel_id UUID REFERENCES usuarios(id),
  fase VARCHAR(100),
  data_planejada DATE NOT NULL,
  data_realizada DATE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('PLANEJADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'ATRASADO', 'CANCELADO')),
  percentual INTEGER DEFAULT 0 CHECK (percentual >= 0 AND percentual <= 100),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 6. **Riscos** (`riscos`)

**Onde é usado:**
- `/contratos/[id]/execucao` - Gestão de riscos do contrato
- `/contratos/[id]` - Card de riscos na visão geral

**Colunas sugeridas:**

```sql
CREATE TABLE riscos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  severidade VARCHAR(10) NOT NULL CHECK (severidade IN ('ALTA', 'MEDIA', 'BAIXA')),
  responsavel_id UUID REFERENCES usuarios(id),
  prazo_mitigacao DATE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('ABERTO', 'EM_TRATAMENTO', 'RESOLVIDO')),
  plano_mitigacao TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 7. **Rubricas** (`rubricas`)

**Onde é usado:**
- `/contratos/[id]/rubricas` - Orçamento detalhado
- `/contratos/[id]/editar` - Tab de rubricas

**Colunas sugeridas:**

```sql
CREATE TABLE rubricas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  codigo VARCHAR(20) NOT NULL, -- Ex: MC, PP, OST-PJ
  nome VARCHAR(200) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE itens_rubrica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubrica_id UUID REFERENCES rubricas(id) ON DELETE CASCADE,
  descricao VARCHAR(500) NOT NULL,
  cnpj_destinacao VARCHAR(18),
  quantidade INTEGER DEFAULT 1,
  meses INTEGER DEFAULT 1,
  valor_unitario DECIMAL(15,2) NOT NULL,
  valor_total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 8. **Arquivos** (`arquivos`)

**Onde é usado:**
- `/contratos/[id]/arquivos` - Documentos do contrato
- `/contratos/[id]/editar` - Tab de arquivos
- `/contratos/pre-projetos` - Upload de documentos

**Colunas sugeridas:**

```sql
CREATE TABLE arquivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  pre_projeto_id UUID REFERENCES pre_projetos(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  nome_original VARCHAR(255) NOT NULL,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('CONTRATO_ASSINADO', 'PLANO_TRABALHO', 'TERMO_REFERENCIA', 'ATA_REUNIAO', 'RELATORIO_TECNICO', 'RELATORIO_FINANCEIRO', 'COMPROVANTE_DESPESA', 'OUTROS')),
  formato VARCHAR(10) NOT NULL, -- pdf, docx, xlsx, etc
  tamanho BIGINT NOT NULL, -- em bytes
  url VARCHAR(500) NOT NULL, -- URL do arquivo no storage
  descricao TEXT,
  upload_por_id UUID REFERENCES usuarios(id),
  data_upload DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 9. **Desembolsos** (`desembolsos`)

**Onde é usado:**
- `/contratos/[id]/desembolso` - Cronograma de pagamentos
- `/contratos/[id]/editar` - Tab de desembolso

**Colunas sugeridas:**

```sql
CREATE TABLE desembolsos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  descricao VARCHAR(500) NOT NULL,
  rubrica_vinculada_id UUID REFERENCES rubricas(id),
  meta_vinculada_id UUID, -- Referência futura para metas
  data_prevista DATE NOT NULL,
  data_efetiva DATE,
  valor_previsto DECIMAL(15,2) NOT NULL,
  valor_liberado DECIMAL(15,2),
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDENTE', 'LIBERADO', 'ATRASADO', 'CANCELADO')),
  observacao TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 10. **Equipe Técnica** (`equipe_tecnica`)

**Onde é usado:**
- `/contratos/[id]/equipe-tecnica` - Membros da equipe
- `/contratos/[id]/editar` - Tab de equipe técnica

**Colunas sugeridas:**

```sql
CREATE TABLE equipe_tecnica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id),
  papel VARCHAR(30) NOT NULL CHECK (papel IN ('COORDENADOR', 'VICE_COORDENADOR', 'SECRETARIO', 'PESQUISADOR', 'BOLSISTA', 'TECNICO', 'OUTRO')),
  papel_custom VARCHAR(100), -- Se papel = OUTRO
  carga_horaria INTEGER DEFAULT 0, -- horas
  vinculo VARCHAR(200), -- Ex: Professor Associado, Doutorando
  endereco VARCHAR(300),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(contrato_id, usuario_id)
);
```

---

### 11. **Incubadas** (`incubadas`)

**Onde é usado:**
- `/contratos/[id]/incubadas` - Empresas vinculadas
- `/contratos/[id]/editar` - Tab de incubadas

**Colunas sugeridas:**

```sql
CREATE TABLE incubadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  razao_social VARCHAR(200) NOT NULL,
  nome_fantasia VARCHAR(200),
  cnpj VARCHAR(18) NOT NULL,
  tipo_servico VARCHAR(200),
  contato VARCHAR(200),
  email VARCHAR(100),
  telefone VARCHAR(20),
  endereco VARCHAR(300),
  cidade VARCHAR(100),
  uf VARCHAR(2),
  valor_contrato DECIMAL(15,2),
  data_inicio DATE,
  data_fim DATE,
  observacao TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 12. **Metas, Etapas e Fases** (`metas`, `etapas`, `fases`)

**Onde é usado:**
- `/contratos/[id]/meta-etapa-fase` - Estrutura hierárquica
- `/contratos/[id]/editar` - Tab de metas

**Colunas sugeridas:**

```sql
CREATE TABLE metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  data_inicio DATE,
  data_fim DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(contrato_id, numero)
);

CREATE TABLE etapas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id UUID REFERENCES metas(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  data_inicio DATE,
  data_fim DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(meta_id, numero)
);

CREATE TABLE fases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etapa_id UUID REFERENCES etapas(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  data_inicio DATE,
  data_fim DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(etapa_id, numero)
);
```

---

### 13. **Movimentações** (`movimentacoes`)

**Onde é usado:**
- `/contratos/[id]` - Timeline de movimentações na visão geral

**Colunas sugeridas:**

```sql
CREATE TABLE movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('CONTRATACAO', 'FINANCEIRO', 'STATUS', 'DOCUMENTO', 'MARCO', 'RISCO')),
  descricao TEXT NOT NULL,
  usuario_id UUID REFERENCES usuarios(id),
  dados_extras JSONB, -- Para armazenar informações adicionais específicas do tipo
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 14. **Usuários** (`usuarios`)

**Onde é usado:**
- Sistema de autenticação
- Coordenadores de contratos
- Responsáveis por marcos e riscos
- Upload de arquivos

**Colunas sugeridas:**

```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(200) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  cpf VARCHAR(11) UNIQUE,
  telefone VARCHAR(20),
  avatar_url VARCHAR(500),
  role VARCHAR(20) DEFAULT 'USUARIO' CHECK (role IN ('ADMIN', 'COORDENADOR', 'USUARIO')),
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔗 Relacionamentos Principais

```
contratos
├──→ parceiros (parceiro_id)
├──→ usuarios (coordenador_id)
├──→ contratacoes (1:N)
├──→ marcos (1:N)
├──→ riscos (1:N)
├──→ rubricas (1:N)
│   └──→ itens_rubrica (1:N)
├──→ arquivos (1:N)
├──→ desembolsos (1:N)
├──→ equipe_tecnica (1:N)
│   └──→ usuarios (usuario_id)
├──→ incubadas (1:N)
├──→ metas (1:N)
│   └──→ etapas (1:N)
│       └──→ fases (1:N)
└──→ movimentacoes (1:N)

pre_projetos
├──→ parceiros (parceiro_id)
└──→ arquivos (1:N)
```

---

## 📍 Mapeamento de Páginas para Tabelas

| Página | Tabelas Utilizadas |
|--------|-------------------|
| `/home` | `contratos` (agregações) |
| `/contratos` | `contratos`, `parceiros`, `usuarios` |
| `/contratos/pre-projetos` | `pre_projetos`, `parceiros`, `arquivos` |
| `/contratos/[id]` | `contratos`, `movimentacoes`, `riscos` |
| `/contratos/[id]/informacoes` | `contratos`, `parceiros`, `usuarios` |
| `/contratos/[id]/contratacoes` | `contratacoes`, `contratos` |
| `/contratos/[id]/execucao` | `marcos`, `riscos`, `contratos` |
| `/contratos/[id]/rubricas` | `rubricas`, `itens_rubrica`, `contratos` |
| `/contratos/[id]/arquivos` | `arquivos`, `contratos` |
| `/contratos/[id]/desembolso` | `desembolsos`, `rubricas`, `contratos` |
| `/contratos/[id]/equipe-tecnica` | `equipe_tecnica`, `usuarios`, `contratos` |
| `/contratos/[id]/incubadas` | `incubadas`, `contratos` |
| `/contratos/[id]/meta-etapa-fase` | `metas`, `etapas`, `fases`, `contratos` |
| `/contratos/[id]/editar` | Todas as tabelas acima |
| `/parceiros` | `parceiros` |
| `/parceiros/fundacoes` | `parceiros` (filtro tipo = FUNDACAO) |
| `/parceiros/ifes` | `parceiros` (filtro tipo = IFES) |

---

## 🎯 Campos Calculados (Não armazenar, calcular em tempo real)

- **Percentual de execução**: `(valor_executado / valor_total) * 100`
- **Dias restantes**: `data_termino - CURRENT_DATE`
- **Status de prazo**: Calculado baseado em dias restantes
- **Total de contratos**: COUNT de contratos
- **Valor total por status**: SUM agrupado por status
- **Progresso de marcos**: COUNT de marcos concluídos / total

---

## 📝 Observações Importantes

1. **UUIDs**: Todas as chaves primárias são UUIDs para melhor distribuição e segurança
2. **Timestamps**: `created_at` e `updated_at` em todas as tabelas para auditoria
3. **Soft Delete**: Considerar adicionar campo `deleted_at` se necessário
4. **Índices**: Criar índices em:
   - `contratos.parceiro_id`
   - `contratos.coordenador_id`
   - `contratos.status`
   - `contratos.tipo`
   - `arquivos.contrato_id`
   - `marcos.contrato_id`
   - Todas as foreign keys

5. **Validações**: Implementar constraints CHECK para enums
6. **Triggers**: Criar triggers para atualizar `updated_at` automaticamente
7. **Valores Monetários**: Usar DECIMAL(15,2) para precisão financeira

---

## 🔄 Próximos Passos

1. Criar migrations com Prisma ou SQL direto
2. Implementar seeds com dados de exemplo
3. Criar API routes para cada entidade
4. Implementar validações de negócio
5. Adicionar índices para performance
6. Configurar relacionamentos no ORM

