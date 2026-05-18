# Estrutura do Módulo de Detalhes do Contrato

Este documento descreve a estrutura e organização das páginas dentro do módulo `[contratoId]`, que representa a visualização e gestão detalhada de um contrato específico.

## 📋 Visão Geral

O módulo `[contratoId]` está localizado em `src/app/(dashboard)/contratos/[contratoId]/` e é responsável por exibir e gerenciar todas as informações relacionadas a um contrato específico. O layout principal (`layout.tsx`) fornece uma estrutura consistente com navegação por abas (tabs) e um card principal com informações resumidas do contrato.

## 🗂️ Estrutura de Pastas e Arquivos

### 📄 Arquivos Principais

#### `layout.tsx`
**Localização:** `src/app/(dashboard)/contratos/[contratoId]/layout.tsx`

**Descrição:** Layout principal que envolve todas as páginas do módulo de contrato. Este arquivo é responsável por:

- **Card Principal do Contrato**: Exibe informações resumidas do contrato em um card expansível, incluindo:
  - Código e título do contrato
  - Badges de Tipo (Projeto/Produto) e Status
  - Grid de informações principais (4 colunas):
    - Coluna 1: Cliente, Parceiro
    - Coluna 2: Órgão Financiador, Tipo
    - Coluna 3: Valor Total, Situação Financeira
    - Coluna 4: Data de Início, Data de Término
  - Seção expansível "Informações Complementares":
    - Coluna 1: Coordenador
    - Coluna 2: Localidade
    - Coluna 3: Segmentos
    - Coluna 4: (vazia)
    - Objeto (descrição completa do contrato)
  - Modo de edição inline para todos os campos
  - Menu dropdown com opções "Editar" e "Exportar"

- **Navegação por Tabs**: Sistema de navegação horizontal com 9 abas:
  1. Visão Geral
  2. Contratações
  3. Execução
  4. Rubricas
  5. Metas
  6. Equipe
  7. Incubadas
  8. Desembolso
  9. Arquivos

- **Breadcrumb**: Navegação hierárquica (Home > Contratos > [Código do Contrato])

**Funcionalidades:**
- Edição inline de informações do contrato
- Expansão/contração de seções complementares
- Integração com sistema de modais para edição e exportação

#### `page.tsx`
**Localização:** `src/app/(dashboard)/contratos/[contratoId]/page.tsx`

**Descrição:** Página principal "Visão Geral" do contrato. Exibe um dashboard com:

- **Resumo Financeiro**: Cards com valores contratado, empenhado, liquidado e pago
- **Cronograma**: Barra de progresso, percentual de execução, dias restantes e status
- **Riscos**: Lista de riscos identificados com severidade (Alta, Média, Baixa)
- **Movimentações Recentes**: Timeline de atividades recentes do contrato
- **Gráficos**: Visualizações de execução financeira e cronograma

**Ordem de Exibição para o Usuário:** 1ª aba (primeira opção na navegação)

#### `types.ts`
**Localização:** `src/app/(dashboard)/contratos/[contratoId]/types.ts`

**Descrição:** Define os tipos TypeScript e dados mockados compartilhados entre as páginas do módulo:

- **Tipo `Contrato`**: Interface principal que define a estrutura de dados do contrato
- **`mockContrato`**: Dados de exemplo para desenvolvimento e testes

**Campos do Tipo Contrato:**
- Informações básicas: `id`, `codigo`, `titulo`, `tipo`, `status`
- Informações financeiras: `valorTotal`, `valorExecutado`
- Datas: `dataInicio`, `dataFim`
- Relacionamentos: `cliente`, `parceiro`, `coordenador`
- Informações complementares: `orgaoFinanciador`, `segmentos`, `localidade`, `descricao`
- Outros: `unidade`, `situacaoFinanceira`, `govIf`

---

### 📁 Pastas e Páginas

#### `/contratacoes`
**Rota:** `/contratos/[contratoId]/contratacoes`

**Descrição:** Gerencia aditivos contratuais, ordens de serviço (OS) e contratos vinculados ao contrato principal.

**Funcionalidades:**
- Listagem de aditivos contratuais
- Gestão de ordens de serviço
- Visualização de contratos vinculados
- Criação e edição de aditivos e OS

**Ordem de Exibição para o Usuário:** 2ª aba

---

#### `/execucao`
**Rota:** `/contratos/[contratoId]/execucao`

**Descrição:** Acompanhamento da execução do contrato, incluindo cronograma, marcos e entregas.

**Funcionalidades:**
- Visualização de cronograma de execução
- Gestão de marcos e entregas
- Acompanhamento de prazos
- Indicadores de execução física e financeira

**Ordem de Exibição para o Usuário:** 3ª aba

---

#### `/rubricas`
**Rota:** `/contratos/[contratoId]/rubricas`

**Descrição:** Gestão do orçamento e execução financeira organizada por rubricas orçamentárias.

**Funcionalidades:**
- Listagem de rubricas orçamentárias (MC, PP, OST-PJ, OST-PF, VD, EQUIP, OP)
- Criação de novas rubricas personalizadas
- Adição de itens a cada rubrica com:
  - Descrição
  - CNPJ de Destinação
  - Quantidade
  - Meses
  - Valor Unitário
  - Valor Total (calculado automaticamente)
- Edição inline de itens
- Remoção de rubricas e itens
- Cálculo automático de totais por rubrica e total geral
- Resumo por rubrica no final da página
- Vínculo opcional do item de rubrica com pessoa ou empresa já vinculada ao projeto
- Cadastro de nova pessoa e nova empresa diretamente no fluxo de criação do item de rubrica
- Reaproveitamento dos modais oficiais de cadastro usados em `/contratos/[contratoId]/equipe-tecnica` e `/contratos/[contratoId]/empresas`
- Preenchimento automático do beneficiário do item após cadastrar ou vincular pessoa/empresa ao projeto
- Modal de empresa em rubricas e empresas expõe seleção de status contratual (`EM_CADASTRO`, `EM_CONTRATACAO`, `CONTRATADA`, `EM_EXECUCAO`, `CONCLUIDA`, `CANCELADA`)
- No fluxo de rubricas, se o status não for informado, o fallback é `CONTRATADA` para permitir lançamento financeiro imediato do item
- Ao criar novo item de rubrica com beneficiário empresa no mesmo contrato, o vínculo da empresa no projeto acumula `totalValue` com o valor total do item
- Ao criar novo item de rubrica com beneficiário pessoa no mesmo contrato, o vínculo da pessoa no projeto acumula `baseAmount` com o valor total do item
- O sistema bloqueia o desvinculamento de empresa ou pessoa do contrato quando existir item de rubrica ativo vinculado ao respectivo vínculo no projeto

**Componentes:**
- `_components/CompanyFormModal.tsx`: modal compartilhado de cadastro/edição de empresa do projeto
- `_components/MemberFormModal.tsx`: modal compartilhado de cadastro/edição de pessoa do projeto

**Ordem de Exibição para o Usuário:** 4ª aba

---

#### `/meta-etapa-fase`
**Rota:** `/contratos/[contratoId]/meta-etapa-fase`

**Descrição:** Estrutura hierárquica de metas, etapas e fases do contrato.

**Funcionalidades:**
- Visualização em árvore de metas > etapas > fases
- Criação e edição de metas, etapas e fases
- Edição inline de datas de início e término
- Acompanhamento de progresso por nível hierárquico
- Indicadores de status e percentual de conclusão

**Ordem de Exibição para o Usuário:** 5ª aba

---

#### `/equipe-tecnica`
**Rota:** `/contratos/[contratoId]/equipe-tecnica`

**Descrição:** Gestão dos membros da equipe técnica do contrato.

**Funcionalidades:**
- Listagem de membros da equipe
- Cadastro de novos membros com:
  - Nome
  - Função/Papel
  - Email
  - Telefone
  - Outras informações relevantes
- Edição e remoção de membros
- Visualização de papéis e responsabilidades
- O formulário de cadastro/edição de pessoa fica centralizado em `_components/MemberFormModal.tsx` e também é usado pelo fluxo de rubricas

**Ordem de Exibição para o Usuário:** 6ª aba

---

#### `/incubadas`
**Rota:** `/contratos/[contratoId]/incubadas`

**Descrição:** Gestão de empresas incubadas vinculadas ao contrato.

**Funcionalidades:**
- Listagem de empresas incubadas
- Cadastro de novas empresas com:
  - Razão Social
  - CNPJ
  - Segmento de atuação
  - Status
  - Informações de contato
- Edição e remoção de empresas
- Acompanhamento de relacionamento com empresas incubadas

**Ordem de Exibição para o Usuário:** 7ª aba

---

#### `/desembolso`
**Rota:** `/contratos/[contratoId]/desembolso`

**Descrição:** Cronograma de pagamentos e desembolsos do contrato.

**Funcionalidades:**
- Visualização de cronograma de desembolsos
- Gestão de parcelas e pagamentos
- Acompanhamento de status de pagamento
- Histórico de desembolsos realizados
- Previsão de desembolsos futuros
- Para pagamentos vinculados a empresa de rubrica, o payload financeiro usa `projectCompanyId` (vínculo da empresa no projeto); `organizationId` permanece apenas legado/compatibilidade

**Ordem de Exibição para o Usuário:** 8ª aba

---

#### `/arquivos`
**Rota:** `/contratos/[contratoId]/arquivos`

**Descrição:** Gestão de documentos e arquivos anexados ao contrato.

**Funcionalidades:**
- Listagem de arquivos com informações:
  - Nome do arquivo
  - Tipo de documento (Contrato, Plano de Trabalho, Termo de Referência, Ata de Reunião, Relatórios, etc.)
  - Tamanho
  - Data de upload
  - Usuário que fez upload
  - Descrição
- Upload de novos arquivos via modal (máx. 100MB)
- Edição de informações de arquivos existentes (tipo, descrição, substituição do arquivo)
- Visualização e download de arquivos
- Remoção de arquivos
- Filtro por tipo de documento
- Formatos aceitos: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG

**Componentes:**
- `_components/NovoArquivoModal.tsx`: Modal para cadastro de novos arquivos
- `_components/EditarArquivoModal.tsx`: Modal para edição de arquivos existentes

**Ordem de Exibição para o Usuário:** 9ª aba (última)

---

#### `/editar`
**Rota:** `/contratos/[contratoId]/editar`

**Descrição:** Página de edição centralizada do contrato com navegação por sidebar vertical. Esta página **NÃO** utiliza o `layout.tsx` principal, possuindo seu próprio layout.

**Funcionalidades:**
- Edição completa de todas as informações do contrato
- Navegação por sidebar vertical com abas:
  - Informações do Contrato
  - Metas, Etapas e Fases
  - Equipe Técnica
  - Incubadas
  - Rubricas
  - Desembolso
  - Arquivos

**Componentes:**
- `_components/InformacoesContratoTab.tsx`: Aba de informações básicas
- `_components/MetaEtapaFaseTab.tsx`: Aba de metas, etapas e fases
- `_components/EquipeTecnicaTab.tsx`: Aba de equipe técnica
- `_components/IncubadasTab.tsx`: Aba de empresas incubadas
- `_components/RubricasTab.tsx`: Aba de rubricas
- `_components/DesembolsoTab.tsx`: Aba de desembolso
- `_components/ArquivosTab.tsx`: Aba de arquivos
- `_components/index.ts`: Exportações centralizadas

**Nota:** Esta página oferece uma experiência de edição mais focada, separada da visualização principal.

---

## 🔄 Fluxo de Navegação do Usuário

### Ordem das Abas (Navegação Horizontal)

1. **Visão Geral** (`/contratos/[contratoId]`)
   - Dashboard com resumo financeiro, cronograma, riscos e movimentações

2. **Contratações** (`/contratos/[contratoId]/contratacoes`)
   - Aditivos, OS e contratos vinculados

3. **Execução** (`/contratos/[contratoId]/execucao`)
   - Cronograma, marcos e entregas

4. **Rubricas** (`/contratos/[contratoId]/rubricas`)
   - Orçamento e execução financeira por rubricas

5. **Metas** (`/contratos/[contratoId]/meta-etapa-fase`)
   - Estrutura hierárquica de metas, etapas e fases

6. **Equipe** (`/contratos/[contratoId]/equipe-tecnica`)
   - Membros e papéis da equipe técnica

7. **Incubadas** (`/contratos/[contratoId]/incubadas`)
   - Empresas incubadas vinculadas

8. **Desembolso** (`/contratos/[contratoId]/desembolso`)
   - Cronograma de pagamentos

9. **Arquivos** (`/contratos/[contratoId]/arquivos`)
   - Documentos e arquivos anexados

### Card Principal (Sempre Visível)

O card principal do contrato no `layout.tsx` permanece visível em todas as abas, permitindo acesso rápido às informações principais e edição inline sem precisar navegar para outra página.

---

## 🎨 Padrões de Design

### Cores Principais
- **Verde Institucional**: `#004225` (cor primária)
- **Verde Escuro (Hover)**: `#003319`
- **Verde Claro (Background)**: `#00563A`

### Componentes Reutilizáveis
- Badges de Status e Tipo
- Cards de informação
- Modais padronizados
- Formulários com validação
- Tabelas responsivas

### Ícones
- Utilização consistente de Lucide React
- Ícones semânticos por tipo de informação

---

## 📝 Notas Importantes

1. **Dados Mockados**: Atualmente, todas as páginas utilizam dados mockados. A integração com API real deve ser implementada substituindo os mocks por chamadas `fetch`.

2. **Edição Inline**: O card principal permite edição inline de informações básicas. Para edição completa, existe a página `/editar` dedicada.

3. **Modais**: O sistema utiliza modais para ações de criação e edição, mantendo o usuário no contexto da página atual.

4. **Responsividade**: Todas as páginas são responsivas e adaptam-se a diferentes tamanhos de tela.

5. **Acessibilidade**: Componentes seguem padrões de acessibilidade com labels apropriados e navegação por teclado.

---

## 🔗 Relacionamentos

- **Contrato Principal**: Todas as páginas estão vinculadas a um `contratoId` específico
- **Tipos Compartilhados**: O arquivo `types.ts` fornece tipos compartilhados entre páginas
- **Layout Compartilhado**: O `layout.tsx` fornece estrutura e navegação comum a todas as páginas (exceto `/editar`)

---

## 📚 Referências

- [Next.js App Router](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide React Icons](https://lucide.dev)

