"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Edit,
  Save,
  X,
  CheckCircle,
  Plus,
  Trash2,
  Edit2,
  Globe,
  MapPin,
  FileText,
} from "lucide-react";

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
type TipoEmpresa = "INCUBADA" | "INDEPENDENTE";

type VinculoRubrica = {
  rubricaId: string;
  itemIds: string[];
};

type Incubada = {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  tipoServico: string;
  tipoEmpresa: TipoEmpresa; // Novo campo obrigatório
  vinculos: VinculoRubrica[]; // Novo campo obrigatório - múltiplos vínculos
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

// Tipos para rubricas (importados da estrutura de rubricas)
interface ItemRubrica {
  id: string;
  descricao: string;
  cnpjDestinacao: string;
  quantidade: number;
  meses: number;
  valorUnitario: number;
  valorTotal: number;
}

interface Rubrica {
  id: string;
  codigo: string;
  nome: string;
  itens: ItemRubrica[];
}

// Mock de rubricas (deve ser buscado do contrato atual)
const mockRubricas: Rubrica[] = [
  {
    id: "1",
    codigo: "MC",
    nome: "Material de Consumo",
    itens: [
      {
        id: "1-1",
        descricao: "Reagentes químicos para laboratório",
        cnpjDestinacao: "12.345.678/0001-00",
        quantidade: 50,
        meses: 12,
        valorUnitario: 150.0,
        valorTotal: 90000.0,
      },
      {
        id: "1-2",
        descricao: "Material de escritório",
        cnpjDestinacao: "",
        quantidade: 1,
        meses: 12,
        valorUnitario: 500.0,
        valorTotal: 6000.0,
      },
    ],
  },
  {
    id: "2",
    codigo: "PP",
    nome: "Pagamento de Pessoal",
    itens: [
      {
        id: "2-1",
        descricao: "Bolsa de pesquisador júnior",
        cnpjDestinacao: "",
        quantidade: 1,
        meses: 12,
        valorUnitario: 3500.0,
        valorTotal: 42000.0,
      },
    ],
  },
  {
    id: "3",
    codigo: "OST-PJ",
    nome: "Outros Serviços de Terceiros - Pessoa Jurídica",
    itens: [],
  },
];

// Mock de dados
const mockIncubadas: Incubada[] = [
  {
    id: "1",
    razaoSocial: "Tech Solutions Ltda",
    nomeFantasia: "TechSol",
    cnpj: "12.345.678/0001-90",
    tipoServico: "Desenvolvimento de Software",
    tipoEmpresa: "INCUBADA",
    vinculos: [
      {
        rubricaId: "3",
        itemIds: [],
      },
    ],
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
    tipoEmpresa: "INDEPENDENTE",
    vinculos: [
      {
        rubricaId: "1",
        itemIds: ["1-1", "1-2"],
      },
      {
        rubricaId: "2",
        itemIds: ["2-1"],
      },
    ],
    contato: "Ana Paula",
    email: "ana@datacore.com.br",
    cidade: "Campinas",
    uf: "SP",
    valorContrato: 80000,
    dataInicio: "2025-03-01",
    dataFim: "2025-10-31",
  },
];

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}

export default function IncubadasPage() {
  const params = useParams();
  const contratoId = params.contratoId as string;

  const [isEditing, setIsEditing] = useState(false);
  const [incubadas, setIncubadas] = useState<Incubada[]>(mockIncubadas);
  const [editIncubadas, setEditIncubadas] = useState<Incubada[]>(mockIncubadas);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncubada, setEditingIncubada] = useState<Incubada | null>(null);
  const [formData, setFormData] = useState<Partial<Incubada>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [rubricas] = useState<Rubrica[]>(mockRubricas);
  const [novoVinculo, setNovoVinculo] = useState<{
    rubricaId: string;
    itemIds: string[];
  }>({ rubricaId: "", itemIds: [] });

  const handleEdit = () => {
    setEditIncubadas(JSON.parse(JSON.stringify(incubadas)));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditIncubadas(JSON.parse(JSON.stringify(incubadas)));
    setIsEditing(false);
    setIsModalOpen(false);
    setEditingIncubada(null);
    setFormData({});
    setNovoVinculo({ rubricaId: "", itemIds: [] });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIncubadas(JSON.parse(JSON.stringify(editIncubadas)));
    setIsSaving(false);
    setIsEditing(false);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  // Abrir modal para nova empresa
  const openNewModal = () => {
    if (!isEditing) {
      setIsEditing(true);
      setEditIncubadas(JSON.parse(JSON.stringify(incubadas)));
    }
    setEditingIncubada(null);
    setFormData({
      razaoSocial: "",
      nomeFantasia: "",
      cnpj: "",
      tipoServico: "",
      tipoEmpresa: undefined,
      vinculos: [],
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
    setNovoVinculo({ rubricaId: "", itemIds: [] });
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const openEditModal = (incubada: Incubada) => {
    if (!isEditing) {
      setIsEditing(true);
      setEditIncubadas(JSON.parse(JSON.stringify(incubadas)));
    }
    setEditingIncubada(incubada);
    setFormData({ ...incubada });
    setNovoVinculo({ rubricaId: "", itemIds: [] });
    setIsModalOpen(true);
  };

  // Adicionar vínculo
  const adicionarVinculo = () => {
    if (!novoVinculo.rubricaId || novoVinculo.itemIds.length === 0) return;

    const vinculosAtuais = formData.vinculos || [];
    const novoVinculoCompleto: VinculoRubrica = {
      rubricaId: novoVinculo.rubricaId,
      itemIds: [...novoVinculo.itemIds],
    };

    setFormData({
      ...formData,
      vinculos: [...vinculosAtuais, novoVinculoCompleto],
    });
    setNovoVinculo({ rubricaId: "", itemIds: [] });
  };

  // Remover vínculo
  const removerVinculo = (index: number) => {
    const vinculosAtuais = formData.vinculos || [];
    setFormData({
      ...formData,
      vinculos: vinculosAtuais.filter((_, i) => i !== index),
    });
  };

  // Salvar empresa
  const saveIncubada = () => {
    if (!formData.razaoSocial || !formData.cnpj || !formData.tipoEmpresa) return;
    if (!formData.vinculos || formData.vinculos.length === 0) {
      alert("É obrigatório vincular a empresa a pelo menos uma rubrica e seus itens.");
      return;
    }

    if (editingIncubada) {
      setEditIncubadas((prev) =>
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
        tipoEmpresa: formData.tipoEmpresa!,
        vinculos: formData.vinculos || [],
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
      setEditIncubadas((prev) => [...prev, novaIncubada]);
    }

    setIsModalOpen(false);
    setFormData({});
    setEditingIncubada(null);
    setNovoVinculo({ rubricaId: "", itemIds: [] });
  };

  // Remover empresa
  const removeIncubada = (id: string) => {
    if (confirm("Deseja realmente excluir esta empresa?")) {
      setEditIncubadas((prev) => prev.filter((i) => i.id !== id));
    }
  };

  // Dados a exibir
  const currentIncubadas = isEditing ? editIncubadas : incubadas;
  const totalValor = currentIncubadas.reduce((acc, i) => acc + (i.valorContrato || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Empresas Incubadas
          </h2>
          <p className="text-sm text-gray-500">
            Empresas que realizam serviços vinculados ao projeto
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedMessage && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              Salvo com sucesso!
            </div>
          )}
          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova Empresa
          </button>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
            >
              <Edit className="h-4 w-4" />
              Editar
            </button>
          ) : (
            <>
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


      {/* Lista de Empresas */}
      {currentIncubadas.length === 0 ? (
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
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Adicionar Empresa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentIncubadas.map((incubada) => (
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
                {isEditing && (
                  <button
                    onClick={() => openEditModal(incubada)}
                    className="p-1.5 text-[#004225] hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      incubada.tipoEmpresa === "INCUBADA"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {incubada.tipoEmpresa === "INCUBADA" ? "Incubada" : "Independente"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span>{incubada.tipoServico || "—"}</span>
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

                {incubada.vinculos && incubada.vinculos.length > 0 && (
                  <div className="flex flex-col gap-1 pt-2 border-t border-gray-100">
                    <span className="text-xs font-medium text-gray-500">Vínculos:</span>
                    {incubada.vinculos.map((vinculo, idx) => {
                      const rubrica = rubricas.find((r) => r.id === vinculo.rubricaId);
                      return (
                        <span key={idx} className="text-xs text-gray-600">
                          • {rubrica ? `${rubrica.codigo}` : "Rubrica"} ({vinculo.itemIds.length} item{vinculo.itemIds.length !== 1 ? "s" : ""})
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  {incubada.dataInicio && incubada.dataFim && (
                    <>
                      {formatDate(incubada.dataInicio)} até {formatDate(incubada.dataFim)}
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
      {currentIncubadas.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-sm font-medium text-gray-700">
            Total: <strong className="text-gray-900">{currentIncubadas.length}</strong>{" "}
            empresa{currentIncubadas.length !== 1 ? "s" : ""}
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
          onClose={() => {
            setIsModalOpen(false);
            setFormData({});
            setEditingIncubada(null);
            setNovoVinculo({ rubricaId: "", itemIds: [] });
          }}
          onDelete={editingIncubada ? () => removeIncubada(editingIncubada.id) : undefined}
          isEditingItem={!!editingIncubada}
          rubricas={rubricas}
          novoVinculo={novoVinculo}
          setNovoVinculo={setNovoVinculo}
          adicionarVinculo={adicionarVinculo}
          removerVinculo={removerVinculo}
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
  onDelete,
  isEditingItem,
  rubricas,
  novoVinculo,
  setNovoVinculo,
  adicionarVinculo,
  removerVinculo,
}: {
  formData: Partial<Incubada>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Incubada>>>;
  onSave: () => void;
  onClose: () => void;
  onDelete?: () => void;
  isEditingItem: boolean;
  rubricas: Rubrica[];
  novoVinculo: { rubricaId: string; itemIds: string[] };
  setNovoVinculo: React.Dispatch<React.SetStateAction<{ rubricaId: string; itemIds: string[] }>>;
  adicionarVinculo: () => void;
  removerVinculo: (index: number) => void;
}) {
  const rubricaSelecionada = rubricas.find((r) => r.id === novoVinculo.rubricaId);
  const itensDisponiveis = rubricaSelecionada?.itens || [];
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
              {isEditingItem ? "Editar Empresa" : "Nova Empresa Incubada"}
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

            {/* Tipo de Empresa */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Tipo de Empresa <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tipoEmpresa || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tipoEmpresa: e.target.value as TipoEmpresa,
                  })
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
              >
                <option value="">Selecione...</option>
                <option value="INCUBADA">Incubada</option>
                <option value="INDEPENDENTE">Não incubada / Independente</option>
              </select>
            </div>

            {/* Data Início */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Data de Início
              </label>
              <input
                type="date"
                value={formData.dataInicio || ""}
                onChange={(e) =>
                  setFormData({ ...formData, dataInicio: e.target.value })
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
              />
            </div>

            {/* Data Fim */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Data de Término
              </label>
              <input
                type="date"
                value={formData.dataFim || ""}
                onChange={(e) =>
                  setFormData({ ...formData, dataFim: e.target.value })
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
              />
            </div>

            {/* Vínculos com Rubricas */}
            <div className="md:col-span-2 space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Vínculos com Rubricas <span className="text-red-500">*</span>
              </label>
              
              {/* Lista de vínculos existentes */}
              {formData.vinculos && formData.vinculos.length > 0 && (
                <div className="space-y-2">
                  {formData.vinculos.map((vinculo, index) => {
                    const rubrica = rubricas.find((r) => r.id === vinculo.rubricaId);
                    return (
                      <div
                        key={index}
                        className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {rubrica ? `${rubrica.codigo} - ${rubrica.nome}` : "Rubrica não encontrada"}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Itens:{" "}
                            {vinculo.itemIds
                              .map((itemId) => {
                                const item = rubrica?.itens.find((i) => i.id === itemId);
                                return item ? item.descricao : itemId;
                              })
                              .join(", ")}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removerVinculo(index)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remover vínculo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Formulário para adicionar novo vínculo */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Adicionar Novo Vínculo
                </h4>
                <div className="space-y-3">
                  {/* Seleção de Rubrica */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">
                      Rubrica <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={novoVinculo.rubricaId}
                      onChange={(e) => {
                        setNovoVinculo({ rubricaId: e.target.value, itemIds: [] });
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                    >
                      <option value="">Selecione uma rubrica...</option>
                      {rubricas.map((rubrica) => (
                        <option key={rubrica.id} value={rubrica.id}>
                          {rubrica.codigo} - {rubrica.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Seleção de Itens (múltipla) */}
                  {novoVinculo.rubricaId && itensDisponiveis.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-700">
                        Itens da Rubrica <span className="text-red-500">*</span>
                      </label>
                      <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
                        {itensDisponiveis.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={novoVinculo.itemIds.includes(item.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNovoVinculo({
                                    ...novoVinculo,
                                    itemIds: [...novoVinculo.itemIds, item.id],
                                  });
                                } else {
                                  setNovoVinculo({
                                    ...novoVinculo,
                                    itemIds: novoVinculo.itemIds.filter((id) => id !== item.id),
                                  });
                                }
                              }}
                              className="rounded border-gray-300 text-[#004225] focus:ring-[#004225]"
                            />
                            <span className="text-xs text-gray-700 flex-1">
                              {item.descricao}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {novoVinculo.rubricaId && itensDisponiveis.length === 0 && (
                    <p className="text-xs text-gray-500">
                      Esta rubrica não possui itens cadastrados.
                    </p>
                  )}

                  {/* Botão para adicionar vínculo */}
                  {novoVinculo.rubricaId && novoVinculo.itemIds.length > 0 && (
                    <button
                      type="button"
                      onClick={adicionarVinculo}
                      className="w-full px-3 py-2 text-sm font-medium text-[#004225] bg-white border border-[#004225] rounded-lg hover:bg-emerald-50 transition-colors"
                    >
                      <Plus className="h-4 w-4 inline-block mr-1" />
                      Adicionar Vínculo
                    </button>
                  )}
                </div>
              </div>
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
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div>
            {isEditingItem && onDelete && (
              <button
                onClick={() => {
                  if (confirm("Deseja realmente excluir esta empresa?")) {
                    onDelete();
                    onClose();
                  }
                }}
                className="px-4 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4 inline-block mr-2" />
                Excluir Empresa
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={
                !formData.razaoSocial ||
                !formData.cnpj ||
                !formData.tipoEmpresa ||
                !formData.vinculos ||
                formData.vinculos.length === 0
              }
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditingItem ? "Salvar Alterações" : "Adicionar Empresa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
