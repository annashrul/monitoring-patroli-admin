import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center gap-1 rounded-brutal border-2 border-brutal-black bg-saas-bg-secondary p-1",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-brutal px-3 py-1.5 text-sm font-bold transition-all duration-100 border-2 border-transparent",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saas-primary",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:bg-saas-primary data-[state=active]:text-brutal-black data-[state=active]:border-brutal-black data-[state=active]:shadow-brutal-sm",
      "data-[state=inactive]:text-saas-text-muted data-[state=inactive]:hover:bg-saas-bg-tertiary data-[state=inactive]:hover:text-saas-text",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saas-primary",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
