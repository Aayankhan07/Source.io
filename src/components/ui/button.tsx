import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Zain's Design Button Contract:
 * - hierarchy: 'primary' (one per view), 'secondary' (default), 'tertiary', 'tertiary-gray', 'link-gray'
 * - destructive: separate prop
 * - sizes: sm (32), md (36), lg (40), xl (44), icon (36), icon-sm (32)
 * - backwards-compatible with shadcn `variant`
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,border-color,opacity,box-shadow,transform] duration-150 active:scale-[0.99] active:translate-y-[0.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none",
  {
    variants: {
      hierarchy: {
        primary:
          "bg-primary text-primary-foreground shadow-xs hover:opacity-95 active:opacity-100",
        secondary:
          "border border-border/80 bg-card hover:bg-muted/70 text-foreground shadow-xs hover:border-border",
        tertiary:
          "text-primary hover:bg-primary/10 active:bg-primary/15",
        "tertiary-gray":
          "text-muted-foreground hover:text-foreground hover:bg-muted/60 active:bg-muted/80",
        "link-gray":
          "text-muted-foreground hover:text-foreground underline-offset-4 hover:underline p-0 h-auto",
      },
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:opacity-95 active:opacity-100",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs",
        outline:
          "border border-border/80 bg-card hover:bg-muted/70 text-foreground shadow-xs hover:border-border",
        secondary:
          "border border-border/80 bg-card hover:bg-muted/70 text-foreground shadow-xs hover:border-border",
        ghost:
          "text-muted-foreground hover:text-foreground hover:bg-muted/60 active:bg-muted/80",
        link:
          "text-muted-foreground hover:text-foreground underline-offset-4 hover:underline p-0 h-auto",
      },
      destructive: {
        true: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs",
        false: "",
      },
      size: {
        default: "h-9 px-3.5 text-sm", // md is default (36px)
        xs: "h-7 px-2.5 text-xs",
        sm: "h-8 px-3 text-xs",        // 32px
        md: "h-9 px-3.5 text-sm",      // 36px
        lg: "h-10 px-4 text-sm font-medium", // 40px
        xl: "h-11 px-5 text-base font-medium", // 44px
        icon: "h-9 w-9 p-0",           // 36px
        "icon-sm": "h-8 w-8 p-0",      // 32px
      },
    },
    compoundVariants: [
      {
        hierarchy: "secondary",
        destructive: true,
        className: "border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50",
      },
      {
        hierarchy: "tertiary-gray",
        destructive: true,
        className: "text-destructive hover:bg-destructive/10",
      },
    ],
    defaultVariants: {
      destructive: false,
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  hierarchy?: "primary" | "secondary" | "tertiary" | "tertiary-gray" | "link-gray";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  destructive?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      hierarchy,
      variant,
      destructive = false,
      size,
      asChild = false,
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    // If hierarchy is specified, use it; else fallback to variant or secondary default
    const effectiveHierarchy = hierarchy || (!variant ? "secondary" : undefined);
    const effectiveVariant = !hierarchy ? (variant || "default") : undefined;

    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(
          buttonVariants({
            hierarchy: effectiveHierarchy,
            variant: effectiveVariant,
            destructive,
            size,
            className,
          }),
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="animate-spin text-current" />}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
