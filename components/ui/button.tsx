import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "glass" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none",
        // Variants
        variant === "primary" && "bg-primary text-white hover:bg-primary/90 shadow-[0_0_20px_rgba(49,107,243,0.3)] hover:shadow-[0_0_30px_rgba(49,107,243,0.5)]",
        variant === "secondary" && "bg-transparent text-foreground border border-border hover:bg-surface",
        variant === "glass" && "glassmorphism text-foreground hover:bg-white/10 hover:border-white/20 border border-white/10",
        variant === "ghost" && "hover:bg-surface text-foreground",
        // Sizes
        size === "sm" && "px-4 py-2 text-sm",
        size === "md" && "px-5 py-2.5 text-base",
        size === "lg" && "px-7 py-3.5 text-lg",
        className
      )}
      {...props}
    />
  );
}
