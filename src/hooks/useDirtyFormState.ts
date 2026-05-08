import { useState, useCallback } from 'react';

/**
 * Hook para gerenciar estado sujo de formulários com confirmação de descarte
 * 
 * Uso:
 * ```
 * const form = useDirtyFormState(initialData);
 * form.handleChange(fieldName, newValue); // Marca como sujo
 * form.reset(); // Limpa e marca como limpo
 * form.confirmDiscard(); // Pede confirmação
 * ```
 */
type UseDirtyFormStateOptions = {
  onDiscardConfirmed?: () => void;
};

export function useDirtyFormState<T extends Record<string, any>>(
  initialData: T,
  options?: UseDirtyFormStateOptions
) {
  const [formData, setFormData] = useState<T>(initialData);
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const handleChange = useCallback(
    (updates: Partial<T>) => {
      setFormData((prev) => ({ ...prev, ...updates }));
      setIsDirty(true);
    },
    []
  );

  const reset = useCallback(() => {
    setFormData(initialData);
    setIsDirty(false);
    setShowDiscardConfirm(false);
  }, [initialData]);

  const requestDiscard = useCallback(() => {
    if (!isDirty) {
      // Se não tem dados sujos, descarta direto
      reset();
      options?.onDiscardConfirmed?.();
    } else {
      // Se tem dados sujos, pede confirmação
      setShowDiscardConfirm(true);
    }
  }, [isDirty, reset, options]);

  const confirmDiscard = useCallback(() => {
    setShowDiscardConfirm(false);
    reset();
    options?.onDiscardConfirmed?.();
  }, [reset, options]);

  const cancelDiscard = useCallback(() => {
    setShowDiscardConfirm(false);
  }, []);

  return {
    formData,
    setFormData,
    isDirty,
    setIsDirty,
    handleChange,
    reset,
    requestDiscard,
    confirmDiscard,
    cancelDiscard,
    showDiscardConfirm,
  };
}
