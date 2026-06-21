"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export function DOBPicker({
  value,
  onChange,
}: {
  value?: string; // ISO string
  onChange: (val: string) => void;
}) {
  const date = value ? new Date(value) : null;

  const day = date?.getDate();
  const month = date?.getMonth();
  const year = date?.getFullYear();

  const currentYear = new Date().getFullYear();

  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const daysInMonth =
    month !== undefined && year
      ? new Date(year, month + 1, 0).getDate()
      : 31;

  const updateDate = (d?: number, m?: number, y?: number) => {
    const newDay = d ?? day;
    const newMonth = m ?? month;
    const newYear = y ?? year;

    if (
      newDay !== undefined &&
      newMonth !== undefined &&
      newYear !== undefined
    ) {
      const newDate = new Date(newYear, newMonth, newDay);
      onChange(newDate.toISOString());
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start w-full">
          {date
            ? `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
            : "Select date of birth"}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[360px] max-w-[calc(100vw-2rem)] p-2">
        <div className="flex gap-2">

          {/* Day */}
          <div className="w-1/3 max-h-56 overflow-y-auto border rounded-md">
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
              <button
                key={d}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-muted",
                  day === d && "bg-muted font-medium"
                )}
                onClick={() => updateDate(d)}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Month */}
          <div className="w-1/3 max-h-56 overflow-y-auto border rounded-md">
            {months.map((m, i) => (
              <button
                key={m}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-muted",
                  month === i && "bg-muted font-medium"
                )}
                onClick={() => updateDate(undefined, i)}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Year */}
          <div className="w-1/3 max-h-56 overflow-y-auto border rounded-md">
            {years.map((y) => (
              <button
                key={y}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-muted",
                  year === y && "bg-muted font-medium"
                )}
                onClick={() => updateDate(undefined, undefined, y)}
              >
                {y}
              </button>
            ))}
          </div>

        </div>
      </PopoverContent>
    </Popover>
  );
}
