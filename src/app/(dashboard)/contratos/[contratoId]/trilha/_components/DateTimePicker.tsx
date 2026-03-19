"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Calendar, X } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";

// =============================================================================
// DATE TIME PICKER - Seletor de data e hora profissional
// =============================================================================

type DateTimePickerProps = {
  value: string; // ISO datetime string
  onChange: (value: string) => void;
};

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const { selectedDate, selectedTime } = useMemo(() => {
    if (!value) {
      return { selectedDate: "", selectedTime: "09:00" };
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return { selectedDate: "", selectedTime: "09:00" };
    }

    return {
      selectedDate: parsed.toISOString().split("T")[0],
      selectedTime: parsed.toTimeString().slice(0, 5),
    };
  }, [value]);

  // Fechar picker ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleDateChange = (date: string) => {
    if (!date) {
      onChange("");
      return;
    }

    const datetime = new Date(`${date}T${selectedTime}`).toISOString();
    onChange(datetime);
  };

  const handleTimeChange = (time: string) => {
    if (selectedDate) {
      const datetime = new Date(`${selectedDate}T${time}`).toISOString();
      onChange(datetime);
    }
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const formatDisplayDate = () => {
    if (!selectedDate) return "Selecionar data e hora";
    const date = new Date(`${selectedDate}T${selectedTime}`);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative" ref={pickerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225] focus:border-[#004225] bg-white text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
      >
        <span className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          {formatDisplayDate()}
        </span>
        {value && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </button>

      {/* Picker Panel */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 w-96">
          {/* Presets */}
          <div className="mb-4">
            <div className="text-xs text-gray-500 font-medium mb-2">Atalhos</div>
            <div className="grid grid-cols-3 gap-2">
              <PresetButton
                label="Hoje"
                onClick={() => {
                  const today = new Date().toISOString().split("T")[0];
                  handleDateChange(today);
                }}
              />
              <PresetButton
                label="Amanhã"
                onClick={() => {
                  const tomorrow = new Date(Date.now() + 86400000)
                    .toISOString()
                    .split("T")[0];
                  handleDateChange(tomorrow);
                }}
              />
              <PresetButton
                label="Próx. Seg."
                onClick={() => {
                  const nextMonday = new Date();
                  nextMonday.setDate(
                    nextMonday.getDate() + ((8 - nextMonday.getDay()) % 7)
                  );
                  handleDateChange(nextMonday.toISOString().split("T")[0]);
                }}
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            {/* Data */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 font-medium mb-2">
                Data
              </label>
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                className="rounded-lg"
              />
            </div>

            {/* Hora */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 font-medium mb-2">
                Hora
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004225]"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <button
                onClick={handleClear}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Limpar
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-[#004225] rounded-lg hover:bg-[#003319] transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente auxiliar para botões de preset
function PresetButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
    >
      {label}
    </button>
  );
}
