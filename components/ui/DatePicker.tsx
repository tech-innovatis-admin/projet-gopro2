"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { createPortal } from "react-dom";
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

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const CALENDAR_WIDTH_PX = 320;
const CALENDAR_GAP_PX = 8;
const VIEWPORT_PADDING_PX = 12;
const FALLBACK_CALENDAR_HEIGHT_PX = 380;

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
  const [calendarPosition, setCalendarPosition] = useState({
    top: 0,
    left: 0,
    openUpward: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setViewDate(new Date(value + "T00:00:00"));
    }
  }, [value]);

  const updateCalendarPosition = useCallback(() => {
    if (!containerRef.current) return;

    const triggerRect = containerRef.current.getBoundingClientRect();
    const calendarHeight =
      calendarRef.current?.getBoundingClientRect().height ?? FALLBACK_CALENDAR_HEIGHT_PX;
    const viewportHeight = window.innerHeight;

    const spaceBelow = viewportHeight - triggerRect.bottom - CALENDAR_GAP_PX;
    const spaceAbove = triggerRect.top - CALENDAR_GAP_PX;
    const openUpward = spaceBelow < calendarHeight && spaceAbove > spaceBelow;

    const maxLeft = window.innerWidth - CALENDAR_WIDTH_PX - VIEWPORT_PADDING_PX;
    const left = Math.min(
      Math.max(triggerRect.left, VIEWPORT_PADDING_PX),
      Math.max(VIEWPORT_PADDING_PX, maxLeft)
    );

    const top = openUpward
      ? Math.max(VIEWPORT_PADDING_PX, triggerRect.top - calendarHeight - CALENDAR_GAP_PX)
      : Math.min(
          viewportHeight - calendarHeight - VIEWPORT_PADDING_PX,
          triggerRect.bottom + CALENDAR_GAP_PX
        );

    setCalendarPosition({ top, left, openUpward });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTrigger = containerRef.current?.contains(target);
      const clickedCalendar = calendarRef.current?.contains(target);

      if (!clickedTrigger && !clickedCalendar) {
        setIsOpen(false);
        onBlur?.();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onBlur]);

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

  useEffect(() => {
    if (!isOpen) return;

    const handleReposition = () => {
      updateCalendarPosition();
    };

    handleReposition();
    const rafId = window.requestAnimationFrame(handleReposition);

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isOpen, updateCalendarPosition]);

  useEffect(() => {
    if (!isOpen) return;
    updateCalendarPosition();
  }, [isOpen, viewDate, updateCalendarPosition]);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const days: (Date | null)[] = [];

    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [viewDate]);

  const formatDateToISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isDateDisabled = (date: Date): boolean => {
    const dateStr = formatDateToISO(date);
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const isSelected = (date: Date): boolean => value === formatDateToISO(date);

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatDateDisplay = (dateStr: string): string => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

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

  const selectDate = (date: Date) => {
    if (isDateDisabled(date)) return;
    onChange(formatDateToISO(date));
    setIsOpen(false);
  };

  const clearDate = (event: ReactMouseEvent) => {
    event.stopPropagation();
    onChange("");
    onBlur?.();
  };

  const goToToday = () => {
    const today = new Date();
    setViewDate(today);
    if (!isDateDisabled(today)) {
      onChange(formatDateToISO(today));
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
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
        <span
          className={cn(
            "truncate transition-colors flex-1 text-left",
            value ? "text-gray-900 font-medium" : "text-gray-400",
            value && !disabled && "pr-8"
          )}
        >
          {value ? formatDateDisplay(value) : placeholder}
        </span>
      </button>

      {value && !disabled && (
        <button
          type="button"
          onClick={clearDate}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0 z-10"
        >
          <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </button>
      )}

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={calendarRef}
            style={{
              top: `${calendarPosition.top}px`,
              left: `${calendarPosition.left}px`,
              width: `${CALENDAR_WIDTH_PX}px`,
            }}
            className={cn(
              "fixed z-[120] p-4",
              "bg-white rounded-2xl shadow-xl",
              "border border-gray-100",
              "animate-in fade-in-0 zoom-in-95 duration-200",
              calendarPosition.openUpward ? "slide-in-from-bottom-2" : "slide-in-from-top-2"
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => navigateMonth("prev")}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                title="Mes anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => navigateYear("prev")}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                title="Ano anterior"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <div className="flex-1 text-center">
                <span className="text-sm font-semibold text-gray-900">
                  {MONTHS[viewDate.getMonth()]}
                </span>
                <span className="text-sm font-medium text-gray-500 ml-1">
                  {viewDate.getFullYear()}
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigateYear("next")}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                title="Proximo ano"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => navigateMonth("next")}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                title="Proximo mes"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

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

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="h-9" />;
                }

                const disabledDate = isDateDisabled(date);
                const selected = isSelected(date);
                const today = isToday(date);

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => selectDate(date)}
                    disabled={disabledDate}
                    className={cn(
                      "h-9 w-full rounded-lg text-sm font-medium transition-all duration-150",
                      "focus:outline-none focus:ring-2 focus:ring-[#004225]/30",
                      disabledDate && "text-gray-300 cursor-not-allowed",
                      !disabledDate && !selected && "hover:bg-gray-100 text-gray-700",
                      selected && "bg-[#004225] text-white shadow-sm hover:bg-[#003319]",
                      today && !selected && "ring-1 ring-[#004225]/30 text-[#004225] font-semibold"
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

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
          </div>,
          document.body
        )}
    </div>
  );
}
