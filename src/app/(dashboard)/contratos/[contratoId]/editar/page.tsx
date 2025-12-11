"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import {
  ChevronRight,
  Home,
  Save,
  ArrowLeft,
  FileText,
  Target,
  Users,
  Building2,
  DollarSign,
  Calendar,
  Folder,
  CheckCircle,
} from "lucide-react";

// Importar componentes de cada aba
import {
  InformacoesContratoTab,
  MetaEtapaFaseTab,
  EquipeTecnicaTab,
  IncubadasTab,
  RubricasTab,
  DesembolsoTab,
  ArquivosTab,
} from "./_components";

import { mockContrato, type Contrato } from "../types";

type TabItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
};

const tabs: TabItem[] = [
  { id: "informacoes", label: "Informações", icon: FileText, description: "Dados básicos do contrato" },
  { id: "metas", label: "Meta, Etapa e Fase", icon: Target, description: "Estrutura de metas e entregas" },
  { id: "equipe", label: "Equipe Técnica", icon: Users, description: "Membros e papéis" },
  { id: "incubadas", label: "Incubadas", icon: Building2, description: "Empresas vinculadas" },
  { id: "rubricas", label: "Rubricas", icon: DollarSign, description: "Orçamento detalhado" },
  { id: "desembolso", label: "Desembolso", icon: Calendar, description: "Cronograma de pagamentos" },
  { id: "arquivos", label: "Arquivos", icon: Folder, description: "Documentos anexados" },
];

// Re-exportar tipo para uso externo se necessário
export type { Contrato };

export default function EditarContratoPage() {
  const params = useParams();
  const router = useRouter();
  const contratoId = params.contratoId as string;

  const [activeTab, setActiveTab] = useState("informacoes");
  const [contrato, setContrato] = useState<Contrato>(mockContrato);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  // Simular carregamento do contrato
  useEffect(() => {
    // TODO: Fetch real do contrato pelo ID
    setContrato({ ...mockContrato, id: contratoId });
  }, [contratoId]);

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Salvar contrato via API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasChanges(false);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleContratoChange = (updates: Partial<Contrato>) => {
    setContrato((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleTabChange = () => {
    setHasChanges(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "informacoes":
        return <InformacoesContratoTab contrato={contrato} onChange={handleContratoChange} />;
      case "metas":
        return <MetaEtapaFaseTab contratoId={contratoId} onChange={handleTabChange} />;
      case "equipe":
        return <EquipeTecnicaTab contratoId={contratoId} />;
      case "incubadas":
        return <IncubadasTab contratoId={contratoId} />;
      case "rubricas":
        return <RubricasTab contratoId={contratoId} />;
      case "desembolso":
        return <DesembolsoTab contratoId={contratoId} />;
      case "arquivos":
        return <ArquivosTab contratoId={contratoId} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/home" className="hover:text-gray-700 flex items-center gap-1">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/contratos" className="hover:text-gray-700">
            Contratos
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/contratos/${contratoId}`} className="hover:text-gray-700">
            {contrato.codigo}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Editar</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center justify-center w-10 h-10 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Editar Contrato
              </h1>
              <p className="text-sm text-gray-500">
                {contrato.codigo} – {contrato.titulo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {savedMessage && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                <CheckCircle className="h-4 w-4" />
                Salvo com sucesso!
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                hasChanges
                  ? "text-white bg-[#004225] hover:bg-[#003319]"
                  : "text-gray-400 bg-gray-200 cursor-not-allowed"
              }`}
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </div>

        {/* Container principal */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar de navegação */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sticky top-24">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                        isActive
                          ? "bg-[#004225] text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <div className="text-left">
                        <div>{tab.label}</div>
                        {isActive && (
                          <div className="text-xs font-normal opacity-80">
                            {tab.description}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Conteúdo da aba */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
