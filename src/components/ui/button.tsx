import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] transition-transform",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary-500 shadow-lg",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive shadow-lg",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-purple-500 shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-secondary shadow-sm",
        ghost: 
          "hover:bg-accent hover:text-accent-foreground focus-visible:ring-purple-500 focus-visible:ring-offset-0",
        link: 
          "text-primary underline-offset-4 hover:underline focus-visible:ring-purple-500 focus-visible:ring-offset-0 p-0 h-auto",
        success:
          "bg-success-600 text-white hover:bg-success-700 focus-visible:ring-success-500 shadow-lg",
        warning:
          "bg-warning-600 text-white hover:bg-warning-700 focus-visible:ring-warning-500 shadow-lg",
        purple:
          "bg-purple-600 text-white hover:bg-purple-700 focus-visible:ring-purple-500 shadow-lg",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
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
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-expanded"?: boolean;
  "aria-haspopup"?: boolean | "false" | "true" | "menu" | "listbox" | "tree" | "grid" | "dialog";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    isLoading = false,
    loadingText = "Loading...",
    icon,
    iconPosition = "left",
    disabled,
    children,
    type = "button",
    "aria-label": ariaLabel,
    "aria-describedby": ariaDescribedby,
    "aria-expanded": ariaExpanded,
    "aria-haspopup": ariaHaspopup,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    const isDisabled = disabled || isLoading;
    
    // Ensure proper aria-label when loading
    const effectiveAriaLabel = isLoading && loadingText 
      ? loadingText 
      : ariaLabel;
    
    const buttonContent = isLoading ? (
      <>
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="sr-only">{loadingText}</span>
        {children}
      </>
    ) : (
      <>
        {icon && iconPosition === "left" && (
          <span className="mr-2" aria-hidden="true">
            {icon}
          </span>
        )}
        {children}
        {icon && iconPosition === "right" && (
          <span className="ml-2" aria-hidden="true">
            {icon}
          </span>
        )}
      </>
    );

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        type={type}
        aria-label={effectiveAriaLabel}
        aria-describedby={ariaDescribedby}
        aria-expanded={ariaExpanded}
        aria-haspopup={ariaHaspopup}
        aria-disabled={isDisabled}
        {...props}
      >
        {buttonContent}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants }; 