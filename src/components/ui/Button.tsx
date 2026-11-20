import React from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "cyan";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#C49A45]/40 active:scale-[0.98]";

  const variantStyles = {
    primary:
      "bg-gradient-champagne text-[#25251F] font-semibold hover:shadow-gold-glow hover:brightness-105 border border-[#C49A45]/30",
    cyan:
      "bg-[#F5EEDB] text-[#25251F] font-semibold hover:bg-[#EFE5CC] border border-[#C49A45]/40 hover:shadow-sm",
    secondary:
      "bg-[#FFFEFA] hover:bg-[#F1EBDD] text-[#25251F] border border-[#E9E1D1] shadow-sm hover:border-[#C49A45]/50",
    outline:
      "bg-transparent hover:bg-[#F1EBDD] text-[#25251F] border border-[#E9E1D1] hover:border-[#C49A45]",
    danger:
      "bg-[#FDE8E8] hover:bg-[#FCD8D8] text-[#D95353] border border-[#D95353]/30",
    ghost:
      "bg-transparent hover:bg-[#F1EBDD] text-[#777365] hover:text-[#25251F]",
  };

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 h-8 gap-1.5",
    md: "text-sm px-4 py-2 h-10 gap-2",
    lg: "text-base px-6 py-2.5 h-12 gap-2.5",
  };

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-[#777365] border-t-[#25251F] rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
}
