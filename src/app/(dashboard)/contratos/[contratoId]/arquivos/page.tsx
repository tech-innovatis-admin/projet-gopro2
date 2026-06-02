"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  File,
  FileSpreadsheet,
  FileText,
  Folder,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  listBudgetCategories,
  listBudgetItems,
  listBudgetTransfers,
  deleteDocument,
  generateDocumentDownloadUrl,
  listDocumentsByOwner,
  uploadDocument,
} from "@/src/lib/api/endpoints";
import {
  canManageContractChildren,
  fetchCurrentUser,
} from "@/src/lib/auth/session";
import {
  type BudgetCategoryResponseDTO,
  type BudgetItemResponseDTO,
  type BudgetTransferResponseDTO,
  type DocumentResponseDTO,
  type PageResponseDTO,
} from "@/src/lib/api/types";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";
import { NovoArquivoModal } from "./_components/NovoArquivoModal";
import { EditarArquivoModal } from "./_components/EditarArquivoModal";
import { Dropdown } from "@/components/ui/dropdown";
import { ContractFilesLoadingSkeleton } from "../_components/ContractLoadingSkeleton";

export type ContractDocumentCategory =
  | "CONTRATO"
  | "PLANO_TRABALHO"
  | "TERMO_REFERENCIA"
  | "ATA_REUNIAO"
  | "RELATORIO_TECNICO"
  | "RELATORIO_FINANCEIRO"
  | "COMPROVANTE_DESPESA"
  | "PROPOSTA_COMERCIAL"
  | "ETP"
  | "RELATORIO_INCUBADAS"
  | "NOTA_FISCAL"
  | "TED"
  | "COMPROVANTES"
  | "TERMO_REMANEJAMENTO"
  | "OUTRO";

type FilterCategory = ContractDocumentCategory | "ALL";

export type ContractDocument = {
  id: string;
  originalName: string;
  category: ContractDocumentCategory;
  contentType: string;
  sizeBytes: number;
  createdAt: string | null;
  updatedAt: string | null;
};

type TransferDocumentContext = {
  transferId: number;
  originLabel: string;
  destinationLabel: string;
};

const CATEGORY_LABELS: Record<ContractDocumentCategory, string> = {
  CONTRATO: "Contrato",
  PLANO_TRABALHO: "Plano de Trabalho",
  TERMO_REFERENCIA: "Termo de Referencia",
  ATA_REUNIAO: "Ata de Reuniao",
  RELATORIO_TECNICO: "Relatório Técnico",
  RELATORIO_FINANCEIRO: "Relatório Financeiro",
  COMPROVANTE_DESPESA: "Comprovante de Despesa",
  PROPOSTA_COMERCIAL: "Proposta Comercial",
  ETP: "ETP",
  RELATORIO_INCUBADAS: "Relatório de Incubadas",
  NOTA_FISCAL: "Nota Fiscal",
  TED: "TED",
  COMPROVANTES: "Comprovantes",
  TERMO_REMANEJAMENTO: "Termo de Remanejamento",
  OUTRO: "Outros",
};

const CATEGORY_OPTIONS: ContractDocumentCategory[] = [
  "CONTRATO",
  "PLANO_TRABALHO",
  "TERMO_REFERENCIA",
  "ATA_REUNIAO",
  "RELATORIO_TECNICO",
  "RELATORIO_FINANCEIRO",
  "COMPROVANTE_DESPESA",
  "PROPOSTA_COMERCIAL",
  "ETP",
  "RELATORIO_INCUBADAS",
  "NOTA_FISCAL",
  "TED",
  "COMPROVANTES",
  "TERMO_REMANEJAMENTO",
  "OUTRO",
];

const PAGE_SIZE = 50;
const MAX_PAGE_REQUESTS = 200;

function normalizeCategory(value: string | null): ContractDocumentCategory {
  if (!value) return "OUTRO";
  const normalized = value.trim().toUpperCase();
  if (CATEGORY_OPTIONS.includes(normalized as ContractDocumentCategory)) {
    return normalized as ContractDocumentCategory;
  }
  if (normalized === "OUTROS") {
    return "OUTRO";
  }
  return "OUTRO";
}

function mapDocument(document: DocumentResponseDTO): ContractDocument {
  return {
    id: document.id,
    originalName: document.originalName,
    category: normalizeCategory(document.category),
    contentType: document.contentType,
    sizeBytes: document.sizeBytes,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("pt-BR");
  } catch {
    return value;
  }
}

function getFileIcon(contentType: string) {
  const iconClass = "h-5 w-5";
  if (contentType.includes("pdf")) {
    return <FileText className={`${iconClass} text-red-500`} />;
  }
  if (
    contentType.includes("sheet") ||
    contentType.includes("excel") ||
    contentType.includes("spreadsheet")
  ) {
    return <FileSpreadsheet className={`${iconClass} text-green-600`} />;
  }
  if (contentType.startsWith("image/")) {
    return <ImageIcon className={`${iconClass} text-indigo-500`} />;
  }
  return <File className={`${iconClass} text-slate-500`} />;
}

function getErrorMessage(error: unknown, fallback: string) {
  return getUserErrorMessage(error, fallback);
}

type UploadPayload = {
  category: ContractDocumentCategory;
  file: File;
};

type ReplacePayload = {
  id: string;
  category: ContractDocumentCategory;
  file: File;
};

async function fetchAllPages<T>(
  fetchPage: (query: { page: number; size: number }) => Promise<PageResponseDTO<T>>
): Promise<T[]> {
  const allItems: T[] = [];
  let page = 0;

  for (let attempt = 0; attempt < MAX_PAGE_REQUESTS; attempt += 1) {
    const response = await fetchPage({ page, size: PAGE_SIZE });
    allItems.push(...response.content);
    if (response.last) {
      break;
    }
    page += 1;
  }

  return allItems;
}

function buildRubricaItemLabel(
  itemId: number,
  items: Map<number, BudgetItemResponseDTO>,
  categories: Map<number, BudgetCategoryResponseDTO>
): string {
  const item = items.get(itemId);
  if (!item) {
    return `Item #${itemId}`;
  }

  const category = categories.get(item.categoryId);
  const rubricaLabel = category
    ? `[${category.code || `RUB-${category.id}`}] ${category.name}`
    : `Rubrica #${item.categoryId}`;

  return `${rubricaLabel} • ${item.description}`;
}

export default function ArquivosPage() {
  const params = useParams();
  const contratoId = params.contratoId as string;
  const ownerId = Number(contratoId);
  const hasValidOwner = Number.isFinite(ownerId) && ownerId > 0;

  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [canManageChildren, setCanManageChildren] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [transferContextsByDocumentId, setTransferContextsByDocumentId] = useState<
    Record<string, TransferDocumentContext>
  >({});

  const [filterCategory, setFilterCategory] = useState<FilterCategory>("ALL");
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ContractDocument | null>(
    null
  );

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
          setLoadingAccess(false);
        }
      }
    }

    void loadAccess();
    return () => {
      cancelled = true;
    };
  }, []);

  const ensureCanManageChildren = () => {
    if (canManageChildren) {
      return true;
    }

    setError("Seu perfil pode apenas visualizar os arquivos deste contrato.");
    return false;
  };

  const loadDocuments = useCallback(async () => {
    if (!hasValidOwner) {
      setError("ID de contrato inválido para buscar documentos.");
      setDocuments([]);
      setTransferContextsByDocumentId({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [response, transfers, budgetItems, budgetCategories] = await Promise.all([
        listDocumentsByOwner({
          ownerType: "PROJECT",
          ownerId,
        }),
        fetchAllPages((query) => listBudgetTransfers({ ...query, projectId: ownerId })),
        fetchAllPages((query) => listBudgetItems({ ...query, projectId: ownerId })),
        fetchAllPages((query) => listBudgetCategories({ ...query, projectId: ownerId })),
      ]);

      const mapped = response.map(mapDocument);
      const itemMap = new Map(budgetItems.map((item) => [item.id, item]));
      const categoryMap = new Map(budgetCategories.map((category) => [category.id, category]));
      const nextTransferContextsByDocumentId: Record<string, TransferDocumentContext> = {};

      transfers.forEach((transfer: BudgetTransferResponseDTO) => {
        if (!transfer.documentId) {
          return;
        }

        nextTransferContextsByDocumentId[transfer.documentId] = {
          transferId: transfer.id,
          originLabel: buildRubricaItemLabel(transfer.fromItemId, itemMap, categoryMap),
          destinationLabel: buildRubricaItemLabel(transfer.toItemId, itemMap, categoryMap),
        };
      });

      setDocuments(mapped);
      setTransferContextsByDocumentId(nextTransferContextsByDocumentId);
      setExpandedCategories((previous) => {
        const next = { ...previous };
        mapped.forEach((item) => {
          if (!(item.category in next)) {
            next[item.category] = true;
          }
        });
        return next;
      });
    } catch (loadError) {
      setError(
        getErrorMessage(loadError, "Não foi possível carregar os documentos.")
      );
      setDocuments([]);
      setTransferContextsByDocumentId({});
    } finally {
      setLoading(false);
    }
  }, [hasValidOwner, ownerId]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const filteredDocuments = useMemo(() => {
    if (filterCategory === "ALL") {
      return documents;
    }
    return documents.filter((item) => item.category === filterCategory);
  }, [documents, filterCategory]);

  const groupedDocuments = useMemo(() => {
    return filteredDocuments.reduce<Record<ContractDocumentCategory, ContractDocument[]>>(
      (acc, item) => {
        const bucket = acc[item.category] ?? [];
        bucket.push(item);
        acc[item.category] = bucket;
        return acc;
      },
      {} as Record<ContractDocumentCategory, ContractDocument[]>
    );
  }, [filteredDocuments]);

  const categoriesWithDocuments = useMemo(() => {
    return Object.keys(groupedDocuments).sort((a, b) =>
      CATEGORY_LABELS[a as ContractDocumentCategory].localeCompare(
        CATEGORY_LABELS[b as ContractDocumentCategory]
      )
    ) as ContractDocumentCategory[];
  }, [groupedDocuments]);

  const toggleCategory = (category: ContractDocumentCategory) => {
    setExpandedCategories((previous) => ({
      ...previous,
      [category]: !previous[category],
    }));
  };

  const handleViewOrDownload = async (
    documentId: string,
    fileName: string,
    mode: "view" | "download"
  ) => {
    setBusyDocumentId(documentId);
    setError(null);

    try {
      const signed = await generateDocumentDownloadUrl(documentId, {
        expiresInMinutes: 10,
      });

      if (mode === "view") {
        window.open(signed.url, "_blank", "noopener,noreferrer");
      } else {
        const link = document.createElement("a");
        link.href = signed.url;
        link.download = fileName;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (actionError) {
      setError(
        getErrorMessage(actionError, "Não foi possível abrir o arquivo selecionado.")
      );
    } finally {
      setBusyDocumentId(null);
    }
  };

  const handleCreateDocument = async (payload: UploadPayload) => {
    if (!ensureCanManageChildren()) return;
    if (!hasValidOwner) return;

    setIsUploading(true);
    setError(null);

    try {
      await uploadDocument({
        file: payload.file,
        ownerType: "PROJECT",
        ownerId,
        category: payload.category,
      });
      setMessage("Arquivo enviado com sucesso.");
      setIsCreateModalOpen(false);
      await loadDocuments();
    } catch (uploadError) {
      setError(
        getErrorMessage(uploadError, "Não foi possível enviar o arquivo.")
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenReplaceModal = (item: ContractDocument) => {
    if (!ensureCanManageChildren()) return;
    setSelectedDocument(item);
    setIsEditModalOpen(true);
  };

  const handleReplaceDocument = async (payload: ReplacePayload) => {
    if (!ensureCanManageChildren()) return;
    if (!hasValidOwner) return;

    setIsReplacing(true);
    setError(null);

    try {
      await uploadDocument({
        file: payload.file,
        ownerType: "PROJECT",
        ownerId,
        category: payload.category,
      });
      await deleteDocument(payload.id);
      setMessage("Arquivo substituido com sucesso.");
      setIsEditModalOpen(false);
      setSelectedDocument(null);
      await loadDocuments();
    } catch (replaceError) {
      setError(
        getErrorMessage(replaceError, "Não foi possível substituir o arquivo.")
      );
    } finally {
      setIsReplacing(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!ensureCanManageChildren()) return;
    const confirmed = window.confirm("Deseja realmente excluir este arquivo?");
    if (!confirmed) return;

    setBusyDocumentId(documentId);
    setError(null);

    try {
      await deleteDocument(documentId);
      setMessage("Arquivo excluído com sucesso.");
      setDocuments((current) => current.filter((item) => item.id !== documentId));
    } catch (deleteError) {
      setError(
        getErrorMessage(deleteError, "Não foi possível excluir o arquivo.")
      );
    } finally {
      setBusyDocumentId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Documentos do Contrato
          </h2>
          <p className="text-sm text-gray-500">
            Lista de arquivos vinculados ao contrato!
          </p>
        </div>

        <div className="flex items-center gap-3">
          {message && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700">
              <CheckCircle className="h-4 w-4" />
              {message}
            </div>
          )}
          {canManageChildren && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#004225] px-4 py-2 text-sm font-medium text-white hover:bg-[#003319]"
            >
              <Plus className="h-4 w-4" />
              Novo Arquivo
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {!loadingAccess && !canManageChildren && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Seu perfil pode consultar e baixar arquivos, mas não pode enviar, substituir ou excluir documentos.
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm text-gray-600">Filtrar por tipo:</label>
        <Dropdown
          options={CATEGORY_OPTIONS.map((category) => ({
            value: category,
            label: CATEGORY_LABELS[category],
          }))}
          value={filterCategory}
          onChange={(value) => setFilterCategory(value as FilterCategory)}
          placeholder="Selecione..."
          className="min-w-[280px]"
        />
        <span className="text-sm text-gray-500">
          {filteredDocuments.length} arquivo(s)
        </span>
        <button
          type="button"
          onClick={() => void loadDocuments()}
          className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Atualizar
        </button>
      </div>

      {loading ? (
        <ContractFilesLoadingSkeleton />
      ) : filteredDocuments.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <UploadCloud className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-800">
            Nenhum arquivo encontrado
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {canManageChildren
              ? "Envie documentos para este contrato usando o botão Novo Arquivo."
              : "Nenhum documento foi encontrado para este contrato."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {categoriesWithDocuments.map((category) => {
            const items = groupedDocuments[category];
            const isExpanded = expandedCategories[category] ?? true;
            return (
              <div
                key={category}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <Folder className="h-5 w-5 text-[#004225]" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {CATEGORY_LABELS[category]}
                      </p>
                      <p className="text-xs text-gray-500">
                        {items.length} arquivo(s)
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    {isExpanded ? "Ocultar" : "Mostrar"}
                  </span>
                </button>

                {isExpanded && (
                  <div className="divide-y divide-gray-100">
                    {items.map((item) => {
                      const isBusy = busyDocumentId === item.id;
                      const transferContext = transferContextsByDocumentId[item.id];
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 px-4 py-3"
                        >
                          <div className="rounded-lg bg-gray-50 p-2">
                            {getFileIcon(item.contentType)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {item.originalName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(item.sizeBytes)} •{" "}
                              {formatDate(item.createdAt)}
                            </p>
                            {transferContext && (
                              <div className="mt-1 space-y-1">
                                <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                  Remanejamento #{transferContext.transferId}
                                </span>
                                <p className="text-xs text-gray-500">
                                  Débito: {transferContext.originLabel}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Crédito: {transferContext.destinationLabel}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                void handleViewOrDownload(
                                  item.id,
                                  item.originalName,
                                  "view"
                                )
                              }
                              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                              title="Visualizar arquivo"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                void handleViewOrDownload(
                                  item.id,
                                  item.originalName,
                                  "download"
                                )
                              }
                              className="rounded-lg p-2 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                              title="Baixar arquivo"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            {canManageChildren && (
                              <>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleOpenReplaceModal(item)}
                                  className="rounded-lg p-2 text-[#004225] hover:bg-emerald-50 disabled:opacity-50"
                                  title="Editar (substituir)"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => void handleDeleteDocument(item.id)}
                                  className="rounded-lg p-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
                                  title="Excluir arquivo"
                                >
                                  {isBusy ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canManageChildren && isCreateModalOpen && (
        <NovoArquivoModal
          isOpen={isCreateModalOpen}
          isSubmitting={isUploading}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateDocument}
        />
      )}

      {canManageChildren && isEditModalOpen && selectedDocument && (
        <EditarArquivoModal
          isOpen={isEditModalOpen}
          arquivo={selectedDocument}
          isSubmitting={isReplacing}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedDocument(null);
          }}
          onSubmit={handleReplaceDocument}
        />
      )}
    </div>
  );
}
