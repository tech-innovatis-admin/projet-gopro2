"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { NavBar } from "@/components/ui/NavBar";
import { fetchCurrentUser, isOwner } from "@/src/lib/auth/session";
import { AlertCircle, CheckCircle, ChevronRight, Eye, EyeOff, Home, Lock, Shield } from "lucide-react";

export default function SegurancaPage() {
  const [formData, setFormData] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [isProtectedOwner, setIsProtectedOwner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAccess() {
      try {
        const user = await fetchCurrentUser();
        if (!cancelled) {
          setIsProtectedOwner(isOwner(user));
        }
      } finally {
        if (!cancelled) {
          setLoadingAccess(false);
        }
      }
    }

    void loadAccess();
    return () => {
      cancelled = true;
    };
  }, []);

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: "A senha deve ter pelo menos 8 caracteres" };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: "A senha deve conter pelo menos uma letra maiuscula" };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: "A senha deve conter pelo menos uma letra minuscula" };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: "A senha deve conter pelo menos um numero" };
    }
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
      return { valid: false, message: "A senha deve conter pelo menos um caractere especial" };
    }
    return { valid: true, message: "" };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage("");

    if (isProtectedOwner) {
      setSubmitStatus("error");
      setErrorMessage("Contas Owner sao protegidas e nao permitem alteracao de senha.");
      setIsSubmitting(false);
      return;
    }

    if (formData.novaSenha !== formData.confirmarSenha) {
      setSubmitStatus("error");
      setErrorMessage("As senhas nao coincidem");
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

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSubmitStatus("success");
      setFormData({
        senhaAtual: "",
        novaSenha: "",
        confirmarSenha: "",
      });
    } catch {
      setSubmitStatus("error");
      setErrorMessage("Erro ao alterar senha. Verifique se a senha atual esta correta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));

    if (submitStatus === "error") {
      setSubmitStatus(null);
      setErrorMessage("");
    }
  };

  const passwordStrength = (
    password: string
  ): { strength: "weak" | "medium" | "strong"; label: string; color: string } => {
    if (password.length === 0) {
      return { strength: "weak", label: "", color: "" };
    }

    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[!@#$%^&*(),.?\":{}|<>]/.test(password),
    ];

    const score = checks.filter(Boolean).length;

    if (score <= 2) {
      return { strength: "weak", label: "Fraca", color: "bg-red-500" };
    }
    if (score <= 4) {
      return { strength: "medium", label: "Media", color: "bg-yellow-500" };
    }
    return { strength: "strong", label: "Forte", color: "bg-green-500" };
  };

  const strength = passwordStrength(formData.novaSenha);
  const isFormDisabled = loadingAccess || isProtectedOwner || isSubmitting;

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <NavBar />

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/home" className="flex items-center gap-1 hover:text-gray-700">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-gray-900">Seguranca</span>
        </nav>

        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-[#004225] p-2">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Privacidade da Conta</h1>
              <p className="text-sm text-gray-500">
                Gerencie as configuracoes de seguranca e privacidade da sua conta
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#004225]" />
            <h2 className="text-lg font-semibold text-gray-900">Alterar Senha</h2>
          </div>

          {loadingAccess && (
            <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
              Validando permissao da conta...
            </div>
          )}

          {!loadingAccess && isProtectedOwner && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Contas Owner sao protegidas. A senha desse perfil nao pode ser alterada.
            </div>
          )}

          {submitStatus === "success" && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Senha alterada com sucesso!</p>
                <p className="mt-1 text-xs text-green-700">
                  Sua senha foi atualizada. Use a nova senha no proximo login.
                </p>
              </div>
            </div>
          )}

          {submitStatus === "error" && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900">Erro ao alterar senha</p>
                <p className="mt-1 text-xs text-red-700">
                  {errorMessage || "Verifique os dados e tente novamente."}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="senhaAtual" className="mb-2 block text-sm font-medium text-gray-700">
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
                  disabled={isFormDisabled}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#004225] disabled:cursor-not-allowed disabled:bg-gray-100"
                  placeholder="Digite sua senha atual"
                />
                <button
                  type="button"
                  onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                  disabled={isFormDisabled}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                >
                  {showSenhaAtual ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="novaSenha" className="mb-2 block text-sm font-medium text-gray-700">
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
                  disabled={isFormDisabled}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#004225] disabled:cursor-not-allowed disabled:bg-gray-100"
                  placeholder="Digite sua nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowNovaSenha(!showNovaSenha)}
                  disabled={isFormDisabled}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                >
                  {showNovaSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {formData.novaSenha && (
                <div className="mt-2">
                  <div className="mb-1 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{
                          width:
                            strength.strength === "weak"
                              ? "33%"
                              : strength.strength === "medium"
                                ? "66%"
                                : "100%",
                        }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        strength.strength === "weak"
                          ? "text-red-600"
                          : strength.strength === "medium"
                            ? "text-yellow-600"
                            : "text-green-600"
                      }`}
                    >
                      {strength.label}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-3 rounded-lg bg-gray-50 p-3">
                <p className="mb-2 text-xs font-medium text-gray-700">A senha deve conter:</p>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className={`flex items-center gap-2 ${formData.novaSenha.length >= 8 ? "text-green-600" : ""}`}>
                    <span>{formData.novaSenha.length >= 8 ? "✓" : "•"}</span>
                    <span>Pelo menos 8 caracteres</span>
                  </li>
                  <li className={`flex items-center gap-2 ${/[A-Z]/.test(formData.novaSenha) ? "text-green-600" : ""}`}>
                    <span>{/[A-Z]/.test(formData.novaSenha) ? "✓" : "•"}</span>
                    <span>Uma letra maiuscula</span>
                  </li>
                  <li className={`flex items-center gap-2 ${/[a-z]/.test(formData.novaSenha) ? "text-green-600" : ""}`}>
                    <span>{/[a-z]/.test(formData.novaSenha) ? "✓" : "•"}</span>
                    <span>Uma letra minuscula</span>
                  </li>
                  <li className={`flex items-center gap-2 ${/[0-9]/.test(formData.novaSenha) ? "text-green-600" : ""}`}>
                    <span>{/[0-9]/.test(formData.novaSenha) ? "✓" : "•"}</span>
                    <span>Um numero</span>
                  </li>
                  <li className={`flex items-center gap-2 ${/[!@#$%^&*(),.?\":{}|<>]/.test(formData.novaSenha) ? "text-green-600" : ""}`}>
                    <span>{/[!@#$%^&*(),.?\":{}|<>]/.test(formData.novaSenha) ? "✓" : "•"}</span>
                    <span>Um caractere especial</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <label htmlFor="confirmarSenha" className="mb-2 block text-sm font-medium text-gray-700">
                Repetir Nova Senha <span className="text-red-500">*</span>
              </label>
              <p className="mb-2 text-xs text-gray-500">
                Digite novamente a nova senha para confirmar e evitar erros de digitacao
              </p>
              <div className="relative">
                <input
                  type={showConfirmarSenha ? "text" : "password"}
                  id="confirmarSenha"
                  name="confirmarSenha"
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  required
                  disabled={isFormDisabled}
                  className={`w-full rounded-lg border px-4 py-2.5 pr-10 text-sm transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#004225] disabled:cursor-not-allowed disabled:bg-gray-100 ${
                    formData.confirmarSenha && formData.novaSenha !== formData.confirmarSenha
                      ? "border-red-300 bg-red-50"
                      : formData.confirmarSenha &&
                          formData.novaSenha === formData.confirmarSenha &&
                          formData.novaSenha.length > 0
                        ? "border-green-300 bg-green-50"
                        : "border-gray-300"
                  }`}
                  placeholder="Digite novamente a nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                  disabled={isFormDisabled}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed"
                  aria-label={showConfirmarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showConfirmarSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {formData.confirmarSenha && formData.novaSenha !== formData.confirmarSenha && (
                <div className="mt-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
                  <p className="text-xs font-medium text-red-600">
                    As senhas nao coincidem. Verifique e tente novamente.
                  </p>
                </div>
              )}

              {formData.confirmarSenha &&
                formData.novaSenha === formData.confirmarSenha &&
                formData.novaSenha.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                    <p className="text-xs font-medium text-green-600">
                      As senhas coincidem corretamente.
                    </p>
                  </div>
                )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
              <button
                type="submit"
                disabled={
                  isFormDisabled ||
                  !formData.senhaAtual ||
                  !formData.novaSenha ||
                  !formData.confirmarSenha ||
                  formData.novaSenha !== formData.confirmarSenha ||
                  !validatePassword(formData.novaSenha).valid
                }
                className="inline-flex items-center gap-2 rounded-lg bg-[#004225] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#003319] disabled:cursor-not-allowed disabled:opacity-50"
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
