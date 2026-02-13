"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Users,
  Edit2,
  Check,
  X,
  Mail,
  Phone,
  UserCircle,
} from "lucide-react";

// Tipos
type Papel =
  | "COORDENADOR"
  | "VICE_COORDENADOR"
  | "SECRETARIO"
  | "PESQUISADOR"
  | "BOLSISTA"
  | "TECNICO"
  | "OUTRO";

type Membro = {
  id: string;
  nome: string;
  papel: Papel;
  papelCustom?: string; // Para papel "OUTRO"
  email?: string;
  telefone?: string;
  cpf?: string;
  avatarUrl?: string;
  endereco?: string;
  vinculo?: string;
  cargaHoraria?: number;
};

const papelLabels: Record<Papel, string> = {
  COORDENADOR: "Coordenador",
  VICE_COORDENADOR: "Vice-Coordenador",
  SECRETARIO: "Secretário",
  PESQUISADOR: "Pesquisador",
  BOLSISTA: "Bolsista",
  TECNICO: "Técnico",
  OUTRO: "Outro",
};

const papelColors: Record<Papel, { bg: string; text: string }> = {
  COORDENADOR: { bg: "bg-emerald-100", text: "text-emerald-800" },
  VICE_COORDENADOR: { bg: "bg-teal-100", text: "text-teal-800" },
  SECRETARIO: { bg: "bg-blue-100", text: "text-blue-800" },
  PESQUISADOR: { bg: "bg-purple-100", text: "text-purple-800" },
  BOLSISTA: { bg: "bg-orange-100", text: "text-orange-800" },
  TECNICO: { bg: "bg-gray-100", text: "text-gray-800" },
  OUTRO: { bg: "bg-slate-100", text: "text-slate-800" },
};

// Mock de dados
const mockMembros: Membro[] = [
  {
    id: "1",
    nome: "João Silva",
    papel: "COORDENADOR",
    email: "joao.silva@email.com",
    telefone: "(11) 99999-1234",
    vinculo: "Professor Associado",
    cargaHoraria: 20,
  },
  {
    id: "2",
    nome: "Maria Santos",
    papel: "VICE_COORDENADOR",
    email: "maria.santos@email.com",
    telefone: "(11) 99999-5678",
    vinculo: "Professora Adjunta",
    cargaHoraria: 15,
  },
  {
    id: "3",
    nome: "Pedro Costa",
    papel: "PESQUISADOR",
    email: "pedro.costa@email.com",
    vinculo: "Doutorando",
    cargaHoraria: 40,
  },
];

interface EquipeTecnicaTabProps {
  contratoId: string;
  onChange?: () => void;
}

export function EquipeTecnicaTab({ contratoId, onChange }: EquipeTecnicaTabProps) {
  const [membros, setMembros] = useState<Membro[]>(mockMembros);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMembro, setEditingMembro] = useState<Membro | null>(null);
  const [formData, setFormData] = useState<Partial<Membro>>({});

  // Funções de formatação
  const formatCPF = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, "");
    if (cleaned.length <= 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return cpf;
  };

  const formatTelefone = (tel: string) => {
    const cleaned = tel.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return tel;
  };

  // Abrir modal para novo membro
  const openNewModal = () => {
    setEditingMembro(null);
    setFormData({
      nome: "",
      papel: "PESQUISADOR",
      email: "",
      telefone: "",
      cpf: "",
      avatarUrl: "",
      endereco: "",
      vinculo: "",
      cargaHoraria: 0,
    });
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const openEditModal = (membro: Membro) => {
    setEditingMembro(membro);
    setFormData({ ...membro });
    setIsModalOpen(true);
  };

  // Salvar membro
  const saveMembro = () => {
    if (!formData.nome || !formData.papel) return;

    if (editingMembro) {
      // Editar existente
      setMembros((prev) =>
        prev.map((m) =>
          m.id === editingMembro.id ? { ...m, ...formData } as Membro : m
        )
      );
    } else {
      // Novo membro
      const novoMembro: Membro = {
        id: `membro-${Date.now()}`,
        nome: formData.nome!,
        papel: formData.papel as Papel,
        papelCustom: formData.papelCustom,
        email: formData.email,
        telefone: formData.telefone,
        cpf: formData.cpf,
        avatarUrl: formData.avatarUrl,
        endereco: formData.endereco,
        vinculo: formData.vinculo,
        cargaHoraria: formData.cargaHoraria,
      };
      setMembros((prev) => [...prev, novoMembro]);
    }

    setIsModalOpen(false);
    setFormData({});
    onChange?.();
  };

  // Remover membro
  const removeMembro = (id: string) => {
    const membro = membros.find((m) => m.id === id);
    if (membro && confirm(`Deseja realmente excluir ${membro.nome} da equipe?`)) {
      setMembros((prev) => prev.filter((m) => m.id !== id));
      onChange?.();
    }
  };

  // Calcular totais
  const totalHoras = membros.reduce((acc, m) => acc + (m.cargaHoraria || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Equipe Técnica
          </h2>
          <p className="text-sm text-gray-500">
            Membros da equipe técnica vinculados ao contrato.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Membro
        </button>
      </div>

      {/* Lista de Membros */}
      {membros.length === 0 ? (
        <EmptyState onAdd={openNewModal} />
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Papel
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Contato
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  CPF
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Vínculo
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Carga Horária
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {membros.map((membro) => (
                <tr key={membro.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {membro.avatarUrl ? (
                        <img
                          src={membro.avatarUrl}
                          alt={membro.nome}
                          className="h-9 w-9 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#004225] to-[#00B894] flex items-center justify-center text-white font-semibold text-sm">
                          {membro.nome.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{membro.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        papelColors[membro.papel].bg
                      } ${papelColors[membro.papel].text}`}
                    >
                      {membro.papel === "OUTRO" && membro.papelCustom
                        ? membro.papelCustom
                        : papelLabels[membro.papel]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {membro.email && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          {membro.email}
                        </div>
                      )}
                      {membro.telefone && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          {formatTelefone(membro.telefone)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {membro.cpf ? formatCPF(membro.cpf) : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {membro.vinculo || "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    {membro.cargaHoraria ? `${membro.cargaHoraria}h` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEditModal(membro)}
                        className="p-2 text-gray-500 hover:text-[#004225] hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeMembro(membro.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resumo */}
      {membros.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-sm font-medium text-gray-700">
            Total: <strong className="text-gray-900">{membros.length}</strong> membro
            {membros.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-gray-600">
              Carga total:{" "}
              <strong className="text-gray-900">{totalHoras}h</strong>
            </span>
          </div>
        </div>
      )}

      {/* Modal de Adicionar/Editar */}
      {isModalOpen && (
        <MembroModal
          formData={formData}
          setFormData={setFormData}
          onSave={saveMembro}
          onClose={() => setIsModalOpen(false)}
          isEditing={!!editingMembro}
        />
      )}
    </div>
  );
}

// Modal de membro
function MembroModal({
  formData,
  setFormData,
  onSave,
  onClose,
  isEditing,
}: {
  formData: Partial<Membro>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Membro>>>;
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
            <UserCircle className="h-6 w-6" />
            <h2 className="text-lg font-bold">
              {isEditing ? "Editar Membro" : "Novo Membro"}
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
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt="Pré-visualização"
                    className="h-16 w-16 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center">
                    <UserCircle className="h-10 w-10 text-gray-400" />
                  </div>
                )}
                <div className="text-sm text-gray-700 space-y-1">
                  <div className="flex items-center gap-2"><span className="text-gray-500">Nome:</span><span className="font-medium">{formData.nome || "—"}</span></div>
                  <div className="flex items-center gap-2"><span className="text-gray-500">CPF:</span><span className="font-medium">{formData.cpf || "—"}</span></div>
                  <div className="flex items-center gap-2"><span className="text-gray-500">Papel:</span><span className="font-medium">{formData.papel ? papelLabels[formData.papel] : "—"}</span></div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <label
                  htmlFor="avatar-upload"
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-camera-icon lucide-camera text-gray-600"
                    aria-hidden
                  >
                    <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                  Carregar
                </label>
                <p className="text-xs text-gray-500 text-center">Clique ou arraste a imagem</p>
              </div>
            </div>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  setFormData({ ...formData, avatarUrl: url });
                }
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nome || ""}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="Nome do membro"
              />
            </div>

            {/* Papel */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Papel <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.papel || "PESQUISADOR"}
                onChange={(e) =>
                  setFormData({ ...formData, papel: e.target.value as Papel })
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
              >
                {Object.entries(papelLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Papel Customizado */}
            {formData.papel === "OUTRO" && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Especificar Papel
                </label>
                <input
                  type="text"
                  value={formData.papelCustom || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, papelCustom: e.target.value })
                  }
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                  placeholder="Ex: Consultor Externo"
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="email@exemplo.com"
              />
            </div>

            {/* Telefone */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Telefone
              </label>
              <input
                type="tel"
                value={formData.telefone || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setFormData({ ...formData, telefone: value });
                }}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="(11) 99999-9999"
                maxLength={11}
              />
              <p className="text-xs text-gray-500">Apenas números</p>
            </div>

            {/* CPF */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                CPF (opcional)
              </label>
              <input
                type="text"
                value={formData.cpf || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setFormData({ ...formData, cpf: value });
                }}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="000.000.000-00"
                maxLength={11}
              />
              <p className="text-xs text-gray-500">Apenas números (11 dígitos, se informado)</p>
            </div>

            {/* Vínculo */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Vínculo Institucional
              </label>
              <input
                type="text"
                value={formData.vinculo || ""}
                onChange={(e) =>
                  setFormData({ ...formData, vinculo: e.target.value })
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="Ex: Professor Associado"
              />
            </div>

            {/* Carga Horária */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Carga Horária (horas)
              </label>
              <input
                type="number"
                value={formData.cargaHoraria || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cargaHoraria: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="0"
                min="0"
              />
            </div>

            {/* Endereço */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Endereço
              </label>
              <input
                type="text"
                value={formData.endereco || ""}
                onChange={(e) =>
                  setFormData({ ...formData, endereco: e.target.value })
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                placeholder="Rua, número, bairro, cidade - UF"
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
            disabled={!formData.nome || !formData.papel}
            className="px-6 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditing ? "Salvar Alterações" : "Adicionar Membro"}
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
        <Users className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">
        Nenhum membro cadastrado
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Adicione membros à equipe técnica do contrato.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
      >
        <Plus className="h-4 w-4" />
        Adicionar Membro
      </button>
    </div>
  );
}
