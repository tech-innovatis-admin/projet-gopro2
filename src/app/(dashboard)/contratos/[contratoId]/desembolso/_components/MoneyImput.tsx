import * as React from "react";

/**
 * MoneyInput (BRL)
 * - Componente controlado com estado interno em centavos (integer)
 * - Exibição formatada em pt-BR: "R$ 1.234,56"
 * - Digitação estilo app bancário: apenas dígitos; casas decimais inferidas
 * - Backspace remove o último dígito (divide por 10)
 * - Suporta colar (paste) números com ou sem separadores
 */

export type MoneyInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "inputMode"
> & {
  valueCents: number;
  onValueChange: (nextCents: number) => void;
  currency?: "BRL" | string;
  locale?: string;
  maxCents?: number;
  allowNegative?: boolean;
};

const DEFAULT_LOCALE = "pt-BR";
const DEFAULT_CURRENCY = "BRL";

function clampInt(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function safeInt(n: unknown) {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.trunc(x);
}

/**
 * Extrai dígitos de qualquer string (ex.: "R$ 1.234,56" -> "123456")
 */
function digitsOnly(s: string) {
  return (s.match(/\d+/g) || []).join("");
}

function formatCents(
  cents: number,
  locale: string,
  currency: string
): string {
  const value = cents / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Converte um texto colado/entrada para centavos.
 * Estratégia: pegar todos os dígitos e assumir que os 2 últimos são centavos.
 * - "10256" => 10256
 * - "R$ 102,56" => 10256
 * - "1.234" => 1234 => R$ 12,34
 */
function parseToCents(raw: string, allowNegative: boolean): number {
  const isNeg = allowNegative && /-/.test(raw);
  const d = digitsOnly(raw);
  if (!d) return 0;
  const cents = safeInt(d);
  return isNeg ? -cents : cents;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  function MoneyInput(
    {
      valueCents,
      onValueChange,
      locale = DEFAULT_LOCALE,
      currency = DEFAULT_CURRENCY,
      maxCents,
      allowNegative = false,
      disabled,
      readOnly,
      onKeyDown,
      onPaste,
      onFocus,
      className,
      ...rest
    },
    ref
  ) {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const isInitialFocus = React.useRef(true);
    
    React.useImperativeHandle(ref, () => inputRef.current!);

    const display = React.useMemo(
      () => formatCents(valueCents, locale, currency),
      [valueCents, locale, currency]
    );

    // Converte posição do cursor no texto formatado para posição nos dígitos brutos
    const getDigitPosition = (cursorPos: number, formatted: string): number => {
      let digitCount = 0;
      for (let i = 0; i < Math.min(cursorPos, formatted.length); i++) {
        if (/\d/.test(formatted[i])) {
          digitCount++;
        }
      }
      return digitCount;
    };

    // Converte posição nos dígitos brutos para posição no texto formatado
    const getFormattedPosition = (digitPos: number, formatted: string): number => {
      let digitCount = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) {
          digitCount++;
          if (digitCount >= digitPos) {
            return i + 1;
          }
        }
      }
      return formatted.length;
    };

    const apply = React.useCallback(
      (next: number, preserveCursor?: { before: number }) => {
        let v = safeInt(next);
        if (!allowNegative) v = Math.max(0, v);
        if (typeof maxCents === "number") {
          v = clampInt(v, allowNegative ? -maxCents : 0, maxCents);
        }
        
        onValueChange(v);
        
        // Restaura posição do cursor após formatação
        if (preserveCursor && inputRef.current) {
          requestAnimationFrame(() => {
            if (inputRef.current) {
              const newFormatted = formatCents(v, locale, currency);
              const newPos = getFormattedPosition(preserveCursor.before, newFormatted);
              inputRef.current.setSelectionRange(newPos, newPos);
            }
          });
        }
      },
      [onValueChange, maxCents, allowNegative, locale, currency]
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;
      if (disabled || readOnly) return;

      const key = e.key;
      const el = e.currentTarget;
      const cursorPos = el.selectionStart || 0;
      const currentFormatted = el.value;

      if (
        key === "Tab" ||
        key === "ArrowLeft" ||
        key === "ArrowRight" ||
        key === "Home" ||
        key === "End"
      ) {
        return;
      }

      if (key === "Backspace") {
        e.preventDefault();
        
        // Se há seleção, remove os dígitos selecionados
        if (el.selectionStart !== el.selectionEnd) {
          const start = el.selectionStart || 0;
          const end = el.selectionEnd || 0;
          const beforeStart = getDigitPosition(start, currentFormatted);
          const beforeEnd = getDigitPosition(end, currentFormatted);
          
          // Remove dígitos da posição start até end
          const digits = digitsOnly(currentFormatted);
          const newDigits = digits.slice(0, beforeStart) + digits.slice(beforeEnd);
          const next = parseToCents(newDigits, allowNegative);
          apply(next, { before: beforeStart });
          return;
        }
        
        // Se não há seleção, remove o dígito antes do cursor
        if (cursorPos > 0) {
          const digitPos = getDigitPosition(cursorPos, currentFormatted);
          if (digitPos > 0) {
            const digits = digitsOnly(currentFormatted);
            const newDigits = digits.slice(0, digitPos - 1) + digits.slice(digitPos);
            const next = parseToCents(newDigits, allowNegative);
            apply(next, { before: digitPos - 1 });
            return;
          }
        }
        
        // Se está no início, apenas zera
        apply(0);
        return;
      }

      if (key === "Delete") {
        e.preventDefault();
        
        // Se há seleção, remove os dígitos selecionados
        if (el.selectionStart !== el.selectionEnd) {
          const start = el.selectionStart || 0;
          const end = el.selectionEnd || 0;
          const beforeStart = getDigitPosition(start, currentFormatted);
          const beforeEnd = getDigitPosition(end, currentFormatted);
          
          const digits = digitsOnly(currentFormatted);
          const newDigits = digits.slice(0, beforeStart) + digits.slice(beforeEnd);
          const next = parseToCents(newDigits, allowNegative);
          apply(next, { before: beforeStart });
          return;
        }
        
        // Se não há seleção, remove o dígito na posição do cursor
        const digitPos = getDigitPosition(cursorPos, currentFormatted);
        const digits = digitsOnly(currentFormatted);
        if (digitPos < digits.length) {
          const newDigits = digits.slice(0, digitPos) + digits.slice(digitPos + 1);
          const next = parseToCents(newDigits, allowNegative);
          apply(next, { before: digitPos });
          return;
        }
        
        return;
      }

      if (/^\d$/.test(key)) {
        e.preventDefault();
        const digit = Number(key);
        
        // Se há seleção, substitui os dígitos selecionados
        if (el.selectionStart !== el.selectionEnd) {
          const start = el.selectionStart || 0;
          const end = el.selectionEnd || 0;
          const beforeStart = getDigitPosition(start, currentFormatted);
          const beforeEnd = getDigitPosition(end, currentFormatted);
          
          const digits = digitsOnly(currentFormatted);
          const newDigits = digits.slice(0, beforeStart) + digit + digits.slice(beforeEnd);
          const next = parseToCents(newDigits, allowNegative);
          apply(next, { before: beforeStart + 1 });
          return;
        }
        
        // Insere dígito na posição do cursor
        const digitPos = getDigitPosition(cursorPos, currentFormatted);
        const digits = digitsOnly(currentFormatted);
        const newDigits = digits.slice(0, digitPos) + digit + digits.slice(digitPos);
        const next = parseToCents(newDigits, allowNegative);
        apply(next, { before: digitPos + 1 });
        return;
      }

      if (e.ctrlKey || e.metaKey) return;
      e.preventDefault();
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      onPaste?.(e);
      if (e.defaultPrevented) return;
      if (disabled || readOnly) return;

      e.preventDefault();
      const text = e.clipboardData.getData("text");
      const next = parseToCents(text, allowNegative);
      apply(next);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      onFocus?.(e);
      
      // Apenas na primeira vez que recebe foco, coloca cursor no final
      if (isInitialFocus.current) {
        isInitialFocus.current = false;
        requestAnimationFrame(() => {
          try {
            const el = e.target;
            const len = el.value.length;
            el.setSelectionRange(len, len);
          } catch {
            // noop
          }
        });
      }
    };

    // Handler onChange necessário para evitar warning do React
    // O componente controla tudo via onKeyDown, então este handler previne mudanças diretas
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Previne mudanças diretas no input (tudo é controlado via onKeyDown)
      e.preventDefault();
    };

    return (
      <input
        ref={inputRef}
        value={display}
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        readOnly={readOnly}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={handleFocus}
        className={className}
        {...rest}
      />
    );
  }
);

/**
 * Hook opcional para facilitar uso em formulários.
 */
export function useMoneyCents(initialCents = 0) {
  const [valueCents, setValueCents] = React.useState<number>(() => safeInt(initialCents));
  const setFromNumber = React.useCallback((value: number) => {
    // value em reais (ex.: 102.56) -> centavos
    const cents = Math.round(value * 100);
    setValueCents(safeInt(cents));
  }, []);
  return { valueCents, setValueCents, setFromNumber };
}

/**
 * Exemplo de uso:
 *
 * const { valueCents, setValueCents } = useMoneyCents(0);
 *
 * <MoneyInput
 *   valueCents={valueCents}
 *   onValueChange={setValueCents}
 *   placeholder="R$ 0,00"
 *   className="h-10 w-full rounded-md border px-3"
 * />
 */
