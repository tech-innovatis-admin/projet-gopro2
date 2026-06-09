'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, Edit2, Landmark, Link2, Plus } from 'lucide-react';
import { Dropdown, type DropdownOption } from '@/components/ui/dropdown';
import { AppModalShell } from '@/components/ui/app-modal-shell';
import { listPartners, createPartner } from '@/src/lib/api/endpoints';
import { canManageContractChildren, fetchCurrentUser, requireCurrentUserId } from '@/src/lib/auth/session';
import { ContractLinkedItemsLoadingSkeleton } from '../_components/ContractLoadingSkeleton';
import { NovoParceiroModal } from '@/src/app/(dashboard)/parceiros/_components/NovoParceiroModal';
import { mapParceiroFormToPartnerRequestDTO } from '@/src/app/(dashboard)/parceiros/mappers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PartnersType = 'IF' | 'FUNDACAO';

type ContractingStatus =
  | 'EM_CADASTRO'
  | 'EM_CONTRATACAO'
  | 'CONTRATADA'
  | 'EM_EXECUCAO'
  | 'CONCLUIDA'
  | 'CANCELADA';

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
  status: ContractingStatus | null;
  totalValue: number | null;
  totalExecutado: number | null;
  totalPago: number | null;
  totalReservado: number | null;
  totalPagamentoRecebido: number | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
};

type EditForm = {
  status: ContractingStatus;
  totalValue: string;
  startDate: string;
  endDate: string;
  notes: string;
};

type PageResponse<T> = {
  content: T[];
  last: boolean;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_PAGE_SIZE = 100;

const STATUS_LABELS: Record<ContractingStatus, string> = {
  EM_CADASTRO: 'Em Cadastro',
  EM_CONTRATACAO: 'Em Contratação',
  CONTRATADA: 'Contratada',
  EM_EXECUCAO: 'Em Execução',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

const STATUS_OPTIONS: DropdownOption[] = (
  Object.entries(STATUS_LABELS) as [ContractingStatus, string][]
).map(([value, label]) => ({ value, label }));

const STATUS_BADGE_CLASS: Record<ContractingStatus, string> = {
  EM_CADASTRO: 'bg-gray-100 text-gray-700',
  EM_CONTRATACAO: 'bg-blue-100 text-blue-700',
  CONTRATADA: 'bg-emerald-100 text-emerald-700',
  EM_EXECUCAO: 'bg-teal-100 text-teal-700',
  CONCLUIDA: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-red-100 text-red-700',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function formatCurrency(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateBr(iso: string | null | undefined) {
  if (!iso) return null;
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

function toIsoDate(value: string) {
  return value ? value : '';
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function fetchLinkedPartners(contratoId: string): Promise<ContractPartner[]> {
  const response = await fetch(`/api/backend/contracts/${contratoId}/parceiros?size=${DEFAULT_PAGE_SIZE}`);
  if (!response.ok) throw new Error('Não foi possível carregar os parceiros do contrato.');
  const payload = (await response.json()) as PageResponse<ContractPartner>;
  return payload.content ?? [];
}

async function linkPartner(contratoId: string, partnerId: number, createdBy: number): Promise<ContractPartner> {
  const response = await fetch(`/api/backend/contracts/${contratoId}/parceiros`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId: Number(contratoId), partnerId, status: 'CONTRATADA', createdBy }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? 'Não foi possível vincular o parceiro.');
  }
  return (await response.json()) as ContractPartner;
}

async function updatePartnerLink(
  contratoId: string,
  parceiroId: number,
  data: {
    status: ContractingStatus;
    totalValue: number | null;
    startDate: string | null;
    endDate: string | null;
    notes: string | null;
    updatedBy: number;
  }
): Promise<ContractPartner> {
  const response = await fetch(`/api/backend/contracts/${contratoId}/parceiros/${parceiroId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? 'Não foi possível atualizar o parceiro.');
  }
  return (await response.json()) as ContractPartner;
}

async function unlinkPartner(contratoId: string, parceiroId: number) {
  const response = await fetch(`/api/backend/contracts/${contratoId}/parceiros/${parceiroId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? 'Não foi possível desvincular o parceiro.');
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ParceirosDoContratoPage() {
  const params = useParams<{ contratoId: string }>();
  const contratoId = params.contratoId;
  const projectId = parseProjectId(contratoId);

  const [canManageChildren, setCanManageChildren] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);

  const [partners, setPartners] = useState<ContractPartner[]>([]);
  const [allPartners, setAllPartners] = useState<PartnerOption[]>([]);

  // link modal
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | undefined>();
  const [isLinking, setIsLinking] = useState(false);

  // create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // edit modal
  const [editingPartner, setEditingPartner] = useState<ContractPartner | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    status: 'EM_CADASTRO',
    totalValue: '',
    startDate: '',
    endDate: '',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ---------------------------------------------------------------------------
  // Access check
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    async function loadAccess() {
      try {
        const user = await fetchCurrentUser();
        if (!cancelled) setCanManageChildren(canManageContractChildren(user));
      } finally {
        if (!cancelled) setLoadingAccess(false);
      }
    }
    void loadAccess();
    return () => { cancelled = true; };
  }, []);

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------
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
            tradeName: item.tradeName ?? null,
            partnersType: item.partnersType as PartnersType,
            isActive: item.isActive,
          }))
          .sort((a, b) => getPartnerLabel(a).localeCompare(getPartnerLabel(b), 'pt-BR'))
      );
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Não foi possível carregar os parceiros.'));
    } finally {
      setIsLoading(false);
    }
  }, [contratoId, projectId]);

  useEffect(() => { void loadData(); }, [loadData]);

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------
  const availablePartnerOptions = useMemo<DropdownOption[]>(
    () =>
      allPartners.map((partner) => ({
        value: String(partner.id),
        label: `${getPartnerLabel(partner)} (${formatPartnerType(partner.partnersType)})`,
      })),
    [allPartners]
  );

  const totalValue = useMemo(
    () => partners.reduce((sum, p) => sum + (p.totalValue ?? 0), 0),
    [partners]
  );

  const totalExecutado = useMemo(
    () => partners.reduce((sum, p) => sum + (p.totalExecutado ?? 0), 0),
    [partners]
  );

  // ---------------------------------------------------------------------------
  // Link handler
  // ---------------------------------------------------------------------------
  const handleLinkPartner = async () => {
    if (!selectedPartnerId) return;
    setIsLinking(true);
    setActionError(null);
    try {
      const actorUserId = await requireCurrentUserId();
      await linkPartner(contratoId, Number(selectedPartnerId), actorUserId);
      setIsLinkModalOpen(false);
      setSelectedPartnerId(undefined);
      await loadData();
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (error) {
      setActionError(getErrorMessage(error, 'Não foi possível vincular o parceiro.'));
    } finally {
      setIsLinking(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Create handler
  // ---------------------------------------------------------------------------
  const handleCreateAndLink = async (
    formData: Parameters<typeof mapParceiroFormToPartnerRequestDTO>[0]
  ) => {
    const actorUserId = await requireCurrentUserId();
    const payload = mapParceiroFormToPartnerRequestDTO(formData);
    const created = await createPartner({ ...payload, createdBy: actorUserId });
    await linkPartner(contratoId, created.id, actorUserId);
    setIsCreateModalOpen(false);
    await loadData();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  // ---------------------------------------------------------------------------
  // Edit modal
  // ---------------------------------------------------------------------------
  const openEditModal = (partner: ContractPartner) => {
    setEditingPartner(partner);
    setEditForm({
      status: partner.status ?? 'EM_CADASTRO',
      totalValue: partner.totalValue != null ? String(partner.totalValue) : '',
      startDate: partner.startDate ? partner.startDate.split('T')[0] : '',
      endDate: partner.endDate ? partner.endDate.split('T')[0] : '',
      notes: partner.notes ?? '',
    });
    setActionError(null);
  };

  const closeEditModal = () => {
    setEditingPartner(null);
    setEditForm({ status: 'EM_CADASTRO', totalValue: '', startDate: '', endDate: '', notes: '' });
    setActionError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingPartner) return;
    setIsSaving(true);
    setActionError(null);
    try {
      const actorUserId = await requireCurrentUserId();
      const totalValueParsed = editForm.totalValue.trim()
        ? Number(editForm.totalValue.replace(',', '.'))
        : null;
      await updatePartnerLink(contratoId, editingPartner.id, {
        status: editForm.status,
        totalValue: totalValueParsed != null && Number.isFinite(totalValueParsed) ? totalValueParsed : null,
        startDate: toIsoDate(editForm.startDate) || null,
        endDate: toIsoDate(editForm.endDate) || null,
        notes: editForm.notes.trim() || null,
        updatedBy: actorUserId,
      });
      closeEditModal();
      await loadData();
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (error) {
      setActionError(getErrorMessage(error, 'Não foi possível salvar as alterações.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePartner = async () => {
    if (!editingPartner) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      await unlinkPartner(contratoId, editingPartner.id);
      closeEditModal();
      await loadData();
    } catch (error) {
      setActionError(getErrorMessage(error, 'Não foi possível desvincular o parceiro.'));
    } finally {
      setIsDeleting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Parceiros do Contrato</h2>
          <p className="text-sm text-gray-500">Vínculos do tipo IF ou Fundação associados a este projeto.</p>
        </div>
        <div className="flex items-center gap-3">
          {savedMessage && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              Salvo com sucesso!
            </div>
          )}
          {canManageChildren && (
            <>
              <button
                onClick={() => setIsLinkModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#004225] bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                <Link2 className="h-4 w-4" />
                Vincular existente
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
              >
                <Plus className="h-4 w-4" />
                Novo parceiro
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error banners */}
      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>
      )}
      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
      )}
      {!loadingAccess && !canManageChildren && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Seu perfil pode consultar os parceiros vinculados, mas não pode vincular, editar ou remover.
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <ContractLinkedItemsLoadingSkeleton titleWidthClassName="w-52" />
      ) : partners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <Landmark className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Nenhum parceiro vinculado</h3>
          <p className="text-sm text-gray-500 mb-4">Vincule uma IF ou Fundação a este projeto.</p>
          {canManageChildren && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsLinkModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#004225] bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                <Link2 className="h-4 w-4" />
                Vincular existente
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
              >
                <Plus className="h-4 w-4" />
                Novo parceiro
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {partners.map((partner) => {
            const statusLabel = partner.status ? (STATUS_LABELS[partner.status] ?? partner.status) : 'Sem status';
            const statusBadge = partner.status ? (STATUS_BADGE_CLASS[partner.status] ?? 'bg-gray-100 text-gray-700') : 'bg-gray-100 text-gray-700';
            const displayName = partner.partnerTradeName?.trim() || partner.partnerName;
            const subtitle = partner.partnerTradeName?.trim() && partner.partnerTradeName !== partner.partnerName
              ? partner.partnerName
              : null;

            return (
              <div key={partner.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                {/* Card header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg flex-shrink-0">
                      <Landmark className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 leading-tight">{displayName}</h3>
                      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{formatPartnerType(partner.partnerType)}</p>
                    </div>
                  </div>
                  {canManageChildren ? (
                    <button
                      onClick={() => openEditModal(partner)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#004225] border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex-shrink-0"
                      title="Editar"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Editar
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 flex-shrink-0">Somente leitura</span>
                  )}
                </div>

                {/* Card body */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {partner.notes && (
                    <p className="text-xs text-gray-500 line-clamp-2">{partner.notes}</p>
                  )}
                </div>

                {/* Resumo financeiro de pagamentos */}
                <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Pago</span>
                    <span className="font-medium text-green-700">{formatCurrency(partner.totalPago)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Reservado</span>
                    <span className="font-medium text-blue-700">{formatCurrency(partner.totalReservado)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-gray-200 pt-1.5 mt-1">
                    <span className="font-medium text-gray-700">Total executado</span>
                    <span className="font-semibold text-[#004225]">{formatCurrency(partner.totalExecutado)}</span>
                  </div>
                </div>

                {/* Card footer */}
                <div className="flex items-end justify-between mt-3 pt-3 border-t border-gray-100 gap-3">
                  <div className="text-xs text-gray-500">
                    {partner.startDate || partner.endDate
                      ? [formatDateBr(partner.startDate), formatDateBr(partner.endDate)]
                          .filter(Boolean)
                          .join(' até ')
                      : 'Período não informado'}
                  </div>
                  {partner.totalValue != null && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Valor contratado</p>
                      <span className="font-semibold text-gray-700 text-sm">
                        {formatCurrency(partner.totalValue)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer totals */}
      {partners.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-sm font-medium text-gray-700">
            Total: <strong className="text-gray-900">{partners.length}</strong>{' '}
            parceiro{partners.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              Valor contratado: <strong className="text-gray-900">{formatCurrency(totalValue)}</strong>
            </span>
            <span>
              Total executado: <strong className="text-[#004225]">{formatCurrency(totalExecutado)}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Link modal */}
      <AppModalShell
        isOpen={isLinkModalOpen}
        title="Vincular parceiro"
        description="Selecione uma IF ou Fundação para associar a este projeto."
        icon={<Link2 className="h-5 w-5" />}
        tone="brand"
        onClose={() => { setIsLinkModalOpen(false); setSelectedPartnerId(undefined); }}
        maxWidthClassName="max-w-md"
        footer={({ requestClose }) => (
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={requestClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleLinkPartner()}
              disabled={!selectedPartnerId || isLinking}
              className="rounded-lg bg-[#004225] px-5 py-2 text-sm font-medium text-white hover:bg-[#003319] disabled:opacity-50"
            >
              {isLinking ? 'Vinculando...' : 'Vincular'}
            </button>
          </div>
        )}
      >
        {availablePartnerOptions.length === 0 ? (
          <p className="text-sm text-gray-500">
            Não há IFs ou Fundações disponíveis para vincular (todas já estão vinculadas ou não existem cadastros ativos).
          </p>
        ) : (
          <Dropdown
            options={availablePartnerOptions}
            value={selectedPartnerId}
            onChange={setSelectedPartnerId}
            placeholder="Selecione o parceiro"
            searchable
            className="w-full"
          />
        )}
      </AppModalShell>

      {/* Create modal */}
      <NovoParceiroModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateAndLink}
      />

      {/* Edit modal */}
      {editingPartner && (
        <AppModalShell
          isOpen={!!editingPartner}
          title={`Editar — ${editingPartner.partnerTradeName?.trim() || editingPartner.partnerName}`}
          description={`${formatPartnerType(editingPartner.partnerType)} · Vínculo #${editingPartner.id}`}
          icon={<Edit2 className="h-5 w-5" />}
          tone="brand"
          onClose={closeEditModal}
          maxWidthClassName="max-w-lg"
          footer={({ requestClose }) => (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => void handleDeletePartner()}
                disabled={isDeleting || isSaving}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {isDeleting ? 'Desvinculando...' : 'Desvincular'}
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={requestClose}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveEdit()}
                  disabled={isSaving || isDeleting}
                  className="rounded-lg bg-[#004225] px-5 py-2 text-sm font-medium text-white hover:bg-[#003319] disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          )}
        >
          <div className="space-y-4">
            {/* Status */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label>
              <Dropdown
                options={STATUS_OPTIONS}
                value={editForm.status}
                onChange={(v) => setEditForm((f) => ({ ...f, status: (v ?? 'EM_CADASTRO') as ContractingStatus }))}
                placeholder="Selecione o status"
                className="w-full"
              />
            </div>

            {/* Valor total */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Valor total (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editForm.totalValue}
                onChange={(e) => setEditForm((f) => ({ ...f, totalValue: e.target.value }))}
                placeholder="0,00"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#004225] focus:outline-none focus:ring-1 focus:ring-[#004225]"
              />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Data início</label>
                <input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#004225] focus:outline-none focus:ring-1 focus:ring-[#004225]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Data fim</label>
                <input
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#004225] focus:outline-none focus:ring-1 focus:ring-[#004225]"
                />
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Observações</label>
              <textarea
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Informações adicionais sobre o parceiro neste projeto..."
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#004225] focus:outline-none focus:ring-1 focus:ring-[#004225]"
              />
            </div>

            {actionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {actionError}
              </div>
            )}
          </div>
        </AppModalShell>
      )}
    </div>
  );
}
