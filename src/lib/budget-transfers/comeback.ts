const COMEBACK_REASON_PATTERN = /comeback do remanejamento\s*#\s*(\d+)/i;

export type BudgetTransferComebackInfo = {
  isComeback: boolean;
  originalTransferId: number | null;
};

export function parseBudgetTransferComeback(
  reason: string | null | undefined
): BudgetTransferComebackInfo {
  const normalizedReason = reason?.trim();
  if (!normalizedReason) {
    return {
      isComeback: false,
      originalTransferId: null,
    };
  }

  const match = normalizedReason.match(COMEBACK_REASON_PATTERN);
  if (!match) {
    return {
      isComeback: false,
      originalTransferId: null,
    };
  }

  const originalTransferId = Number.parseInt(match[1], 10);
  return {
    isComeback: true,
    originalTransferId: Number.isFinite(originalTransferId) ? originalTransferId : null,
  };
}

export function buildBudgetTransferComebackReason(
  transferId: string | number,
  originalReason: string | null | undefined
): string {
  const header = `Comeback do remanejamento #${transferId}`;
  const trimmedOriginalReason = originalReason?.trim();

  if (!trimmedOriginalReason) {
    return header;
  }

  return `${header}. Motivo original: ${trimmedOriginalReason}`;
}
