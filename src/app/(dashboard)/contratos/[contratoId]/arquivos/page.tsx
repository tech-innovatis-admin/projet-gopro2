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
  deleteDocument,
  generateDocumentDownloadUrl,
  listDocumentsByOwner,
  uploadDocument,
} from "@/src/lib/api/endpoints";
import { HttpError, type DocumentResponseDTO } from "@/src/lib/api/types";
import { NovoArquivoModal } from "./_components/NovoArquivoModal";
import { EditarArquivoModal } from "./_components/EditarArquivoModal";

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

const CATEGORY_LABELS: Record<ContractDocumentCategory, string> = {
  CONTRATO: "Contrato",
  PLANO_TRABALHO: "Plano de Trabalho",
  TERMO_REFERENCIA: "Termo de Referencia",
  ATA_REUNIAO: "Ata de Reuniao",
  RELATORIO_TECNICO: "Relatorio Tecnico",
  RELATORIO_FINANCEIRO: "Relatorio Financeiro",
  COMPROVANTE_DESPESA: "Comprovante de Despesa",
  PROPOSTA_COMERCIAL: "Proposta Comercial",
  ETP: "ETP",
  RELATORIO_INCUBADAS: "Relatorio de Incubadas",
  NOTA_FISCAL: "Nota Fiscal",
  TED: "TED",
  COMPROVANTES: "Comprovantes",
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
  "OUTRO",
];

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
  if (error instanceof HttpError && error.message) {
    return error.message;
  }
  return fallback;
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

export default function ArquivosPage() {
  const params = useParams();
  const contratoId = params.contratoId as string;
  const ownerId = Number(contratoId);
  const hasValidOwner = Number.isFinite(ownerId) && ownerId > 0;

  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [filterCategory, setFilterCategory] = useState<FilterCategory>("ALL");
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ContractDocument | null>(
    null
  );

  const loadDocuments = useCallback(async () => {
    if (!hasValidOwner) {
      setError("ID de contrato invalido para buscar documentos.");
      setDocuments([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await listDocumentsByOwner({
        ownerType: "PROJECT",
        ownerId,
      });

      const mapped = response.map(mapDocument);
      setDocuments(mapped);
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
        getErrorMessage(loadError, "Nao foi possivel carregar os documentos.")
      );
      setDocuments([]);
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
        getErrorMessage(actionError, "Nao foi possivel abrir o arquivo selecionado.")
      );
    } finally {
      setBusyDocumentId(null);
    }
  };

  const handleCreateDocument = async (payload: UploadPayload) => {
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
        getErrorMessage(uploadError, "Nao foi possivel enviar o arquivo.")
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenReplaceModal = (item: ContractDocument) => {
    setSelectedDocument(item);
    setIsEditModalOpen(true);
  };

  const handleReplaceDocument = async (payload: ReplacePayload) => {
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
        getErrorMessage(replaceError, "Nao foi possivel substituir o arquivo.")
      );
    } finally {
      setIsReplacing(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    const confirmed = window.confirm("Deseja realmente excluir este arquivo?");
    if (!confirmed) return;

    setBusyDocumentId(documentId);
    setError(null);

    try {
      await deleteDocument(documentId);
      setMessage("Arquivo excluido com sucesso.");
      setDocuments((current) => current.filter((item) => item.id !== documentId));
    } catch (deleteError) {
      setError(
        getErrorMessage(deleteError, "Nao foi possivel excluir o arquivo.")
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
            Lista de arquivos vinculados ao contrato no backend/S3
          </p>
        </div>

        <div className="flex items-center gap-3">
          {message && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700">
              <CheckCircle className="h-4 w-4" />
              {message}
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#004225] px-4 py-2 text-sm font-medium text-white hover:bg-[#003319]"
          >
            <Plus className="h-4 w-4" />
            Novo Arquivo
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm text-gray-600">Filtrar por tipo:</label>
        <select
          value={filterCategory}
          onChange={(event) =>
            setFilterCategory(event.target.value as FilterCategory)
          }
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="ALL">Todos</option>
          {CATEGORY_OPTIONS.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
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
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#004225]" />
          <p className="mt-2 text-sm text-gray-500">Carregando arquivos...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <UploadCloud className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-800">
            Nenhum arquivo encontrado
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Envie documentos para este contrato usando o botao Novo Arquivo.
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

      {isCreateModalOpen && (
        <NovoArquivoModal
          isOpen={isCreateModalOpen}
          isSubmitting={isUploading}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateDocument}
        />
      )}

      {isEditModalOpen && selectedDocument && (
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
