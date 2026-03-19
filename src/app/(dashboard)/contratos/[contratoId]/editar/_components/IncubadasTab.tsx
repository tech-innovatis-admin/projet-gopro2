"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Globe,
  MapPin,
  FileText,
} from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";

// Ícone customizado de Briefcase Business
const BriefcaseBusinessIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-briefcase-business"
  >
    <path d="M12 12h.01" />
    <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <path d="M22 13a18.15 18.15 0 0 1-20 0" />
    <rect width="20" height="14" x="2" y="6" rx="2" />
  </svg>
);

// Tipos
type Incubada = {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  tipoServico: string;
  contato?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  valorContrato?: number;
  dataInicio?: string;
  dataFim?: string;
  observacao?: string;
};

// Mock de dados
const mockIncubadas: Incubada[] = [
  {
    id: "1",
    razaoSocial: "Tech Solutions Ltda",
    nomeFantasia: "TechSol",
    cnpj: "12.345.678/0001-90",
    tipoServico: "Desenvolvimento de Software",
    contato: "Carlos Mendes",
    email: "contato@techsol.com.br",
    telefone: "(11) 3333-4444",
    cidade: "São Paulo",
    uf: "SP",
    valorContrato: 150000,
    dataInicio: "2025-02-01",
    dataFim: "2025-08-31",
  },
  {
    id: "2",
    razaoSocial: "DataCore Análise de Dados Eireli",
    nomeFantasia: "DataCore",
    cnpj: "98.765.432/0001-21",
    tipoServico: "Análise de Dados e BI",
    contato: "Ana Paula",
    email: "ana@datacore.com.br",
    cidade: "Campinas",
    uf: "SP",
    valorContrato: 80000,
    dataInicio: "2025-03-01",
    dataFim: "2025-10-31",
  },
];

interface IncubadasTabProps {
  contratoId: string;
}

export function IncubadasTab({ contratoId }: IncubadasTabProps) {
  const [incubadas, setIncubadas] = useState<Incubada[]>(mockIncubadas);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncubada, setEditingIncubada] = useState<Incubada | null>(null);
  const [formData, setFormData] = useState<Partial<Incubada>>({});

  // Abrir modal para nova empresa
  const openNewModal = () => {
    setEditingIncubada(null);
    setFormData({
      razaoSocial: "",
      nomeFantasia: "",
      cnpj: "",
      tipoServico: "",
      contato: "",
      email: "",
      telefone: "",
      endereco: "",
      cidade: "",
      uf: "",
      valorContrato: 0,
      dataInicio: "",
      dataFim: "",
      observacao: "",
    });
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const openEditModal = (incubada: Incubada) => {
    setEditingIncubada(incubada);
    setFormData({ ...incubada });
    setIsModalOpen(true);
  };

  // Salvar empresa
  const saveIncubada = () => {
    if (!formData.razaoSocial || !formData.cnpj) return;

    if (editingIncubada) {
      setIncubadas((prev) =>
        prev.map((i) =>
          i.id === editingIncubada.id ? { ...i, ...formData } as Incubada : i
        )
      );
    } else {
      const novaIncubada: Incubada = {
        id: `incubada-${Date.now()}`,
        razaoSocial: formData.razaoSocial!,
        nomeFantasia: formData.nomeFantasia,
        cnpj: formData.cnpj!,
        tipoServico: formData.tipoServico || "",
        contato: formData.contato,
        email: formData.email,
        telefone: formData.telefone,
        endereco: formData.endereco,
        cidade: formData.cidade,
        uf: formData.uf,
        valorContrato: formData.valorContrato,
        dataInicio: formData.dataInicio,
        dataFim: formData.dataFim,
        observacao: formData.observacao,
      };
      setIncubadas((prev) => [...prev, novaIncubada]);
    }

    setIsModalOpen(false);
    setFormData({});
  };

  // Remover empresa
  const removeIncubada = (id: string) => {
    setIncubadas((prev) => prev.filter((i) => i.id !== id));
  };

  // Calcular total
  const totalValor = incubadas.reduce((acc, i) => acc + (i.valorContrato || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Empresas Incubadas
          </h2>
          <p className="text-sm text-gray-500">
            Empresas que realizam serviços vinculados ao projeto.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Empresa
        </button>
      </div>

      {/* Lista de Empresas */}
      {incubadas.length === 0 ? (
        <EmptyState onAdd={openNewModal} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incubadas.map((incubada) => (
            <div
              key={incubada.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <div className="h-5 w-5 text-green-600">
                      <BriefcaseBusinessIcon />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {incubada.nomeFantasia || incubada.razaoSocial}
                    </h3>
                    {incubada.nomeFantasia && (
                      <p className="text-xs text-gray-500">{incubada.razaoSocial}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      CNPJ: {incubada.cnpj}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(incubada)}
                    className="p-1.5 text-gray-500 hover:text-[#004225] hover:bg-gray-100 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeIncubada(incubada.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span>{incubada.tipoServico}</span>
                </div>

                {(incubada.cidade || incubada.uf) && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>
                      {[incubada.cidade, incubada.uf].filter(Boolean).join(" - ")}
                    </span>
                  </div>
                )}

                {incubada.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <span>{incubada.email}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  {incubada.dataInicio && incubada.dataFim && (
                    <>
                      {formatDate(incubada.dataInicio)} até{" "}
                      {formatDate(incubada.dataFim)}
                    </>
                  )}
                </div>
                {incubada.valorContrato && (
                  <span className="font-semibold text-[#004225]">
                    R$ {incubada.valorContrato.toLocaleString("pt-BR")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resumo */}
      {incubadas.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-sm font-medium text-gray-700">
            Total: <strong className="text-gray-900">{incubadas.length}</strong>{" "}
            empresa{incubadas.length !== 1 ? "s" : ""}
          </span>
          <span className="text-sm text-gray-600">
            Valor total:{" "}
            <strong className="text-gray-900">
              R$ {totalValor.toLocaleString("pt-BR")}
            </strong>
          </span>
        </div>
      )}

      {/* Modal de Adicionar/Editar */}
      {isModalOpen && (
        <IncubadaModal
          formData={formData}
          setFormData={setFormData}
          onSave={saveIncubada}
          onClose={() => setIsModalOpen(false)}
          isEditing={!!editingIncubada}
        />
      )}
    </div>
  );
}

// Modal
function IncubadaModal({
  formData,
  setFormData,
  onSave,
  onClose,
  isEditing,
}: {
  formData: Partial<Incubada>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Incubada>>>;
  onSave: () => void;
  onClose: () => void;
  isEditing: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#004225] to-[#00563A] text-white">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6">
              <BriefcaseBusinessIcon />
            </div>
            <h2 className="text-lg font-bold">
              {isEditing ? "Editar Empresa" : "Nova Empresa Incubada"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Razão Social */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Razão Social <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.razaoSocial || ""}
                onChange={(e) =>
                  setFormData({ ...formData, razaoSocial: e.target.value })
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="Razão social da empresa"
              />
            </div>

            {/* Nome Fantasia */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Nome Fantasia
              </label>
              <input
                type="text"
                value={formData.nomeFantasia || ""}
                onChange={(e) =>
                  setFormData({ ...formData, nomeFantasia: e.target.value })
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="Nome fantasia"
              />
            </div>

            {/* CNPJ */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                CNPJ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.cnpj || ""}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="00.000.000/0000-00"
              />
            </div>

            {/* Tipo de Serviço */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Tipo de Serviço
              </label>
              <input
                type="text"
                value={formData.tipoServico || ""}
                onChange={(e) =>
                  setFormData({ ...formData, tipoServico: e.target.value })
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="Ex: Desenvolvimento de Software"
              />
            </div>

            {/* Contato */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Contato
              </label>
              <input
                type="text"
                value={formData.contato || ""}
                onChange={(e) =>
                  setFormData({ ...formData, contato: e.target.value })
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="Nome do contato"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="email@empresa.com.br"
              />
            </div>

            {/* Cidade */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Cidade
              </label>
              <input
                type="text"
                value={formData.cidade || ""}
                onChange={(e) =>
                  setFormData({ ...formData, cidade: e.target.value })
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="Cidade"
              />
            </div>

            {/* UF */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                UF
              </label>
              <input
                type="text"
                value={formData.uf || ""}
                onChange={(e) => setFormData({ ...formData, uf: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="UF"
                maxLength={2}
              />
            </div>

            {/* Valor do Contrato */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Valor do Contrato (R$)
              </label>
              <input
                type="number"
                value={formData.valorContrato || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    valorContrato: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="0,00"
                min="0"
                step="0.01"
              />
            </div>

            {/* Data Início */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Data de Início
              </label>
              <DatePicker
                value={formData.dataInicio || ""}
                onChange={(value) =>
                  setFormData({ ...formData, dataInicio: value })
                }
              />
            </div>

            {/* Data Fim */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Data de Término
              </label>
              <DatePicker
                value={formData.dataFim || ""}
                onChange={(value) =>
                  setFormData({ ...formData, dataFim: value })
                }
              />
            </div>

            {/* Observação */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Observações
              </label>
              <textarea
                value={formData.observacao || ""}
                onChange={(e) =>
                  setFormData({ ...formData, observacao: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] resize-none"
                placeholder="Observações adicionais..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={!formData.razaoSocial || !formData.cnpj}
            className="px-6 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditing ? "Salvar Alterações" : "Adicionar Empresa"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Empty State
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 bg-gray-100 rounded-full mb-4">
        <div className="h-8 w-8 text-gray-400">
          <BriefcaseBusinessIcon />
        </div>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">
        Nenhuma empresa cadastrada
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Adicione empresas incubadas que realizam serviços no projeto.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
      >
        <Plus className="h-4 w-4" />
        Adicionar Empresa
      </button>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}
