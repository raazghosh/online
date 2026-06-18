"use client";

import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  /** Whether to render the badge. If false/undefined, renders nothing. */
  isVerified?: boolean;
  /** Display size of the badge */
  size?: "xs" | "sm" | "md";
  /** Extra class names */
  className?: string;
  /** Whether to show the label text alongside the icon */
  showLabel?: boolean;
}

/**
 * VerifiedBadge
 * Renders a premium emerald "Trusted & Verified" badge when `isVerified` is true.
 * Returns null when not verified so it's safe to drop anywhere.
 */
export function VerifiedBadge({
  isVerified,
  size = "sm",
  className,
  showLabel = true,
}: VerifiedBadgeProps) {
  if (!isVerified) return null;

  const sizeStyles = {
    xs: {
      container: "px-1.5 py-0.5 gap-0.5 rounded",
      icon: "w-2.5 h-2.5",
      text: "text-[8px]",
    },
    sm: {
      container: "px-2 py-0.5 gap-1 rounded-md",
      icon: "w-3 h-3",
      text: "text-[9px]",
    },
    md: {
      container: "px-2.5 py-1 gap-1.5 rounded-lg",
      icon: "w-3.5 h-3.5",
      text: "text-[10px]",
    },
  };

  const s = sizeStyles[size];

  return (
    <span
      className={cn(
        "inline-flex items-center font-bold uppercase tracking-wider",
        "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400",
        "shadow-[0_0_8px_rgba(16,185,129,0.15)]",
        s.container,
        className
      )}
      title="Trusted & Verified User"
    >
      <ShieldCheck className={cn(s.icon, "shrink-0")} />
      {showLabel && <span className={s.text}>Verified</span>}
    </span>
  );
}
