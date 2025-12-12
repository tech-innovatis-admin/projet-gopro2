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
  Users,
  Edit2,
  Mail,
  Phone,
  UserCircle,
} from "lucide-react";
import { ResizableTable } from "@/components/ui/resizable-table";
import {
  formatCPF,
  unformatCPF,
  validateCPFComplete,
} from "./_components/CPFValidator";
import {
  formatPhone,
  unformatPhone,
  validatePhoneComplete,
} from "./_components/PhoneValidator";

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
  papelCustom?: string;
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
    telefone: "11999991234",
    cpf: "12345678901",
    vinculo: "Professor Associado",
    cargaHoraria: 20,
  },
  {
    id: "2",
    nome: "Maria Santos",
    papel: "VICE_COORDENADOR",
    email: "maria.santos@email.com",
    telefone: "11999995678",
    cpf: "98765432101",
    vinculo: "Professora Adjunta",
    cargaHoraria: 15,
  },
  {
    id: "3",
    nome: "Pedro Costa",
    papel: "PESQUISADOR",
    email: "pedro.costa@email.com",
    cpf: "11122233344",
    vinculo: "Doutorando",
    cargaHoraria: 40,
  },
];

// Funções de formatação (removidas - usando PhoneValidator)

export default function EquipeTecnicaPage() {
  const params = useParams();
  const contratoId = params.contratoId as string;

  const [isEditing, setIsEditing] = useState(false);
  const [showCancelButton, setShowCancelButton] = useState(false);
  const [membros, setMembros] = useState<Membro[]>(mockMembros);
  const [editMembros, setEditMembros] = useState<Membro[]>(mockMembros);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMembro, setEditingMembro] = useState<Membro | null>(null);
  const [formData, setFormData] = useState<Partial<Membro>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [cpfError, setCpfError] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");

  const handleEdit = () => {
    setEditMembros(JSON.parse(JSON.stringify(membros)));
    setIsEditing(true);
    setShowCancelButton(true);
  };

  const handleCancel = () => {
    setEditMembros(JSON.parse(JSON.stringify(membros)));
    setIsEditing(false);
    setShowCancelButton(false);
    setIsModalOpen(false);
    setEditingMembro(null);
    setFormData({});
    setCpfError("");
    setPhoneError("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setMembros(JSON.parse(JSON.stringify(editMembros)));
    setIsSaving(false);
    setIsEditing(false);
    setShowCancelButton(false);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
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
    setCpfError("");
    setPhoneError("");
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const openEditModal = (membro: Membro) => {
    setEditingMembro(membro);
    // Formatar CPF e telefone ao abrir o modal para edição
    setFormData({
      ...membro,
      cpf: membro.cpf ? formatCPF(membro.cpf) : "",
      telefone: membro.telefone ? formatPhone(membro.telefone) : "",
    });
    setCpfError("");
    setPhoneError("");
    setIsModalOpen(true);
  };

  // Salvar membro
  const saveMembro = () => {
    if (!formData.nome || !formData.papel || !formData.cpf) return;

    // Validar CPF antes de salvar
    const cpfValidation = validateCPFComplete(formData.cpf || "");
    if (!cpfValidation.isValid) {
      setCpfError(cpfValidation.errorMessage);
      return;
    }

    // Validar telefone se fornecido (opcional)
    if (formData.telefone && formData.telefone.trim()) {
      const phoneValidation = validatePhoneComplete(formData.telefone);
      if (!phoneValidation.isValid) {
        setPhoneError(phoneValidation.errorMessage);
        return;
      }
    }

    // Salvar CPF e telefone sem formatação
    const cpfUnformatted = unformatCPF(formData.cpf || "");
    const phoneUnformatted = formData.telefone
      ? unformatPhone(formData.telefone)
      : formData.telefone;

    if (editingMembro) {
      setEditMembros((prev) =>
        prev.map((m) =>
          m.id === editingMembro.id
            ? {
                ...m,
                ...formData,
                cpf: cpfUnformatted,
                telefone: phoneUnformatted,
              } as Membro
            : m
        )
      );
    } else {
      const novoMembro: Membro = {
        id: `membro-${Date.now()}`,
        nome: formData.nome!,
        papel: formData.papel as Papel,
        papelCustom: formData.papelCustom,
        email: formData.email,
        telefone: phoneUnformatted,
        cpf: cpfUnformatted,
        avatarUrl: formData.avatarUrl,
        endereco: formData.endereco,
        vinculo: formData.vinculo,
        cargaHoraria: formData.cargaHoraria,
      };
      setEditMembros((prev) => [...prev, novoMembro]);
    }

    setIsModalOpen(false);
    setFormData({});
    setEditingMembro(null);
    setCpfError("");
    setPhoneError("");
  };

  // Remover membro
  const removeMembro = (id: string) => {
    const membro = editMembros.find((m) => m.id === id);
    if (membro && confirm(`Deseja realmente excluir ${membro.nome} da equipe?`)) {
      setEditMembros((prev) => prev.filter((m) => m.id !== id));
    }
  };

  // Dados a exibir (edição ou visualização)
  const currentMembros = isEditing ? editMembros : membros;
  const totalHoras = currentMembros.reduce((acc, m) => acc + (m.cargaHoraria || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Equipe Técnica
          </h2>
          <p className="text-sm text-gray-500">
            Membros da equipe técnica vinculados ao contrato
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
            onClick={() => {
              if (!isEditing) {
                setEditMembros(JSON.parse(JSON.stringify(membros)));
                setIsEditing(true);
                // Não mostra o botão Cancelar quando entra em modo de edição via "+ Novo Membro"
              }
              openNewModal();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Membro
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
              {showCancelButton && (
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </button>
              )}
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

      {/* Lista de Membros */}
      {currentMembros.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Nenhum membro cadastrado
          </h3>
          <p className="text-sm text-gray-500">
            Clique em "Novo Membro" para adicionar membros à equipe técnica do contrato.
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg">
          <ResizableTable
            columnCount={isEditing ? 7 : 6}
            defaultWidths={[
              250, // Nome
              150, // Papel
              200, // Contato
              140, // CPF
              180, // Vínculo
              130, // Carga Horária
              ...(isEditing ? [120] : []), // Ações (se em edição)
            ]}
            minColumnWidth={100}
            className="divide-y divide-gray-200"
          >
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Nome
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Papel
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Contato
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  CPF
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Vínculo
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Carga Horária
                </th>
                {isEditing && (
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Ações
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {currentMembros.map((membro) => (
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
                          {formatPhone(membro.telefone)}
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
                  {isEditing && (
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
                  )}
                </tr>
              ))}
            </tbody>
          </ResizableTable>
        </div>
      )}

      {/* Resumo */}
      {currentMembros.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-sm font-medium text-gray-700">
            Total: <strong className="text-gray-900">{currentMembros.length}</strong> membro
            {currentMembros.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-gray-600">
              Carga total: <strong className="text-gray-900">{totalHoras}h</strong>
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
          onClose={() => {
            setIsModalOpen(false);
            setFormData({});
            setEditingMembro(null);
            setCpfError("");
            setPhoneError("");
          }}
          isEditingMembro={!!editingMembro}
          cpfError={cpfError}
          setCpfError={setCpfError}
          phoneError={phoneError}
          setPhoneError={setPhoneError}
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
  isEditingMembro,
  cpfError,
  setCpfError,
  phoneError,
  setPhoneError,
}: {
  formData: Partial<Membro>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Membro>>>;
  onSave: () => void;
  onClose: () => void;
  isEditingMembro: boolean;
  cpfError: string;
  setCpfError: React.Dispatch<React.SetStateAction<string>>;
  phoneError: string;
  setPhoneError: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#004225] to-[#00563A] text-white">
          <div className="flex items-center gap-3">
            <UserCircle className="h-6 w-6" />
            <h2 className="text-lg font-bold">
              {isEditingMembro ? "Editar Membro" : "Novo Membro"}
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
          {/* Preview Card */}
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
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Nome:</span>
                    <span className="font-medium">{formData.nome || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">CPF:</span>
                    <span className="font-medium">{formData.cpf ? formatCPF(formData.cpf) : "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Papel:</span>
                    <span className="font-medium">{formData.papel ? papelLabels[formData.papel] : "—"}</span>
                  </div>
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
                    className="text-gray-600"
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
                  const formatted = formatPhone(e.target.value);
                  setFormData({ ...formData, telefone: formatted });
                  
                  // Validar em tempo real quando o usuário terminar de digitar
                  if (formatted.replace(/\D/g, "").length >= 10) {
                    const validation = validatePhoneComplete(formatted);
                    setPhoneError(validation.errorMessage);
                  } else {
                    setPhoneError("");
                  }
                }}
                onBlur={() => {
                  // Validar ao perder o foco
                  if (formData.telefone && formData.telefone.trim()) {
                    const validation = validatePhoneComplete(formData.telefone);
                    setPhoneError(validation.errorMessage);
                  } else {
                    setPhoneError("");
                  }
                }}
                className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  phoneError
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-[#004225]"
                }`}
                placeholder="(11) 98765-4321"
                maxLength={15}
              />
              {phoneError ? (
                <p className="text-xs text-red-600">{phoneError}</p>
              ) : (
                <p className="text-xs text-gray-500">Digite o telefone completo (10 ou 11 dígitos)</p>
              )}
            </div>

            {/* CPF */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                CPF <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.cpf || ""}
                onChange={(e) => {
                  const formatted = formatCPF(e.target.value);
                  setFormData({ ...formData, cpf: formatted });
                  
                  // Validar em tempo real quando o usuário terminar de digitar
                  if (formatted.length === 14) {
                    const validation = validateCPFComplete(formatted);
                    setCpfError(validation.errorMessage);
                  } else {
                    setCpfError("");
                  }
                }}
                onBlur={() => {
                  // Validar ao perder o foco
                  if (formData.cpf) {
                    const validation = validateCPFComplete(formData.cpf);
                    setCpfError(validation.errorMessage);
                  }
                }}
                className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  cpfError
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-[#004225]"
                }`}
                placeholder="000.000.000-00"
                maxLength={14}
              />
              {cpfError ? (
                <p className="text-xs text-red-600">{cpfError}</p>
              ) : (
                <p className="text-xs text-gray-500">Digite o CPF completo (11 dígitos)</p>
              )}
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
            disabled={
              !formData.nome ||
              !formData.papel ||
              !formData.cpf ||
              !!cpfError ||
              !!phoneError
            }
            className="px-6 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditingMembro ? "Salvar Alterações" : "Adicionar Membro"}
          </button>
        </div>
      </div>
    </div>
  );
}
