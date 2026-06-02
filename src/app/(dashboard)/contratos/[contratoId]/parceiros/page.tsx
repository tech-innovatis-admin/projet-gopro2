'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Trash2, X } from 'lucide-react';
import { Dropdown, type DropdownOption } from '@/components/ui/dropdown';
import { listPartners } from '@/src/lib/api/endpoints';
import { canManageContractChildren, fetchCurrentUser, requireCurrentUserId } from '@/src/lib/auth/session';

type PartnersType = 'IF' | 'FUNDACAO';

type PartnerOption = {
  id: number;
  name: string;
  tradeName: string | null;
  partnersType: PartnersType;
  isActive: boolean;
};

type ContractPartner = {
  id: number;
  projectId: number;
  partnerId: number;
  partnerName: string;
  partnerTradeName: string | null;
  partnerType: PartnersType;
  status: string;
  totalValue: number | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
};

type PageResponse<T> = {
  content: T[];
  last: boolean;
};

const DEFAULT_PAGE_SIZE = 100;

function parseProjectId(rawId: string) {
  const parsed = Number(rawId);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getPartnerLabel(partner: PartnerOption) {
  const tradeName = partner.tradeName?.trim();
  const name = partner.name?.trim();
  return tradeName && tradeName !== name ? `${tradeName} - ${name}` : name || `Parceiro #${partner.id}`;
}

function formatPartnerType(type: PartnersType) {
  return type === 'IF' ? 'IF' : 'Fundação';
}

async function fetchLinkedPartners(contratoId: string): Promise<ContractPartner[]> {
  const response = await fetch(`/api/backend/contracts/${contratoId}/parceiros?size=${DEFAULT_PAGE_SIZE}`);
  if (!response.ok) {
    throw new Error('Nao foi possivel carregar os parceiros do contrato.');
  }
  const payload = (await response.json()) as PageResponse<ContractPartner>;
  return payload.content ?? [];
}

async function linkPartner(contratoId: string, partnerId: number, createdBy: number) {
  const response = await fetch(`/api/backend/contracts/${contratoId}/parceiros`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectId: Number(contratoId),
      partnerId,
      status: 'EM_CADASTRO',
      createdBy,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? 'Nao foi possivel vincular o parceiro.');
  }
}

async function unlinkPartner(contratoId: string, parceiroId: number) {
  const response = await fetch(`/api/backend/contracts/${contratoId}/parceiros/${parceiroId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? 'Nao foi possivel desvincular o parceiro.');
  }
}

export default function ParceirosDoContratoPage() {
  const params = useParams<{ contratoId: string }>();
  const contratoId = params.contratoId;
  const projectId = parseProjectId(contratoId);

  const [canManageChildren, setCanManageChildren] = useState(false);
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [partners, setPartners] = useState<ContractPartner[]>([]);
  const [allPartners, setAllPartners] = useState<PartnerOption[]>([]);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | undefined>();
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAccess() {
      try {
        const user = await fetchCurrentUser();
        if (!cancelled) {
          setCanManageChildren(canManageContractChildren(user));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAccess(false);
        }
      }
    }

    void loadAccess();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!projectId) {
      setLoadError('ID do contrato inválido.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      setActionError(null);

      const [linkedPartners, allPartnersResponse] = await Promise.all([
        fetchLinkedPartners(contratoId),
        listPartners({ page: 0, size: DEFAULT_PAGE_SIZE }),
      ]);

      setPartners(linkedPartners.filter((item) => item.projectId === projectId));

      const linkedIds = new Set(linkedPartners.map((item) => item.partnerId));
      setAllPartners(
        allPartnersResponse.content
          .filter((item) => item.isActive !== false)
          .filter((item) => item.partnersType === 'IF' || item.partnersType === 'FUNDACAO')
          .filter((item) => !linkedIds.has(item.id))
          .map((item) => ({
            id: item.id,
            name: item.name,
            tradeName: item.tradeName,
            partnersType: item.partnersType,
            isActive: item.isActive,
          }))
          .sort((a, b) => getPartnerLabel(a).localeCompare(getPartnerLabel(b), 'pt-BR'))
      );
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Nao foi possivel carregar os parceiros.');
    } finally {
      setIsLoading(false);
    }
  }, [contratoId, projectId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const availablePartnerOptions = useMemo<DropdownOption[]>(
    () =>
      allPartners.map((partner) => ({
        value: String(partner.id),
        label: `${getPartnerLabel(partner)} - ${formatPartnerType(partner.partnersType)}`,
      })),
    [allPartners]
  );

  const canManage = canManageChildren && !isLoadingAccess;

  const handleLinkPartner = async () => {
    if (!selectedPartnerId) {
      return;
    }

    setIsLinking(true);
    setActionError(null);

    try {
      const actorUserId = await requireCurrentUserId();
      await linkPartner(contratoId, Number(selectedPartnerId), actorUserId);
      setIsLinkModalOpen(false);
      setSelectedPartnerId(undefined);
      await loadData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Nao foi possivel vincular o parceiro.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkPartner = async (partnerLinkId: number) => {
    setActionError(null);

    try {
      await unlinkPartner(contratoId, partnerLinkId);
      await loadData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Nao foi possivel desvincular o parceiro.');
    }
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-500">Carregando parceiros...</div>;
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Parceiros do contrato</h1>
          <p className="text-sm text-gray-500">Vínculos do tipo IF ou Fundação.</p>
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={() => setIsLinkModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#004225] px-4 py-2 text-sm font-medium text-white hover:bg-[#003319]"
          >
            <Plus className="h-4 w-4" />
            Vincular parceiro
          </button>
        ) : null}
      </div>

      {loadError ? <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div> : null}
      {actionError ? <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div> : null}

      {partners.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
          Nenhum parceiro vinculado ao contrato.
        </div>
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {partners.map((partner) => (
            <div key={partner.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {partner.partnerTradeName?.trim() ? `${partner.partnerTradeName} - ` : ''}
                  {partner.partnerName}
                </div>
                <div className="text-xs text-gray-500">
                  {formatPartnerType(partner.partnerType)} · {partner.status}
                </div>
              </div>
              {canManage ? (
                <button
                  type="button"
                  onClick={() => void handleUnlinkPartner(partner.id)}
                  className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                  title="Desvincular"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {isLinkModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Vincular parceiro</h2>
              <button
                type="button"
                onClick={() => {
                  setIsLinkModalOpen(false);
                  setSelectedPartnerId(undefined);
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <Dropdown
              options={availablePartnerOptions}
              value={selectedPartnerId}
              onChange={setSelectedPartnerId}
              placeholder="Selecione o parceiro"
              searchable
              className="w-full"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsLinkModalOpen(false);
                  setSelectedPartnerId(undefined);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleLinkPartner()}
                disabled={!selectedPartnerId || isLinking}
                className="rounded-lg bg-[#004225] px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {isLinking ? 'Vinculando...' : 'Vincular'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
