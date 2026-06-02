import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export function Card({ className, glow = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "glassmorphism rounded-2xl p-6 transition-all duration-300 relative overflow-hidden",
        glow && "premium-glow",
        className
      )}
      {...props}
    />
  );
}
