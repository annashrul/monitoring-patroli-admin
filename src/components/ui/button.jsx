import * as React from "react";
import { cn } from "../../lib/utils";

const Button = React.forwardRef(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? React.Children.only(props.children).type : "button";
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center gap-2 font-bold rounded-xl border-2 border-brutal-black transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saas-primary",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0",
          variant === "default" &&
            "bg-saas-primary text-black shadow-brutal hover:shadow-brutal-hover hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-0 active:translate-y-0",
          variant === "primary" &&
            "bg-saas-primary text-black shadow-brutal hover:shadow-brutal-hover hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-0 active:translate-y-0",
          variant === "destructive" &&
            "bg-saas-danger text-white shadow-brutal hover:shadow-brutal-hover hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-0 active:translate-y-0",
          variant === "outline" &&
            "bg-saas-bg-secondary text-saas-text shadow-brutal hover:shadow-brutal-hover hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-0 active:translate-y-0",
          variant === "ghost" &&
            "bg-transparent text-saas-text-muted border-transparent shadow-none hover:bg-saas-bg-tertiary hover:text-saas-text hover:border-saas-border hover:shadow-brutal-sm",
          variant === "secondary" &&
            "bg-saas-bg-tertiary text-saas-text shadow-brutal hover:shadow-brutal-hover hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-0 active:translate-y-0",
          size === "default" && "px-4 py-2 text-sm",
          size === "sm" && "px-3 py-1.5 text-xs",
          size === "lg" && "px-6 py-3 text-base",
          size === "icon" && "w-9 h-9 p-0",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
