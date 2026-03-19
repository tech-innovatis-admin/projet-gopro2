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
const DEFAULT_MAX_CENTS = 99_999_999_999;

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
      onClick,
      onKeyDown,
      onMouseUp,
      onPaste,
      onFocus,
      className,
      ...rest
    },
    ref
  ) {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    
    React.useImperativeHandle(ref, () => inputRef.current!);

    const display = React.useMemo(
      () => formatCents(valueCents, locale, currency),
      [valueCents, locale, currency]
    );

    const moveCaretToEnd = React.useCallback(() => {
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) return;

        try {
          const len = el.value.length;
          el.setSelectionRange(len, len);
        } catch {
          // noop
        }
      });
    }, []);

    const apply = React.useCallback(
      (next: number) => {
        let v = safeInt(next);
        const resolvedMaxCents = typeof maxCents === "number" ? maxCents : DEFAULT_MAX_CENTS;

        if (!allowNegative) v = Math.max(0, v);
        v = clampInt(v, allowNegative ? -resolvedMaxCents : 0, resolvedMaxCents);
        
        onValueChange(v);
        moveCaretToEnd();
      },
      [onValueChange, maxCents, allowNegative, moveCaretToEnd]
    );

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;
      if (disabled || readOnly) return;

      const key = e.key;
      const currentFormatted = e.currentTarget.value;

      if (key === "Tab") {
        return;
      }

      if (key === "ArrowLeft" || key === "ArrowRight" || key === "Home" || key === "End") {
        e.preventDefault();
        moveCaretToEnd();
        return;
      }

      if (key === "Backspace") {
        e.preventDefault();

        const digits = digitsOnly(currentFormatted);
        const next = parseToCents(digits.slice(0, -1), allowNegative);
        apply(next);
        return;
      }

      if (key === "Delete") {
        e.preventDefault();

        const digits = digitsOnly(currentFormatted);
        const next = parseToCents(digits.slice(0, -1), allowNegative);
        apply(next);
        return;
      }

      if (/^\d$/.test(key)) {
        e.preventDefault();
        const digits = digitsOnly(currentFormatted);
        const newDigits = `${digits}${key}`;
        const next = parseToCents(newDigits, allowNegative);
        apply(next);
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
      moveCaretToEnd();
    };

    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
      onClick?.(e);
      if (e.defaultPrevented) return;
      if (disabled || readOnly) return;

      moveCaretToEnd();
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
      onMouseUp?.(e);
      if (e.defaultPrevented) return;
      if (disabled || readOnly) return;

      e.preventDefault();
      moveCaretToEnd();
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
        onClick={handleClick}
        onMouseUp={handleMouseUp}
        className={`${className ?? ""} text-center tabular-nums`}
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
