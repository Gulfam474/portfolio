import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-lg border border-border-subtle bg-[color:var(--input-bg)] px-3 py-2 text-sm text-foreground placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/60",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
