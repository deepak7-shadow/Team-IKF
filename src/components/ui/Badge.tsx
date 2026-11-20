import React from "react";
import { cn } from "../../lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "gradient" | "outline";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "info",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    success: "bg-[#D8F3E5] text-[#258B65] border border-[#258B65]/30",
    warning: "bg-[#FDF0D5] text-[#B58428] border border-[#D49A32]/40",
    danger: "bg-[#FDE8E8] text-[#D95353] border border-[#D95353]/35",
    info: "bg-[#F5EEDB] text-[#9E7828] border border-[#C49A45]/35",
    neutral: "bg-[#F1EBDD] text-[#777365] border border-[#E9E1D1]",
    gradient: "bg-gradient-champagne text-[#25251F] border border-[#C49A45]/30 shadow-sm font-semibold",
    outline: "bg-transparent text-[#777365] border border-[#E9E1D1]",
  };

  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide",
    md: "text-xs px-2.5 py-1 rounded-full font-medium tracking-wide",
    lg: "text-sm px-3.5 py-1.5 rounded-full font-semibold",
  };

  const dotColors = {
    success: "bg-[#258B65]",
    warning: "bg-[#D49A32]",
    danger: "bg-[#D95353]",
    info: "bg-[#C49A45]",
    neutral: "bg-[#777365]",
    gradient: "bg-[#25251F]",
    outline: "bg-[#C49A45]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 transition-all select-none font-sans whitespace-nowrap shrink-0",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            dotColors[variant],
            (variant === "success" || variant === "danger") && "animate-pulse"
          )}
        />
      )}
      {children}
    </span>
  );
}
