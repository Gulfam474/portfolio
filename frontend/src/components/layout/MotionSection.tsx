import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MotionSection({
  children,
  className,
  delay = 0,
  ...props
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
} & HTMLMotionProps<"section">) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
      className={cn("glass-card glass-card-hover p-4 sm:p-6 md:p-7", className)}
      {...props}
    >
      {children}
    </motion.section>
  );
}
