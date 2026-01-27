/**
 * Tipos da API GoPro Java
 * 
 * DECISÃO: Tipos simples espelhando exatamente a API Java.
 * Sem transformações, adapters ou normalizações.
 * O frontend confia cegamente no backend.
 * 
 * Estrutura:
 * - common.ts      → IDs, paginação, timestamps
 * - projects.ts    → Projetos
 * - organizations.ts → Organizações (fornecedores, parceiros)
 * - people.ts      → Pessoas (PF)
 * - documents.ts   → Documentos
 * - finance.ts     → Orçamento, desembolso, receitas, despesas, remanejamentos
 * - execution.ts   → Metas, etapas, fases, marcos, tarefas
 * - contracts.ts   → Contratações PF/PJ, trilha de contratos, avaliações
 * - audit.ts       → Auditoria e usuários
 * 
 * @see http://localhost:8080/swagger-ui.html
 */

// Common
export * from './common';

// Entities
export * from './projects';
export * from './organizations';
export * from './people';
export * from './documents';
export * from './finance';
export * from './execution';
export * from './contracts';
export * from './audit';
