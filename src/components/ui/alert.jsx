import * as React from "react";
import { cn } from "../../lib/utils";

const Alert = React.forwardRef(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "relative w-full rounded-xl border p-4 text-sm font-medium",
        variant === "default" &&
          "bg-saas-bg-secondary text-saas-text border-saas-border",
        variant === "destructive" &&
          "bg-saas-danger-light border-2 border-saas-danger text-saas-danger font-bold shadow-brutal",
        variant === "success" &&
          "bg-saas-success-light border-saas-success/30 text-saas-success",
        variant === "warning" &&
          "bg-saas-warning-light border-saas-warning/30 text-saas-warning",
        variant === "info" &&
          "bg-saas-primary-light border-saas-primary/30 text-saas-primary",
        className,
      )}
      {...props}
    />
  ),
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5 ref={ref} className={cn("mb-1 font-semibold", className)} {...props} />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
