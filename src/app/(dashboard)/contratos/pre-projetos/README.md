# Página de Pré-Projetos

## Descrição

Página completa para gerenciamento de pré-projetos e pré-contratos antes da formalização oficial. Permite cadastrar, visualizar e gerenciar propostas com todos os documentos necessários.

## Localização

- **Rota**: `/contratos/pre-projetos`
- **Página principal**: `src/app/(dashboard)/contratos/pre-projetos/page.tsx`
- **Componentes**: `src/app/(dashboard)/contratos/pre-projetos/_components/`

## Funcionalidades Implementadas

### 1. Listagem de Pré-Projetos

- ✅ Tabela completa com todas as informações dos pré-projetos
- ✅ Filtros por tipo (Projeto/Produto) e parceiro
- ✅ Busca por título, parceiro ou localidade
- ✅ Ordenação por qualquer coluna (clicável)
- ✅ Paginação funcional (10 itens por página)
- ✅ Cards de métricas no topo (Total, Projetos, Produtos, Valor Total)
- ✅ Breadcrumb de navegação
- ✅ Empty state quando não há dados ou filtros não retornam resultados

### 2. Cadastro de Pré-Projeto

**Modal acessível por**:
- Botão "Novo Pré-Projeto" no header da página
- Botão "Criar pré-projeto" no empty state
- Item "Pré-Projetos" no menu de navegação (em breve)

**Campos do formulário**:
- ✅ **Título do Projeto** (obrigatório, máx. 200 caracteres)
- ✅ **Tipo de Contrato** (obrigatório, select: Projeto/Produto)
- ✅ **Parceiro** (obrigatório, select com lista predefinida)
- ✅ **Localidade** (obrigatório, texto livre)
- ✅ **Valor Total Estimado** (obrigatório, formatação monetária automática em tempo real)
- ✅ **Documentos** (todos opcionais):
  - Contrato
  - TR (Termo de Referência)
  - Plano de Trabalho
  - Outro Documento

**Validações**:
- ✅ Todos os campos obrigatórios validados
- ✅ Limite de caracteres no título
- ✅ Validação de valor numérico
- ✅ Upload de arquivos com validação:
  - Tamanho máximo: 10MB por arquivo
  - Formatos aceitos: PDF, DOC, DOCX, XLS, XLSX
  - Feedback visual para cada arquivo anexado
  - Botão para remover arquivo

### 3. Formatação Monetária Inteligente

O campo de valor total possui formatação automática em tempo real:
- Usuário digita apenas números (ex: `100000`)
- Sistema formata automaticamente (ex: `1.000,00`)
- Formato brasileiro: separador de milhares (`.`) e decimais (`,`)
- Atualização conforme o usuário digita

### 4. Sistema de Eventos

Integrado ao sistema global de modais da aplicação:
- ✅ Dispara evento `pre-projeto-criado` ao criar novo pré-projeto
- ✅ Página atualiza automaticamente quando evento é recebido
- ✅ Modal global gerenciado pelo `ModalListener`
- ✅ Redirecionamento automático quando criado fora da página

## Estrutura de Dados

```typescript
type PreProjeto = {
  id: string;
  titulo: string;
  tipo: "PROJETO" | "PRODUTO";
  parceiro: string;
  localidade: string;
  valorTotal: number;
  dataCriacao: string;
  documentos?: {
    contrato?: string;
    tr?: string;
    planoTrabalho?: string;
    outro?: string;
  };
};
```

## Layout Visual

### Métricas (Cards)
- Total de Pré-Projetos (verde escuro #004225)
- Projetos (verde médio #0B7A4B)
- Produtos (verde claro #00B894)
- Valor Total Estimado (roxo #6D28D9)

### Tabela
Colunas:
1. Título
2. Tipo (badge com cores distintas)
3. Parceiro
4. Localidade
5. Valor Estimado (formato monetário)
6. Documentos (badge mostrando quantidade)
7. Data de Criação
8. Ações (Ver, Editar, Exportar, Mais opções)

### Filtros
- Barra de busca principal
- Tabs rápidos: Todos / Projetos / Produtos
- Filtros expandíveis (parceiro)
- Indicador visual de filtros ativos
- Botão "Limpar filtros"

## Integração com Navegação

O item "Pré-Projetos" está disponível no submenu de "Contratos" no NavBar:
```
Contratos
├── Todos os Contratos
├── Novo Contrato
├── Pré-Projetos  ← NOVO
└── Relatórios
```

## Próximos Passos

### Para integração com backend:
1. Substituir dados mockados por chamadas à API
2. Implementar upload real de arquivos
3. Adicionar endpoints:
   - `GET /api/pre-projetos` - Listar com filtros e paginação
   - `POST /api/pre-projetos` - Criar novo
   - `PUT /api/pre-projetos/:id` - Editar
   - `DELETE /api/pre-projetos/:id` - Excluir
   - `POST /api/pre-projetos/:id/documentos` - Upload de documentos

### Funcionalidades futuras:
- [ ] Visualização detalhada de pré-projeto
- [ ] Edição de pré-projeto existente
- [ ] Conversão de pré-projeto para contrato formal
- [ ] Download de documentos anexados
- [ ] Histórico de alterações
- [ ] Comentários e notas
- [ ] Exportação para Excel/PDF

## Paleta de Cores

Seguindo o padrão Innovatis:
- **Primary**: `#004225` (verde escuro)
- **Hover**: `#003319` (verde mais escuro)
- **Accent 1**: `#0B7A4B` (verde médio)
- **Accent 2**: `#00B894` (verde claro)
- **Background**: `#F5F6F8` (cinza claro)

## Responsividade

- ✅ Mobile-first design
- ✅ Grid adaptativo (1 coluna em mobile, 2-4 em desktop)
- ✅ Tabela com scroll horizontal em telas pequenas
- ✅ Modal responsivo com max-height
- ✅ Filtros adaptáveis

## Acessibilidade

- ✅ Títulos semânticos (h1, h2, h3)
- ✅ Labels descritivos em formulários
- ✅ Navegação por teclado (Tab, ESC)
- ✅ Estados de foco visíveis
- ✅ Mensagens de erro claras
- ✅ ARIA labels em botões de ícones
