"use client";

import { useCallback, useMemo, useState } from "react";
import { HttpError } from "@/src/lib/api/types";

type FieldErrors<T extends string> = Partial<Record<T, string>>;
type FieldMap<T extends string> = Partial<Record<string, T>>;

export function useFormApiErrors<T extends string>(
  options?: { fieldMap?: FieldMap<T> }
) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<T>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const mapField = useCallback(
    (backendField: string): T | null => {
      const mapped = options?.fieldMap?.[backendField];
      if (mapped) return mapped;
      return backendField as T;
    },
    [options?.fieldMap]
  );

  const focusFirstError = useCallback((source?: FieldErrors<T>) => {
    const errors = source ?? fieldErrors;
    const firstField = Object.keys(errors)[0];
    if (!firstField) return;

    const selector = [
      `[name="${firstField}"]`,
      `[id="${firstField}"]`,
      `[data-field="${firstField}"]`,
    ].join(",");
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    if ("focus" in element) element.focus();
  }, [fieldErrors]);

  const clearErrors = useCallback(() => {
    setFieldErrors({});
    setGlobalError(null);
  }, []);

  const handleSubmitError = useCallback((error: unknown, fallback: string) => {
    const nextFieldErrors: FieldErrors<T> = {};

    if (error instanceof HttpError && error.fieldErrors) {
      for (const [backendField, message] of Object.entries(error.fieldErrors)) {
        const field = mapField(backendField);
        if (!field || !message) continue;
        nextFieldErrors[field] = message;
      }
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setGlobalError(null);
      setTimeout(() => focusFirstError(nextFieldErrors), 0);
      return;
    }

    setFieldErrors({});
    setGlobalError(fallback);
  }, [focusFirstError, mapField]);

  return useMemo(
    () => ({
      fieldErrors,
      globalError,
      isSubmitting,
      handleSubmitError,
      clearErrors,
      setSubmitting,
      focusFirstError,
      setFieldErrors,
      setGlobalError,
    }),
    [fieldErrors, globalError, isSubmitting, handleSubmitError, clearErrors, focusFirstError]
  );
}

