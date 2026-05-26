import { useCallback, useEffect, useState } from "react";

type UseModalCloseGuardOptions = {
  isOpen: boolean;
  shouldConfirm: boolean;
  closeDisabled?: boolean;
  closeOnEscape?: boolean;
  onClose: () => void;
  onDiscardConfirm?: () => void;
};

export function useModalCloseGuard({
  isOpen,
  shouldConfirm,
  closeDisabled = false,
  closeOnEscape = true,
  onClose,
  onDiscardConfirm,
}: UseModalCloseGuardOptions) {
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const requestClose = useCallback(() => {
    if (closeDisabled) {
      return;
    }

    if (shouldConfirm) {
      setShowDiscardConfirm(true);
      return;
    }

    onClose();
  }, [closeDisabled, onClose, shouldConfirm]);

  const cancelDiscard = useCallback(() => {
    setShowDiscardConfirm(false);
  }, []);

  const confirmDiscard = useCallback(() => {
    setShowDiscardConfirm(false);
    onDiscardConfirm?.();
    onClose();
  }, [onClose, onDiscardConfirm]);

  useEffect(() => {
    if (!isOpen) {
      setShowDiscardConfirm(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || closeDisabled || !closeOnEscape || showDiscardConfirm) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeDisabled, closeOnEscape, isOpen, requestClose, showDiscardConfirm]);

  return {
    requestClose,
    discardConfirmProps: {
      isOpen: showDiscardConfirm,
      onConfirm: confirmDiscard,
      onCancel: cancelDiscard,
    },
  };
}
