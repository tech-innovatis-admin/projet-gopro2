"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listAuditLogs } from "@/src/lib/api/endpoints/auth";
import { resolveUserNamesById } from "@/src/lib/audit/userLookup";
import { fetchCurrentUser, isSuperAdmin } from "@/src/lib/auth/session";
import { AuditLogResponseDTO, HttpError } from "@/src/lib/api/types";

const PAGE_SIZE = 10;

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

function parseContractId(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
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

export default function ContractAuditPage() {
  const params = useParams();
  const contractId = parseContractId(params.contratoId as string);

  const [loadingAccess, setLoadingAccess] = useState(true);
  const [canView, setCanView] = useState(false);
  const [logs, setLogs] = useState<AuditLogResponseDTO[]>([]);
  const [actorNamesById, setActorNamesById] = useState<Record<number, string>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError("ID do contrato invalido.");
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
        actorName: actorNameFilter || undefined,
        action: actionFilter || undefined,
        entityType: entityTypeFilter || undefined,
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
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setLogs([]);
      setActorNamesById({});
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [canView, contractId, actorNameFilter, actionFilter, entityTypeFilter, currentPage]);

  useEffect(() => {
    if (!canView) {
      return;
    }
    void loadLogs();
  }, [canView, loadLogs]);

  function handleSubmitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (currentPage !== 0) {
      setCurrentPage(0);
      return;
    }
    void loadLogs();
  }

  const emptyMessage = useMemo(() => {
    if (loading) {
      return "Carregando auditoria do contrato...";
    }
    return "Nenhum registro de auditoria encontrado para este contrato.";
  }, [loading]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-zinc-900">Auditoria do contrato</h2>
        <p className="text-sm text-zinc-600">
          Acoes de POST, PUT, PATCH e DELETE associadas ao contrato {contractId ?? "-"}.
        </p>
      </header>

      {loadingAccess && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">Validando permissao...</p>
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
                  placeholder="API_POST"
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
                  placeholder="contracts:documents.project"
                />
              </div>

              <div className="flex items-end">
                <Button type="submit">Aplicar filtros</Button>
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
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-left text-zinc-600">
                        <th className="px-3 py-2">Data</th>
                        <th className="px-3 py-2">Ator</th>
                        <th className="px-3 py-2">Acao</th>
                        <th className="px-3 py-2">Entidade</th>
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
                    Pagina {totalPages === 0 ? 0 : currentPage + 1} de {totalPages} - {totalElements} registro(s)
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
                      Proxima
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
