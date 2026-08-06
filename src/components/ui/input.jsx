import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-brutal border-2 border-brutal-black bg-saas-bg-secondary px-3 py-2 text-sm text-saas-text font-medium",
        "shadow-brutal-sm transition-all duration-100",
        "focus:outline-none focus:ring-2 focus:ring-saas-primary focus:shadow-brutal",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "placeholder:text-saas-text-light",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
