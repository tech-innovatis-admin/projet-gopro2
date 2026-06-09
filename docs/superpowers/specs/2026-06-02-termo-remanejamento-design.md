# Design: termo de remanejamento com upload opcional e rastreabilidade em arquivos

## Contexto

Hoje o modal de remanejamento em `projet-gopro2/src/app/(dashboard)/contratos/[contratoId]/rubricas/_components/RemanejamentoModal.tsx` permite informar origem, destino, valor, data e motivo, mas não permite anexar o documento que formaliza o remanejamento.

A tela de arquivos em `projet-gopro2/src/app/(dashboard)/contratos/[contratoId]/arquivos/page.tsx` lista documentos por contrato, agrupados por categoria, sem indicar se um arquivo foi usado em um remanejamento específico nem em quais rubricas esse vínculo ocorreu.

O contrato já ajuda parcialmente: `BudgetTransferRequestDTO` em `projet-gopro2/src/lib/api/types.ts` já aceita `documentId?: string`.

## Objetivo

Permitir anexar opcionalmente um termo de remanejamento no momento da criação do remanejamento e tornar esse documento rastreável na área de arquivos do contrato, com indicação explícita de em qual remanejamento/rubricas ele foi usado.

## Decisão

Implementar com:

- upload opcional de um único arquivo no modal de remanejamento;
- categoria própria de documento para esse caso, `TERMO_REMANEJAMENTO`;
- vínculo estruturado entre remanejamento e documento usando `documentId`;
- exibição do documento na tela de arquivos com contexto do remanejamento vinculado.

## Abordagem

### 1. Modal de remanejamento

O modal passa a aceitar, além dos campos atuais:

- arquivo opcional;
- estado de upload/submissão integrado ao submit do remanejamento.

Fluxo:

1. usuário preenche os dados do remanejamento;
2. se anexar arquivo, o frontend envia o documento primeiro;
3. o upload retorna um `documentId`;
4. o frontend envia o remanejamento com `documentId`;
5. o histórico e a tela de arquivos passam a refletir o vínculo criado.

Se o upload falhar, o remanejamento não deve ser criado. O comportamento esperado é falha atômica do fluxo do ponto de vista do usuário.

### 2. Categoria de documento

Adicionar uma categoria dedicada para o termo:

- `TERMO_REMANEJAMENTO`

Motivo:

- evita depender de convenção em texto livre;
- melhora filtro, agrupamento e leitura operacional;
- reduz ambiguidade entre documento financeiro genérico e documento formal de remanejamento.

### 3. Rastreabilidade em arquivos

A tela de arquivos deve continuar listando documentos do contrato, mas os documentos da categoria `TERMO_REMANEJAMENTO` precisam exibir contexto adicional:

- remanejamento associado;
- rubrica/item de origem;
- rubrica/item de destino.

Exemplo de apresentação:

- badge/categoria: `Termo de Remanejamento`
- subtítulo contextual: `Usado no remanejamento: [rubrica origem] → [rubrica destino]`

Não é necessário mover esses arquivos para outra área. Eles continuam pertencendo ao contrato.

### 4. Fonte dos dados

Há duas possibilidades técnicas:

- backend/BFF expor na listagem de arquivos os metadados de vínculo com remanejamento;
- frontend cruzar a lista de documentos com a lista de remanejamentos pelo `documentId`.

A implementação preferencial é:

- usar cruzamento controlado no frontend/BFF se o payload atual de remanejamentos já trouxer `documentId`;
- estender payload backend/BFF apenas se o contrato atual não expuser esse dado.

Isso mantém a mudança pequena e reduz risco de refactor amplo.

## Requisitos funcionais

- usuário com permissão de gestão pode anexar 1 arquivo opcional ao criar remanejamento;
- usuário sem anexo continua criando remanejamento normalmente;
- documento enviado com remanejamento deve ficar vinculado ao contrato;
- documento vinculado deve aparecer na tela de arquivos;
- a tela de arquivos deve indicar em qual remanejamento/rubricas o documento foi usado;
- filtros por categoria devem incluir `TERMO_REMANEJAMENTO`.

## Requisitos não funcionais

- preservar fluxo atual para remanejamentos sem arquivo;
- não introduzir múltiplos uploads nesse modal;
- manter diff pequeno e aderente à arquitetura atual;
- evitar duplicação manual de contexto no nome do arquivo ou no campo motivo.

## Impacto técnico esperado

### Frontend

- `RemanejamentoModal.tsx`: novo campo opcional de upload;
- `rubricas/page.tsx`: orquestração upload + createBudgetTransfer;
- `arquivos/page.tsx`: nova categoria e exibição do contexto do remanejamento;
- possivelmente tipos locais de remanejamento para carregar `documentId`.

### Contratos / API

- confirmar se `BudgetTransferResponseDTO` já retorna `documentId`;
- se não retornar, estender o payload consumido pelo frontend/BFF;
- confirmar se o endpoint de upload aceita categoria arbitrária/novo enum de categoria.

### Documentação

- atualizar documentação local do fluxo financeiro/arquivos se houver mudança de contrato ou categoria operacional.

## Riscos

### Risco 1: backend não retornar `documentId` no remanejamento

Impacto:

- a tela de arquivos não consegue relacionar documento e remanejamento de forma confiável.

Mitigação:

- validar o payload real antes de implementar UI final;
- se necessário, ajustar contrato mínimo no backend/BFF.

### Risco 2: enum de categoria rejeitar `TERMO_REMANEJAMENTO`

Impacto:

- upload falha mesmo com frontend correto.

Mitigação:

- validar enum aceito pelo backend antes da implementação final;
- se necessário, alinhar backend e frontend no mesmo incremento.

### Risco 3: upload bem-sucedido e criação do remanejamento falhar

Impacto:

- documento órfão na pasta do contrato.

Mitigação:

- tentar manter o fluxo sequencial com tratamento explícito de erro;
- se não houver transação ponta a ponta, documentar o risco residual e avaliar limpeza compensatória.

## Fora de escopo

- múltiplos anexos por remanejamento;
- edição retroativa do documento associado ao remanejamento no histórico;
- nova área exclusiva para documentos de remanejamento;
- refactor amplo da gestão documental.

## Critérios de aceite

- criar remanejamento com arquivo opcional funcionando;
- criar remanejamento sem arquivo continua funcionando;
- arquivo anexado aparece em `Arquivos` como `Termo de Remanejamento`;
- o item listado informa origem e destino do remanejamento;
- filtro por categoria permite localizar esses documentos;
- lint do frontend afetado continua passando;
- build do módulo afetado não introduz novos erros.
