"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
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

function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return "";
  return `${day}/${month}/${year}`;
}

function maskTypedDate(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseTypedDateToISO(rawValue: string): string | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(`${trimmed}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : formatDateToISO(date) === trimmed ? trimmed : null;
  }

  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return formatDateToISO(date);
}

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
  const [draftValue, setDraftValue] = useState<string | null>(null);
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

  const displayValue = draftValue ?? (value ? formatDateDisplay(value) : "");

  const isDateDisabled = useCallback(
    (date: Date): boolean => {
      const dateStr = formatDateToISO(date);
      if (minDate && dateStr < minDate) return true;
      if (maxDate && dateStr > maxDate) return true;
      return false;
    },
    [maxDate, minDate]
  );

  const prepareCalendarView = useCallback(() => {
    const selectedValue = parseTypedDateToISO(displayValue) || value;
    setViewDate(selectedValue ? new Date(selectedValue + "T00:00:00") : new Date());
  }, [displayValue, value]);

  const openCalendar = useCallback(() => {
    if (disabled) return;
    prepareCalendarView();
    setIsOpen(true);
  }, [disabled, prepareCalendarView]);

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
        setDraftValue(null);
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
        setDraftValue(null);
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

  const commitTypedValue = useCallback(
    (rawValue: string) => {
      const nextIso = parseTypedDateToISO(rawValue);

      if (nextIso === "") {
        onChange("");
        setDraftValue(null);
        return;
      }

      if (!nextIso) {
        setDraftValue(null);
        return;
      }

      const parsed = new Date(nextIso + "T00:00:00");
      if (isDateDisabled(parsed)) {
        setDraftValue(null);
        return;
      }

      onChange(nextIso);
      setDraftValue(null);
      setViewDate(parsed);
    },
    [isDateDisabled, onChange]
  );

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;

    if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue.trim())) {
      setDraftValue(formatDateDisplay(rawValue.trim()));
      commitTypedValue(rawValue.trim());
      return;
    }

    const maskedValue = maskTypedDate(rawValue);
    setDraftValue(maskedValue);

    if (maskedValue.length === 10) {
      const nextIso = parseTypedDateToISO(maskedValue);
      if (nextIso) {
        const parsed = new Date(nextIso + "T00:00:00");
        if (!isDateDisabled(parsed)) {
          onChange(nextIso);
          setViewDate(parsed);
        }
      }
    }
  };

  const handleInputBlur = (event: FocusEvent<HTMLInputElement>) => {
    const relatedTarget = event.relatedTarget as Node | null;
    if (
      (relatedTarget && containerRef.current?.contains(relatedTarget)) ||
      (relatedTarget && calendarRef.current?.contains(relatedTarget))
    ) {
      return;
    }

    commitTypedValue(event.target.value);
    onBlur?.();
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

    const isoDate = formatDateToISO(date);
    onChange(isoDate);
    setDraftValue(null);
    setIsOpen(false);
  };

  const clearDate = (event: ReactMouseEvent) => {
    event.stopPropagation();
    setDraftValue(null);
    onChange("");
    onBlur?.();
  };

  const goToToday = () => {
    const today = new Date();
    setViewDate(today);
    if (!isDateDisabled(today)) {
      const isoDate = formatDateToISO(today);
      onChange(isoDate);
      setDraftValue(null);
      setIsOpen(false);
    }
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

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "relative flex h-11 w-full items-center overflow-hidden rounded-xl border bg-gradient-to-b from-white to-gray-50/50 transition-all duration-200",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-0",
          error
            ? "border-red-300 focus-within:border-red-500 focus-within:ring-red-500/20"
            : "border-gray-200 focus-within:border-[#004225] focus-within:ring-[#004225]/20",
          disabled && "cursor-not-allowed opacity-50",
          isOpen && !error && "border-[#004225] ring-2 ring-[#004225]/20",
          className
        )}
      >
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={openCalendar}
          onClick={openCalendar}
          onBlur={handleInputBlur}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && !disabled) {
              event.preventDefault();
              openCalendar();
            }
            if (event.key === "Escape") {
              setIsOpen(false);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          inputMode="numeric"
          className={cn(
            "h-full w-full bg-transparent px-4 pr-20 text-sm outline-none placeholder:text-gray-400",
            displayValue ? "text-gray-900 font-medium" : "text-gray-900"
          )}
        />

        <div className="absolute right-2 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={clearDate}
              className="rounded-full p-1 transition-colors hover:bg-gray-200"
              aria-label="Limpar data"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (disabled) return;
              if (!isOpen) {
                openCalendar();
                return;
              }
              setIsOpen((prev) => !prev);
            }}
            disabled={disabled}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
            aria-label={isOpen ? "Fechar calendario" : "Abrir calendario"}
          >
            <CalendarDays className="h-4 w-4" />
          </button>
        </div>
      </div>

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
              "fixed z-[120] rounded-2xl border border-gray-100 bg-white p-4 shadow-xl",
              "animate-in fade-in-0 zoom-in-95 duration-200",
              calendarPosition.openUpward ? "slide-in-from-bottom-2" : "slide-in-from-top-2"
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigateMonth("prev")}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                title="Mes anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => navigateYear("prev")}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                title="Ano anterior"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <div className="flex-1 text-center">
                <span className="text-sm font-semibold text-gray-900">
                  {MONTHS[viewDate.getMonth()]}
                </span>
                <span className="ml-1 text-sm font-medium text-gray-500">
                  {viewDate.getFullYear()}
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigateYear("next")}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                title="Próximo ano"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => navigateMonth("next")}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                title="Próximo mes"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="flex h-8 items-center justify-center text-xs font-medium uppercase text-gray-400"
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
                      disabledDate && "cursor-not-allowed text-gray-300",
                      !disabledDate && !selected && "text-gray-700 hover:bg-gray-100",
                      selected && "bg-[#004225] text-white shadow-sm hover:bg-[#003319]",
                      today && !selected && "font-semibold text-[#004225] ring-1 ring-[#004225]/30"
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={goToToday}
                className="text-sm font-medium text-[#004225] transition-colors hover:text-[#003319]"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onBlur?.();
                }}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900"
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
