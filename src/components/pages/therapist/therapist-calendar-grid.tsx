"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarGridProps {
  /** Days of week (0-6) that are weekly off-days */
  weekOffDays: number[];
  /** Leave blocks [{startDate, endDate}] */
  leaves: Array<{ startDate: string; endDate: string }>;
  /** Called when a day is clicked (for adding leave) */
  onDayClick?: (date: string) => void;
}

export function CalendarGrid({
  weekOffDays,
  leaves,
  onDayClick,
}: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  // Build a set of leave-covered date strings
  const leaveDates = useMemo(() => {
    const dates = new Set<string>();
    for (const leave of leaves) {
      let d = new Date(leave.startDate + "T00:00:00");
      const end = new Date(leave.endDate + "T00:00:00");
      while (d <= end) {
        dates.add(format(d, "yyyy-MM-dd"));
        d = addDays(d, 1);
      }
    }
    return dates;
  }, [leaves]);

  // Build the calendar rows
  const weeks = useMemo(() => {
    const rows: Date[][] = [];
    let day = calStart;
    while (day <= calEnd) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(day);
        day = addDays(day, 1);
      }
      rows.push(week);
    }
    return rows;
  }, [calStart.getTime(), calEnd.getTime()]);

  const today = new Date();

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h4 className="text-sm font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h4>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500/30 border border-red-500/50" />
          Weekly off
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500/30 border border-amber-500/50" />
          Leave
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500/50 border border-red-600" />
          Off + Leave
        </span>
      </div>

      {/* Calendar grid */}
      <div className="rounded-md border overflow-hidden">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 bg-muted/50">
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className="py-1.5 text-center text-[10px] font-medium text-muted-foreground border-r last:border-r-0"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Date cells */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-t">
            {week.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const inMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, today);
              const dayOfWeek = day.getDay();
              const isWeeklyOff = weekOffDays.includes(dayOfWeek);
              const isLeave = leaveDates.has(dateStr);

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => onDayClick?.(dateStr)}
                  className={cn(
                    "relative h-9 border-r last:border-r-0 text-xs transition-colors",
                    !inMonth && "bg-background/50 text-muted-foreground/40",
                    inMonth && "text-foreground",
                    isToday && "font-bold",
                    isWeeklyOff &&
                      isLeave &&
                      "bg-red-500/40 text-red-100",
                    isWeeklyOff &&
                      !isLeave &&
                      "bg-red-500/15 text-red-600 dark:text-red-400",
                    !isWeeklyOff &&
                      isLeave &&
                      "bg-amber-500/20 text-amber-700 dark:text-amber-400",
                    inMonth &&
                      !isWeeklyOff &&
                      !isLeave &&
                      "hover:bg-muted/50",
                  )}
                >
                  {format(day, "d")}
                  {/* Dot indicators */}
                  {(isWeeklyOff || isLeave) && inMonth && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {isWeeklyOff && (
                        <span className="h-1 w-1 rounded-full bg-red-500" />
                      )}
                      {isLeave && (
                        <span className="h-1 w-1 rounded-full bg-amber-500" />
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
