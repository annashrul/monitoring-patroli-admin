import * as React from "react";
import { cn } from "../../lib/utils";
import { Select } from "./select";
import { Clock } from "lucide-react";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function TimePicker({ value, onChange, className }) {
  const [hours, minutes] = value ? value.split(":") : ["", ""];

  const handleChange = (type, val) => {
    const h = type === "hour" ? val : (hours || "00");
    const m = type === "minute" ? val : (minutes || "00");
    onChange({ target: { value: `${h}:${m}` } });
  };

  return (
    <div className={cn(
      "flex items-center h-11 rounded-brutal border-2 border-brutal-black bg-saas-bg-secondary shadow-brutal-sm overflow-hidden",
      className,
    )}>
      <div className="flex items-center gap-1.5 px-3 border-r-2 border-brutal-black h-full bg-saas-bg-tertiary/50">
        <Clock className="w-4 h-4 text-saas-text-muted" />
        <span className="text-xs font-bold text-saas-text-muted uppercase tracking-wider">Jam</span>
      </div>
      <Select value={hours || undefined} onValueChange={(v) => handleChange("hour", v)}>
        <Select.Trigger className="w-[60px] h-full border-0 rounded-none shadow-none bg-transparent text-sm font-mono justify-center focus:ring-0 focus:shadow-none">
          <Select.Value placeholder="--" />
        </Select.Trigger>
        <Select.Content>
          {HOURS.map((h) => (
            <Select.Item key={h} value={h}>{h}</Select.Item>
          ))}
        </Select.Content>
      </Select>
      <span className="text-saas-text font-bold text-sm">:</span>
      <Select value={minutes || undefined} onValueChange={(v) => handleChange("minute", v)}>
        <Select.Trigger className="w-[60px] h-full border-0 rounded-none shadow-none bg-transparent text-sm font-mono justify-center focus:ring-0 focus:shadow-none">
          <Select.Value placeholder="--" />
        </Select.Trigger>
        <Select.Content>
          {MINUTES.map((m) => (
            <Select.Item key={m} value={m}>{m}</Select.Item>
          ))}
        </Select.Content>
      </Select>
    </div>
  );
}
TimePicker.displayName = "TimePicker";

export { TimePicker };
