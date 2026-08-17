import * as React from "react";
import { cn } from "../../lib/utils";

const badgeVariants = {
  default: "bg-saas-bg-tertiary text-saas-text border-saas-border",
  primary: "bg-saas-primary text-black border-brutal-black",
  destructive: "bg-saas-danger text-white border-brutal-black",
  success: "bg-saas-success text-white border-brutal-black",
  warning: "bg-saas-warning text-white border-brutal-black",
  info: "bg-saas-info text-white border-brutal-black",
  muted: "bg-saas-bg-tertiary text-saas-text-muted border-saas-border",
  outline: "bg-transparent text-saas-text border-saas-border",
};

const Badge = React.forwardRef(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-brutal border-2 px-2.5 py-0.5 text-xs font-bold shadow-brutal-sm",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  ),
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
