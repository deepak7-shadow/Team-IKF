import React from "react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./Button";
import { cn } from "../../lib/utils";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  onActionClick?: () => void;
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  actionLabel,
  actionTo,
  onAction,
  onActionClick,
  compact = false,
  className,
}: EmptyStateProps) {
  const label = actionLabel || actionText;
  const handler = onAction || onActionClick;

  return (
    <div
      className={cn(
        "glass-card bg-[#FFFEFA] border border-[#E9E1D1] rounded-2xl text-center flex flex-col items-center justify-center space-y-4 shadow-warm",
        compact ? "p-6 sm:p-8" : "p-8 sm:p-12",
        className
      )}
    >
      <div
        className={cn(
          "rounded-2xl bg-[#FAF7F0] border border-[#E4C477]/50 flex items-center justify-center text-[#A88032] shadow-sm",
          compact ? "w-11 h-11" : "w-14 h-14"
        )}
      >
        <Icon className={compact ? "w-5 h-5" : "w-7 h-7"} />
      </div>

      <div className="space-y-1.5 max-w-md">
        <h3
          className={cn(
            "font-bold text-[#25251F] tracking-tight",
            compact ? "text-sm sm:text-base" : "text-base sm:text-lg"
          )}
        >
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-[#777365] leading-relaxed">
          {description}
        </p>
      </div>

      {label && (actionTo || handler) && (
        <div className="pt-2">
          {actionTo ? (
            <Link to={actionTo}>
              <Button variant="primary" size={compact ? "sm" : "md"} className="shadow-gold-glow">
                {label}
              </Button>
            </Link>
          ) : (
            <Button
              variant="primary"
              size={compact ? "sm" : "md"}
              onClick={handler}
              className="shadow-gold-glow"
            >
              {label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
