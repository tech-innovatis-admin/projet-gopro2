"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PersonActionItemProps = {
  label: string;
  icon: ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
};

const baseButtonClassName =
  "border-gray-200 bg-white text-slate-600 shadow-none transition-colors hover:border-[#004225]/20 hover:bg-[#004225]/5 hover:text-[#004225]";

const tooltipClassName =
  "pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-150 invisible group-hover/action:visible group-hover/action:translate-y-0 group-hover/action:opacity-100 group-focus-within/action:visible group-focus-within/action:translate-y-0 group-focus-within/action:opacity-100";

export function PersonActionItem({
  label,
  icon,
  href,
  target,
  rel,
  onClick,
  className,
  disabled = false,
}: PersonActionItemProps) {
  const buttonClassName = cn(baseButtonClassName, className);
  const content = (
    <>
      {icon}
      <span className="sr-only">{label}</span>
    </>
  );

  return (
    <div className="group/action relative">
      {href ? (
        <Button
          asChild
          variant="outline"
          size="icon-sm"
          className={buttonClassName}
        >
          <Link href={href} aria-label={label} target={target} rel={rel}>
            {content}
          </Link>
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={onClick}
          aria-label={label}
          className={buttonClassName}
          disabled={disabled}
        >
          {content}
        </Button>
      )}

      <span role="tooltip" className={tooltipClassName}>
        {label}
      </span>
    </div>
  );
}
