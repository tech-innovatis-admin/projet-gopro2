"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface MenuPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

const VIEWPORT_PADDING = 8;
const MENU_GAP = 4;
const MENU_MAX_HEIGHT = 240;
const MENU_MIN_HEIGHT = 120;

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
  const [openUpward, setOpenUpward] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTrigger = triggerRef.current?.contains(target);
      const clickedMenu = menuRef.current?.contains(target);

      if (clickedTrigger || clickedMenu) return;

      setIsOpen(false);
      if (searchable) {
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, searchable]);

  useEffect(() => {
    if (!isOpen) return;

    const updateMenuPosition = () => {
      if (!triggerRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      const spaceBelow = viewportHeight - triggerRect.bottom - VIEWPORT_PADDING;
      const spaceAbove = triggerRect.top - VIEWPORT_PADDING;
      const shouldOpenUpward = spaceBelow < MENU_MAX_HEIGHT && spaceAbove > spaceBelow;

      const availableHeight = shouldOpenUpward ? spaceAbove : spaceBelow;
      const maxHeight = Math.max(
        MENU_MIN_HEIGHT,
        Math.min(MENU_MAX_HEIGHT, availableHeight - MENU_GAP)
      );

      const width = Math.min(triggerRect.width, viewportWidth - VIEWPORT_PADDING * 2);
      const left = Math.min(
        Math.max(VIEWPORT_PADDING, triggerRect.left),
        viewportWidth - width - VIEWPORT_PADDING
      );
      const top = shouldOpenUpward
        ? triggerRect.top - maxHeight - MENU_GAP
        : triggerRect.bottom + MENU_GAP;

      setOpenUpward(shouldOpenUpward);
      setMenuPosition({
        top: Math.round(top),
        left: Math.round(left),
        width: Math.round(width),
        maxHeight: Math.round(maxHeight),
      });
    };

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen]);

  const filteredOptions =
    searchable && searchTerm
      ? options.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase()))
      : options;

  const selectedOption = options.find((option) => option.value === value);

  const toggleDropdown = () => {
    if (disabled) return;

    setIsOpen((prev) => !prev);

    if (searchable && !isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  };

  const selectOption = (optionValue: string | undefined) => {
    onChange(optionValue);
    setIsOpen(false);
    if (searchable) {
      setSearchTerm("");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    if (!isOpen && newSearchTerm.length > 0) {
      setIsOpen(true);
    }
  };

  const handleSearchFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleSearchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const dropdownMenu =
    isOpen && menuPosition ? (
      <div
        ref={menuRef}
        className={cn(
          "fixed bg-white border border-zinc-200 rounded-lg shadow-lg z-[9999] overflow-hidden transition-all duration-150 ease-out",
          openUpward ? "origin-bottom" : "origin-top"
        )}
        style={{
          top: menuPosition.top,
          left: menuPosition.left,
          width: menuPosition.width,
        }}
      >
        <div style={{ maxHeight: menuPosition.maxHeight }} className="overflow-y-auto">
          {(!searchable || !searchTerm) && (
            <button
              type="button"
              onClick={() => selectOption(undefined)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors duration-150 text-left",
                !value ? "bg-zinc-50 font-medium" : ""
              )}
            >
              <span>{placeholder}</span>
            </button>
          )}

          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
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
    ) : null;

  return (
    <div ref={triggerRef} className="relative">
      {searchable ? (
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
              "pr-10",
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
        <button
          type="button"
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
            <span className="truncate">{selectedOption?.label || placeholder}</span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200 flex-shrink-0",
              isOpen ? "rotate-180" : ""
            )}
          />
        </button>
      )}

      {typeof document !== "undefined" && dropdownMenu
        ? createPortal(dropdownMenu, document.body)
        : null}
    </div>
  );
}
