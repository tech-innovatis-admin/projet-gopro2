// =============================================================================
// UTILITÁRIOS PARA PÁGINA DE PERFIL
// =============================================================================

/**
 * Formata uma data ISO em formato humano legível
 * Exemplos:
 * - "Hoje, 09:32"
 * - "Ontem, 17:10"
 * - "Há 5 dias"
 */
export function formatHumanDate(isoDate: string): string {
  if (!isoDate) return "Nunca";

  try {
    const date = new Date(isoDate);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return "Data inválida";
    }

    const now = new Date();
    
    // Resetar horas para comparar apenas datas
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Calcular diferença em dias
    const diffTime = today.getTime() - targetDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Formatar hora
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const timeStr = `${hours}:${minutes}`;
    
    if (diffDays === 0) {
      return `Hoje, ${timeStr}`;
    } else if (diffDays === 1) {
      return `Ontem, ${timeStr}`;
    } else if (diffDays > 1 && diffDays <= 7) {
      return `Há ${diffDays} dias`;
    } else {
      // Para mais de 7 dias, mostrar data completa
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return "Data inválida";
  }
}

/**
 * Obtém as iniciais de um nome
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

