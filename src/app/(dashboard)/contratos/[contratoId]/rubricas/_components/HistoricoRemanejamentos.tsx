'use client';

import { useState } from 'react';
import { X, FileText, Calendar, User, ArrowRight, Search } from 'lucide-react';

type ID = string;

interface Remanejamento {
  id: string;
  contratoId: string;
  itemOrigemId: string;
  itemDestinoId: string;
  valor: number;
  data: string;
  motivo: string;
  createdBy: string;
  createdAt: string;
  status?: 'PENDENTE' | 'APROVADO';
  // Dados relacionados para exibição
  itemOrigem?: {
    descricao: string;
    codigo?: string;
    rubricaNome: string;
    rubricaCodigo: string;
  };
  itemDestino?: {
    descricao: string;
    codigo?: string;
    rubricaNome: string;
    rubricaCodigo: string;
  };
}

interface HistoricoRemanejamentosProps {
  isOpen: boolean;
  onClose: () => void;
  remanejamentos: Remanejamento[];
  contratoId: string;
}

export function HistoricoRemanejamentos({
  isOpen,
  onClose,
  remanejamentos,
  contratoId,
}: HistoricoRemanejamentosProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRubrica, setFilterRubrica] = useState<string>('');

  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  // Filtrar remanejamentos
  const remanejamentosFiltrados = remanejamentos.filter(rem => {
    const matchSearch = 
      rem.itemOrigem?.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rem.itemDestino?.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rem.motivo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchRubrica = !filterRubrica || 
      rem.itemOrigem?.rubricaCodigo === filterRubrica ||
      rem.itemDestino?.rubricaCodigo === filterRubrica;

    return matchSearch && matchRubrica;
  });

  // Obter lista única de rubricas para filtro
  const rubricasUnicas = Array.from(
    new Set(
      remanejamentos.flatMap(rem => [
        rem.itemOrigem?.rubricaCodigo,
        rem.itemDestino?.rubricaCodigo,
      ].filter(Boolean))
    )
  );

  const totalRemanejado = remanejamentosFiltrados.reduce((acc, rem) => acc + rem.valor, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#004225] to-[#003319]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Histórico de Remanejamentos</h2>
              <p className="text-sm text-white/80">
                {remanejamentos.length} remanejamento(s) registrado(s)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por item ou motivo..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] text-sm"
              />
            </div>
            <div>
              <select
                value={filterRubrica}
                onChange={(e) => setFilterRubrica(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] text-sm"
              >
                <option value="">Todas as rubricas</option>
                {rubricasUnicas.map(codigo => (
                  <option key={codigo} value={codigo}>
                    {codigo}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end">
              <div className="text-sm text-gray-600">
                Total filtrado: <span className="font-semibold">{formatCurrency(totalRemanejado)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {remanejamentosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum remanejamento encontrado</p>
              <p className="text-sm mt-1">
                {searchTerm || filterRubrica
                  ? 'Tente ajustar os filtros de busca'
                  : 'Nenhum remanejamento foi registrado ainda'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {remanejamentosFiltrados.map((rem) => (
                <div
                  key={rem.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Origem */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-xs font-medium text-red-900 uppercase">Origem (Débito)</span>
                      </div>
                      <p className="font-medium text-gray-900 text-sm">
                        {rem.itemOrigem?.codigo && `[${rem.itemOrigem.codigo}] `}
                        {rem.itemOrigem?.descricao || 'Item não encontrado'}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Rubrica: {rem.itemOrigem?.rubricaCodigo} - {rem.itemOrigem?.rubricaNome}
                      </p>
                    </div>

                    {/* Setas e Valor */}
                    <div className="flex flex-col items-center justify-center">
                      <ArrowRight className="w-6 h-6 text-gray-400 mb-2" />
                      <div className="text-center">
                        <p className="text-lg font-bold text-[#004225]">
                          {formatCurrency(rem.valor)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(rem.data)}
                        </p>
                      </div>
                    </div>

                    {/* Destino */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs font-medium text-green-900 uppercase">Destino (Crédito)</span>
                      </div>
                      <p className="font-medium text-gray-900 text-sm">
                        {rem.itemDestino?.codigo && `[${rem.itemDestino.codigo}] `}
                        {rem.itemDestino?.descricao || 'Item não encontrado'}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Rubrica: {rem.itemDestino?.rubricaCodigo} - {rem.itemDestino?.rubricaNome}
                      </p>
                    </div>
                  </div>

                  {/* Motivo e Metadados */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-start gap-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700 mb-1">Motivo:</p>
                        <p className="text-sm text-gray-600">{rem.motivo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{rem.createdBy}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Criado em: {formatDate(rem.createdAt)}</span>
                      </div>
                      {rem.status && (
                        <div className={`px-2 py-1 rounded ${
                          rem.status === 'APROVADO' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {rem.status}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {remanejamentosFiltrados.length} de {remanejamentos.length} remanejamento(s)
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#004225] text-white rounded-lg hover:bg-[#003319] transition-colors font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
