"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Edit,
  Save,
  X,
  CheckCircle,
  FileText,
  Upload,
  Eye,
  Download,
  Trash2,
  File,
  FileSpreadsheet,
  Image,
  Plus,
  Folder,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { NovoArquivoModal } from "./_components/NovoArquivoModal";
import { EditarArquivoModal } from "./_components/EditarArquivoModal";

// Tipos
type TipoArquivo =
  | "CONTRATO_ASSINADO"
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
  | "OUTROS";

export interface Arquivo {
  id: string;
  nome: string;
  tipo: TipoArquivo;
  tamanho: number;
  formato: string;
  dataUpload: string;
  uploadPor: string;
  descricao: string;
  url: string;
}

export type { TipoArquivo };

// Labels dos tipos
const tipoLabels: Record<TipoArquivo, string> = {
  CONTRATO_ASSINADO: "Contrato",
  PLANO_TRABALHO: "Plano de Trabalho",
  TERMO_REFERENCIA: "Termo de Referência",
  ATA_REUNIAO: "Ata de Reunião",
  RELATORIO_TECNICO: "Relatório Técnico",
  RELATORIO_FINANCEIRO: "Relatório Financeiro",
  COMPROVANTE_DESPESA: "Comprovante de Despesa",
  PROPOSTA_COMERCIAL: "Proposta comercial",
  ETP: "ETP",
  RELATORIO_INCUBADAS: "Relatórios de Incubadas",
  NOTA_FISCAL: "Nota Fiscal",
  TED: "TED",
  COMPROVANTES: "Comprovantes",
  OUTROS: "Outros",
};

// Cores dos tipos
const tipoCores: Record<TipoArquivo, string> = {
  CONTRATO_ASSINADO: "bg-purple-100 text-purple-800",
  PLANO_TRABALHO: "bg-blue-100 text-blue-800",
  TERMO_REFERENCIA: "bg-green-100 text-green-800",
  ATA_REUNIAO: "bg-orange-100 text-orange-800",
  RELATORIO_TECNICO: "bg-cyan-100 text-cyan-800",
  RELATORIO_FINANCEIRO: "bg-yellow-100 text-yellow-800",
  COMPROVANTE_DESPESA: "bg-red-100 text-red-800",
  PROPOSTA_COMERCIAL: "bg-indigo-100 text-indigo-800",
  ETP: "bg-teal-100 text-teal-800",
  RELATORIO_INCUBADAS: "bg-pink-100 text-pink-800",
  NOTA_FISCAL: "bg-amber-100 text-amber-800",
  TED: "bg-emerald-100 text-emerald-800",
  COMPROVANTES: "bg-rose-100 text-rose-800",
  OUTROS: "bg-gray-100 text-gray-800",
};

// Dados mockados
const arquivosMock: Arquivo[] = [
  {
    id: "1",
    nome: "Contrato_001_2024_Assinado.pdf",
    tipo: "CONTRATO_ASSINADO",
    tamanho: 2500000,
    formato: "pdf",
    dataUpload: "2024-01-15",
    uploadPor: "João Silva",
    descricao: "Contrato principal assinado por todas as partes",
    url: "#",
  },
  {
    id: "2",
    nome: "Plano_de_Trabalho_v2.pdf",
    tipo: "PLANO_TRABALHO",
    tamanho: 1200000,
    formato: "pdf",
    dataUpload: "2024-01-18",
    uploadPor: "Maria Santos",
    descricao: "Versão final do plano de trabalho aprovado",
    url: "#",
  },
  {
    id: "3",
    nome: "TR_Consultoria_TI.docx",
    tipo: "TERMO_REFERENCIA",
    tamanho: 850000,
    formato: "docx",
    dataUpload: "2024-01-20",
    uploadPor: "Carlos Oliveira",
    descricao: "Termo de referência para contratação de consultoria",
    url: "#",
  },
  {
    id: "4",
    nome: "Ata_Reuniao_Kickoff.pdf",
    tipo: "ATA_REUNIAO",
    tamanho: 320000,
    formato: "pdf",
    dataUpload: "2024-02-01",
    uploadPor: "Ana Costa",
    descricao: "Ata da reunião de kickoff do projeto",
    url: "#",
  },
  {
    id: "5",
    nome: "Relatorio_Mensal_Janeiro.xlsx",
    tipo: "RELATORIO_FINANCEIRO",
    tamanho: 450000,
    formato: "xlsx",
    dataUpload: "2024-02-05",
    uploadPor: "Pedro Lima",
    descricao: "Relatório financeiro do mês de janeiro",
    url: "#",
  },
];

// Formatos aceitos
const formatosAceitos = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";
const tamanhoMaximo = 100 * 1024 * 1024; // 100MB

// Formatar tamanho
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// Formatar data
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("pt-BR");
};

// Ícone por formato
const getFileIcon = (formato: string) => {
  const iconClass = "w-10 h-10";
  switch (formato.toLowerCase()) {
    case "pdf":
      return <FileText className={`${iconClass} text-red-500`} />;
    case "doc":
    case "docx":
      return <File className={`${iconClass} text-blue-500`} />;
    case "xls":
    case "xlsx":
      return <FileSpreadsheet className={`${iconClass} text-green-600`} />;
    case "png":
    case "jpg":
    case "jpeg":
      return <Image className={`${iconClass} text-purple-500`} />;
    default:
      return <File className={`${iconClass} text-gray-500`} />;
  }
};

export default function ArquivosPage() {
  const params = useParams();
  const contratoId = params.contratoId as string;

  const [isEditing, setIsEditing] = useState(false);
  const [arquivos, setArquivos] = useState<Arquivo[]>(arquivosMock);
  const [editArquivos, setEditArquivos] = useState<Arquivo[]>(arquivosMock);
  const [filtroTipo, setFiltroTipo] = useState<TipoArquivo | "TODOS">("TODOS");
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [isNovoArquivoModalOpen, setIsNovoArquivoModalOpen] = useState(false);
  const [arquivoParaEditar, setArquivoParaEditar] = useState<Arquivo | null>(null);
  const [isEditarArquivoModalOpen, setIsEditarArquivoModalOpen] = useState(false);
  const [pastasAbertas, setPastasAbertas] = useState<Record<string, boolean>>({});

  const togglePasta = (tipo: string) => {
    setPastasAbertas((prev) => ({
      ...prev,
      [tipo]: !prev[tipo],
    }));
  };

  const handleEdit = () => {
    setEditArquivos(JSON.parse(JSON.stringify(arquivos)));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditArquivos(JSON.parse(JSON.stringify(arquivos)));
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setArquivos(JSON.parse(JSON.stringify(editArquivos)));
    setIsSaving(false);
    setIsEditing(false);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este arquivo?")) {
      setEditArquivos(editArquivos.filter((a) => a.id !== id));
    }
  };

  // Handle novo arquivo
  const handleNovoArquivo = async (formData: { tipo: TipoArquivo; arquivo: File | null; descricao: string }) => {
    if (!formData.arquivo) return;

    const novoArquivo: Arquivo = {
      id: Date.now().toString(),
      nome: formData.arquivo.name,
      tipo: formData.tipo,
      tamanho: formData.arquivo.size,
      formato: formData.arquivo.name.split(".").pop() || "",
      dataUpload: new Date().toISOString().split("T")[0],
      uploadPor: "Usuário Atual",
      descricao: formData.descricao,
      url: "#",
    };

    if (isEditing) {
      setEditArquivos([novoArquivo, ...editArquivos]);
    } else {
      setArquivos([novoArquivo, ...arquivos]);
    }
    setIsNovoArquivoModalOpen(false);
  };

  // Handle editar arquivo
  const handleEditarArquivo = async (data: { id: string; tipo: TipoArquivo; arquivo: File | null; descricao: string }) => {
    const arquivoAtualizado = editArquivos.find(a => a.id === data.id);
    if (!arquivoAtualizado) return;

    const arquivoEditado: Arquivo = {
      ...arquivoAtualizado,
      tipo: data.tipo,
      descricao: data.descricao,
      ...(data.arquivo && {
        nome: data.arquivo.name,
        tamanho: data.arquivo.size,
        formato: data.arquivo.name.split(".").pop() || "",
      }),
    };

    setEditArquivos(editArquivos.map(a => a.id === data.id ? arquivoEditado : a));
    setIsEditarArquivoModalOpen(false);
    setArquivoParaEditar(null);
  };

  // Abrir modal de edição
  const handleOpenEditarArquivo = (arquivo: Arquivo) => {
    setArquivoParaEditar(arquivo);
    setIsEditarArquivoModalOpen(true);
  };

  // Dados a exibir
  const currentArquivos = isEditing ? editArquivos : arquivos;
  const arquivosFiltrados =
    filtroTipo === "TODOS"
      ? currentArquivos
      : currentArquivos.filter((a) => a.tipo === filtroTipo);

  // Agrupar arquivos por tipo
  const arquivosPorTipo = arquivosFiltrados.reduce((acc, arquivo) => {
    if (!acc[arquivo.tipo]) {
      acc[arquivo.tipo] = [];
    }
    acc[arquivo.tipo].push(arquivo);
    return acc;
  }, {} as Record<TipoArquivo, Arquivo[]>);

  // Obter tipos ordenados que possuem arquivos
  const tiposComArquivos = Object.keys(arquivosPorTipo).sort((a, b) => 
    tipoLabels[a as TipoArquivo].localeCompare(tipoLabels[b as TipoArquivo], "pt-BR")
  ) as TipoArquivo[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Documentos do Contrato
          </h2>
          <p className="text-sm text-gray-500">
            Arquivos e documentos vinculados a este contrato
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {savedMessage && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              Salvo com sucesso!
            </div>
          )}
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsNovoArquivoModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Arquivo
                </button>
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Salvando..." : "Salvar"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filtro dropdown adicional */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-gray-600">Filtrar por tipo:</label>
        <select
          value={filtroTipo}
          onChange={(e) =>
            setFiltroTipo(e.target.value as TipoArquivo | "TODOS")
          }
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="TODOS">Todos os tipos</option>
          {Object.entries(tipoLabels)
            .sort(([, labelA], [, labelB]) => labelA.localeCompare(labelB, "pt-BR"))
            .map(([tipo, label]) => (
              <option key={tipo} value={tipo}>
                {label}
              </option>
            ))}
        </select>
        <span className="text-sm text-gray-500">
          {arquivosFiltrados.length} arquivo(s) encontrado(s)
        </span>
      </div>

      {/* Lista de arquivos organizada por pastas */}
      {arquivosFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum arquivo encontrado</p>
          {filtroTipo !== "TODOS" && (
            <button
              onClick={() => setFiltroTipo("TODOS")}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              Limpar filtro
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {tiposComArquivos.map((tipo) => (
            <div key={tipo} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              {/* Cabeçalho da Pasta */}
              <button
                onClick={() => togglePasta(tipo)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {pastasAbertas[tipo] ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  <Folder className={`w-6 h-6 ${pastasAbertas[tipo] ? "text-[#004225]" : "text-gray-400"}`} />
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">{tipoLabels[tipo]}</h3>
                    <p className="text-xs text-gray-500">
                      {arquivosPorTipo[tipo].length} {arquivosPorTipo[tipo].length === 1 ? "arquivo" : "arquivos"}
                    </p>
                  </div>
                </div>
              </button>

              {/* Conteúdo da Pasta */}
              {pastasAbertas[tipo] && (
                <div className="border-t border-gray-200 divide-y divide-gray-100">
                  {arquivosPorTipo[tipo].map((arquivo) => (
                    <div
                      key={arquivo.id}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors pl-12"
                    >
                      {/* Ícone */}
                      <div className="flex-shrink-0">{getFileIcon(arquivo.formato)}</div>

                      {/* Info do arquivo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 truncate">
                            {arquivo.nome}
                          </h4>
                        </div>
                        {arquivo.descricao && (
                          <p className="text-sm text-gray-600 mt-1">
                            {arquivo.descricao}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{formatFileSize(arquivo.tamanho)}</span>
                          <span>•</span>
                          <span>{formatDate(arquivo.dataUpload)}</span>
                          <span>•</span>
                          <span>Por: {arquivo.uploadPor}</span>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => window.open(arquivo.url, "_blank")}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Visualizar"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = arquivo.url;
                            link.download = arquivo.nome;
                            link.click();
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Baixar"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        {isEditing && (
                          <>
                            <button
                              onClick={() => handleOpenEditarArquivo(arquivo)}
                              className="p-2 text-[#004225] hover:bg-emerald-50 rounded-lg"
                              title="Editar"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(arquivo.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Excluir"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo Arquivo */}
      <NovoArquivoModal
        isOpen={isNovoArquivoModalOpen}
        onClose={() => setIsNovoArquivoModalOpen(false)}
        onSubmit={handleNovoArquivo}
      />

      {/* Modal Editar Arquivo */}
      <EditarArquivoModal
        isOpen={isEditarArquivoModalOpen}
        onClose={() => {
          setIsEditarArquivoModalOpen(false);
          setArquivoParaEditar(null);
        }}
        arquivo={arquivoParaEditar}
        onSubmit={handleEditarArquivo}
      />
    </div>
  );
}
