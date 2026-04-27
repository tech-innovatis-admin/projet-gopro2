"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Mail, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/src/lib/api/endpoints/auth";
import { getUserErrorMessage } from "@/src/lib/feedback/user-messages";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const trimmedEmail = useMemo(() => email.trim(), [email]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!trimmedEmail) {
      setError("Informe seu e-mail.");
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError("Informe um e-mail válido.");
      return;
    }

    setLoading(true);
    try {
      const response = await forgotPassword({ email: trimmedEmail });
      setSuccessMessage(response.message);
    } catch (requestError) {
      setError(getUserErrorMessage(requestError, "Não foi possível enviar o link de redefinição."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100 px-4 py-12">
      <div className="mx-auto max-w-xl">
        <Card className="border-zinc-200 bg-white shadow-xl">
          <CardContent className="space-y-6 p-8">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-zinc-900">Esqueci minha senha</h1>
              <p className="text-sm text-zinc-600">
                Informe seu e-mail para receber um link de redefinição de senha.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative group">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@exemplo.com"
                    disabled={loading}
                    required
                    className="pl-11 h-12 rounded-xl border-zinc-200 bg-zinc-50/50 focus:bg-white focus:border-[#004225] focus:ring-2 focus:ring-[#004225]/20 transition-all duration-200"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-[#1F4E79] transition-colors" />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar link
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-zinc-600">
              Lembrou sua senha?{" "}
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
