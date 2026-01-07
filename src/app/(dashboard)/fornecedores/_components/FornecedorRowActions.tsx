"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Eye, Pencil, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Fornecedor } from "../types";

// =============================================================================
// AÇÕES POR LINHA DA TABELA DE FORNECEDORES
// =============================================================================

interface FornecedorRowActionsProps {
  fornecedor: Fornecedor;
}

export function FornecedorRowActions({ fornecedor }: FornecedorRowActionsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleAction = (action: "ver" | "editar" | "contratos") => {
    setIsOpen(false);
    switch (action) {
      case "ver":
        router.push(`/fornecedores/${fornecedor.id}`);
        break;
      case "editar":
        router.push(`/fornecedores/${fornecedor.id}/editar`);
        break;
      case "contratos":
        router.push(`/fornecedores/${fornecedor.id}/contratos`);
        break;
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Ações"
      >
        <MoreHorizontal className="h-4 w-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            onClick={() => handleAction("ver")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700",
              "hover:bg-gray-50 hover:text-gray-900 transition-colors text-left"
            )}
          >
            <Eye className="h-4 w-4" />
            <span>Ver detalhes</span>
          </button>

          <button
            onClick={() => handleAction("editar")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700",
              "hover:bg-gray-50 hover:text-gray-900 transition-colors text-left"
            )}
          >
            <Pencil className="h-4 w-4" />
            <span>Editar</span>
          </button>

          <button
            onClick={() => handleAction("contratos")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700",
              "hover:bg-gray-50 hover:text-gray-900 transition-colors text-left"
            )}
          >
            <FileText className="h-4 w-4" />
            <span>Ver contratos</span>
          </button>
        </div>
      )}
    </div>
  );
}
