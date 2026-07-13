import { Link } from "react-router-dom";
import { BRAND_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/logo.png";

export function BrandMark({
  className,
  size = "sm",
  showWordmark = true,
}: {
  className?: string;
  size?: "sm" | "lg" | "hero";
  showWordmark?: boolean;
}) {
  const imgSizes = {
    sm: "h-8 w-8",
    lg: "h-11 w-11",
    hero: "h-16 w-16 md:h-20 md:w-20",
  };
  const textSizes = {
    sm: "text-sm",
    lg: "text-xl sm:text-2xl md:text-3xl",
    hero: "text-4xl sm:text-5xl md:text-7xl tracking-tight",
  };

  return (
    <Link
      to="/"
      className={cn(
        "group inline-flex items-center gap-2.5 font-mono font-semibold",
        className
      )}
      aria-label={BRAND_NAME}
    >
      <img
        src={LOGO_SRC}
        alt=""
        className={cn(
          "rounded-full object-cover ring-1 ring-accent-cyan/25 transition duration-500 group-hover:ring-accent-cyan/60 group-hover:shadow-[0_0_24px_-4px_rgba(77,184,255,0.45)]",
          imgSizes[size]
        )}
      />
      {showWordmark && (
        <span className={cn("inline-flex items-baseline", textSizes[size])}>
          <span className="brand-wordmark transition duration-500 group-hover:brightness-110">
            {BRAND_NAME}
          </span>
          <span
            className="brand-cursor ml-0.5 inline-block h-[0.9em] w-[0.45em] translate-y-[0.08em] animate-cursor-blink"
            aria-hidden
          />
        </span>
      )}
    </Link>
  );
}
