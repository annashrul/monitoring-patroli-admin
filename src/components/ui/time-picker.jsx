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
    <div className={cn("flex items-center gap-2", className)}>
      <Clock className="w-4 h-4 text-saas-text-muted shrink-0" />
      <Select value={hours || undefined} onValueChange={(v) => handleChange("hour", v)}>
        <Select.Trigger className="w-[70px] h-11 text-sm">
          <Select.Value placeholder="--" />
        </Select.Trigger>
        <Select.Content>
          {HOURS.map((h) => (
            <Select.Item key={h} value={h}>{h}</Select.Item>
          ))}
        </Select.Content>
      </Select>
      <span className="text-saas-text font-bold">:</span>
      <Select value={minutes || undefined} onValueChange={(v) => handleChange("minute", v)}>
        <Select.Trigger className="w-[70px] h-11 text-sm">
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
