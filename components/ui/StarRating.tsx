"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// COMPONENTE DE AVALIAÇÃO POR ESTRELAS
// =============================================================================

interface StarRatingProps {
  nota: number; // 0-5
  onRatingChange?: (nota: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  nota,
  onRatingChange,
  readonly = false,
  size = "md",
  showLabel = false,
  showValue = false,
  className,
}: StarRatingProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (!readonly) {
      setHoveredStar(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoveredStar(null);
    }
  };

  const displayValue = hoveredStar !== null ? hoveredStar : nota;
  const hasRating = nota > 0;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((value) => {
          const isFilled = value <= displayValue;
          const isInteractive = !readonly && onRatingChange;

          return (
            <button
              key={value}
              type="button"
              onClick={() => handleClick(value)}
              onMouseEnter={() => handleMouseEnter(value)}
              onMouseLeave={handleMouseLeave}
              disabled={readonly || !isInteractive}
              className={cn(
                "transition-all duration-150",
                isInteractive && "cursor-pointer hover:scale-110",
                readonly && "cursor-default"
              )}
              aria-label={`Avaliar com ${value} estrela${value > 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  isFilled
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-200 text-gray-200",
                  isInteractive && hoveredStar !== null && value <= hoveredStar && !isFilled
                    ? "fill-yellow-300 text-yellow-300"
                    : ""
                )}
              />
            </button>
          );
        })}
      </div>
      {showValue && hasRating && (
        <span className="text-sm font-medium text-gray-700 ml-1">
          {nota.toFixed(1)}
        </span>
      )}
      {showLabel && (
        <span className="text-xs text-gray-500 ml-1">
          {nota === 0
            ? "Sem avaliação"
            : nota === 1
            ? "Ruim"
            : nota === 2
            ? "Regular"
            : nota === 3
            ? "Bom"
            : nota === 4
            ? "Muito Bom"
            : "Excelente"}
        </span>
      )}
    </div>
  );
}
