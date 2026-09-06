"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-fg hover:bg-accent-strong disabled:bg-surface-3 disabled:text-faint",
  secondary:
    "bg-surface-2 text-text border border-border hover:border-muted/60 hover:bg-surface-3 disabled:opacity-40",
  ghost:
    "bg-transparent text-muted hover:text-text hover:bg-surface-2 disabled:opacity-40",
  danger:
    "bg-bad/15 text-bad border border-bad/30 hover:bg-bad/25 disabled:opacity-40",
  success:
    "bg-good/15 text-good border border-good/30 hover:bg-good/25 disabled:opacity-40",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9.5 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
  icon: "h-9 w-9",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant = "secondary", size = "md", ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex select-none items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors duration-150 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);