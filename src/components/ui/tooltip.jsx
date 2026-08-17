import * as React from "react";
import { cn } from "../../lib/utils";

const TooltipProvider = ({ delayDuration = 0, ...props }) => <div {...props} />;

const Tooltip = React.forwardRef(({ ...props }, ref) => (
  <div ref={ref} {...props} />
));

const TooltipTrigger = React.forwardRef(({ ...props }, ref) => (
  <div ref={ref} {...props} />
));

const TooltipContent = React.forwardRef(
  ({ className, sideOffset = 4, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "z-50 overflow-hidden rounded-xl border border-saas-border bg-saas-bg-secondary text-saas-text px-3 py-1.5 text-xs shadow-card font-bold",
        className,
      )}
      {...props}
    />
  ),
);
TooltipContent.displayName = "TooltipContent";

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
