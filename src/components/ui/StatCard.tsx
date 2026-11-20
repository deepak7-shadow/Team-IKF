import React from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "../../lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: "blue" | "cyan" | "violet" | "success" | "warning";
  isDemo?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel = "vs last month",
  icon: Icon,
  iconColor = "blue",
  isDemo = true,
  className,
}: StatCardProps) {
  const iconColorStyles = {
    blue: "bg-[#FDF6E3] text-[#A88032] border-[#E4C477]/50",
    cyan: "bg-[#FFF9EA] text-[#C49A45] border-[#E9E1D1]",
    violet: "bg-[#F5EEDB] text-[#9E7828] border-[#E4C477]/40",
    success: "bg-[#D8F3E5] text-[#258B65] border-[#258B65]/30",
    warning: "bg-[#FDF0D5] text-[#B58428] border-[#D49A32]/40",
  };

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div
      className={cn(
        "glass-card p-5 sm:p-6 rounded-2xl flex flex-col justify-between h-full group hover:border-[#D6A94F] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden bg-[#FFFEFA] border border-[#E9E1D1] shadow-warm hover:shadow-warm-hover",
        className
      )}
    >
      {/* Decorative ambient card glow */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#E4C477]/10 rounded-full blur-2xl group-hover:bg-[#E4C477]/20 transition-all pointer-events-none" />

      {/* Top Header & Icon */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#777365] tracking-wider uppercase">
              {title}
            </span>
            {isDemo && (
              <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-[#F1EBDD] text-[#777365] border border-[#E9E1D1]">
                SAMPLE
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#25251F] tracking-tight">
            {value}
          </h2>
        </div>

        <div
          className={cn(
            "p-3 rounded-2xl border transition-transform duration-300 group-hover:scale-105 shrink-0 shadow-sm",
            iconColorStyles[iconColor]
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Bottom Change Indicator */}
      {change !== undefined && (
        <div className="mt-4 pt-3 border-t border-[#E9E1D1] flex items-center gap-2 text-xs relative z-10">
          <span
            className={cn(
              "flex items-center font-bold px-2 py-0.5 rounded-md text-[11px]",
              isPositive && "text-[#258B65] bg-[#D8F3E5] border border-[#258B65]/30",
              isNegative && "text-[#D95353] bg-[#FDE8E8] border border-[#D95353]/30",
              !isPositive && !isNegative && "text-[#777365] bg-[#F1EBDD]"
            )}
          >
            {isPositive && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
            {isNegative && <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
            {!isPositive && !isNegative && <Minus className="w-3.5 h-3.5 mr-0.5" />}
            {Math.abs(change)}%
          </span>
          <span className="text-[#777365] text-[11px] truncate">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}
