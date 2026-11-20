import React from "react";
import { cn } from "../../lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "blue" | "cyan" | "violet" | "none";
  hoverEffect?: boolean;
}

export function Card({
  className,
  glow = "none",
  hoverEffect = true,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "glass-card bg-[#FFFEFA] border border-[#E9E1D1] rounded-2xl p-5 sm:p-6 transition-all duration-300 relative overflow-hidden shadow-warm",
        hoverEffect && "hover:-translate-y-0.5 hover:shadow-warm-hover hover:border-[#D6A94F]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-between pb-4 mb-4 border-b border-[#E9E1D1]", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-base font-bold text-[#25251F] tracking-tight flex items-center gap-2", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-[#777365] mt-0.5", className)} {...props}>
      {children}
    </p>
  );
}
