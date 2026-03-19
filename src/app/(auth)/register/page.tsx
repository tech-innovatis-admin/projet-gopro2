"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  completeRegistration,
  validateRegistrationToken,
} from "@/src/lib/api/endpoints/auth";
import { UserRoleEnum } from "@/src/lib/api/types";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";

type InviteInfo = {
  email: string;
  role: UserRoleEnum;
  expiresAt: string;
};

const roleLabels: Record<UserRoleEnum, string> = {
  SUPERADMIN: "Superadmin",
  ADMIN: "Admin",
  ANALISTA: "Analista",
  ESTAGIARIO: "Estagiario",
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default function RegisterPage() {
  const router = useRouter();

  const [token, setToken] = useState<string>("");
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const trimmedUsername = username.trim();

  const passwordRules = [
    { id: "length", label: "Pelo menos 8 caracteres", isValid: password.length >= 8 },
    { id: "upper", label: "Uma letra maiuscula", isValid: /[A-Z]/.test(password) },
    { id: "lower", label: "Uma letra minuscula", isValid: /[a-z]/.test(password) },
    { id: "digit", label: "Um número", isValid: /[0-9]/.test(password) },
    { id: "special", label: "Um caractere especial", isValid: /[^\p{L}\p{N}]/u.test(password) },
  ];
  const isPasswordPolicyValid = passwordRules.every((rule) => rule.isValid);
  const didConfirmPassword = confirmPassword.length > 0;
  const doesPasswordMatch = didConfirmPassword && password === confirmPassword;

  useEffect(() => {
    const inviteToken = (new URLSearchParams(window.location.search).get("token") || "").trim();
    setToken(inviteToken);

    if (!inviteToken) {
      setError("Link de convite inválido.");
      setLoadingInvite(false);
      return;
    }

    let cancelled = false;
    async function loadInvite() {
      try {
        setError(null);
        const data = await validateRegistrationToken(inviteToken);
        if (!cancelled) {
          setInviteInfo({
            email: data.email,
            role: data.role,
            expiresAt: data.expiresAt,
          });
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(getUserErrorMessage(requestError, "Não foi possível concluir o cadastro."));
          setInviteInfo(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingInvite(false);
        }
      }
    }

    void loadInvite();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!inviteInfo || !token) {
      setError("Convite inválido.");
      return;
    }

    if (!trimmedUsername) {
      setError("Usuário é obrigatório.");
      return;
    }

    if (!isPasswordPolicyValid) {
      setError("A senha não atende aos critérios obrigatórios.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await completeRegistration({
        token,
        fullName,
        username: trimmedUsername,
        password,
      });

      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          identifier: inviteInfo.email,
          password,
        }),
      });

      if (loginResponse.ok) {
        window.location.href = "/";
        return;
      }

      setSuccess("Cadastro concluído com sucesso. Faça login para continuar.");
      router.push("/login");
    } catch (requestError) {
      setError(getUserErrorMessage(requestError, "Não foi possível concluir o cadastro."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100 px-4 py-12">
      <div className="mx-auto max-w-xl">
        <Card className="border-zinc-200 bg-white shadow-xl">
          <CardContent className="space-y-6 p-8">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-zinc-900">Cadastro por convite</h1>
              <p className="text-sm text-zinc-600">
                Complete seu cadastro para receber acesso ao sistema.
              </p>
            </div>

            {loadingInvite && (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                Validando convite...
              </div>
            )}

            {!loadingInvite && inviteInfo && (
              <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                <p>
                  <span className="font-medium">Email:</span> {inviteInfo.email}
                </p>
                <p>
                  <span className="font-medium">Perfil:</span> {roleLabels[inviteInfo.role]}
                </p>
                <p>
                  <span className="font-medium">Expira em:</span> {formatDate(inviteInfo.expiresAt)}
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            {!loadingInvite && inviteInfo && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={inviteInfo.email} disabled />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Usuário</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      minLength={8}
                      disabled={submitting}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={submitting}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 transition-colors hover:text-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]/20 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                    <p className="mb-2 text-xs font-medium text-zinc-700">A senha deve conter:</p>
                    <ul className="space-y-1">
                      {passwordRules.map((rule) => (
                        <li
                          key={rule.id}
                          className={`flex items-center gap-2 text-xs ${
                            rule.isValid ? "text-emerald-700" : "text-zinc-600"
                          }`}
                        >
                          <span
                            className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
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
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      minLength={8}
                      disabled={submitting}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      disabled={submitting}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 transition-colors hover:text-[#004225] focus:outline-none focus:ring-2 focus:ring-[#004225]/20 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {didConfirmPassword && (
                    <p
                      className={`flex items-center gap-2 text-xs ${
                        doesPasswordMatch ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      <span
                        className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                          doesPasswordMatch
                            ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                            : "border-red-300 bg-red-100 text-red-700"
                        }`}
                      >
                        {doesPasswordMatch ? <Check className="h-3 w-3" /> : "!"}
                      </span>
                      {doesPasswordMatch
                        ? "Senha confirmada: as senhas estão iguais."
                        : "As senhas não estão iguais."}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Concluindo cadastro..." : "Concluir cadastro"}
                </Button>
              </form>
            )}

            <div className="text-center text-sm text-zinc-600">
              Já possui acesso?{" "}
              <Link href="/login" className="font-medium text-[#004225] hover:underline">
                Entrar
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
