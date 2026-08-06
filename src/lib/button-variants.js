import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium text-sm rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brutal-accent/20 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-brutal-accent text-white hover:bg-brutal-accentHover shadow-sm",
        primary:
          "bg-brutal-accent text-white hover:bg-brutal-accentHover shadow-sm",
        destructive: "bg-brutal-red text-white hover:bg-red-600 shadow-sm",
        outline:
          "bg-white text-brutal-white border border-brutal-zinc hover:bg-brutal-bg",
        ghost:
          "bg-transparent text-brutal-muted hover:bg-brutal-bg hover:text-brutal-white",
      },
      size: {
        default: "px-4 py-2 text-sm",
        sm: "px-3 py-1.5 text-xs",
        lg: "px-6 py-3 text-base",
        icon: "w-9 h-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
