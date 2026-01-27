"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function DatePicker({
  value,
  onChange,
  onBlur,
  placeholder = "Selecione uma data",
  minDate,
  maxDate,
  error = false,
  disabled = false,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value + "T00:00:00");
    return new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Atualiza viewDate quando value muda externamente
  useEffect(() => {
    if (value) {
      setViewDate(new Date(value + "T00:00:00"));
    }
  }, [value]);

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onBlur?.();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onBlur]);

  // Fecha com ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        onBlur?.();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onBlur]);

  // Gera os dias do mês
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const days: (Date | null)[] = [];
    
    // Dias vazios antes do primeiro dia
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    
    // Dias do mês
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  }, [viewDate]);

  // Verifica se uma data está dentro do range permitido
  const isDateDisabled = (date: Date): boolean => {
    const dateStr = formatDateToISO(date);
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  // Verifica se é a data selecionada
  const isSelected = (date: Date): boolean => {
    return value === formatDateToISO(date);
  };

  // Verifica se é hoje
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Formata data para ISO (YYYY-MM-DD)
  const formatDateToISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Formata data para exibição (DD/MM/YYYY)
  const formatDateDisplay = (dateStr: string): string => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  // Navega entre meses
  const navigateMonth = (direction: "prev" | "next") => {
    setViewDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Navega entre anos
  const navigateYear = (direction: "prev" | "next") => {
    setViewDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setFullYear(newDate.getFullYear() - 1);
      } else {
        newDate.setFullYear(newDate.getFullYear() + 1);
      }
      return newDate;
    });
  };

  // Seleciona uma data
  const selectDate = (date: Date) => {
    if (isDateDisabled(date)) return;
    const isoDate = formatDateToISO(date);
    onChange(isoDate);
    setIsOpen(false);
    // Não chamar onBlur aqui, pois o onChange já atualiza o valor
  };

  // Limpa a data
  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    onBlur?.();
  };

  // Vai para hoje
  const goToToday = () => {
    const today = new Date();
    setViewDate(today);
    if (!isDateDisabled(today)) {
      const isoDate = formatDateToISO(today);
      onChange(isoDate);
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Input Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full h-11 px-4 flex items-center justify-between gap-3",
          "text-sm border rounded-xl transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-offset-0",
          "bg-gradient-to-b from-white to-gray-50/50",
          "hover:from-gray-50 hover:to-gray-100/50",
          "group",
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
            : "border-gray-200 focus:border-[#004225] focus:ring-[#004225]/20",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && !error && "border-[#004225] ring-2 ring-[#004225]/20",
          className
        )}
      >
        <span className={cn(
          "truncate transition-colors flex-1 text-left",
          value ? "text-gray-900 font-medium" : "text-gray-400",
          // Adiciona padding direita quando tem clear button
          value && !disabled && "pr-8"
        )}>
          {value ? formatDateDisplay(value) : placeholder}
        </span>
      </button>

      {/* Clear Button - Posicionado absolutamente */}
      {value && !disabled && (
        <button
          type="button"
          onClick={clearDate}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0 z-10"
        >
          <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </button>
      )}

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className={cn(
          "absolute top-full left-0 mt-2 z-50",
          "w-[320px] p-4",
          "bg-white rounded-2xl shadow-xl",
          "border border-gray-100",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
          "duration-200"
        )}>
          {/* Header - Navegação */}
          <div className="flex items-center justify-between mb-4">
            {/* Navegação Mês Anterior */}
            <button
              type="button"
              onClick={() => navigateMonth("prev")}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              title="Mês anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Navegação Ano Anterior (pequena) */}
            <button
              type="button"
              onClick={() => navigateYear("prev")}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              title="Ano anterior"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {/* Mês e Ano */}
            <div className="flex-1 text-center">
              <span className="text-sm font-semibold text-gray-900">
                {MONTHS[viewDate.getMonth()]}
              </span>
              <span className="text-sm font-medium text-gray-500 ml-1">
                {viewDate.getFullYear()}
              </span>
            </div>

            {/* Navegação Próximo Ano (pequena) */}
            <button
              type="button"
              onClick={() => navigateYear("next")}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              title="Próximo ano"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            {/* Navegação Próximo Mês */}
            <button
              type="button"
              onClick={() => navigateMonth("next")}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              title="Próximo mês"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Dias da Semana */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs font-medium text-gray-400 uppercase"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Dias do Calendário */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="h-9" />;
              }

              const disabled = isDateDisabled(date);
              const selected = isSelected(date);
              const today = isToday(date);

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => selectDate(date)}
                  disabled={disabled}
                  className={cn(
                    "h-9 w-full rounded-lg text-sm font-medium transition-all duration-150",
                    "focus:outline-none focus:ring-2 focus:ring-[#004225]/30",
                    disabled && "text-gray-300 cursor-not-allowed",
                    !disabled && !selected && "hover:bg-gray-100 text-gray-700",
                    selected && "bg-[#004225] text-white shadow-sm hover:bg-[#003319]",
                    today && !selected && "ring-1 ring-[#004225]/30 text-[#004225] font-semibold"
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={goToToday}
              className="text-sm font-medium text-[#004225] hover:text-[#003319] transition-colors"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onBlur?.();
              }}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
