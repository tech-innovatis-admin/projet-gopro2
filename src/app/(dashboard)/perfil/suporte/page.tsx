"use client";

import { useState } from "react";
import Link from "next/link";
import { NavBar } from "@/components/ui/NavBar";
import { Home, ChevronRight, Send, Mail, Phone, MessageSquare, CheckCircle, AlertCircle } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";

export default function SuportePage() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    assunto: "",
    mensagem: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    // Simulação de envio (substituir por chamada real à API)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // TODO: Implementar chamada à API
      // await fetch("/api/suporte", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(formData),
      // });

      setSubmitStatus("success");
      setFormData({
        nome: "",
        email: "",
        assunto: "",
        mensagem: "",
      });
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <NavBar />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/home" className="hover:text-gray-700 flex items-center gap-1">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Suporte</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Entre em Contato com o Suporte</h1>
          <p className="text-sm text-gray-500">
            Estamos aqui para ajudar. Envie sua dúvida, sugestão ou problema e nossa equipe entrará em contato.
          </p>
        </div>

        {/* Cards de Informações de Contato */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Mail className="h-5 w-5 text-green-700" />
              </div>
              <h3 className="font-semibold text-gray-900">E-mail</h3>
            </div>
            <p className="text-sm text-gray-600">suporte@gopro2.com.br</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Phone className="h-5 w-5 text-green-700" />
              </div>
              <h3 className="font-semibold text-gray-900">Telefone</h3>
            </div>
            <p className="text-sm text-gray-600">(00) 0000-0000</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-green-700" />
              </div>
              <h3 className="font-semibold text-gray-900">Horário</h3>
            </div>
            <p className="text-sm text-gray-600">Segunda a Sexta, 8h às 18h</p>
          </div>
        </div>

        {/* Formulário de Contato */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="h-5 w-5 text-[#004225]" />
            <h2 className="text-lg font-semibold text-gray-900">Envie sua Mensagem</h2>
          </div>

          {submitStatus === "success" && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900">Mensagem enviada com sucesso!</p>
                <p className="text-xs text-green-700 mt-1">Nossa equipe entrará em contato em breve.</p>
              </div>
            </div>
          )}

          {submitStatus === "error" && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900">Erro ao enviar mensagem</p>
                <p className="text-xs text-red-700 mt-1">Tente novamente ou entre em contato por e-mail.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-transparent text-sm"
                  placeholder="Seu nome completo"
                />
              </div>

              {/* E-mail */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-transparent text-sm"
                  placeholder="seu.email@exemplo.com"
                />
              </div>
            </div>

            {/* Assunto */}
            <div>
              <label htmlFor="assunto" className="block text-sm font-medium text-gray-700 mb-2">
                Assunto <span className="text-red-500">*</span>
              </label>
              <Dropdown 
                options={[
                  { value: "duvida", label: "Dúvida sobre o sistema" },
                  { value: "reportar", label: "Reportar problema" },
                  { value: "sugestao", label: "Sugestão de melhoria" },
                  { value: "solicitacao", label: "Solicitação de suporte" },
                  { value: "outro", label: "Outro" },
                ]}
                value={formData.assunto}
                onChange={(value) => setFormData((prev) => ({ ...prev, assunto: value ?? "" }))}
                placeholder="Selecione o assunto"
              />
            </div>

            {/* Mensagem */}
            <div>
              <label htmlFor="mensagem" className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem <span className="text-red-500">*</span>
              </label>
              <textarea
                id="mensagem"
                name="mensagem"
                value={formData.mensagem}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-transparent text-sm resize-none"
                placeholder="Descreva sua dúvida, problema ou sugestão com o máximo de detalhes possível..."
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.mensagem.length} caracteres
              </p>
            </div>

            {/* Botão de Envio */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting || !formData.nome || !formData.email || !formData.assunto || !formData.mensagem}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar Mensagem
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

