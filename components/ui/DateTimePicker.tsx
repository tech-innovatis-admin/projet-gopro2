"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  defaultTime?: string;
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

const DATETIME_PICKER_WIDTH_PX = 360;
const PICKER_GAP_PX = 8;
const VIEWPORT_PADDING_PX = 12;
const FALLBACK_PICKER_HEIGHT_PX = 470;

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));

function extractDatePart(value: string): string {
  const [datePart = ""] = value.split("T");
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : "";
}

function extractTimePart(value: string): string {
  const [, timePart = ""] = value.split("T");
  const normalized = timePart.slice(0, 5);
  return /^\d{2}:\d{2}$/.test(normalized) ? normalized : "";
}

function formatDateTimeDisplay(value: string, defaultTime: string): string {
  const datePart = extractDatePart(value);
  if (!datePart) {
    return "";
  }

  const [year, month, day] = datePart.split("-");
  const timePart = extractTimePart(value) || defaultTime;
  return `${day}/${month}/${year} ${timePart}`;
}

function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DateTimePicker({
  value,
  onChange,
  onBlur,
  placeholder = "Selecione data e hora",
  minDate,
  maxDate,
  error = false,
  disabled = false,
  className,
  defaultTime = "23:59",
}: DateTimePickerProps) {
  const selectedDateValue = extractDatePart(value);
  const selectedTimeValue = extractTimePart(value) || defaultTime;

  const [isOpen, setIsOpen] = useState(false);
  const [draftTime, setDraftTime] = useState(selectedTimeValue);
  const [viewDate, setViewDate] = useState(() =>
    selectedDateValue ? new Date(`${selectedDateValue}T00:00:00`) : new Date()
  );
  const [pickerPosition, setPickerPosition] = useState({
    top: 0,
    left: 0,
    openUpward: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const updatePickerPosition = useCallback(() => {
    if (!containerRef.current) return;

    const triggerRect = containerRef.current.getBoundingClientRect();
    const pickerHeight =
      pickerRef.current?.getBoundingClientRect().height ?? FALLBACK_PICKER_HEIGHT_PX;
    const viewportHeight = window.innerHeight;

    const spaceBelow = viewportHeight - triggerRect.bottom - PICKER_GAP_PX;
    const spaceAbove = triggerRect.top - PICKER_GAP_PX;
    const openUpward = spaceBelow < pickerHeight && spaceAbove > spaceBelow;

    const maxLeft = window.innerWidth - DATETIME_PICKER_WIDTH_PX - VIEWPORT_PADDING_PX;
    const left = Math.min(
      Math.max(triggerRect.left, VIEWPORT_PADDING_PX),
      Math.max(VIEWPORT_PADDING_PX, maxLeft)
    );

    const top = openUpward
      ? Math.max(VIEWPORT_PADDING_PX, triggerRect.top - pickerHeight - PICKER_GAP_PX)
      : Math.min(
          viewportHeight - pickerHeight - VIEWPORT_PADDING_PX,
          triggerRect.bottom + PICKER_GAP_PX
        );

    setPickerPosition({ top, left, openUpward });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTrigger = containerRef.current?.contains(target);
      const clickedPicker = pickerRef.current?.contains(target);

      if (!clickedTrigger && !clickedPicker) {
        setIsOpen(false);
        onBlur?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    if (!isOpen) {
      return;
    }

    const handleReposition = () => {
      updatePickerPosition();
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
  }, [isOpen, updatePickerPosition]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    updatePickerPosition();
  }, [isOpen, viewDate, draftTime, updatePickerPosition]);

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

  const navigateMonth = (direction: "prev" | "next") => {
    setViewDate((previous) => {
      const nextDate = new Date(previous);
      nextDate.setMonth(nextDate.getMonth() + (direction === "prev" ? -1 : 1));
      return nextDate;
    });
  };

  const navigateYear = (direction: "prev" | "next") => {
    setViewDate((previous) => {
      const nextDate = new Date(previous);
      nextDate.setFullYear(nextDate.getFullYear() + (direction === "prev" ? -1 : 1));
      return nextDate;
    });
  };

  const isDateDisabled = (date: Date): boolean => {
    const dateStr = formatDateToISO(date);
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const isSelected = (date: Date): boolean => selectedDateValue === formatDateToISO(date);

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const selectDate = (date: Date) => {
    if (isDateDisabled(date)) {
      return;
    }

    onChange(`${formatDateToISO(date)}T${draftTime}`);
  };

  const handleTimeChange = (part: "hour" | "minute", nextValue: string) => {
    const [currentHour, currentMinute] = draftTime.split(":");
    const nextHour = part === "hour" ? nextValue : currentHour;
    const nextMinute = part === "minute" ? nextValue : currentMinute;
    const nextTime = `${nextHour}:${nextMinute}`;

    setDraftTime(nextTime);

    if (selectedDateValue) {
      onChange(`${selectedDateValue}T${nextTime}`);
    }
  };

  const clearValue = (event: ReactMouseEvent) => {
    event.stopPropagation();
    setDraftTime(defaultTime);
    onChange("");
    onBlur?.();
  };

  const goToToday = () => {
    const today = new Date();
    setViewDate(today);

    if (!isDateDisabled(today)) {
      onChange(`${formatDateToISO(today)}T${draftTime}`);
    }
  };

  const togglePicker = () => {
    if (disabled) {
      return;
    }

    if (!isOpen) {
      setDraftTime(selectedTimeValue);
      setViewDate(selectedDateValue ? new Date(`${selectedDateValue}T00:00:00`) : new Date());
    }

    setIsOpen((previous) => !previous);
  };

  const [hourValue, minuteValue] = draftTime.split(":");

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={togglePicker}
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
          {value ? formatDateTimeDisplay(value, defaultTime) : placeholder}
        </span>
      </button>

      {value && !disabled && (
        <button
          type="button"
          onClick={clearValue}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0 z-10"
        >
          <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </button>
      )}

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={pickerRef}
            style={{
              top: `${pickerPosition.top}px`,
              left: `${pickerPosition.left}px`,
              width: `${DATETIME_PICKER_WIDTH_PX}px`,
            }}
            className={cn(
              "fixed z-[120] p-4",
              "bg-white rounded-2xl shadow-xl",
              "border border-gray-100",
              "animate-in fade-in-0 zoom-in-95 duration-200",
              pickerPosition.openUpward ? "slide-in-from-bottom-2" : "slide-in-from-top-2"
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
                <span className="ml-1 text-sm font-medium text-gray-500">
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

            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Horario
                </p>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <select
                    value={hourValue}
                    onChange={(event) => handleTimeChange("hour", event.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-colors focus:border-[#004225] focus:ring-2 focus:ring-[#004225]/20"
                  >
                    {HOUR_OPTIONS.map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm font-semibold text-gray-500">:</span>
                  <select
                    value={minuteValue}
                    onChange={(event) => handleTimeChange("minute", event.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-colors focus:border-[#004225] focus:ring-2 focus:ring-[#004225]/20"
                  >
                    {MINUTE_OPTIONS.map((minute) => (
                      <option key={minute} value={minute}>
                        {minute}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
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
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
