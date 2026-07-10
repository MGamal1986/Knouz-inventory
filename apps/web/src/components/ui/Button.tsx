import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "dark" | "ghost" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-artisan-gold text-deep-charcoal font-semibold hover:brightness-95 px-lg py-sm rounded-lg",
  dark: "bg-deep-charcoal text-white font-semibold hover:brightness-110 px-lg py-sm rounded-lg",
  ghost:
    "bg-transparent border border-surface-border text-on-surface-variant hover:bg-surface-container-high px-lg py-sm rounded-lg",
  icon: "p-sm rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-low",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-sm text-body-sm font-body-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
