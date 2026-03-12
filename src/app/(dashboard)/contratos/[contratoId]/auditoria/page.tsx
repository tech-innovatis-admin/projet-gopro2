"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AuditLogCard } from "@/src/components/audit/AuditLogCard";
import { BudgetTransferSummary } from "@/src/components/audit/BudgetTransferSummary";
import { getProjectById } from "@/src/lib/api/endpoints";
import { listBudgetCategories } from "@/src/lib/api/endpoints/budget-categories";
import { listBudgetItems } from "@/src/lib/api/endpoints/budget-items";
import { listAuditLogs } from "@/src/lib/api/endpoints/auth";
import { AuditLogResponseDTO, BudgetItemResponseDTO } from "@/src/lib/api/types";
import {
  getErrorMessage,
  parseBeforeAfter,
  parseChanges,
  parseContractId,
  parseTechnical,
  resolveActorEmail,
  resolveActorId,
  resolveActorName,
  resolveEntity,
} from "@/src/lib/audit/presentation";
import {
  buildBudgetCategoryReferenceLabel,
  buildBudgetItemReferenceLabel,
  buildBudgetItemReferencePresentation,
  buildBudgetTransferBusinessSummary,
  enhanceBudgetReferenceChanges,
  resolveBudgetReferenceEntityLabel,
} from "@/src/lib/audit/budget-reference-presentation";
import { resolveUserNamesById } from "@/src/lib/audit/userLookup";
import { fetchCurrentUser, isSuperAdmin } from "@/src/lib/auth/session";

const PAGE_SIZE = 5;

type EntityFilterOption = {
  key: "ALL" | "RUBRICAS" | "INCOMES" | "EXPENSES";
  label: string;
  entityType: string;
  description: string;
};

const ENTITY_FILTER_OPTIONS: EntityFilterOption[] = [
  {
    key: "ALL",
    label: "Tudo",
    entityType: "",
    description: "Mostra todos os eventos de auditoria do contrato.",
  },
  {
    key: "RUBRICAS",
    label: "Rubricas",
    entityType: "rubricas",
    description: "Eventos de categorias, itens e remanejamentos de rubrica.",
  },
  {
    key: "INCOMES",
    label: "Receitas",
    entityType: "incomes",
    description: "Eventos de receitas/entradas financeiras do contrato.",
  },
  {
    key: "EXPENSES",
    label: "Despesas",
    entityType: "expenses",
    description: "Eventos de despesas/saídas financeiras do contrato.",
  },
];

const USER_ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Superadmin",
  ADMIN: "Admin",
  ANALISTA: "Analista",
  ESTAGIARIO: "Estagiário",
};

type TransferDirection = {
  fromItemId: number | null;
  toItemId: number | null;
  amount: number | null;
};

const FROM_ITEM_KEYS = ["fromItemId", "fromItem", "itemOrigemId"] as const;
const TO_ITEM_KEYS = ["toItemId", "toItem", "itemDestinoId"] as const;
const AMOUNT_KEYS = ["amount", "valor", "transferAmount", "valorRemanejado"] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) {
      return null;
    }

    const direct = Number(raw);
    if (Number.isFinite(direct)) {
      return direct;
    }

    const sanitized = raw.replace(/[^\d,.-]/g, "");
    if (!sanitized) {
      return null;
    }

    const lastComma = sanitized.lastIndexOf(",");
    const lastDot = sanitized.lastIndexOf(".");
    let normalized = sanitized;
    if (lastComma > lastDot) {
      normalized = sanitized.replace(/\./g, "").replace(",", ".");
    } else if (lastComma >= 0 && lastDot < 0) {
      normalized = sanitized.replace(",", ".");
    } else if (lastComma >= 0) {
      normalized = sanitized.replace(/,/g, "");
    }

    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function pickItemId(
  source: Record<string, unknown> | null,
  keys: readonly string[]
): number | null {
  if (!source) {
    return null;
  }
  for (const key of keys) {
    const parsed = toNumber(source[key]);
    if (parsed !== null) {
      return parsed;
    }
  }
  return null;
}

function normalizeChangePath(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function pickNumberFromChanges(
  changes: ReturnType<typeof parseChanges>,
  tokens: readonly string[]
): number | null {
  for (const change of changes) {
    const normalizedPath = normalizeChangePath(change.caminho || "");
    const matched = tokens.some((token) => normalizedPath.includes(token));
    if (!matched) {
      continue;
    }
    const parsed = toNumber(change.para) ?? toNumber(change.de);
    if (parsed !== null) {
      return parsed;
    }
  }
  return null;
}

function isTransferAudit(log: AuditLogResponseDTO): boolean {
  const entityType = (log.entityType || "").toLowerCase();
  if (entityType.includes("budget-transfer")) {
    return true;
  }

  const searchable = [log.feature, log.subsecao, log.resumo, log.descricao]
    .map((value) => (value || "").toLowerCase())
    .join(" ");

  return searchable.includes("remanej");
}

function resolveTransferDirection(log: AuditLogResponseDTO): TransferDirection | null {
  if (!isTransferAudit(log)) {
    return null;
  }

  const before = asRecord(parseBeforeAfter(log.beforeJson));
  const after = asRecord(parseBeforeAfter(log.afterJson));
  const technical = asRecord(parseTechnical(log.detalhesTecnicosJson));
  const changes = parseChanges(log.alteracoesJson);

  const fromItemId =
    pickItemId(after, FROM_ITEM_KEYS) ??
    pickItemId(before, FROM_ITEM_KEYS) ??
    pickItemId(technical, FROM_ITEM_KEYS) ??
    pickNumberFromChanges(changes, ["fromitemid", "fromitem", "itemorigemid", "origem"]);

  const toItemId =
    pickItemId(after, TO_ITEM_KEYS) ??
    pickItemId(before, TO_ITEM_KEYS) ??
    pickItemId(technical, TO_ITEM_KEYS) ??
    pickNumberFromChanges(changes, ["toitemid", "toitem", "itemdestinoid", "destino"]);

  const amount =
    pickItemId(after, AMOUNT_KEYS) ??
    pickItemId(before, AMOUNT_KEYS) ??
    pickItemId(technical, AMOUNT_KEYS) ??
    pickNumberFromChanges(changes, ["amount", "valor", "transferamount", "valorremanejado"]);

  if (fromItemId === null && toItemId === null && amount === null) {
    return null;
  }

  return { fromItemId, toItemId, amount };
}

function resolveBudgetItemLabel(itemId: number | null, labelsById: Record<number, string>): string {
  if (itemId === null) {
    return "Não informado";
  }
  const label = labelsById[itemId];
  if (!label) {
    return `Item #${itemId}`;
  }
  return label;
}

function formatCurrencyBRL(value: number | null): string {
  if (value === null) {
    return "Não informado";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
    .format(value)
    .replace(/\u00a0/g, " ");
}

function resolveActorRoleLabel(log: AuditLogResponseDTO): string | null {
  const role = log.usuarioResponsavelRole?.trim().toUpperCase();
  if (!role) {
    return null;
  }
  return USER_ROLE_LABELS[role] || role;
}

export default function ContractAuditPage() {
  const params = useParams();
  const rawContractId = Array.isArray(params.contratoId) ? params.contratoId[0] : (params.contratoId as string);
  const contractId = parseContractId(rawContractId || "");

  const [loadingAccess, setLoadingAccess] = useState(true);
  const [canView, setCanView] = useState(false);

  const [logs, setLogs] = useState<AuditLogResponseDTO[]>([]);
  const [actorNamesById, setActorNamesById] = useState<Record<number, string>>({});
  const [budgetCategoryLabelsById, setBudgetCategoryLabelsById] = useState<Record<number, string>>({});
  const [budgetItemLabelsById, setBudgetItemLabelsById] = useState<Record<number, string>>({});
  const [budgetItemsById, setBudgetItemsById] = useState<Record<number, BudgetItemResponseDTO>>({});
  const [contractName, setContractName] = useState<string | null>(null);
  const [loadingContractName, setLoadingContractName] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchFilter, setSearchFilter] = useState("");
  const [actorNameFilter, setActorNameFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAccess() {
      try {
        const user = await fetchCurrentUser();
        if (!cancelled) {
          setCanView(isSuperAdmin(user));
        }
      } finally {
        if (!cancelled) {
          setLoadingAccess(false);
        }
      }
    }

    void loadAccess();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadLogs = useCallback(async () => {
    if (!canView) {
      return;
    }

    if (!contractId) {
      setError("ID do contrato inválido.");
      setLogs([]);
      setActorNamesById({});
      setTotalPages(0);
      setTotalElements(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await listAuditLogs({
        scope: "CONTRACTS",
        contractId,
        search: searchFilter || undefined,
        actorName: actorNameFilter || undefined,
        action: actionFilter || undefined,
        entityType: entityTypeFilter || undefined,
        page: currentPage,
        size: PAGE_SIZE,
      });

      const actorNameMap = await resolveUserNamesById(response.content.map((log) => resolveActorId(log)));

      setLogs(response.content);
      setActorNamesById(actorNameMap);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setLogs([]);
      setActorNamesById({});
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [canView, contractId, searchFilter, actorNameFilter, actionFilter, entityTypeFilter, currentPage]);

  useEffect(() => {
    if (!canView) {
      return;
    }
    void loadLogs();
  }, [canView, loadLogs]);

  useEffect(() => {
    if (!contractId) {
      setContractName(null);
      setLoadingContractName(false);
      return;
    }
    const resolvedContractId = contractId;

    let cancelled = false;

    async function loadContractName() {
      setLoadingContractName(true);
      try {
        const project = await getProjectById(resolvedContractId);
        if (!cancelled) {
          const name = project.name?.trim();
          setContractName(name || null);
        }
      } catch {
        if (!cancelled) {
          setContractName(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingContractName(false);
        }
      }
    }

    void loadContractName();
    return () => {
      cancelled = true;
    };
  }, [contractId]);

  useEffect(() => {
    if (!canView || !contractId) {
      setBudgetCategoryLabelsById({});
      return;
    }
    const resolvedContractId = contractId;

    let cancelled = false;

    async function loadBudgetCategories() {
      const labels: Record<number, string> = {};
      let page = 0;
      const size = 100;

      try {
        while (true) {
          const response = await listBudgetCategories({
            projectId: resolvedContractId,
            page,
            size,
          });

          for (const category of response.content) {
            labels[category.id] = buildBudgetCategoryReferenceLabel(category);
          }

          const isLastPage = response.last || page >= response.totalPages - 1;
          if (isLastPage) {
            break;
          }
          page += 1;
        }

        if (!cancelled) {
          setBudgetCategoryLabelsById(labels);
        }
      } catch {
        if (!cancelled) {
          setBudgetCategoryLabelsById({});
        }
      }
    }

    void loadBudgetCategories();
    return () => {
      cancelled = true;
    };
  }, [canView, contractId]);

  useEffect(() => {
    if (!canView || !contractId) {
      setBudgetItemLabelsById({});
      setBudgetItemsById({});
      return;
    }
    const resolvedContractId = contractId;

    let cancelled = false;

    async function loadBudgetItems() {
      const labels: Record<number, string> = {};
      const itemsById: Record<number, BudgetItemResponseDTO> = {};
      let page = 0;
      const size = 100;

      try {
        while (true) {
          const response = await listBudgetItems({
            projectId: resolvedContractId,
            page,
            size,
          });

          for (const item of response.content) {
            labels[item.id] = buildBudgetItemReferenceLabel(item);
            itemsById[item.id] = item;
          }

          const isLastPage = response.last || page >= response.totalPages - 1;
          if (isLastPage) {
            break;
          }
          page += 1;
        }

        if (!cancelled) {
          setBudgetItemLabelsById(labels);
          setBudgetItemsById(itemsById);
        }
      } catch {
        if (!cancelled) {
          setBudgetItemLabelsById({});
          setBudgetItemsById({});
        }
      }
    }

    void loadBudgetItems();
    return () => {
      cancelled = true;
    };
  }, [canView, contractId]);

  const budgetItemPresentationsById = useMemo(
    () =>
      Object.fromEntries(
        Object.values(budgetItemsById).map((item) => [
          item.id,
          buildBudgetItemReferencePresentation(
            item,
            budgetCategoryLabelsById[item.categoryId] || null
          ),
        ])
      ),
    [budgetItemsById, budgetCategoryLabelsById]
  );

  function handleSubmitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (currentPage !== 0) {
      setCurrentPage(0);
      return;
    }
    void loadLogs();
  }

  function handleQuickEntityFilter(entityType: string) {
    const changed = entityTypeFilter !== entityType;
    if (changed) {
      setEntityTypeFilter(entityType);
    }
    if (currentPage !== 0) {
      setCurrentPage(0);
      return;
    }
    if (!changed) {
      void loadLogs();
    }
  }

  const emptyMessage = useMemo(() => {
    if (loading) {
      return "Carregando timeline de auditoria...";
    }
    return "Nenhum evento de auditoria encontrado para este contrato.";
  }, [loading]);

  const contractLabel = useMemo(() => {
    if (!contractId) {
      return "Contrato -";
    }
    if (loadingContractName) {
      return `Contrato ${contractId} - carregando nome...`;
    }
    if (contractName) {
      return `Contrato ${contractId} - ${contractName}`;
    }
    return `Contrato ${contractId}`;
  }, [contractId, contractName, loadingContractName]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold text-zinc-900">Auditoria</h2>
        <p className="text-sm text-zinc-600">Ações realizadas no contrato.</p>
      </header>

      {loadingAccess && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">Validando permissão...</p>
        </section>
      )}

      {!loadingAccess && !canView && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <p className="text-sm text-amber-800">Acesso permitido apenas para superadmin.</p>
        </section>
      )}

      {!loadingAccess && canView && (
        <>
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <form onSubmit={handleSubmitFilters} className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="space-y-2 md:col-span-4">
                <p className="text-sm font-medium text-zinc-700">Atalhos de auditoria financeira</p>
                <div className="flex flex-wrap gap-2">
                  {ENTITY_FILTER_OPTIONS.map((option) => {
                    const active = option.entityType === entityTypeFilter;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => handleQuickEntityFilter(option.entityType)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition",
                          active
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                            : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-zinc-500">
                  {ENTITY_FILTER_OPTIONS.find((option) => option.entityType === entityTypeFilter)?.description ||
                    "Filtro customizado por tipo de entidade."}
                </p>
              </div>

              <div className="space-y-1">
                <label htmlFor="search" className="text-sm font-medium text-zinc-700">
                  Busca na timeline
                </label>
                <Input
                  id="search"
                  value={searchFilter}
                  onChange={(event) => setSearchFilter(event.target.value)}
                  placeholder="Resumo, descrição ou campo"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="actorName" className="text-sm font-medium text-zinc-700">
                  Usuário responsável
                </label>
                <Input
                  id="actorName"
                  value={actorNameFilter}
                  onChange={(event) => setActorNameFilter(event.target.value)}
                  placeholder="Nome ou email"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="action" className="text-sm font-medium text-zinc-700">
                  Tipo de ação
                </label>
                <Input
                  id="action"
                  value={actionFilter}
                  onChange={(event) => setActionFilter(event.target.value)}
                  placeholder="Criou, alterou, removeu..."
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="entityType" className="text-sm font-medium text-zinc-700">
                  Classificação interna
                </label>
                <Input
                  id="entityType"
                  value={entityTypeFilter}
                  onChange={(event) => setEntityTypeFilter(event.target.value)}
                    placeholder="Ex.: rubricas, receitas, despesas"
                />
              </div>

              <div className="md:col-span-4 flex items-end">
                <Button type="submit" disabled={loading}>
                  Aplicar filtros
                </Button>
              </div>
            </form>
          </section>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            {logs.length === 0 ? (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                {emptyMessage}
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-4">
                  {logs.map((log, index) => {
                    const hasConnector = index < logs.length - 1;
                    const actorRoleLabel = resolveActorRoleLabel(log);
                    const transferDirection = resolveTransferDirection(log);
                    const enhancedChanges = enhanceBudgetReferenceChanges(
                      parseChanges(log.alteracoesJson),
                      {
                        categoryLabelsById: budgetCategoryLabelsById,
                        itemLabelsById: budgetItemLabelsById,
                      }
                    );
                    const entityTextOverride = resolveBudgetReferenceEntityLabel(log, {
                      categoryLabelsById: budgetCategoryLabelsById,
                      itemLabelsById: budgetItemLabelsById,
                      itemPresentationsById: budgetItemPresentationsById,
                    });
                    const transferSummary = transferDirection
                      ? buildBudgetTransferBusinessSummary(log, {
                          categoryLabelsById: budgetCategoryLabelsById,
                          itemLabelsById: budgetItemLabelsById,
                          itemPresentationsById: budgetItemPresentationsById,
                        })
                      : null;
                    const resolvedTransferSummary =
                      transferSummary ||
                      (transferDirection
                        ? {
                            sourceLabel: resolveBudgetItemLabel(
                              transferDirection.fromItemId,
                              budgetItemLabelsById
                            ),
                            destinationLabel: resolveBudgetItemLabel(
                              transferDirection.toItemId,
                              budgetItemLabelsById
                            ),
                            sourceInitialTotal: "NÃ£o informado",
                            destinationInitialTotal: "NÃ£o informado",
                            transferredAmount: formatCurrencyBRL(transferDirection.amount),
                            sourceFinalTotal: "NÃ£o informado",
                            destinationFinalTotal: "NÃ£o informado",
                          }
                        : null);

                    return (
                      <div key={log.auditId || log.id} className="relative pl-8">
                        <span className="absolute left-1 top-5 h-3 w-3 rounded-full border border-emerald-300 bg-emerald-500" />
                        {hasConnector && <span className="absolute left-[7px] top-8 h-[calc(100%-12px)] w-px bg-zinc-200" />}

                        <AuditLogCard
                          log={log}
                          changesOverride={enhancedChanges}
                          actorNamesById={actorNamesById}
                          actorRoleLabel={actorRoleLabel}
                          entityTextOverride={entityTextOverride}
                          secondaryEntityText={contractLabel}
                          className="bg-zinc-50/60"
                          extraSummaryContent={
                            resolvedTransferSummary ? (
                              <BudgetTransferSummary summary={resolvedTransferSummary} />
                            ) : null
                          }
                        >

                          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                            <div>
                              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                Usuário responsável
                              </dt>
                              <dd className="mt-1 font-medium text-zinc-900">
                                {resolveActorName(log, actorNamesById)}
                              </dd>
                              {resolveActorEmail(log) && (
                                <dd className="text-xs text-zinc-600">{resolveActorEmail(log)}</dd>
                              )}
                              {actorRoleLabel && (
                                <dd className="text-xs text-zinc-600">Perfil: {actorRoleLabel}</dd>
                              )}
                            </div>
                            <div>
                              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                Registro afetado
                              </dt>
                              <dd className="mt-1 break-all text-zinc-800">{resolveEntity(log)}</dd>
                              <dd className="text-xs text-zinc-600">
                                {contractLabel}
                              </dd>
                            </div>
                          </dl>
                        </AuditLogCard>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-zinc-600">
                    Página {totalPages === 0 ? 0 : currentPage + 1} de {totalPages} | {totalElements} registro(s)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={loading || currentPage <= 0}
                      onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                    >
                      Anterior
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={loading || totalPages === 0 || currentPage >= totalPages - 1}
                      onClick={() => setCurrentPage((page) => page + 1)}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
