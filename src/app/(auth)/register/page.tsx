"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  completeRegistration,
  validateRegistrationToken,
} from "@/src/lib/api/endpoints/auth";
import { HttpError, UserRoleEnum } from "@/src/lib/api/types";

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

function getErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Nao foi possivel concluir o cadastro.";
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const inviteToken = (new URLSearchParams(window.location.search).get("token") || "").trim();
    setToken(inviteToken);

    if (!inviteToken) {
      setError("Link de convite invalido.");
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
          setError(getErrorMessage(requestError));
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
      setError("Convite invalido.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas nao conferem.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await completeRegistration({
        token,
        fullName,
        username: username.trim() || undefined,
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

      setSuccess("Cadastro concluido com sucesso. Faca login para continuar.");
      router.push("/login");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
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
                  <Label htmlFor="username">Usuario (opcional)</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={8}
                    disabled={submitting}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Concluindo cadastro..." : "Concluir cadastro"}
                </Button>
              </form>
            )}

            <div className="text-center text-sm text-zinc-600">
              Ja possui acesso?{" "}
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
