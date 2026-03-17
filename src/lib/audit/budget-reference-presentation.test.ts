import assert from "node:assert/strict";
import {
  buildBudgetTransferBusinessSummary,
  buildBudgetItemReferenceLabel,
  buildBudgetItemReferencePresentation,
  resolveBudgetReferenceEntityLabel,
} from "./budget-reference-presentation.ts";
import type { AuditLogResponseDTO } from "../api/types";

function createLog(overrides: Partial<AuditLogResponseDTO> = {}): AuditLogResponseDTO {
  return {
    id: 1,
    auditId: "audit-1",
    action: "ATUALIZAR",
    entityType: "contracts:expense",
    entityId: "10",
    actorUserId: 1,
    actorEmail: "teste@gopro.local",
    beforeJson: null,
    afterJson: null,
    ip: null,
    userAgent: null,
    createdAt: "2026-03-10T12:00:00Z",
    ...overrides,
  };
}

const tests: Array<{ name: string; run: () => void }> = [
  {
    name: "resolve item de rubrica pelo snapshot quando entityId eh o contrato",
    run: () => {
      assert.equal(
        resolveBudgetReferenceEntityLabel(
          createLog({
            entityType: "contracts:budget-items",
            entityId: "9",
            contractId: 9,
            afterJson: JSON.stringify({
              id: 22,
              description: "Consultoria especializada",
              plannedAmount: 6000,
            }),
          }),
          {
            itemLabelsById: {
              22: buildBudgetItemReferenceLabel({
                id: 22,
                description: "Consultoria especializada",
                plannedAmount: 6000,
              }),
            },
          }
        ),
        "Consultoria especializada • Valor total: R$ 6.000,00"
      );
    },
  },
  {
    name: "resolve rubrica pelo snapshot quando entityId eh o contrato",
    run: () => {
      assert.equal(
        resolveBudgetReferenceEntityLabel(
          createLog({
            entityType: "contracts:budget-categories",
            entityId: "9",
            contractId: 9,
            afterJson: JSON.stringify({
              id: 12,
              code: "RUB-12",
              name: "Operacional",
            }),
          }),
          {}
        ),
        "RUB-12 - Operacional"
      );
    },
  },
  {
    name: "resolve remanejamento com origem e destino dos itens",
    run: () => {
      assert.equal(
        resolveBudgetReferenceEntityLabel(
          createLog({
            entityType: "contracts:budget-transfers",
            entityId: "9",
            contractId: 9,
            afterJson: JSON.stringify({
              id: 44,
              fromItem: 21,
              toItem: 22,
            }),
          }),
          {
            itemLabelsById: {
              21: "Bolsa de pesquisa • Valor total: R$ 5.201,42",
              22: "Consultoria especializada • Valor total: R$ 6.000,00",
            },
          }
        ),
        "Origem: Bolsa de pesquisa • Valor total: R$ 5.201,42 | Destino: Consultoria especializada • Valor total: R$ 6.000,00"
      );
    },
  },
  {
    name: "monta resumo de remanejamento com valor inicial, remanejado e final",
    run: () => {
      const summary = buildBudgetTransferBusinessSummary(
        createLog({
          entityType: "contracts:budget-transfers",
          entityId: "9",
          contractId: 9,
          afterJson: JSON.stringify({
            id: 44,
            fromItem: 21,
            toItem: 22,
            amount: 1000,
          }),
        }),
        {
          categoryLabelsById: {
            11: "RUB-11 - Pessoal",
            12: "RUB-12 - Operacional",
          },
          itemPresentationsById: {
            21: buildBudgetItemReferencePresentation(
              {
                id: 21,
                categoryId: 11,
                description: "Bolsa de pesquisa",
                plannedAmount: 5201.42,
              },
              "RUB-11 - Pessoal"
            ),
            22: buildBudgetItemReferencePresentation(
              {
                id: 22,
                categoryId: 12,
                description: "Consultoria especializada",
                plannedAmount: 6000,
              },
              "RUB-12 - Operacional"
            ),
          },
        }
      );

      assert.deepEqual(summary, {
        transferId: 44,
        sourceLabel: "RUB-11 - Pessoal • Bolsa de pesquisa",
        destinationLabel: "RUB-12 - Operacional • Consultoria especializada",
        sourceInitialTotal: "R$ 5.201,42",
        destinationInitialTotal: "R$ 6.000,00",
        transferredAmount: "R$ 1.000,00",
        sourceFinalTotal: "R$ 4.201,42",
        destinationFinalTotal: "R$ 7.000,00",
        isComeback: false,
        comebackOfTransferId: null,
        reason: null,
      });
    },
  },
  {
    name: "identifica comeback no resumo de remanejamento",
    run: () => {
      const summary = buildBudgetTransferBusinessSummary(
        createLog({
          entityType: "contracts:budget-transfers",
          entityId: "9",
          contractId: 9,
          afterJson: JSON.stringify({
            id: 45,
            fromItem: 22,
            toItem: 21,
            amount: 1000,
            reason: "Comeback do remanejamento #44. Motivo original: cadastro incorreto",
          }),
        }),
        {
          categoryLabelsById: {
            11: "RUB-11 - Pessoal",
            12: "RUB-12 - Operacional",
          },
          itemPresentationsById: {
            21: buildBudgetItemReferencePresentation(
              {
                id: 21,
                categoryId: 11,
                description: "Bolsa de pesquisa",
                plannedAmount: 5201.42,
              },
              "RUB-11 - Pessoal"
            ),
            22: buildBudgetItemReferencePresentation(
              {
                id: 22,
                categoryId: 12,
                description: "Consultoria especializada",
                plannedAmount: 6000,
              },
              "RUB-12 - Operacional"
            ),
          },
        }
      );

      assert.equal(summary?.isComeback, true);
      assert.equal(summary?.transferId, 45);
      assert.equal(summary?.comebackOfTransferId, 44);
      assert.equal(
        summary?.reason,
        "Comeback do remanejamento #44. Motivo original: cadastro incorreto"
      );
    },
  },
];

let failed = 0;

for (const testCase of tests) {
  try {
    testCase.run();
    console.log(`ok - ${testCase.name}`);
  } catch (error) {
    failed += 1;
    console.error(`not ok - ${testCase.name}`);
    console.error(error);
  }
}

if (failed > 0) {
  process.exitCode = 1;
}
