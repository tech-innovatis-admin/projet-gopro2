"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// DROPDOWN - Componente de dropdown customizado (estilo NavBar)
// =============================================================================

export interface DropdownOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  placeholder?: string;
  onChange: (value: string | undefined) => void;
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
}

export function Dropdown({
  options,
  value,
  placeholder = "Selecionar...",
  onChange,
  className,
  disabled = false,
  searchable = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Limpa busca ao fechar apenas se não houver valor selecionado
        if (searchable && !value) {
          setSearchTerm("");
        } else if (searchable && value) {
          // Se há valor selecionado, limpa o termo de busca para mostrar o label
          setSearchTerm("");
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, searchable, value]);

  // Filtra opções baseado no termo de busca
  const filteredOptions = searchable && searchTerm
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Encontra a opção selecionada
  const selectedOption = options.find(option => option.value === value);

  // Toggle dropdown
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (searchable && !isOpen && searchInputRef.current) {
        // Foca no input quando abre o dropdown
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
    }
  };

  // Seleciona uma opção
  const selectOption = (optionValue: string | undefined) => {
    onChange(optionValue);
    setIsOpen(false);
    if (searchable) {
      setSearchTerm(""); // Limpa busca ao selecionar
    }
  };

  // Handler para quando o usuário digita no input pesquisável
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    // Abre o dropdown automaticamente quando começa a digitar
    if (!isOpen && newSearchTerm.length > 0) {
      setIsOpen(true);
    }
  };

  // Handler para quando o input pesquisável recebe foco
  const handleSearchFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  // Handler para quando clica no input pesquisável
  const handleSearchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {searchable ? (
        // Input pesquisável no lugar do botão
        <div className="relative flex items-center">
          {selectedOption?.icon && !searchTerm && (
            <div className="absolute left-3 z-10 flex-shrink-0">{selectedOption.icon}</div>
          )}
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm || selectedOption?.label || ""}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            onClick={handleSearchClick}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225]",
              selectedOption?.icon && !searchTerm ? "pl-9" : "pl-3",
              "pr-10", // Espaço para o chevron
              value && !searchTerm ? "text-gray-900" : "text-gray-500",
              disabled && "opacity-50 cursor-not-allowed",
              className
            )}
          />
          <button
            onClick={toggleDropdown}
            disabled={disabled}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors z-10"
            type="button"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200 flex-shrink-0 text-gray-500",
                isOpen ? "rotate-180" : ""
              )}
            />
          </button>
        </div>
      ) : (
        // Botão normal quando não é pesquisável
        <button
          onClick={toggleDropdown}
          disabled={disabled}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 border border-gray-300 bg-white hover:bg-gray-50 text-left",
            value ? "text-gray-900" : "text-gray-500",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            {selectedOption?.icon}
            <span className="truncate">
              {selectedOption?.label || placeholder}
            </span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200 flex-shrink-0",
              isOpen ? "rotate-180" : ""
            )}
          />
        </button>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow-lg z-50 overflow-hidden transition-all duration-300 ease-out">
          <div className="max-h-60 overflow-y-auto">
            {/* Opção "Nenhuma" - sempre disponível */}
            {(!searchable || !searchTerm) && (
              <button
                onClick={() => selectOption(undefined)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-150 text-left",
                  !value ? "bg-zinc-50 font-medium" : ""
                )}
              >
                <span>{placeholder}</span>
              </button>
            )}
            
            {/* Opções disponíveis (filtradas se pesquisável) */}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => selectOption(option.value)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-150 text-left",
                    value === option.value ? "bg-zinc-50 font-medium" : ""
                  )}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </button>
              ))
            ) : searchable && searchTerm ? (
              <div className="px-4 py-3 text-sm text-zinc-500 text-center">
                Nenhum resultado encontrado
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

