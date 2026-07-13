import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 [&_svg]:stroke-[2.25]",
  {
    variants: {
      variant: {
        default:
          "btn-sheen bg-accent-gradient text-[color:var(--on-accent)] shadow-[0_0_24px_-6px_rgba(77,184,255,0.45)] hover:brightness-110 [&_svg]:text-[color:var(--on-accent)]",
        secondary:
          "btn-secondary border bg-[color:var(--btn-secondary-bg)] text-[color:var(--btn-secondary-text)] border-[color:var(--btn-secondary-border)] hover:brightness-105 hover:shadow-[0_0_20px_-8px_rgba(77,184,255,0.35)] [&_svg]:text-[color:var(--btn-secondary-icon)]",
        ghost:
          "text-muted hover:bg-[color:var(--overlay-hover)] hover:text-[color:var(--heading)] [&_svg]:text-current",
        danger: "bg-red-500/20 text-red-300 hover:bg-red-500/30 [&_svg]:text-current",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
