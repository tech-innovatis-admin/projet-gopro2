import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildBusinessAuditDiffs,
  buildBusinessAuditDiffsFromSnapshots,
  buildAuditChangesView,
  presentAuditChange,
  sortAuditChangesForPresentation,
} from "./change-presentation";
import {
  buildBudgetCategoryReferenceLabel,
  buildBudgetItemReferenceLabel,
  enhanceBudgetReferenceChanges,
  resolveBudgetReferenceEntityLabel,
} from "./budget-reference-presentation";
import { resolveAuditDescription, resolveAuditOperationKind } from "./log-presentation";
import type { AuditLogResponseDTO } from "../api/types";
import type { AuditChange } from "./presentation";

function createChange(overrides: Partial<AuditChange> = {}): AuditChange {
  return {
    label: "Campo",
    caminho: "campo",
    de: null,
    para: null,
    tipo: "Editado",
    ...overrides,
  };
}

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

const tests: Array<{ name: string; run: () => void | Promise<void> }> = [
  {
    name: "converte labels em inglês para português quando houver mapeamento seguro",
    run: () => {
      const item = presentAuditChange(
        createChange({
          label: "Expense date",
          para: "2026-07-01",
          tipo: "Adicionado",
        }),
        0
      );

      assert.equal(item.label, "Data da despesa");
      assert.equal(item.kindLabel, "Definido");
      assert.deepEqual(item.sections, [
        {
          key: "single",
          title: "Valor definido",
          text: "2026-07-01",
          technicalText: null,
        },
      ]);
    },
  },
  {
    name: "mantém fallback técnico legível quando não houver tradução segura",
    run: () => {
      const item = presentAuditChange(
        createChange({
          label: "legacyControlField",
          para: "ABC",
          tipo: "Adicionado",
        }),
        0
      );

      assert.equal(item.label, "Legacy control field");
      assert.equal(item.sections[0]?.text, "ABC");
    },
  },
  {
    name: "prioriza nome amigável e deixa id como rastreabilidade secundária",
    run: () => {
      const item = presentAuditChange(
        createChange({
          label: "budgetItemId",
          de: 11,
          deLabel: "Serviços técnicos",
          para: 14,
          paraLabel: "Consultoria especializada",
          tipo: "Editado",
        }),
        0
      );

      assert.equal(item.label, "Item de rubrica");
      assert.equal(item.kindLabel, "Alterado");
      assert.equal(item.sections[0]?.title, "Valor anterior");
      assert.equal(item.sections[0]?.text, "Serviços técnicos (ID 11)");
      assert.equal(item.sections[0]?.technicalText, null);
      assert.equal(item.sections[1]?.title, "Novo valor");
      assert.equal(item.sections[1]?.text, "Consultoria especializada (ID 14)");
      assert.equal(item.sections[1]?.technicalText, null);
    },
  },
  {
    name: "quando não houver label amigável exibe apenas id com label de negócio",
    run: () => {
      const item = presentAuditChange(
        createChange({
          label: "personId",
          para: 22,
          tipo: "Adicionado",
        }),
        0
      );

      assert.equal(item.label, "Pessoa vinculada");
      assert.equal(item.sections[0]?.text, "ID 22");
      assert.equal(item.sections[0]?.technicalText, null);
    },
  },
  {
    name: "evento de criação com null para valor não pode ser exibido como alteração",
    run: () => {
      const item = presentAuditChange(
        createChange({
          label: "amount",
          de: null,
          para: 10500,
          tipo: "Editado",
        }),
        0,
        { operationKind: "added" }
      );

      assert.equal(item.kind, "added");
      assert.equal(item.kindLabel, "Definido");
      assert.equal(item.showComparisonArrow, false);
      assert.equal(item.sections.length, 1);
      assert.equal(item.sections[0]?.title, "Valor definido");
      assert.equal(item.sections[0]?.text, "10500");
    },
  },
  {
    name: "evento de atualização usa comparação com valor anterior e novo valor",
    run: () => {
      const item = presentAuditChange(
        createChange({
          label: "status",
          de: "DRAFT",
          deLabel: "Em elaboração",
          para: "APPROVED",
          paraLabel: "Aprovado",
          tipo: "Editado",
        }),
        0,
        { operationKind: "changed" }
      );

      assert.equal(item.label, "Status");
      assert.equal(item.kind, "changed");
      assert.equal(item.kindLabel, "Alterado");
      assert.equal(item.showComparisonArrow, true);
      assert.equal(item.sections[0]?.title, "Valor anterior");
      assert.equal(item.sections[0]?.text, "Em elaboração");
      assert.equal(item.sections[0]?.technicalText, "DRAFT");
      assert.equal(item.sections[1]?.title, "Novo valor");
      assert.equal(item.sections[1]?.text, "Aprovado");
      assert.equal(item.sections[1]?.technicalText, "APPROVED");
    },
  },
  {
    name: "evento de remoção usa último valor e badge coerente",
    run: () => {
      const item = presentAuditChange(
        createChange({
          label: "fileName",
          de: "proposta.pdf",
          para: null,
          tipo: "Editado",
        }),
        0,
        { operationKind: "removed" }
      );

      assert.equal(item.label, "Nome do arquivo");
      assert.equal(item.kind, "removed");
      assert.equal(item.kindLabel, "Removido");
      assert.equal(item.showComparisonArrow, false);
      assert.equal(item.sections.length, 1);
      assert.equal(item.sections[0]?.title, "Último valor");
      assert.equal(item.sections[0]?.text, "proposta.pdf");
    },
  },
  {
    name: "resolve o tipo da operação a partir do evento pai",
    run: () => {
      assert.equal(resolveAuditOperationKind(createLog({ action: "CRIAR" })), "added");
      assert.equal(resolveAuditOperationKind(createLog({ action: "EXCLUIR" })), "removed");
      assert.equal(resolveAuditOperationKind(createLog({ action: "ATUALIZAR" })), "changed");
      assert.equal(resolveAuditOperationKind(createLog({ action: "LOGIN" })), null);
    },
  },
  {
    name: "oculta descrição legada e preserva descrição nova orientada a negócio",
    run: () => {
      const legacy = createLog({
        descricao:
          "Tela Cadastro de despesa. Alteração registrada na aba Financeiro. Campos alterados: Amount, Quantity.",
      });
      const modern = createLog({
        descricao: "Registro criado na aba Financeiro.",
      });

      assert.equal(resolveAuditDescription(legacy), null);
      assert.equal(resolveAuditDescription(modern), "Registro criado na aba Financeiro.");
    },
  },
  {
    name: "prioriza campos de negócio antes de campos técnicos e suporta expansão",
    run: () => {
      const changes = [
        createChange({ label: "requestId", de: "abc", para: "def" }),
        createChange({
          label: "Status do projeto",
          de: "DRAFT",
          deLabel: "Em elaboração",
          para: "APPROVED",
          paraLabel: "Aprovado",
        }),
        createChange({ label: "amount", de: 100, para: 150 }),
        createChange({ label: "legacyControlField", de: "A", para: "B" }),
      ];

      const sortedLabels = sortAuditChangesForPresentation(changes, {
        operationKind: "changed",
      }).map((item) => item.label);
      assert.deepEqual(sortedLabels, [
        "Status do projeto",
        "Valor",
        "Request",
        "Legacy control field",
      ]);

      const collapsed = buildAuditChangesView(changes, {
        limit: 2,
        operationKind: "changed",
      });
      assert.equal(collapsed.visibleItems.length, 2);
      assert.equal(collapsed.hiddenCount, 2);
      assert.equal(collapsed.hasTechnicalDetails, true);
    },
  },
  {
    name: "as três telas de auditoria continuam reutilizando o card compartilhado",
    run: async () => {
      const files = [
        "../../app/(dashboard)/admin/auditoria/page.tsx",
        "../../app/(dashboard)/contratos/[contratoId]/auditoria/page.tsx",
        "../../app/(dashboard)/perfil/page.tsx",
      ] as const;

      await Promise.all(
        files.map(async (relativePath) => {
          const content = await readFile(new URL(relativePath, import.meta.url), "utf8");
          assert.match(content, /AuditLogCard/);
        })
      );
    },
  },
];

tests.splice(7, 0,
  {
    name: "gera diffs enxutos com formatação amigável para negócio",
    run: () => {
      const diffs = buildBusinessAuditDiffs(
        [
          createChange({
            label: "planned_amount",
            de: "5201.42",
            para: "6000",
            tipo: "Editado",
          }),
          createChange({
            label: "expenseDate",
            de: "2026-03-10",
            para: "2026-03-12",
            tipo: "Editado",
          }),
          createChange({
            label: "quantity",
            de: "5",
            para: "5",
            tipo: "Editado",
          }),
          createChange({
            label: "fileName",
            de: "",
            para: "contrato-final.pdf",
            tipo: "Editado",
          }),
        ],
        { operationKind: "changed" }
      );

      assert.deepEqual(
        diffs.map((item) => ({
          label: item.label,
          oldValue: item.oldValue,
          newValue: item.newValue,
        })),
        [
          {
            label: "Valor planejado",
            oldValue: "R$ 5.201,42",
            newValue: "R$ 6.000,00",
          },
          {
            label: "Data da despesa",
            oldValue: "10/03/2026",
            newValue: "12/03/2026",
          },
          {
            label: "Nome do arquivo",
            oldValue: "Não informado",
            newValue: "contrato-final.pdf",
          },
        ]
      );
    },
  },
  {
    name: "não gera acordeão de alterações para eventos de criação",
    run: () => {
      const diffs = buildBusinessAuditDiffs(
        [
          createChange({
            label: "amount",
            de: null,
            para: 1000,
            tipo: "Adicionado",
          }),
        ],
        { operationKind: "added" }
      );

      assert.deepEqual(diffs, []);
    },
  },
  {
    name: "gera diff de atualizacao mesmo quando o delta vier com tipo inconsistente",
    run: () => {
      const diffs = buildBusinessAuditDiffs(
        [
          createChange({
            label: "name",
            de: "AWS",
            para: "AWS Console",
            tipo: "Adicionado",
          }),
        ],
        { operationKind: "changed" }
      );

      assert.deepEqual(
        diffs.map((item) => ({
          label: item.label,
          oldValue: item.oldValue,
          newValue: item.newValue,
        })),
        [
          {
            label: "Name",
            oldValue: "AWS",
            newValue: "AWS Console",
          },
        ]
      );
    },
  },
  {
    name: "gera diff de atualizacao a partir dos snapshots quando nao houver alteracoes enriquecidas",
    run: () => {
      const diffs = buildBusinessAuditDiffsFromSnapshots(
        {
          id: 9,
          code: "RUB-9-279336",
          name: "AWS",
          updatedAt: "2026-03-12T15:30:00Z",
        },
        {
          id: 9,
          code: "RUB-9-279336",
          name: "AWS Console",
          updatedAt: "2026-03-12T15:36:00Z",
        }
      );

      assert.deepEqual(
        diffs.map((item) => ({
          label: item.label,
          oldValue: item.oldValue,
          newValue: item.newValue,
        })),
        [
          {
            label: "Name",
            oldValue: "AWS",
            newValue: "AWS Console",
          },
        ]
      );
    },
  }
);

tests.splice(9, 0,
  {
    name: "enriquece referência de rubrica e item de rubrica com nome amigável e valor total",
    run: () => {
      const changes = enhanceBudgetReferenceChanges(
        [
          createChange({
            label: "budgetCategoryId",
            de: 11,
            para: 12,
          }),
          createChange({
            label: "budgetItemId",
            de: 21,
            para: 22,
          }),
        ],
        {
          categoryLabelsById: {
            11: buildBudgetCategoryReferenceLabel({ id: 11, code: "RUB-01", name: "Pessoal" }),
            12: buildBudgetCategoryReferenceLabel({ id: 12, code: null, name: "Operacional" }),
          },
          itemLabelsById: {
            21: buildBudgetItemReferenceLabel({
              id: 21,
              description: "Bolsa de pesquisa",
              plannedAmount: 5201.42,
            }),
            22: buildBudgetItemReferenceLabel({
              id: 22,
              description: "Consultoria especializada",
              plannedAmount: 6000,
            }),
          },
        }
      );

      assert.equal(changes[0]?.deLabel, "RUB-01 - Pessoal");
      assert.equal(changes[0]?.paraLabel, "Operacional");
      assert.equal(changes[1]?.deLabel, "Bolsa de pesquisa • Valor total: R$ 5.201,42");
      assert.equal(changes[1]?.paraLabel, "Consultoria especializada • Valor total: R$ 6.000,00");
    },
  },
  {
    name: "resolve registro afetado amigável para rubrica e item de rubrica",
    run: () => {
      assert.equal(
        resolveBudgetReferenceEntityLabel(
          createLog({ entityType: "contracts:budget-categories", entityId: "12" }),
          {
            categoryLabelsById: {
              12: "RUB-12 - Operacional",
            },
          }
        ),
        "RUB-12 - Operacional"
      );

      assert.equal(
        resolveBudgetReferenceEntityLabel(
          createLog({ entityType: "contracts:budget-items", entityId: "22" }),
          {
            itemLabelsById: {
              22: "Consultoria especializada • Valor total: R$ 6.000,00",
            },
          }
        ),
        "Consultoria especializada • Valor total: R$ 6.000,00"
      );
    },
  }
);

tests.push(
  {
    name: "usa texto mais claro quando um pagamento fica sem v\u00EDnculo",
    run: () => {
      const item = presentAuditChange(
        createChange({
          label: "organizationId",
          de: 81,
          para: null,
          tipo: "Editado",
        }),
        0,
        { operationKind: "changed" }
      );

      assert.equal(item.label, "Empresa vinculada");
      assert.equal(item.sections[0]?.text, "ID 81");
      assert.equal(item.sections[1]?.text, "Sem v\u00EDnculo");
      assert.equal(item.afterText, "Sem v\u00EDnculo");
    },
  },
  {
    name: "usa texto mais claro quando a meta deixa de ter valor financeiro",
    run: () => {
      const diffs = buildBusinessAuditDiffs(
        [
          createChange({
            label: "financialAmount",
            de: "5000",
            para: null,
            tipo: "Editado",
          }),
        ],
        { operationKind: "changed" }
      );

      assert.deepEqual(
        diffs.map((item) => ({
          label: item.label,
          oldValue: item.oldValue,
          newValue: item.newValue,
        })),
        [
          {
            label: "Valor financeiro da meta",
            oldValue: "R$ 5.000,00",
            newValue: "Sem valor financeiro",
          },
        ]
      );
    },
  }
);

let failed = 0;

for (const testCase of tests) {
  try {
    await testCase.run();
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
