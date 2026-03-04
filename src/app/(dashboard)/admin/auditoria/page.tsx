"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { NavBar } from "@/components/ui/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { listAuditLogs } from "@/src/lib/api/endpoints/auth";
import { AuditLogResponseDTO, AuditScopeEnum } from "@/src/lib/api/types";
import {
  formatDateTime,
  formatUnknown,
  getErrorMessage,
  parseBeforeAfter,
  parseChanges,
  parseContractId,
  parseTechnical,
  resolveActorEmail,
  resolveActorId,
  resolveActorName,
  resolveContext,
  resolveEntity,
  resolveEventDate,
  resolveResultClass,
  resolveResultLabel,
  resolveScopeLabel,
  resolveSummary,
} from "@/src/lib/audit/presentation";
import { resolveUserNamesById } from "@/src/lib/audit/userLookup";
import { fetchCurrentUser, isSuperAdmin } from "@/src/lib/auth/session";

const PAGE_SIZE = 10;

type ScopeCard = {
  value: AuditScopeEnum;
  title: string;
  description: string;
};

const scopeCards: ScopeCard[] = [
  {
    value: "SYSTEM",
    title: "Auditoria do sistema",
    description: "Login, logout, erros e alteracoes de configuracao.",
  },
  {
    value: "CONTRACTS",
    title: "Auditoria de contratos",
    description: "Visao geral de acoes em todos os contratos.",
  },
  {
    value: "USERS",
    title: "Auditoria de usuarios",
    description: "Permissoes, bloqueios, cadastro e alteracoes de usuarios.",
  },
];

function buildScopeLabel(scope: AuditScopeEnum): string {
  return resolveScopeLabel(scope);
}

export default function AdminAuditoriaPage() {
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [canView, setCanView] = useState(false);

  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logs, setLogs] = useState<AuditLogResponseDTO[]>([]);
  const [actorNamesById, setActorNamesById] = useState<Record<number, string>>({});
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
            Painel unico para auditoria de sistema, contratos e usuarios.
          </p>
        </header>

        {loadingAccess && (
          <section className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
            Validando permissao...
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
                    placeholder="Resumo, descricao, contrato, nome..."
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="actorName" className="text-sm font-medium text-zinc-700">
                    Usuario responsavel
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
                    Tipo de acao
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
                    {showAdvancedFilters ? "Ocultar filtro avancado" : "Exibir filtro avancado"}
                  </button>
                </div>

                {showAdvancedFilters && (
                  <div className="space-y-1 md:col-span-2">
                    <label htmlFor="entityType" className="text-sm font-medium text-zinc-700">
                      Classificacao interna (opcional)
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
                    const changes = parseChanges(log.alteracoesJson);
                    const before = parseBeforeAfter(log.beforeJson);
                    const after = parseBeforeAfter(log.afterJson);
                    const technical = parseTechnical(log.detalhesTecnicosJson);

                    return (
                      <article
                        key={log.auditId || log.id}
                        className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4"
                      >
                        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                                {resolveScopeLabel(log.tipoAuditoria || scope)}
                              </span>
                              <span
                                className={cn(
                                  "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                                  resolveResultClass(log.resultado)
                                )}
                              >
                                {resolveResultLabel(log.resultado)}
                              </span>
                            </div>
                            <h2 className="text-base font-semibold text-zinc-900">{resolveSummary(log)}</h2>
                            {log.descricao && <p className="text-sm text-zinc-700">{log.descricao}</p>}
                          </div>
                          <p className="text-xs text-zinc-500">{formatDateTime(resolveEventDate(log))}</p>
                        </header>

                        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                              Usuario responsavel
                            </dt>
                            <dd className="mt-1 font-medium text-zinc-900">
                              {resolveActorName(log, actorNamesById)}
                            </dd>
                            {resolveActorEmail(log) && (
                              <dd className="text-xs text-zinc-600">{resolveActorEmail(log)}</dd>
                            )}
                          </div>
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                              Modulo e tela
                            </dt>
                            <dd className="mt-1 text-zinc-800">{resolveContext(log)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                              Registro afetado
                            </dt>
                            <dd className="mt-1 text-zinc-800">{resolveEntity(log)}</dd>
                          </div>
                        </dl>

                        <details className="mt-4 rounded-lg border border-zinc-200 bg-white p-3">
                          <summary className="cursor-pointer text-sm font-medium text-zinc-700">
                            Ver detalhamento completo
                          </summary>
                          <div className="mt-3 space-y-3 text-sm text-zinc-700">
                            {changes.length > 0 && (
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-zinc-200 text-left text-zinc-600">
                                      <th className="py-2 pr-2">Campo</th>
                                      <th className="py-2 pr-2">Valor anterior</th>
                                      <th className="py-2 pr-2">Novo valor</th>
                                      <th className="py-2 pr-2">Tipo</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {changes.map((change, index) => (
                                      <tr key={`${log.id}-change-${index}`} className="border-b border-zinc-100">
                                        <td className="py-2 pr-2 font-medium">{change.caminho || "-"}</td>
                                        <td className="py-2 pr-2">{formatUnknown(change.de)}</td>
                                        <td className="py-2 pr-2">{formatUnknown(change.para)}</td>
                                        <td className="py-2 pr-2">{change.tipo || "-"}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {(before !== null || after !== null) && (
                              <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                    Antes
                                  </p>
                                  <pre className="max-h-56 overflow-auto rounded-md bg-zinc-100 p-2 text-[11px] text-zinc-700">
                                    {JSON.stringify(before, null, 2) || "null"}
                                  </pre>
                                </div>
                                <div>
                                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                    Depois
                                  </p>
                                  <pre className="max-h-56 overflow-auto rounded-md bg-zinc-100 p-2 text-[11px] text-zinc-700">
                                    {JSON.stringify(after, null, 2) || "null"}
                                  </pre>
                                </div>
                              </div>
                            )}

                            {technical && (
                              <div>
                                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                  Detalhes tecnicos
                                </p>
                                <pre className="max-h-56 overflow-auto rounded-md bg-zinc-100 p-2 text-[11px] text-zinc-700">
                                  {JSON.stringify(technical, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </details>
                      </article>
                    );
                  })}

                  <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-zinc-600">
                      Pagina {totalPages === 0 ? 0 : currentPage + 1} de {totalPages} | {totalElements} registro(s)
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
                        Proxima
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

