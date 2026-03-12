"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { NavBar } from "@/components/ui/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AuditLogCard } from "@/src/components/audit/AuditLogCard";
import { BudgetTransferSummary } from "@/src/components/audit/BudgetTransferSummary";
import { getBudgetCategoryById } from "@/src/lib/api/endpoints/budget-categories";
import { getBudgetItemById } from "@/src/lib/api/endpoints/budget-items";
import { listAuditLogs } from "@/src/lib/api/endpoints/auth";
import { AuditLogResponseDTO, AuditScopeEnum, BudgetItemResponseDTO } from "@/src/lib/api/types";
import {
  getErrorMessage,
  parseBeforeAfter,
  parseChanges,
  parseContractId,
  parseTechnical,
  resolveActorId,
  resolveScopeLabel,
} from "@/src/lib/audit/presentation";
import {
  buildBudgetCategoryReferenceLabel,
  buildBudgetItemReferencePresentation,
  buildBudgetTransferBusinessSummary,
} from "@/src/lib/audit/budget-reference-presentation";
import { resolveUserNamesById } from "@/src/lib/audit/userLookup";
import { fetchCurrentUser, isSuperAdmin } from "@/src/lib/auth/session";

const PAGE_SIZE = 5;

type ScopeCard = {
  value: AuditScopeEnum;
  title: string;
  description: string;
};

const scopeCards: ScopeCard[] = [
  {
    value: "SYSTEM",
    title: "Auditoria do sistema",
    description: "Login, logout, erros e alterações de configuração.",
  },
  {
    value: "CONTRACTS",
    title: "Auditoria de contratos",
    description: "Visão geral de ações em todos os contratos.",
  },
  {
    value: "USERS",
    title: "Auditoria de usuários",
    description: "Permissões, bloqueios, cadastro e alterações de usuários.",
  },
];

function buildScopeLabel(scope: AuditScopeEnum): string {
  return resolveScopeLabel(scope);
}

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

function pickItemId(source: Record<string, unknown> | null, keys: readonly string[]): number | null {
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
  const description = labelsById[itemId];
  if (!description) {
    return `Item #${itemId}`;
  }
  return `${description} (ID ${itemId})`;
}

function formatCurrencyBRL(value: number | null): string {
  if (value === null) {
    return "Não informado";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function AdminAuditoriaPage() {
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [canView, setCanView] = useState(false);

  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logs, setLogs] = useState<AuditLogResponseDTO[]>([]);
  const [actorNamesById, setActorNamesById] = useState<Record<number, string>>({});
  const [budgetCategoryLabelsById, setBudgetCategoryLabelsById] = useState<Record<number, string>>({});
  const [budgetItemLabelsById, setBudgetItemLabelsById] = useState<Record<number, string>>({});
  const [budgetItemsById, setBudgetItemsById] = useState<Record<number, BudgetItemResponseDTO>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [scope, setScope] = useState<AuditScopeEnum>("SYSTEM");
  const [searchFilter, setSearchFilter] = useState("");
  const [actorNameFilter, setActorNameFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [contractIdFilter, setContractIdFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    setError(null);

    try {
      const response = await listAuditLogs({
        scope,
        search: searchFilter || undefined,
        actorName: actorNameFilter || undefined,
        action: actionFilter || undefined,
        entityType: entityTypeFilter || undefined,
        contractId: scope === "CONTRACTS" ? parseContractId(contractIdFilter || "") ?? undefined : undefined,
        page: currentPage,
        size: PAGE_SIZE,
      });

      const actorNameMap = await resolveUserNamesById(response.content.map((log) => resolveActorId(log)));

      setLogs(response.content);
      setActorNamesById(actorNameMap);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setFeedback(
        response.totalElements > 0
          ? `${response.totalElements} registro(s) encontrados em ${buildScopeLabel(scope)}.`
          : "Nenhum registro encontrado com os filtros atuais."
      );
    } catch (requestError) {
      setLogs([]);
      setActorNamesById({});
      setTotalPages(0);
      setTotalElements(0);
      setFeedback(null);
      setError(getErrorMessage(requestError));
    } finally {
      setLoadingLogs(false);
    }
  }, [
    scope,
    searchFilter,
    actorNameFilter,
    actionFilter,
    entityTypeFilter,
    contractIdFilter,
    currentPage,
  ]);

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

  useEffect(() => {
    if (!canView) {
      return;
    }
    void loadLogs();
  }, [canView, loadLogs]);

  useEffect(() => {
    const ids = new Set<number>();

    for (const log of logs) {
      const transferDirection = resolveTransferDirection(log);
      if (!transferDirection) {
        continue;
      }
      if (transferDirection.fromItemId !== null) {
        ids.add(transferDirection.fromItemId);
      }
      if (transferDirection.toItemId !== null) {
        ids.add(transferDirection.toItemId);
      }
    }

    const missingIds = Array.from(ids).filter((id) => !budgetItemLabelsById[id]);
    if (missingIds.length === 0) {
      return;
    }

    let cancelled = false;

    async function loadBudgetItemLabels() {
      const resolvedItems = await Promise.all(
        missingIds.map(async (id) => {
          try {
            const item = await getBudgetItemById(id);
            return item;
          } catch {
            return null;
          }
        })
      );

      if (cancelled) {
        return;
      }

      setBudgetItemLabelsById((prev) => {
        const next = { ...prev };
        for (const item of resolvedItems) {
          if (!item) {
            continue;
          }
          next[item.id] = buildBudgetItemReferencePresentation(item).label;
        }
        return next;
      });

      setBudgetItemsById((prev) => {
        const next = { ...prev };
        for (const item of resolvedItems) {
          if (!item) {
            continue;
          }
          next[item.id] = item;
        }
        return next;
      });
    }

    void loadBudgetItemLabels();
    return () => {
      cancelled = true;
    };
  }, [logs, budgetItemLabelsById]);

  useEffect(() => {
    const missingCategoryIds = Array.from(
      new Set(
        Object.values(budgetItemsById)
          .map((item) => item.categoryId)
          .filter(
            (categoryId): categoryId is number =>
              Number.isInteger(categoryId) && categoryId > 0 && !budgetCategoryLabelsById[categoryId]
          )
      )
    );

    if (missingCategoryIds.length === 0) {
      return;
    }

    let cancelled = false;

    async function loadBudgetCategories() {
      const resolvedCategories = await Promise.all(
        missingCategoryIds.map(async (id) => {
          try {
            const category = await getBudgetCategoryById(id);
            return [id, buildBudgetCategoryReferenceLabel(category)] as const;
          } catch {
            return [id, null] as const;
          }
        })
      );

      if (cancelled) {
        return;
      }

      setBudgetCategoryLabelsById((prev) => {
        const next = { ...prev };
        for (const [id, label] of resolvedCategories) {
          if (label) {
            next[id] = label;
          }
        }
        return next;
      });
    }

    void loadBudgetCategories();
    return () => {
      cancelled = true;
    };
  }, [budgetCategoryLabelsById, budgetItemsById]);

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

  function handleApplyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (currentPage !== 0) {
      setCurrentPage(0);
      return;
    }
    void loadLogs();
  }

  function handleScopeChange(nextScope: AuditScopeEnum) {
    setScope(nextScope);
    setCurrentPage(0);
    setContractIdFilter("");
  }

  const emptyMessage = useMemo(() => {
    if (loadingLogs) {
      return "Carregando auditoria...";
    }
    return "Nenhum evento de auditoria para exibir.";
  }, [loadingLogs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
      <NavBar />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-900">Auditoria geral</h1>
          <p className="text-sm text-zinc-600">
            Painel único para auditoria de sistema, contratos e usuários.
          </p>
        </header>

        {loadingAccess && (
          <section className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
            Validando permissão...
          </section>
        )}

        {!loadingAccess && !canView && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Acesso permitido apenas para superadmin.
          </section>
        )}

        {!loadingAccess && canView && (
          <>
            <section className="grid gap-3 md:grid-cols-3">
              {scopeCards.map((card) => {
                const active = scope === card.value;
                return (
                  <button
                    key={card.value}
                    type="button"
                    onClick={() => handleScopeChange(card.value)}
                    className={cn(
                      "rounded-2xl border p-4 text-left shadow-sm transition",
                      active
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-zinc-200 bg-white hover:border-zinc-300"
                    )}
                  >
                    <p className="text-sm font-semibold text-zinc-900">{card.title}</p>
                    <p className="mt-1 text-xs text-zinc-600">{card.description}</p>
                  </button>
                );
              })}
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <form onSubmit={handleApplyFilters} className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-1">
                  <label htmlFor="search" className="text-sm font-medium text-zinc-700">
                    Busca geral
                  </label>
                  <Input
                    id="search"
                    value={searchFilter}
                    onChange={(event) => setSearchFilter(event.target.value)}
                    placeholder="Resumo, descrição, contrato, nome..."
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
                    placeholder="Nome, email ou username"
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
                  <label htmlFor="contractId" className="text-sm font-medium text-zinc-700">
                    Contrato (ID)
                  </label>
                  <Input
                    id="contractId"
                    value={contractIdFilter}
                    onChange={(event) => setContractIdFilter(event.target.value)}
                    placeholder="Use apenas em contratos"
                    disabled={scope !== "CONTRACTS"}
                  />
                </div>

                <div className="md:col-span-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedFilters((prev) => !prev)}
                    className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
                  >
                    {showAdvancedFilters ? "Ocultar filtro avançado" : "Exibir filtro avançado"}
                  </button>
                </div>

                {showAdvancedFilters && (
                  <div className="space-y-1 md:col-span-2">
                    <label htmlFor="entityType" className="text-sm font-medium text-zinc-700">
                      Classificação interna (opcional)
                    </label>
                    <Input
                      id="entityType"
                      value={entityTypeFilter}
                      onChange={(event) => setEntityTypeFilter(event.target.value)}
                      placeholder="Ex.: contracts:project"
                    />
                  </div>
                )}

                <div className={cn("flex items-end", showAdvancedFilters ? "md:col-span-2" : "md:col-span-4")}>
                  <Button type="submit" disabled={loadingLogs}>
                    Aplicar filtros
                  </Button>
                </div>
              </form>
            </section>

            {feedback && (
              <div className="rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-700">
                {feedback}
              </div>
            )}

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
                <div className="space-y-4">
                  {logs.map((log) => {
                    const transferDirection = resolveTransferDirection(log);
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
                      <AuditLogCard
                        key={log.auditId || log.id}
                        log={log}
                        actorNamesById={actorNamesById}
                        scopeFallback={scope}
                        showScopeBadge
                        extraSummaryContent={
                          resolvedTransferSummary ? (
                            <BudgetTransferSummary summary={resolvedTransferSummary} />
                          ) : null
                        }
                      />
                    );
                  })}

                  <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-zinc-600">
                      Página {totalPages === 0 ? 0 : currentPage + 1} de {totalPages} | {totalElements} registro(s)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={loadingLogs || currentPage <= 0}
                        onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                      >
                        Anterior
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={loadingLogs || totalPages === 0 || currentPage >= totalPages - 1}
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
      </main>
    </div>
  );
}
