import * as React from "react";
import { cn } from "../../lib/utils";

const InputOTP = React.forwardRef(
  ({ className, maxLength = 6, ...props }, ref) => {
    const [value, setValue] = React.useState("");
    const inputRefs = React.useRef([]);

    return (
      <div className={cn("flex gap-2 has-[:disabled]:opacity-50", className)}>
        {Array.from({ length: maxLength }, (_, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[i] || ""}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) return;
              const newVal = value.slice(0, i) + val + value.slice(i + 1);
              setValue(newVal);
              if (val && i < maxLength - 1) {
                inputRefs.current[i + 1]?.focus();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !value[i] && i > 0) {
                inputRefs.current[i - 1]?.focus();
              }
            }}
            className="h-10 w-10 rounded-brutal border-2 border-brutal-black bg-saas-bg-secondary text-saas-text text-center text-sm font-bold font-mono shadow-brutal-sm focus:outline-none focus:ring-2 focus:ring-saas-primary/20 focus:border-saas-primary"
            ref={ref}
            {...props}
          />
        ))}
      </div>
    );
  },
);
InputOTP.displayName = "InputOTP";

export { InputOTP };
