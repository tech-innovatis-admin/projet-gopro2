"use client";

import { useState } from "react";
import Link from "next/link";
import { NavBar } from "@/components/ui/NavBar";
import { Home, ChevronRight, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Shield } from "lucide-react";

export default function SegurancaPage() {
  const [formData, setFormData] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: "A senha deve ter pelo menos 8 caracteres" };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: "A senha deve conter pelo menos uma letra maiúscula" };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: "A senha deve conter pelo menos uma letra minúscula" };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: "A senha deve conter pelo menos um número" };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: "A senha deve conter pelo menos um caractere especial" };
    }
    return { valid: true, message: "" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage("");

    // Validações
    if (formData.novaSenha !== formData.confirmarSenha) {
      setSubmitStatus("error");
      setErrorMessage("As senhas não coincidem");
      setIsSubmitting(false);
      return;
    }

    const passwordValidation = validatePassword(formData.novaSenha);
    if (!passwordValidation.valid) {
      setSubmitStatus("error");
      setErrorMessage(passwordValidation.message);
      setIsSubmitting(false);
      return;
    }

    if (formData.senhaAtual === formData.novaSenha) {
      setSubmitStatus("error");
      setErrorMessage("A nova senha deve ser diferente da senha atual");
      setIsSubmitting(false);
      return;
    }

    // Simulação de envio (substituir por chamada real à API)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // TODO: Implementar chamada à API
      // await fetch("/api/seguranca/alterar-senha", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     senhaAtual: formData.senhaAtual,
      //     novaSenha: formData.novaSenha,
      //   }),
      // });

      setSubmitStatus("success");
      setFormData({
        senhaAtual: "",
        novaSenha: "",
        confirmarSenha: "",
      });
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage("Erro ao alterar senha. Verifique se a senha atual está correta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpar mensagem de erro ao digitar
    if (submitStatus === "error") {
      setSubmitStatus(null);
      setErrorMessage("");
    }
  };

  const passwordStrength = (password: string): { strength: "weak" | "medium" | "strong"; label: string; color: string } => {
    if (password.length === 0) {
      return { strength: "weak", label: "", color: "" };
    }
    
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[!@#$%^&*(),.?":{}|<>]/.test(password),
    ];
    
    const score = checks.filter(Boolean).length;
    
    if (score <= 2) {
      return { strength: "weak", label: "Fraca", color: "bg-red-500" };
    } else if (score <= 4) {
      return { strength: "medium", label: "Média", color: "bg-yellow-500" };
    } else {
      return { strength: "strong", label: "Forte", color: "bg-green-500" };
    }
  };

  const strength = passwordStrength(formData.novaSenha);

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
          <span className="text-gray-900 font-medium">Segurança</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#004225] rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Segurança da Conta</h1>
              <p className="text-sm text-gray-500">
                Gerencie as configurações de segurança da sua conta
              </p>
            </div>
          </div>
        </div>

        {/* Formulário de Alteração de Senha */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="h-5 w-5 text-[#004225]" />
            <h2 className="text-lg font-semibold text-gray-900">Alterar Senha</h2>
          </div>

          {submitStatus === "success" && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900">Senha alterada com sucesso!</p>
                <p className="text-xs text-green-700 mt-1">Sua senha foi atualizada. Use a nova senha no próximo login.</p>
              </div>
            </div>
          )}

          {submitStatus === "error" && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900">Erro ao alterar senha</p>
                <p className="text-xs text-red-700 mt-1">{errorMessage || "Verifique os dados e tente novamente."}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Senha Atual */}
            <div>
              <label htmlFor="senhaAtual" className="block text-sm font-medium text-gray-700 mb-2">
                Senha Atual <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showSenhaAtual ? "text" : "password"}
                  id="senhaAtual"
                  name="senhaAtual"
                  value={formData.senhaAtual}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-transparent text-sm"
                  placeholder="Digite sua senha atual"
                />
                <button
                  type="button"
                  onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSenhaAtual ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Nova Senha */}
            <div>
              <label htmlFor="novaSenha" className="block text-sm font-medium text-gray-700 mb-2">
                Nova Senha <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNovaSenha ? "text" : "password"}
                  id="novaSenha"
                  name="novaSenha"
                  value={formData.novaSenha}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-transparent text-sm"
                  placeholder="Digite sua nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowNovaSenha(!showNovaSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNovaSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Indicador de força da senha */}
              {formData.novaSenha && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{
                          width: strength.strength === "weak" ? "33%" : strength.strength === "medium" ? "66%" : "100%",
                        }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      strength.strength === "weak" ? "text-red-600" :
                      strength.strength === "medium" ? "text-yellow-600" :
                      "text-green-600"
                    }`}>
                      {strength.label}
                    </span>
                  </div>
                </div>
              )}

              {/* Requisitos da senha */}
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-2">A senha deve conter:</p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className={`flex items-center gap-2 ${formData.novaSenha.length >= 8 ? "text-green-600" : ""}`}>
                    <span>{formData.novaSenha.length >= 8 ? "✓" : "•"}</span>
                    <span>Pelo menos 8 caracteres</span>
                  </li>
                  <li className={`flex items-center gap-2 ${/[A-Z]/.test(formData.novaSenha) ? "text-green-600" : ""}`}>
                    <span>{/[A-Z]/.test(formData.novaSenha) ? "✓" : "•"}</span>
                    <span>Uma letra maiúscula</span>
                  </li>
                  <li className={`flex items-center gap-2 ${/[a-z]/.test(formData.novaSenha) ? "text-green-600" : ""}`}>
                    <span>{/[a-z]/.test(formData.novaSenha) ? "✓" : "•"}</span>
                    <span>Uma letra minúscula</span>
                  </li>
                  <li className={`flex items-center gap-2 ${/[0-9]/.test(formData.novaSenha) ? "text-green-600" : ""}`}>
                    <span>{/[0-9]/.test(formData.novaSenha) ? "✓" : "•"}</span>
                    <span>Um número</span>
                  </li>
                  <li className={`flex items-center gap-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.novaSenha) ? "text-green-600" : ""}`}>
                    <span>{/[!@#$%^&*(),.?":{}|<>]/.test(formData.novaSenha) ? "✓" : "•"}</span>
                    <span>Um caractere especial</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Repetir Nova Senha */}
            <div>
              <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700 mb-2">
                Repetir Nova Senha <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Digite novamente a nova senha para confirmar e garantir que não houve erro de digitação
              </p>
              <div className="relative">
                <input
                  type={showConfirmarSenha ? "text" : "password"}
                  id="confirmarSenha"
                  name="confirmarSenha"
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-transparent text-sm transition-colors ${
                    formData.confirmarSenha && formData.novaSenha !== formData.confirmarSenha
                      ? "border-red-300 bg-red-50"
                      : formData.confirmarSenha && formData.novaSenha === formData.confirmarSenha && formData.novaSenha.length > 0
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300"
                  }`}
                  placeholder="Digite novamente a nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showConfirmarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showConfirmarSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formData.confirmarSenha && formData.novaSenha !== formData.confirmarSenha && (
                <div className="mt-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <p className="text-xs text-red-600 font-medium">As senhas não coincidem. Verifique e tente novamente.</p>
                </div>
              )}
              {formData.confirmarSenha && formData.novaSenha === formData.confirmarSenha && formData.novaSenha.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <p className="text-xs text-green-600 font-medium">As senhas coincidem corretamente.</p>
                </div>
              )}
            </div>

            {/* Botão de Envio */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !formData.senhaAtual ||
                  !formData.novaSenha ||
                  !formData.confirmarSenha ||
                  formData.novaSenha !== formData.confirmarSenha ||
                  !validatePassword(formData.novaSenha).valid
                }
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Alterando...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Alterar Senha
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
