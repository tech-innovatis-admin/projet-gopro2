"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("🔐 Enviando login...");
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Importante: garante que cookies sejam enviados/recebidos
        body: JSON.stringify({ identifier, password, rememberMe }),
      });

      const data = await response.json();
      console.log("📡 Resposta:", response.status, data);

      if (!response.ok) {
        setError(data.error || "Erro ao fazer login");
        setIsLoading(false);
        return;
      }

      console.log("✅ Login OK! Redirecionando...");
      
      // Login bem-sucedido - usa window.location para garantir reload completo com cookies
      window.location.href = "/";
    } catch (err) {
      console.error("❌ Erro:", err);
      setError("Erro de conexão. Tente novamente.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Painel Esquerdo - Área com Imagem de Fundo */}
      <div
        // Classes para layout, posicionamento e controle da imagem
        className="hidden lg:flex lg:w-1/2 relative bg-cover"
        // O caminho da imagem na pasta 'public'
        style={{
          backgroundImage: "url('https://www.innovatismc.com.br/wp-content/uploads/2023/12/EpitacioBrito_D0111.png')",
          backgroundPosition: "center 20%",
        }}
      >
        {/* 1. Overlay Escuro Semitransparente (para garantir a legibilidade do texto branco) */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* 2. Conteúdo Original (posicionado acima da imagem/overlay) */}
        <div className="relative z-10 flex flex-col justify-between text-white p-12 w-full h-full">
          <div className="flex items-center gap-1">
            <img src="/Logos/logo_innovatis.svg" alt="Logo Innovatis" className="h-6 w-6" />
            <span className="text-2xl font-semibold tracking-tight">GoPro</span>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-sm backdrop-blur-sm">
                <span className="text-zinc-300">Plataforma de gestão</span>
              </div>
              <h2 className="text-4xl font-bold leading-tight">
                Gerenciar projetos
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#004225] to-[#00B894]">
                  de forma inteligente
                </span>
              </h2>
            </div>

            <blockquote className="border-l-2 border-[#004225] pl-6 space-y-3">
              <p className="text-lg text-zinc-300 leading-relaxed">
                &ldquo;Você não precisa saber tudo, mas precisa saber fazer o que fazer com o que sabe.&rdquo;
              </p>
              <footer className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#004225] to-[#00B894] flex items-center justify-center text-white font-semibold">
                  EB
                </div>
                <div>
                  <p className="font-medium text-white">Epitacio Brito</p>
                  <p className="text-sm text-zinc-400">Founder @innovatismc</p>
                </div>
              </footer>
            </blockquote>
          </div>

          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <span>© 2025 GoPro</span>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
              Privacidade
            </Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">
              Termos
            </Link>
          </div>
        </div>
      </div>

      {/* Painel Direito - Formulário de login */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-zinc-100 p-8">
        <div className="w-full max-w-lg space-y-8">
          {/* Card de Login */}
          <Card className="border-0 shadow-2xl shadow-zinc-200/50 bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden transform hover:scale-101 transition-all duration-200 hover:shadow-3xl"
                style={{
                  transform: 'perspective(1000px) rotateX(2deg)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}>
            <CardContent className="p-8 space-y-6">
              {/* Cabeçalho */}
              <div className="text-center space-y-2">
                {/* Logo Innovatis com cor controlada por CSS */}
                <div className="text-sky-300 flex justify-center"> {/* Esta classe controla a cor do SVG */}
                  <Image
                    src="/Logos/logo_innovatis_preta.svg"
                    alt="Logo Innovatis"
                    width={120}
                    height={120}

                    className="mb-2 object-contain [&>path]:fill-current [&>g]:fill-current"
                    priority
                  />
                </div>
                <h1 className="text-2xl font-bold text-zinc-900">
                  Bem-vindo de volta
                </h1>
                <p className="text-sm text-zinc-500">
                  Entre com suas credenciais para acessar sua conta
                </p>
              </div>

              {/* Mensagem de erro */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              {/* Formulário de Email e Password */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Campo Email */}
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-zinc-700 font-medium text-sm">
                    Email ou Nome de Usuário
                  </Label>
                  <div className="relative group">
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="admin"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={isLoading}
                      required
                      className="pl-11 pr-4 h-12 rounded-xl border-zinc-200 bg-zinc-50/50 focus:bg-white focus:border-[#004225] focus:ring-2 focus:ring-[#004225]/20 transition-all duration-200"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-[#004225] transition-colors" />
                  </div>
                </div>

                {/* Campo Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-700 font-medium text-sm">
                    Senha
                  </Label>
                  <div className="relative group">
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                      className="pl-11 pr-4 h-12 rounded-xl border-zinc-200 bg-zinc-50/50 focus:bg-white focus:border-[#004225] focus:ring-2 focus:ring-[#004225]/20 transition-all duration-200"
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-[#004225] transition-colors" />
                  </div>
                </div>

                {/* Remember me e Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      disabled={isLoading}
                      className="border-zinc-300 data-[state=checked]:bg-[#004225] data-[state=checked]:border-[#004225]"
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm font-normal text-zinc-600 cursor-pointer select-none"
                    >
                      Lembrar de mim
                    </Label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-zinc-600 hover:text-[#0B7A4B] font-medium hover:underline transition-colors"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>

                {/* Botão Sign In */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#004225] to-[#00B894] hover:from-[#002816] hover:to-[#0B7A4B] text-white font-semibold shadow-lg shadow-[#004225]/30 hover:shadow-xl hover:shadow-[#004225]/40 transition-all duration-300 group disabled:opacity-70 disabled:cursor-not-allowed"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200"></div>
                </div>
              </div>

              {/* Link de Registro */}
            </CardContent>
          </Card>

          {/* Termos e Política */}
          <p className="text-center text-xs text-zinc-400 leading-relaxed">
            Ao continuar, você concorda com nossos{" "}
            <Link href="/terms" className="text-zinc-600 hover:text-[#0B7A4B] underline underline-offset-2 transition-colors">
              Termos de Serviço
            </Link>{" "}
            e{" "}
            <Link href="/privacy" className="text-zinc-600 hover:text-[#0B7A4B] underline underline-offset-2 transition-colors">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
