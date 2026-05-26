"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { NavBar } from "@/components/ui/NavBar";
import { Button } from "@/components/ui/button";
import { AuditLogCard } from "@/src/components/audit/AuditLogCard";
import { listAuditLogs } from "@/src/lib/api/endpoints/auth";
import { resolveUserNamesById } from "@/src/lib/audit/userLookup";
import { canManageAdminAudit, fetchCurrentUser } from "@/src/lib/auth/session";
import { AuditLogResponseDTO, AuditScopeEnum } from "@/src/lib/api/types";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";
import { Dropdown } from "@/components/ui/dropdown";

const PAGE_SIZE = 10;

const scopeOptions: Array<{ value: AuditScopeEnum | ""; label: string }> = [
  { value: "", label: "Todos os escopos" },
  { value: "SYSTEM", label: "Sistema" },
  { value: "CONTRACTS", label: "Contratos" },
  { value: "USERS", label: "Usuários" },
  { value: "PEOPLE_COMPANIES", label: "Pessoas e empresas" },
];

const roleLabels: Record<string, string> = {
  OWNER: "Owner",
  SUPERADMIN: "Superadmin",
  ADMIN: "Admin",
  ANALISTA: "Analista",
  ESTAGIARIO: "Estagiario",
};

function resolveActorRoleLabel(log: AuditLogResponseDTO): string | null {
  const role = log.usuarioResponsavelRole?.trim().toUpperCase();
  if (!role) {
    return null;
  }

  return roleLabels[role] || role;
}

export default function AdminAuditoriaPage() {
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [canManage, setCanManage] = useState(false);

  const [logs, setLogs] = useState<AuditLogResponseDTO[]>([]);
  const [actorNamesById, setActorNamesById] = useState<Record<number, string>>({});
  const [scope, setScope] = useState<AuditScopeEnum | "">("");
  const [search, setSearch] = useState("");
  const [contractIdFilter, setContractIdFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadAccess() {
      try {
        const user = await fetchCurrentUser();
        if (!cancelled) {
          setCanManage(canManageAdminAudit(user));
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

  const parsedContractId = useMemo(() => {
    const trimmed = contractIdFilter.trim();
    if (!trimmed) {
      return undefined;
    }

    const parsed = Number(trimmed);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  }, [contractIdFilter]);

  const loadLogs = useCallback(async () => {
    if (!canManage) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await listAuditLogs({
        scope: scope || undefined,
        search: search.trim() || undefined,
        contractId: parsedContractId,
        page: currentPage,
        size: PAGE_SIZE,
      });

      const actorNameMap = await resolveUserNamesById(
        response.content.map((log) => log.usuarioResponsavelId ?? log.actorUserId)
      );

      setLogs(response.content);
      setActorNamesById(actorNameMap);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (requestError) {
      setError(getUserErrorMessage(requestError, "Não foi possível carregar a auditoria."));
      setLogs([]);
      setActorNamesById({});
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [canManage, currentPage, parsedContractId, scope, search]);

  useEffect(() => {
    if (!canManage) {
      return;
    }

    void loadLogs();
  }, [canManage, loadLogs]);

  const emptyMessage = useMemo(() => {
    if (loading) {
      return "Carregando eventos de auditoria...";
    }

    return "Nenhum evento encontrado para os filtros selecionados.";
  }, [loading]);

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <NavBar />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-2xl font-bold text-zinc-900">Auditoria administrativa</h1>
          <p className="text-sm text-zinc-600">
            Timeline consolidada das ações administrativas e operacionais do sistema.
          </p>
        </header>

        {loadingAccess && (
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-600">Validando permissão...</p>
          </section>
        )}

        {!loadingAccess && !canManage && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <p className="text-sm text-amber-800">Acesso permitido apenas para owner, superadmin e admin.</p>
          </section>
        )}

        {!loadingAccess && canManage && (
          <>
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-1">
                  <label htmlFor="auditScope" className="text-sm font-medium text-zinc-700">
                    Escopo
                  </label>
                  <Dropdown
                    options={scopeOptions}
                    value={scope}
                    onChange={(value) => {
                      setScope((value ?? "") as AuditScopeEnum | "");
                      setCurrentPage(0);
                    }}
                    className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="auditContractId" className="text-sm font-medium text-zinc-700">
                    Contrato
                  </label>
                  <input
                    id="auditContractId"
                    type="number"
                    min={1}
                    value={contractIdFilter}
                    onChange={(event) => {
                      setContractIdFilter(event.target.value);
                      setCurrentPage(0);
                    }}
                    className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
                    placeholder="ID opcional"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label htmlFor="auditSearch" className="text-sm font-medium text-zinc-700">
                    Busca
                  </label>
                  <input
                    id="auditSearch"
                    type="search"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setCurrentPage(0);
                    }}
                    className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
                    placeholder="Resumo, entidade, usuário ou descrição"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" onClick={() => void loadLogs()} disabled={loading}>
                  Atualizar
                </Button>
                <p className="text-sm text-zinc-500">
                  {totalElements} registro(s) encontrado(s)
                </p>
              </div>
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
                    {logs.map((log) => (
                      <AuditLogCard
                        key={log.auditId || log.id}
                        log={log}
                        actorNamesById={actorNamesById}
                        actorRoleLabel={resolveActorRoleLabel(log)}
                        showScopeBadge
                        className="bg-zinc-50/60"
                      />
                    ))}
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
