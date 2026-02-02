# Estrutura de Pastas do Projeto GoPro 2.0

> **Última atualização:** 28 de Janeiro de 2026

Este documento apresenta a estrutura completa de pastas do projeto GoPro 2.0.

```
gopro-2/
│
├── .cursor/                              # Configurações do Cursor IDE
├── .git/                                 # Repositório Git
├── .next/                                # Build do Next.js (gerado)
├── node_modules/                         # Dependências (gerado)
│
├── .env                                  # Variáveis de ambiente
├── .gitignore                            # Arquivos ignorados pelo Git
├── components.json                       # Configuração do shadcn/ui
├── eslint.config.mjs                     # Configuração do ESLint
├── next-env.d.ts                         # Tipos do Next.js
├── next.config.ts                        # Configuração do Next.js
├── package.json                          # Dependências do projeto
├── package-lock.json                     # Lock de dependências
├── postcss.config.mjs                    # Configuração do PostCSS
├── prisma.config.ts                      # Configuração do Prisma
├── RubricasTab.tsx                       # Arquivo temporário (raiz)
├── tsconfig.json                         # Configuração do TypeScript
├── tsconfig.tsbuildinfo                  # Cache do TypeScript
│
├── components/                           # Componentes globais (shadcn)
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── DatePicker.tsx
│       ├── dropdown-menu.tsx
│       ├── dropdown.md
│       ├── dropdown.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── MiniFooter.tsx
│       ├── NavBar.tsx
│       ├── resizable-table.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       └── StarRating.tsx
│
├── contexts/                             # Contextos globais (raiz)
│   └── NotificationContext.tsx
│
├── docs/                                 # Documentação do projeto
│   ├── ARQUITETURA_PASTAS.md             # Este arquivo
│   ├── BASE_DADOS.md
│   ├── BASE_NECESSARIA.md
│   ├── README.md
│   │
│   ├── BANCO DE DADOS/                   # Documentação do banco
│   │   ├── Dicionário.md
│   │   ├── Estrutura_Atualizada_Banco_Dados.md
│   │   ├── Explicacao_Banco.md
│   │   ├── GoPro2_Especificacao_Backend (1).md
│   │   └── GoPro2_Especificacao_Backend_Complemento (1).md
│   │
│   └── Recursos/                         # Documentação de recursos
│       ├── ANALISE_FUNIL_CONTRATOS.md
│       ├── ESTRUTURA_CONTRATO_ID.md
│       └── MODULO_FORNECEDORES.md
│
├── EXEMPLO_CSS_LETRAS_BREAK/             # Exemplos CSS (raiz)
│   ├── exemplo1.html
│   ├── exemplo2.css
│   └── exemplo3.js
│
├── hooks/                                # Hooks globais (raiz)
│   └── useResizableColumns.ts
│
├── lib/                                  # Utilitários globais (raiz)
│   └── utils.ts
│
├── prisma/                               # Schema do Prisma
│   └── schema.prisma
│
├── public/                               # Arquivos públicos
│   ├── epitacio.png
│   ├── epitacio_brito_foto_oficial.jpeg
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   ├── window.svg
│   │
│   ├── Logos/                            # Logos do projeto
│   │   ├── logo_innovatis.svg
│   │   ├── logo_innovatis_oficial.svg
│   │   ├── logo_innovatis_preta.svg
│   │   ├── para vitor.svg
│   │   ├── vitor_svg.svg
│   │   │
│   │   └── EXEMPLO_CSS_LETRAS_BREAK/
│   │       ├── exemplo1.html
│   │       ├── exemplo2.css
│   │       └── exemplo3.js
│   │
│   └── Poppins/                          # Fonte Poppins
│       ├── OFL.txt
│       ├── Poppins-Black.ttf
│       ├── Poppins-BlackItalic.ttf
│       ├── Poppins-Bold.ttf
│       ├── Poppins-BoldItalic.ttf
│       ├── Poppins-ExtraBold.ttf
│       ├── Poppins-ExtraBoldItalic.ttf
│       ├── Poppins-ExtraLight.ttf
│       ├── Poppins-ExtraLightItalic.ttf
│       ├── Poppins-Italic.ttf
│       ├── Poppins-Light.ttf
│       ├── Poppins-LightItalic.ttf
│       ├── Poppins-Medium.ttf
│       ├── Poppins-MediumItalic.ttf
│       ├── Poppins-Regular.ttf
│       ├── Poppins-SemiBold.ttf
│       ├── Poppins-SemiBoldItalic.ttf
│       ├── Poppins-Thin.ttf
│       └── Poppins-ThinItalic.ttf
│
└── src/                                  # Código fonte principal
    │
    ├── .env                              # Variáveis de ambiente (src)
    ├── AUTENTICACAO.md                   # Documentação de autenticação
    ├── middleware.ts                     # Middleware do Next.js
    │
    ├── app/                              # App Router do Next.js
    │   │
    │   ├── globals.css                   # Estilos globais
    │   ├── layout.tsx                    # Layout raiz
    │   ├── page.tsx                      # Página inicial (/)
    │   │
    │   ├── (auth)/                       # Grupo de rotas de autenticação
    │   │   ├── layout.tsx
    │   │   └── login/
    │   │       ├── page.tsx
    │   │       └── _components/          # (vazio)
    │   │
    │   ├── (dashboard)/                  # Grupo de rotas do dashboard
    │   │   │
    │   │   ├── contratos/                # Módulo de Contratos
    │   │   │   ├── mockData.ts
    │   │   │   ├── page.tsx
    │   │   │   │
    │   │   │   ├── funil/                # Funil de contratos
    │   │   │   │   ├── layout.tsx
    │   │   │   │   ├── page.tsx
    │   │   │   │   ├── types.ts
    │   │   │   │   │
    │   │   │   │   ├── context/
    │   │   │   │   │   └── PipelineStagesContext.tsx
    │   │   │   │   │
    │   │   │   │   ├── edit/
    │   │   │   │   │   └── page.tsx
    │   │   │   │   │
    │   │   │   │   └── _components/
    │   │   │   │       ├── ColumnHeader.tsx
    │   │   │   │       ├── ContractCard.tsx
    │   │   │   │       ├── index.ts
    │   │   │   │       ├── PipelineBoard.tsx
    │   │   │   │       └── StageConfigColumn.tsx
    │   │   │   │
    │   │   │   ├── novo-contrato/        # Novo contrato
    │   │   │   │   ├── page.tsx
    │   │   │   │   └── _components/
    │   │   │   │       └── SuccessToast.tsx
    │   │   │   │
    │   │   │   ├── pre-projetos/         # Pré-projetos
    │   │   │   │   ├── page.tsx
    │   │   │   │   ├── README.md
    │   │   │   │   └── _components/
    │   │   │   │       ├── index.ts
    │   │   │   │       └── NovoPreProjetoModal.tsx
    │   │   │   │
    │   │   │   ├── [contratoId]/         # Detalhe do contrato
    │   │   │   │   ├── layout.tsx
    │   │   │   │   ├── page.tsx
    │   │   │   │   ├── types.ts
    │   │   │   │   │
    │   │   │   │   ├── arquivos/
    │   │   │   │   │   ├── page.tsx
    │   │   │   │   │   └── _components/
    │   │   │   │   │       ├── EditarArquivoModal.tsx
    │   │   │   │   │       └── NovoArquivoModal.tsx
    │   │   │   │   │
    │   │   │   │   ├── desembolso/
    │   │   │   │   │   ├── page.tsx
    │   │   │   │   │   └── _components/
    │   │   │   │   │       └── MoneyImput.tsx
    │   │   │   │   │
    │   │   │   │   ├── editar/
    │   │   │   │   │   ├── page.tsx
    │   │   │   │   │   └── _components/
    │   │   │   │   │       ├── ArquivosTab.tsx
    │   │   │   │   │       ├── DesembolsoTab.tsx
    │   │   │   │   │       ├── EquipeTecnicaTab.tsx
    │   │   │   │   │       ├── IncubadasTab.tsx
    │   │   │   │   │       ├── index.ts
    │   │   │   │   │       ├── InformacoesContratoTab.tsx
    │   │   │   │   │       ├── MetaEtapaFaseTab.tsx
    │   │   │   │   │       └── RubricasTab.tsx
    │   │   │   │   │
    │   │   │   │   ├── empresas/
    │   │   │   │   │   └── page.tsx
    │   │   │   │   │
    │   │   │   │   ├── equipe-tecnica/
    │   │   │   │   │   ├── data.ts
    │   │   │   │   │   ├── page.tsx
    │   │   │   │   │   └── _components/
    │   │   │   │   │       ├── CPFValidator.ts
    │   │   │   │   │       ├── CPF_VALIDATOR_GUIDE.md
    │   │   │   │   │       ├── PhoneValidator.ts
    │   │   │   │   │       └── PHONE_VALIDATOR_GUIDE.md
    │   │   │   │   │
    │   │   │   │   ├── execucao/
    │   │   │   │   │   └── _components/  # (vazio)
    │   │   │   │   │
    │   │   │   │   ├── meta-etapa-fase/
    │   │   │   │   │   ├── data.ts
    │   │   │   │   │   └── page.tsx
    │   │   │   │   │
    │   │   │   │   ├── pagamentos/
    │   │   │   │   │   └── page.tsx
    │   │   │   │   │
    │   │   │   │   ├── rubricas/
    │   │   │   │   │   ├── page.tsx
    │   │   │   │   │   └── _components/
    │   │   │   │   │       ├── HistoricoRemanejamentos.tsx
    │   │   │   │   │       └── RemanejamentoModal.tsx
    │   │   │   │   │
    │   │   │   │   └── trilha/
    │   │   │   │       ├── page.tsx
    │   │   │   │       └── _components/
    │   │   │   │           ├── DateTimePicker.tsx
    │   │   │   │           ├── FocusPanel.tsx
    │   │   │   │           ├── HistoryPanel.tsx
    │   │   │   │           ├── index.ts
    │   │   │   │           ├── InitiationActivities.tsx
    │   │   │   │           ├── InitiationProgressBar.tsx
    │   │   │   │           ├── InitiationSummary.tsx
    │   │   │   │           ├── InitiationTimeline.tsx
    │   │   │   │           └── UnifiedActivityTimeline.tsx
    │   │   │   │
    │   │   │   └── _components/
    │   │   │       ├── index.ts
    │   │   │       └── NovoContratoModal.tsx
    │   │   │
    │   │   ├── fornecedores/             # Módulo de Fornecedores
    │   │   │   ├── mockData.ts
    │   │   │   ├── page.tsx
    │   │   │   ├── types.ts
    │   │   │   │
    │   │   │   ├── [fornecedorId]/       # Detalhe do fornecedor
    │   │   │   │   ├── layout.tsx
    │   │   │   │   ├── page.tsx
    │   │   │   │   │
    │   │   │   │   ├── contratos/
    │   │   │   │   │   └── page.tsx
    │   │   │   │   │
    │   │   │   │   ├── editar/
    │   │   │   │   │   └── page.tsx
    │   │   │   │   │
    │   │   │   │   └── _components/
    │   │   │   │       ├── FornecedorContractsTable.tsx
    │   │   │   │       ├── FornecedorInfo.tsx
    │   │   │   │       ├── FornecedorSummary.tsx
    │   │   │   │       ├── FornecedorTags.tsx
    │   │   │   │       └── index.ts
    │   │   │   │
    │   │   │   └── _components/
    │   │   │       ├── FornecedoresFilters.tsx
    │   │   │       ├── FornecedoresGrid.tsx
    │   │   │       ├── FornecedoresHeader.tsx
    │   │   │       ├── FornecedoresTable.tsx
    │   │   │       ├── FornecedorRowActions.tsx
    │   │   │       ├── index.ts
    │   │   │       └── NovoFornecedorModal.tsx
    │   │   │
    │   │   ├── home/                     # Página inicial (dashboard)
    │   │   │   ├── page.tsx
    │   │   │   └── _components/
    │   │   │       ├── CategoryPieChart.tsx
    │   │   │       ├── ContractsLineChart.tsx
    │   │   │       ├── ContractsMap.tsx
    │   │   │       ├── index.ts
    │   │   │       ├── MapComponent.tsx
    │   │   │       └── PartnerBarChart.tsx
    │   │   │
    │   │   ├── parceiros/                # Módulo de Parceiros
    │   │   │   ├── page.tsx
    │   │   │   │
    │   │   │   ├── fundacoes/
    │   │   │   │   └── page.tsx
    │   │   │   │
    │   │   │   └── ifes/
    │   │   │       └── page.tsx
    │   │   │
    │   │   ├── perfil/                   # Módulo de Perfil
    │   │   │   ├── page.tsx
    │   │   │   │
    │   │   │   ├── atividades/
    │   │   │   │   ├── data.ts
    │   │   │   │   ├── page.tsx
    │   │   │   │   └── _components/      # (vazio)
    │   │   │   │
    │   │   │   ├── configuracoes/
    │   │   │   │   └── page.tsx
    │   │   │   │
    │   │   │   ├── notificacoes/
    │   │   │   │   ├── data.ts
    │   │   │   │   ├── page.tsx
    │   │   │   │   └── _components/
    │   │   │   │       ├── index.ts
    │   │   │   │       └── NotificationDrawer.tsx
    │   │   │   │
    │   │   │   ├── seguranca/
    │   │   │   │   ├── page.tsx
    │   │   │   │   └── _components/      # (vazio)
    │   │   │   │
    │   │   │   ├── suporte/
    │   │   │   │   ├── page.tsx
    │   │   │   │   └── _components/      # (vazio)
    │   │   │   │
    │   │   │   └── _components/
    │   │   │       ├── index.ts
    │   │   │       ├── ProfileHeader.tsx
    │   │   │       └── utils.ts
    │   │   │
    │   │   └── recursos-humanos/         # Módulo de Recursos Humanos
    │   │       ├── README.md
    │   │       │
    │   │       ├── equipe/               # Equipe interna
    │   │       │   ├── mockData.ts
    │   │       │   ├── page.tsx
    │   │       │   ├── types.ts
    │   │       │   └── _components/
    │   │       │       ├── index.ts
    │   │       │       ├── UserDetails.tsx
    │   │       │       └── UsersTable.tsx
    │   │       │
    │   │       └── pessoas/              # Pessoas em projetos
    │   │           ├── data.ts
    │   │           ├── layout.tsx
    │   │           ├── page.tsx
    │   │           ├── types.ts
    │   │           │
    │   │           ├── [pessoasId]/
    │   │           │   └── page.tsx
    │   │           │
    │   │           └── _components/
    │   │               ├── index.ts
    │   │               ├── PeopleTable.tsx
    │   │               └── PersonDetails.tsx
    │   │
    │   ├── api/                          # API Routes
    │   │   │
    │   │   ├── _shared/                  # Utilitários compartilhados da API
    │   │   │   ├── backend.ts
    │   │   │   ├── errors.ts
    │   │   │   ├── index.ts
    │   │   │   ├── response.ts
    │   │   │   └── types.ts
    │   │   │
    │   │   ├── auth/                     # Autenticação
    │   │   │   ├── login/
    │   │   │   │   └── route.ts
    │   │   │   ├── logout/
    │   │   │   │   └── route.ts
    │   │   │   └── me/
    │   │   │       └── route.ts
    │   │   │
    │   │   ├── backend/                  # Proxy para backend Java
    │   │   │   ├── README.md
    │   │   │   │
    │   │   │   ├── audit-log/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts
    │   │   │   │
    │   │   │   ├── budget-categories/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts
    │   │   │   │
    │   │   │   ├── budget-item/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts
    │   │   │   │
    │   │   │   ├── budget-transfers/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts
    │   │   │   │
    │   │   │   ├── contracts/
    │   │   │   │   ├── trail/
    │   │   │   │   │   └── pipeline/
    │   │   │   │   │       └── route.ts
    │   │   │   │   │
    │   │   │   │   └── [id]/
    │   │   │   │       └── trail/
    │   │   │   │           ├── activities/
    │   │   │   │           │   ├── route.ts
    │   │   │   │           │   └── [activityId]/
    │   │   │   │           │       └── route.ts
    │   │   │   │           │
    │   │   │   │           └── move/
    │   │   │   │               └── route.ts
    │   │   │   │
    │   │   │   ├── disbursement-schedule/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts
    │   │   │   │
    │   │   │   ├── documents/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts
    │   │   │   │
    │   │   │   ├── expenses/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts
    │   │   │   │
    │   │   │   ├── goals/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts
    │   │   │   │
    │   │   │   ├── income/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts
    │   │   │   │
    │   │   │   ├── milestones/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts
    │   │   │   │
    │   │   │   ├── organization-categories/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts
    │   │   │   │
    │   │   │   ├── organization-categories-master/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts
    │   │   │   │
    │   │   │   ├── organization-services/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts
    │   │   │   │
    │   │   │   ├── organization-services-master/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts
    │   │   │   │
    │   │   │   ├── organizations/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts
    │   │   │   │
    │   │   │   ├── peoples/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts
    │   │   │   │
    │   │   │   ├── phases/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts
    │   │   │   │
    │   │   │   ├── project-organization-budget-links/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts
    │   │   │   │
    │   │   │   ├── project-people/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts
    │   │   │   │
    │   │   │   ├── projects/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts
    │   │   │   │
    │   │   │   ├── project_organization/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts
    │   │   │   │
    │   │   │   ├── stages/
    │   │   │   │   ├── route.ts
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts
    │   │   │   │
    │   │   │   └── tasks/
    │   │   │       ├── route.ts
    │   │   │       └── [id]/
    │   │   │           └── route.ts
    │   │   │
    │   │   ├── contracts/                # APIs de contratos
    │   │   │   ├── initiation/
    │   │   │   │   └── stages/           # (vazio)
    │   │   │   │
    │   │   │   └── trail/
    │   │   │       └── stages/
    │   │   │           └── route.ts
    │   │   │
    │   │   └── contratos/                # APIs de contratos (legado)
    │   │       └── [contratoId]/
    │   │           ├── iniciacao/
    │   │           │   ├── history/
    │   │           │   │   └── route.ts
    │   │           │   └── move/
    │   │           │       └── route.ts
    │   │           │
    │   │           ├── pdf/              # (vazio)
    │   │           │
    │   │           └── rubricas/
    │   │               ├── export/       # (vazio)
    │   │               ├── remanejamentos/   # (vazio)
    │   │               ├── remanejamentos-itens/
    │   │               │   └── route.ts
    │   │               └── resumo/       # (vazio)
    │   │
    │   ├── not-found.tsx/                # Página 404
    │   │   └── page.tsx
    │   │
    │   ├── privacidade/                  # Página de privacidade
    │   │   └── page.tsx
    │   │
    │   └── termos/                       # Termos de uso
    │       └── page.tsx
    │
    ├── components/                       # Componentes do src
    │   ├── ModalListener.tsx
    │   └── Providers.tsx
    │
    ├── contexts/                         # Contextos React
    │   └── NotificationContext.tsx
    │
    ├── generated/                        # Código gerado (Prisma)
    │   └── prisma/
    │       ├── client.d.ts
    │       ├── client.js
    │       ├── default.d.ts
    │       ├── default.js
    │       ├── edge.d.ts
    │       ├── edge.js
    │       ├── index-browser.js
    │       ├── index.d.ts
    │       ├── index.js
    │       ├── package.json
    │       ├── query_compiler_bg.js
    │       ├── query_compiler_bg.wasm
    │       ├── query_compiler_bg.wasm-base64.js
    │       ├── schema.prisma
    │       ├── wasm-edge-light-loader.mjs
    │       ├── wasm-worker-loader.mjs
    │       │
    │       └── runtime/
    │           ├── client.d.ts
    │           ├── client.js
    │           ├── index-browser.d.ts
    │           ├── index-browser.js
    │           └── wasm-compiler-edge.js
    │
    ├── hooks/                            # Hooks customizados (vazio)
    │
    ├── lib/                              # Bibliotecas e utilitários
    │   ├── api.ts
    │   ├── auth.ts
    │   ├── jwt.ts
    │   └── prisma.ts
    │
    ├── public/                           # Assets públicos (src)
    │   ├── epitacio.png
    │   ├── epitacio_brito_foto_oficial.jpeg
    │   ├── logo_innovatis.svg
    │   └── logo_innovatis_oficial.svg
    │
    ├── types/                            # Definições de tipos
    │   ├── api_gopro_java.ts
    │   ├── index.ts
    │   │
    │   └── api_gopro_java/               # Tipos da API Java
    │       ├── audit.ts
    │       ├── common.ts
    │       ├── contracts.ts
    │       ├── documents.ts
    │       ├── execution.ts
    │       ├── finance.ts
    │       ├── index.ts
    │       ├── organizations.ts
    │       ├── people.ts
    │       └── projects.ts
    │
    └── utils/                            # Utilitários (vazio)
```

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| `/` | Pasta |
| `(nome)/` | Route Group (Next.js) |
| `[param]/` | Rota dinâmica |
| `_components/` | Componentes locais (convenção) |
| `# (vazio)` | Pasta vazia |

---

## Estatísticas

- **Total de pastas**: ~150+
- **Módulos principais**: Contratos, Fornecedores, Recursos Humanos, Parceiros, Perfil
- **Rotas de API**: ~50+ endpoints
- **Framework**: Next.js 13+ (App Router)
- **Linguagem**: TypeScript
- **ORM**: Prisma
- **Estilização**: Tailwind CSS
