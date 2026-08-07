import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "../../lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: "w-full",
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-bold text-saas-text",
        nav: "space-x-1 flex items-center",
        button_previous: cn(
          "absolute left-1 inline-flex items-center justify-center w-7 h-7 rounded-brutal border-2 border-brutal-black bg-transparent text-saas-text hover:bg-saas-primary hover:text-white transition-colors",
        ),
        button_next: cn(
          "absolute right-1 inline-flex items-center justify-center w-7 h-7 rounded-brutal border-2 border-brutal-black bg-transparent text-saas-text hover:bg-saas-primary hover:text-white transition-colors",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-saas-text-muted rounded-md w-9 font-medium text-[0.8rem] uppercase tracking-wider",
        week: "flex w-full mt-2",
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-saas-bg-tertiary",
        ),
        day_button: cn(
          "w-9 h-9 p-0 font-medium text-sm rounded-brutal border-2 border-transparent text-saas-text hover:bg-saas-primary hover:text-white hover:border-brutal-black transition-colors",
        ),
        selected: cn(
          "bg-saas-primary text-white border-brutal-black font-bold",
        ),
        today: "border-brutal-black bg-saas-bg-tertiary font-bold",
        outside: "text-saas-text-muted opacity-40",
        disabled: "text-saas-text-muted opacity-40",
        range_middle: "aria-selected:bg-saas-bg-tertiary aria-selected:text-saas-text",
        hidden: "invisible",
        chevron: "w-4 h-4",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className="w-4 h-4" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
