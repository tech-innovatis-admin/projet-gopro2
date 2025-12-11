"use client";

import React, { useRef, useEffect, useState } from "react";
import { useResizableColumns } from "@/hooks/useResizableColumns";
import { cn } from "@/lib/utils";

export interface ResizableTableProps
  extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  columnCount: number;
  defaultWidths?: (number | { minWidth?: number; defaultWidth?: number; maxWidth?: number })[];
  minColumnWidth?: number;
}

export function ResizableTable({
  children,
  columnCount,
  defaultWidths,
  minColumnWidth = 50,
  className,
  ...props
}: ResizableTableProps) {
  const tableRef = useRef<HTMLTableElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  const { columnWidths, handleMouseDown } = useResizableColumns({
    columnCount,
    defaultWidths,
    minColumnWidth,
    tableRef,
  });

  // Aplicar larguras nas colunas após renderização
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !tableRef.current) return;

    const table = tableRef.current;
    const thead = table.querySelector("thead");
    if (!thead) return;

    const headerRow = thead.querySelector("tr");
    if (!headerRow) return;

    const headers = Array.from(headerRow.querySelectorAll("th"));
    const tbody = table.querySelector("tbody");
    const tfoot = table.querySelector("tfoot");

    headers.forEach((th, index) => {
      if (index >= columnWidths.length) return;

      const width = columnWidths[index] || 150;
      
      // Aplicar largura no header
      th.style.width = `${width}px`;
      th.style.minWidth = `${width}px`;
      th.style.maxWidth = `${width}px`;
      th.style.position = "relative";

      // Remover handlers anteriores
      const existingHandlers = th.querySelectorAll(".resize-handler");
      existingHandlers.forEach((handler) => handler.remove());

      // Adicionar handler de redimensionamento (exceto na última coluna)
      if (index < columnCount - 1) {
        const handler = document.createElement("div");
        handler.className = "resize-handler absolute top-0 right-0 w-1 h-full cursor-col-resize group";
        handler.style.marginRight = "-4px";
        handler.style.zIndex = "10";
        handler.style.padding = "0 2px";
        handler.title = "Arraste para redimensionar";
        
        const line = document.createElement("div");
        line.className = "w-0.5 h-full bg-gray-300 group-hover:bg-blue-500 transition-colors";
        handler.appendChild(line);

        handler.addEventListener("mousedown", (e) => {
          e.preventDefault();
          e.stopPropagation();
          handleMouseDown(index, e as any);
        });

        th.appendChild(handler);
      }

      // Aplicar largura nas células do tbody
      if (tbody) {
        const rows = Array.from(tbody.querySelectorAll("tr"));
        rows.forEach((row) => {
          const cells = Array.from(row.querySelectorAll("td"));
          if (cells[index]) {
            cells[index].style.width = `${width}px`;
            cells[index].style.minWidth = `${width}px`;
            cells[index].style.maxWidth = `${width}px`;
          }
        });
      }

      // Aplicar largura nas células do tfoot
      if (tfoot) {
        const footerRows = Array.from(tfoot.querySelectorAll("tr"));
        footerRows.forEach((row) => {
          const cells = Array.from(row.querySelectorAll("td"));
          if (cells[index] && cells[index].getAttribute("colspan") === null) {
            cells[index].style.width = `${width}px`;
            cells[index].style.minWidth = `${width}px`;
            cells[index].style.maxWidth = `${width}px`;
          }
        });
      }
    });
  }, [columnWidths, columnCount, handleMouseDown, isMounted]);

  return (
    <div className="overflow-x-auto">
      <table
        ref={tableRef}
        className={cn("w-full", className)}
        style={{ tableLayout: "fixed" }}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

