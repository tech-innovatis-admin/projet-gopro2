"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { NavBar } from "@/components/ui/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listAuditLogs } from "@/src/lib/api/endpoints/auth";
import { resolveUserNamesById } from "@/src/lib/audit/userLookup";
import { fetchCurrentUser, isSuperAdmin } from "@/src/lib/auth/session";
import { AuditLogResponseDTO, AuditScopeEnum, HttpError } from "@/src/lib/api/types";

const PAGE_SIZE = 10;

const scopeOptions: Array<{ value: AuditScopeEnum; label: string }> = [
  { value: "SYSTEM", label: "Auditoria de sistema" },
  { value: "CONTRACTS", label: "Auditoria de contratos" },
  { value: "PEOPLE_COMPANIES", label: "Auditoria de pessoas/empresas" },
];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Erro inesperado.";
}

function parseContractId(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
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
  const [actionFilter, setActionFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [actorNameFilter, setActorNameFilter] = useState("");
  const [contractIdFilter, setContractIdFilter] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    setError(null);

    try {
      const response = await listAuditLogs({
        scope,
        action: actionFilter || undefined,
        entityType: entityTypeFilter || undefined,
        actorName: actorNameFilter || undefined,
        contractId: scope === "CONTRACTS" ? parseContractId(contractIdFilter) : undefined,
        page: currentPage,
        size: PAGE_SIZE,
      });

      const actorNameMap = await resolveUserNamesById(
        response.content.map((log) => log.actorUserId)
      );

      setLogs(response.content);
      setActorNamesById(actorNameMap);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setFeedback(
        response.totalElements > 0
          ? `${response.totalElements} registro(s) encontrados.`
          : "Nenhum registro encontrado."
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
  }, [scope, actionFilter, entityTypeFilter, actorNameFilter, contractIdFilter, currentPage]);

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
  }

  const emptyMessage = useMemo(() => {
    if (loadingLogs) {
      return "Carregando auditoria...";
    }
    return "Nenhum registro de auditoria encontrado.";
  }, [loadingLogs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
      <NavBar />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-2xl font-bold text-zinc-900">Auditoria</h1>
          <p className="text-sm text-zinc-600">
            Trilha separada por sistema, contratos e pessoas/empresas.
          </p>
        </header>

        {loadingAccess && (
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
            Validando permissao...
          </div>
        )}

        {!loadingAccess && !canView && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Acesso permitido apenas para superadmin.
          </div>
        )}

        {!loadingAccess && canView && (
          <>
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap gap-2">
                {scopeOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={scope === option.value ? "default" : "outline"}
                    onClick={() => handleScopeChange(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              <form onSubmit={handleApplyFilters} className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <div className="space-y-1">
                  <label htmlFor="actorName" className="text-sm font-medium text-zinc-700">
                    Nome do usuario
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
                    Acao
                  </label>
                  <Input
                    id="action"
                    value={actionFilter}
                    onChange={(event) => setActionFilter(event.target.value)}
                    placeholder="API_PATCH"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="entityType" className="text-sm font-medium text-zinc-700">
                    Entidade
                  </label>
                  <Input
                    id="entityType"
                    value={entityTypeFilter}
                    onChange={(event) => setEntityTypeFilter(event.target.value)}
                    placeholder="contracts:projects"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="contractId" className="text-sm font-medium text-zinc-700">
                    Contrato
                  </label>
                  <Input
                    id="contractId"
                    value={contractIdFilter}
                    onChange={(event) => setContractIdFilter(event.target.value)}
                    placeholder="ID do contrato"
                    disabled={scope !== "CONTRACTS"}
                  />
                </div>

                <div className="flex items-end">
                  <Button type="submit">Aplicar filtros</Button>
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
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 text-left text-zinc-600">
                          <th className="px-3 py-2">Data</th>
                          <th className="px-3 py-2">Ator</th>
                          <th className="px-3 py-2">Acao</th>
                          <th className="px-3 py-2">Entidade</th>
                          <th className="px-3 py-2">Contrato</th>
                          <th className="px-3 py-2">IP</th>
                          <th className="px-3 py-2">Detalhes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log) => (
                          <tr key={log.id} className="border-b border-zinc-100 align-top">
                            <td className="px-3 py-2">{formatDate(log.createdAt)}</td>
                            <td className="px-3 py-2">
                              <div>
                                {log.actorUserId
                                  ? (actorNamesById[log.actorUserId] ?? `ID ${log.actorUserId}`)
                                  : "Sistema"}
                              </div>
                              {log.actorEmail && (
                                <div className="text-xs text-zinc-500">{log.actorEmail}</div>
                              )}
                            </td>
                            <td className="px-3 py-2 font-medium text-zinc-900">{log.action}</td>
                            <td className="px-3 py-2">{log.entityType}</td>
                            <td className="px-3 py-2">{log.entityId || "-"}</td>
                            <td className="px-3 py-2">{log.ip || "-"}</td>
                            <td className="px-3 py-2">
                              <details className="max-w-sm">
                                <summary className="cursor-pointer text-xs text-zinc-600 hover:text-zinc-900">
                                  Ver detalhes
                                </summary>
                                <pre className="mt-2 whitespace-pre-wrap rounded-md bg-zinc-100 p-2 text-xs text-zinc-700">
                                  {`before: ${log.beforeJson || "-"}\nafter: ${log.afterJson || "-"}`}
                                </pre>
                              </details>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-zinc-600">
                      Pagina {totalPages === 0 ? 0 : currentPage + 1} de {totalPages} • {totalElements} registro(s)
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

