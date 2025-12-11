"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface ColumnWidth {
  minWidth?: number;
  defaultWidth?: number;
  maxWidth?: number;
}

export interface UseResizableColumnsOptions {
  columnCount: number;
  defaultWidths?: (number | ColumnWidth)[];
  minColumnWidth?: number;
  tableRef?: React.RefObject<HTMLTableElement>;
}

export function useResizableColumns({
  columnCount,
  defaultWidths = [],
  minColumnWidth = 50,
  tableRef,
}: UseResizableColumnsOptions) {
  const [columnWidths, setColumnWidths] = useState<number[]>(() => {
    // Inicializar larguras das colunas
    const widths: number[] = [];
    for (let i = 0; i < columnCount; i++) {
      const defaultWidth = defaultWidths[i];
      if (typeof defaultWidth === "number") {
        widths.push(defaultWidth);
      } else if (defaultWidth && typeof defaultWidth === "object") {
        widths.push(defaultWidth.defaultWidth || 150);
      } else {
        widths.push(150); // Largura padrão
      }
    }
    return widths;
  });

  const resizingRef = useRef<{
    columnIndex: number;
    startX: number;
    startWidth: number;
  } | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return;

    const { columnIndex, startX, startWidth } = resizingRef.current;
    const diff = e.clientX - startX;
    const newWidth = Math.max(minColumnWidth, startWidth + diff);

    setColumnWidths((prev) => {
      const newWidths = [...prev];
      newWidths[columnIndex] = newWidth;
      return newWidths;
    });

    // Prevenir seleção de texto durante o redimensionamento
    e.preventDefault();
  }, [minColumnWidth]);

  const handleMouseUp = useCallback(() => {
    resizingRef.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(
    (columnIndex: number, e: React.MouseEvent | MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const handler = e.currentTarget || e.target;
      const th = (handler as HTMLElement).parentElement as HTMLTableCellElement;
      if (!th) return;

      const startWidth = th.offsetWidth;
      const startX = e.clientX;

      resizingRef.current = {
        columnIndex,
        startX,
        startWidth,
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [handleMouseMove, handleMouseUp]
  );

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [handleMouseMove, handleMouseUp]);

  return {
    columnWidths,
    handleMouseDown,
  };
}

