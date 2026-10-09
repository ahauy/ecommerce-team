import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import CommonIcons from "../commonIcons";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-black text-white hover:bg-zinc-800 active:bg-[#3f3f46]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-hairline-light bg-background hover:bg-accent hover:text-accent-foreground",
        outlineDark:
          "border-2 border-white bg-transparent text-white hover:bg-white/10 active:bg-white/20",
        outlineLight:
          "border border-black bg-white text-black hover:bg-black/5",
        aloe:
          "bg-aloe text-black hover:bg-[#aef8c7] active:bg-[#9dedb8]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-full px-3",
        lg: "h-10 rounded-full px-8",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, asChild = false, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {props.children}
        </Slot>
      );
    }

    return (
      <button
        type="button"
        {...props}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={Boolean(isLoading || props.disabled)}
      >
        {isLoading && (
          <CommonIcons.Loader2 className="icon mr-2 animate-spin" />
        )}
        {props.children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
