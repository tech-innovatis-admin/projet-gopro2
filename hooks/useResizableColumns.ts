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
  tableRef?: React.RefObject<HTMLTableElement | null>;
}

export function useResizableColumns({
  columnCount,
  defaultWidths = [],
  minColumnWidth = 50,
  tableRef,
}: UseResizableColumnsOptions) {
  const getColumnConstraints = useCallback(
    (index: number) => {
      const config = defaultWidths[index];

      if (typeof config === "object" && config !== null) {
        return {
          min: config.minWidth ?? minColumnWidth,
          max: config.maxWidth ?? Number.POSITIVE_INFINITY,
        };
      }

      return {
        min: minColumnWidth,
        max: Number.POSITIVE_INFINITY,
      };
    },
    [defaultWidths, minColumnWidth]
  );

  const [columnWidths, setColumnWidths] = useState<number[]>(() => {
    const widths: number[] = [];

    for (let i = 0; i < columnCount; i++) {
      const config = defaultWidths[i];
      const { min, max } =
        typeof config === "object" && config !== null
          ? {
              min: config.minWidth ?? minColumnWidth,
              max: config.maxWidth ?? Number.POSITIVE_INFINITY,
            }
          : { min: minColumnWidth, max: Number.POSITIVE_INFINITY };

      const clampWidth = (width: number) => Math.min(max, Math.max(min, width));

      if (typeof config === "number") {
        widths.push(clampWidth(config));
      } else if (config && typeof config === "object") {
        widths.push(clampWidth(config.defaultWidth || 150));
      } else {
        widths.push(clampWidth(150));
      }
    }

    return widths;
  });

  const resizingRef = useRef<{
    columnIndex: number;
    startX: number;
    startWidth: number;
  } | null>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!resizingRef.current) return;

      const { columnIndex, startX, startWidth } = resizingRef.current;
      const diff = e.clientX - startX;
      const { min, max } = getColumnConstraints(columnIndex);
      const newWidth = Math.min(max, Math.max(min, startWidth + diff));

      setColumnWidths((prev) => {
        const newWidths = [...prev];
        newWidths[columnIndex] = newWidth;
        return newWidths;
      });

      e.preventDefault();
    },
    [getColumnConstraints]
  );

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
