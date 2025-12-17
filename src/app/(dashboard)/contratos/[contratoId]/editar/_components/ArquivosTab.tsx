'use client';

import { useState, useRef } from 'react';
import { Plus, Trash2, Download, FileText, File, FileSpreadsheet, Image, AlertCircle, Upload, Eye, X } from 'lucide-react';

// Props
interface ArquivosTabProps {
  contratoId?: string;
}

// Tipos
type TipoArquivo = 
  | 'CONTRATO_ASSINADO'
  | 'PLANO_TRABALHO'
  | 'TERMO_REFERENCIA'
  | 'ATA_REUNIAO'
  | 'RELATORIO_TECNICO'
  | 'RELATORIO_FINANCEIRO'
  | 'COMPROVANTE_DESPESA'
  | 'PROPOSTA_COMERCIAL'
  | 'ETP'
  | 'RELATORIO_INCUBADAS'
  | 'NOTA_FISCAL'
  | 'TED'
  | 'COMPROVANTES'
  | 'OUTROS';

interface Arquivo {
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

// Labels dos tipos
const tipoLabels: Record<TipoArquivo, string> = {
  CONTRATO_ASSINADO: 'Contrato',
  PLANO_TRABALHO: 'Plano de Trabalho',
  TERMO_REFERENCIA: 'Termo de Referência',
  ATA_REUNIAO: 'Ata de Reunião',
  RELATORIO_TECNICO: 'Relatório Técnico',
  RELATORIO_FINANCEIRO: 'Relatório Financeiro',
  COMPROVANTE_DESPESA: 'Comprovante de Despesa',
  PROPOSTA_COMERCIAL: 'Proposta comercial',
  ETP: 'ETP',
  RELATORIO_INCUBADAS: 'Relatórios de Incubadas',
  NOTA_FISCAL: 'Nota Fiscal',
  TED: 'TED',
  COMPROVANTES: 'Comprovantes',
  OUTROS: 'Outros',
};

// Cores dos tipos
const tipoCores: Record<TipoArquivo, string> = {
  CONTRATO_ASSINADO: 'bg-purple-100 text-purple-800',
  PLANO_TRABALHO: 'bg-blue-100 text-blue-800',
  TERMO_REFERENCIA: 'bg-green-100 text-green-800',
  ATA_REUNIAO: 'bg-orange-100 text-orange-800',
  RELATORIO_TECNICO: 'bg-cyan-100 text-cyan-800',
  RELATORIO_FINANCEIRO: 'bg-yellow-100 text-yellow-800',
  COMPROVANTE_DESPESA: 'bg-red-100 text-red-800',
  PROPOSTA_COMERCIAL: 'bg-indigo-100 text-indigo-800',
  ETP: 'bg-teal-100 text-teal-800',
  RELATORIO_INCUBADAS: 'bg-pink-100 text-pink-800',
  NOTA_FISCAL: 'bg-amber-100 text-amber-800',
  TED: 'bg-emerald-100 text-emerald-800',
  COMPROVANTES: 'bg-rose-100 text-rose-800',
  OUTROS: 'bg-gray-100 text-gray-800',
};

// Dados mockados
const arquivosMock: Arquivo[] = [
  {
    id: '1',
    nome: 'Contrato_001_2024_Assinado.pdf',
    tipo: 'CONTRATO_ASSINADO',
    tamanho: 2500000, // 2.5MB
    formato: 'pdf',
    dataUpload: '2024-01-15',
    uploadPor: 'João Silva',
    descricao: 'Contrato principal assinado por todas as partes',
    url: '#',
  },
  {
    id: '2',
    nome: 'Plano_de_Trabalho_v2.pdf',
    tipo: 'PLANO_TRABALHO',
    tamanho: 1200000, // 1.2MB
    formato: 'pdf',
    dataUpload: '2024-01-18',
    uploadPor: 'Maria Santos',
    descricao: 'Versão final do plano de trabalho aprovado',
    url: '#',
  },
  {
    id: '3',
    nome: 'TR_Consultoria_TI.docx',
    tipo: 'TERMO_REFERENCIA',
    tamanho: 850000,
    formato: 'docx',
    dataUpload: '2024-01-20',
    uploadPor: 'Carlos Oliveira',
    descricao: 'Termo de referência para contratação de consultoria',
    url: '#',
  },
  {
    id: '4',
    nome: 'Ata_Reuniao_Kickoff.pdf',
    tipo: 'ATA_REUNIAO',
    tamanho: 320000,
    formato: 'pdf',
    dataUpload: '2024-02-01',
    uploadPor: 'Ana Costa',
    descricao: 'Ata da reunião de kickoff do projeto',
    url: '#',
  },
  {
    id: '5',
    nome: 'Relatorio_Mensal_Janeiro.xlsx',
    tipo: 'RELATORIO_FINANCEIRO',
    tamanho: 450000,
    formato: 'xlsx',
    dataUpload: '2024-02-05',
    uploadPor: 'Pedro Lima',
    descricao: 'Relatório financeiro do mês de janeiro',
    url: '#',
  },
];

// Formatos aceitos
const formatosAceitos = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg';
const tamanhoMaximo = 10 * 1024 * 1024; // 10MB

export default function ArquivosTab({ contratoId }: ArquivosTabProps) {
  const [arquivos, setArquivos] = useState<Arquivo[]>(arquivosMock);
  const [filtroTipo, setFiltroTipo] = useState<TipoArquivo | 'TODOS'>('TODOS');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState<{
    tipo: TipoArquivo;
    descricao: string;
    file: File | null;
  }>({
    tipo: 'OUTROS',
    descricao: '',
    file: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formatar tamanho
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Formatar data
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
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

  // Filtrar arquivos
  const arquivosFiltrados = filtroTipo === 'TODOS'
    ? arquivos
    : arquivos.filter(a => a.tipo === filtroTipo);

  // Contagem por tipo
  const contagemPorTipo = arquivos.reduce((acc, a) => {
    acc[a.tipo] = (acc[a.tipo] || 0) + 1;
    return acc;
  }, {} as Record<TipoArquivo, number>);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > tamanhoMaximo) {
        alert('Arquivo muito grande. Tamanho máximo: 10MB');
        return;
      }
      setUploadForm({ ...uploadForm, file });
    }
  };

  // Handle upload
  const handleUpload = () => {
    if (!uploadForm.file) return;

    const novoArquivo: Arquivo = {
      id: Date.now().toString(),
      nome: uploadForm.file.name,
      tipo: uploadForm.tipo,
      tamanho: uploadForm.file.size,
      formato: uploadForm.file.name.split('.').pop() || '',
      dataUpload: new Date().toISOString().split('T')[0],
      uploadPor: 'Usuário Atual', // TODO: pegar do contexto de auth
      descricao: uploadForm.descricao,
      url: '#',
    };

    setArquivos([novoArquivo, ...arquivos]);
    setUploadForm({ tipo: 'OUTROS', descricao: '', file: null });
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este arquivo?')) {
      setArquivos(arquivos.filter(a => a.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Documentos do Contrato</h3>
          <p className="text-sm text-gray-500">
            Gerencie os arquivos e documentos vinculados a este contrato
          </p>
        </div>

        <button
          onClick={() => setIsUploading(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800"
        >
          <Upload className="w-4 h-4" />
          Upload de Arquivo
        </button>
      </div>

      {/* Cards de resumo por tipo */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <button
          onClick={() => setFiltroTipo('TODOS')}
          className={`p-3 rounded-lg border text-left transition-colors ${
            filtroTipo === 'TODOS'
              ? 'bg-blue-50 border-blue-300'
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold text-gray-900">{arquivos.length}</p>
          <p className="text-sm text-gray-600">Todos os arquivos</p>
        </button>
        {Object.entries(tipoLabels).slice(0, 4).map(([tipo, label]) => (
          <button
            key={tipo}
            onClick={() => setFiltroTipo(tipo as TipoArquivo)}
            className={`p-3 rounded-lg border text-left transition-colors ${
              filtroTipo === tipo
                ? 'bg-blue-50 border-blue-300'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <p className="text-2xl font-bold text-gray-900">
              {contagemPorTipo[tipo as TipoArquivo] || 0}
            </p>
            <p className="text-sm text-gray-600 truncate">{label}</p>
          </button>
        ))}
      </div>

      {/* Modal de upload */}
      {isUploading && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium bg-gray-400 text-white px-3 py-1 rounded">Novo Upload</h4>
            <button
              onClick={() => {
                setIsUploading(false);
                setUploadForm({ tipo: 'OUTROS', descricao: '', file: null });
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento *</label>
              <select
                value={uploadForm.tipo}
                onChange={(e) => setUploadForm({ ...uploadForm, tipo: e.target.value as TipoArquivo })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {Object.entries(tipoLabels).map(([tipo, label]) => (
                  <option key={tipo} value={tipo}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo *</label>
              <input
                ref={fileInputRef}
                type="file"
                accept={formatosAceitos}
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
              />
              <p className="text-xs text-gray-500 mt-1">
                Formatos: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG. Máx: 10MB
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <input
                type="text"
                value={uploadForm.descricao}
                onChange={(e) => setUploadForm({ ...uploadForm, descricao: e.target.value })}
                placeholder="Breve descrição do documento (opcional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          {uploadForm.file && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                {getFileIcon(uploadForm.file.name.split('.').pop() || '')}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{uploadForm.file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(uploadForm.file.size)}</p>
                </div>
                <button
                  onClick={() => {
                    setUploadForm({ ...uploadForm, file: null });
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                setIsUploading(false);
                setUploadForm({ tipo: 'OUTROS', descricao: '', file: null });
              }}
              className="px-4 py-2 bg-gray-200 text-gray-600 hover:bg-gray-300 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleUpload}
              disabled={!uploadForm.file}
              className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Filtros adicionais */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-gray-600">Filtrar por tipo:</label>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as TipoArquivo | 'TODOS')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="TODOS">Todos os tipos</option>
          {Object.entries(tipoLabels).map(([tipo, label]) => (
            <option key={tipo} value={tipo}>{label}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">
          {arquivosFiltrados.length} arquivo(s) encontrado(s)
        </span>
      </div>

      {/* Lista de arquivos */}
      {arquivosFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum arquivo encontrado</p>
          {filtroTipo !== 'TODOS' && (
            <button
              onClick={() => setFiltroTipo('TODOS')}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              Limpar filtro
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {arquivosFiltrados.map((arquivo) => (
            <div
              key={arquivo.id}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              {/* Ícone */}
              <div className="flex-shrink-0">
                {getFileIcon(arquivo.formato)}
              </div>

              {/* Info do arquivo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 truncate">{arquivo.nome}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipoCores[arquivo.tipo]}`}>
                    {tipoLabels[arquivo.tipo]}
                  </span>
                </div>
                {arquivo.descricao && (
                  <p className="text-sm text-gray-600 mt-1">{arquivo.descricao}</p>
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
                  onClick={() => window.open(arquivo.url, '_blank')}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Visualizar"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    // Simular download
                    const link = document.createElement('a');
                    link.href = arquivo.url;
                    link.download = arquivo.nome;
                    link.click();
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Baixar"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(arquivo.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Excluir"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
