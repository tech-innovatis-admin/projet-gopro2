# Termo de Remanejamento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir upload opcional de termo de remanejamento no modal de remanejamento e exibir esse vínculo na aba de arquivos do contrato.

**Architecture:** O frontend envia opcionalmente o documento antes de criar o remanejamento, reaproveitando `documentId` já suportado pelo contrato de `budget transfer`. A aba de arquivos cruza a lista de documentos do contrato com os remanejamentos e itens/rubricas para exibir o contexto de uso do documento.

**Tech Stack:** Next.js App Router, React, TypeScript, BFF `/api/backend`, upload via `FormData`.

---

### Task 1: Ajustar fluxo de remanejamento

**Files:**
- Modify: `projet-gopro2/src/app/(dashboard)/contratos/[contratoId]/rubricas/_components/RemanejamentoModal.tsx`
- Modify: `projet-gopro2/src/app/(dashboard)/contratos/[contratoId]/rubricas/page.tsx`

- [ ] Adicionar campo opcional de arquivo e estado de submissão no modal.
- [ ] Enviar documento como `TERMO_REMANEJAMENTO` antes do `createBudgetTransfer`.
- [ ] Repassar `documentId` no payload do remanejamento.
- [ ] Tentar limpeza compensatória do documento se o remanejamento falhar.

### Task 2: Exibir contexto na aba de arquivos

**Files:**
- Modify: `projet-gopro2/src/app/(dashboard)/contratos/[contratoId]/arquivos/page.tsx`
- Modify: `projet-gopro2/src/app/(dashboard)/contratos/[contratoId]/arquivos/_components/NovoArquivoModal.tsx`
- Modify: `projet-gopro2/src/app/(dashboard)/contratos/[contratoId]/arquivos/_components/EditarArquivoModal.tsx`

- [ ] Adicionar categoria `TERMO_REMANEJAMENTO`.
- [ ] Carregar remanejamentos, itens e rubricas para montar contexto por `documentId`.
- [ ] Exibir badge e subtítulo com origem/destino do remanejamento.

### Task 3: Atualizar documentação e validar

**Files:**
- Modify: `projet-gopro2/docs/superpowers/specs/2026-06-02-termo-remanejamento-design.md`
- Modify: documentação local adicional se surgir mudança relevante de contrato operacional

- [ ] Atualizar spec se o contrato real exigir ajuste fino.
- [ ] Rodar `npm run lint` no frontend.
- [ ] Rodar `npm run build` no frontend e registrar bloqueios fora do escopo se persistirem.
