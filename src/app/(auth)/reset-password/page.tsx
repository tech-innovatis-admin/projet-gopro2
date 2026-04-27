"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/src/lib/api/endpoints/auth";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const passwordRules = [
    { id: "length", label: "Pelo menos 8 caracteres", isValid: newPassword.length >= 8 },
    { id: "upper", label: "Uma letra maiuscula", isValid: /[A-Z]/.test(newPassword) },
    { id: "lower", label: "Uma letra minuscula", isValid: /[a-z]/.test(newPassword) },
    { id: "digit", label: "Um numero", isValid: /[0-9]/.test(newPassword) },
    { id: "special", label: "Um caractere especial", isValid: /[^\p{L}\p{N}]/u.test(newPassword) },
  ];
  const isPasswordPolicyValid = passwordRules.every((rule) => rule.isValid);

  useEffect(() => {
    const tokenFromQuery = (new URLSearchParams(window.location.search).get("token") || "").trim();
    setToken(tokenFromQuery);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!token) {
      setError("Link inválido. Solicite um novo link de redefinição.");
      return;
    }

    if (!newPassword.trim()) {
      setError("Informe a nova senha.");
      return;
    }

    if (!isPasswordPolicyValid) {
      setError("A senha não atende aos critérios obrigatórios.");
      return;
    }

    if (!confirmPassword.trim()) {
      setError("Confirme a nova senha.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword({
        token,
        newPassword,
      });

      setSuccessMessage(response.message);
      setTimeout(() => {
        router.push("/login");
      }, 1800);
    } catch (requestError) {
      setError(getUserErrorMessage(requestError, "Não foi possível redefinir a senha."));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100 px-4 py-12">
        <div className="mx-auto max-w-xl">
          <Card className="border-zinc-200 bg-white shadow-xl">
            <CardContent className="space-y-4 p-8">
              <h1 className="text-2xl font-bold text-zinc-900">Link inválido</h1>
              <p className="text-sm text-zinc-600">
                O link de redefinição está incompleto ou expirado. Solicite um novo link para continuar.
              </p>
              <Link href="/forgot-password" className="text-sm font-medium text-[#004225] hover:underline">
                Solicitar novo link
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100 px-4 py-12">
      <div className="mx-auto max-w-xl">
        <Card className="border-zinc-200 bg-white shadow-xl">
          <CardContent className="space-y-6 p-8">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-zinc-900">Redefinir senha</h1>
              <p className="text-sm text-zinc-600">Digite sua nova senha para concluir a recuperação de acesso.</p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {successMessage} Redirecionando para login...
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    disabled={loading}
                    className="pr-10 h-12 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((current) => !current)}
                    disabled={loading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 transition-colors hover:text-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]/20 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={showNewPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                  <p className="mb-2 text-sm font-medium text-zinc-800">A senha deve conter:</p>
                  <ul className="space-y-1">
                    {passwordRules.map((rule) => (
                      <li
                        key={rule.id}
                        className={`flex items-center gap-2 text-sm ${
                          rule.isValid ? "text-emerald-700" : "text-zinc-600"
                        }`}
                      >
                        <span
                          className={`inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                            rule.isValid
                              ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                              : "border-zinc-300 bg-white text-zinc-400"
                          }`}
                        >
                          {rule.isValid ? <Check className="h-3 w-3" /> : "-"}
                        </span>
                        {rule.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    disabled={loading}
                    className="pr-10 h-12 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    disabled={loading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 transition-colors hover:text-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]/20 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-700">As senhas não conferem.</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl"
                disabled={
                  loading ||
                  Boolean(successMessage) ||
                  !newPassword ||
                  !confirmPassword ||
                  !isPasswordPolicyValid ||
                  newPassword !== confirmPassword
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  <>
                    Redefinir senha
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-zinc-600">
              <Link href="/login" className="font-medium text-[#004225] hover:underline">
                Voltar para login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
