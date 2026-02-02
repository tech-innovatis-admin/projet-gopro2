"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageLabels?: string[];
}

export function PageNavigation({
  currentPage,
  totalPages,
  onPageChange,
  pageLabels,
}: PageNavigationProps) {
  const goToNext = () => {
    onPageChange(currentPage < totalPages ? currentPage + 1 : 1);
  };

  const goToPrev = () => {
    onPageChange(currentPage > 1 ? currentPage - 1 : totalPages);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={goToPrev}
        className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
        title="Página anterior"
      >
        <ChevronLeft className="h-4 w-4 text-gray-600" />
      </button>

      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-medium transition-colors ${
              currentPage === page
                ? "bg-[#004225] text-white"
                : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100"
            }`}
            title={pageLabels?.[page - 1] || `Página ${page}`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={goToNext}
        className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
        title="Próxima página"
      >
        <ChevronRight className="h-4 w-4 text-gray-600" />
      </button>
    </div>
  );
}

// Indicador de página para o rodapé
export function PageIndicator({
  currentPage,
  totalPages,
  pageLabel,
}: {
  currentPage: number;
  totalPages: number;
  pageLabel?: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
      <span className="font-medium">
        Página {currentPage} de {totalPages}
      </span>
      {pageLabel && (
        <>
          <span className="text-gray-300">|</span>
          <span>{pageLabel}</span>
        </>
      )}
    </div>
  );
}
