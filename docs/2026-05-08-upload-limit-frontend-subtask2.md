# Subtask 2 — Frontend Upload Limit Unificado

## Decisão
- Limite único de upload no frontend: `200 MB` (`UPLOAD_MAX_FILE_SIZE_BYTES`).
- Fonte única: `src/lib/upload.ts`.

## O que foi padronizado
- Validação pré-envio de tamanho e tipo de arquivo.
- Mensagens claras para:
  - arquivo acima do limite;
  - tipo inválido.
- Exibição do limite máximo na UI com o mesmo valor em todas as telas-alvo.

## Telas cobertas
- Novo contrato.
- Pré-projeto.
- Arquivos do contrato (novo e substituir arquivo).
- Perfil (avatar).

## Arquivos alterados
- `src/lib/upload.ts`
- `src/app/(dashboard)/contratos/novo-contrato/page.tsx`
- `src/app/(dashboard)/contratos/pre-projetos/_components/NovoPreProjetoModal.tsx`
- `src/app/(dashboard)/contratos/[contratoId]/arquivos/_components/NovoArquivoModal.tsx`
- `src/app/(dashboard)/contratos/[contratoId]/arquivos/_components/EditarArquivoModal.tsx`
- `src/app/(dashboard)/perfil/page.tsx`

## Observações
- O fluxo multipart não foi alterado.
- Estados de loading/submissão existentes foram preservados (botões desabilitados durante envio).
