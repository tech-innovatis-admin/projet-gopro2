"use client";

import { useState, useEffect } from "react";
import { NavBar } from "@/components/ui/NavBar";
import { ProfileHeader } from "./_components";
import { type TeamUser } from "../equipe/types";
import { MOCK_TEAM_USERS } from "../equipe/mockData";
import { User } from "lucide-react";

// =============================================================================
// PÁGINA DE PERFIL DO USUÁRIO
// =============================================================================

export default function PerfilPage() {
  const [currentUser, setCurrentUser] = useState<TeamUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Substituir por chamada real à API quando disponível
    // Por enquanto, usa o primeiro usuário do mock como exemplo
    // Em produção, buscar dados do usuário logado via /api/auth/me
    
    const loadUserData = async () => {
      try {
        // Simulação de carregamento
        await new Promise((resolve) => setTimeout(resolve, 300));
        
        // Por enquanto, usa o primeiro usuário do mock
        // TODO: Integrar com API real
        // const response = await fetch("/api/auth/me");
        // const data = await response.json();
        // const user = await fetchUserProfile(data.user.id);
        
        const mockUser = MOCK_TEAM_USERS[0]; // Vitor Silva como exemplo
        setCurrentUser(mockUser);
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
        <NavBar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-13">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#004225] mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando perfil...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
        <NavBar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-13">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 flex items-center justify-center">
            <div className="text-center">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Não foi possível carregar os dados do perfil.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-zinc-100">
      <NavBar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-13">
        {/* Espaçamento vertical generoso seguindo proporção áurea */}
        <div className="space-y-6 sm:space-y-8">
          {/* Título da página */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Meu Perfil
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Visualize suas informações de identidade funcional no sistema
            </p>
          </div>

          {/* Header de Identidade Funcional */}
          <ProfileHeader user={currentUser} />
        </div>
      </main>
    </div>
  );
}

