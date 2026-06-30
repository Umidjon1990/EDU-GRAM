import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "focus-ring interactive-lift inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[linear-gradient(135deg,var(--primary),color-mix(in_srgb,var(--primary)_72%,var(--sky)))] text-primary-foreground shadow-[var(--shadow-float)] hover:brightness-105",
        secondary:
          "surface-raised text-card-foreground hover:bg-muted",
        ghost: "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
      },
      size: {
        md: "h-11 px-4 text-sm",
        lg: "h-13 px-6 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  asChild,
  className,
  size,
  variant,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp className={cn(buttonVariants({ className, size, variant }))} {...props} />
  );
}
