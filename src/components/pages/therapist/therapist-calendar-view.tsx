"use client";

import { useMemo, useState, useCallback } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, startOfToday, parseISO, isValid } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useGetAllAppointments } from "@/data/appointment/appointment";
import { useGetAllTherapist } from "@/data/therapist/therapist";
import { useGetClinicSettings } from "@/data/clinic-settings/clinic-settings";
import { useAuthStore } from "@/providers/permission-provider";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TherapistformType } from "@/type/schema";

const locales = { "en-US": {} };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// Color palette for therapists - distinct, accessible colors
const THERAPIST_COLORS = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#e11d48", // rose
  "#0ea5e9", // sky
  "#a855f7", // purple
  "#22c55e", // green
  "#eab308", // yellow
];

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  therapistId: string;
  therapistName: string;
  color: string;
  service?: string;
  patientName?: string;
}

interface TherapistCalendarViewProps {
  onBack: () => void;
}

type TherapistWithId = TherapistformType & { _id: string };

export function TherapistCalendarView({ onBack }: TherapistCalendarViewProps) {
  const { user } = useAuthStore();
  const { data: appointments = [] } = useGetAllAppointments({ id: user?.id, role: user?.role, userEmail: user?.userEmail });
  const { data: therapists = [] } = useGetAllTherapist() as { data: TherapistWithId[] };
  const { data: clinicSettings } = useGetClinicSettings();

  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState<Date>(startOfToday());

  const gapMinutes = clinicSettings?.bookingGapMinutes ?? 60;

  // Map therapist IDs to colors
  const therapistColorMap = useMemo(() => {
    const map = new Map<string, string>();
    therapists.forEach((t, i) => {
      map.set(t._id, THERAPIST_COLORS[i % THERAPIST_COLORS.length]);
    });
    return map;
  }, [therapists]);

  // Map therapist IDs to names
  const therapistNameMap = useMemo(() => {
    const map = new Map<string, string>();
    therapists.forEach((t) => {
      map.set(t._id, t.name);
    });
    return map;
  }, [therapists]);

  // Convert appointments to calendar events
  const events = useMemo<CalendarEvent[]>(() => {
    return appointments
      .filter((a): a is typeof a & { physioSlot: { date: string; time: string }; doctorId: string } =>
        Boolean(a.physioSlot?.date && a.physioSlot?.time && a.doctorId)
      )
      .map((a) => {
        const slotDate = parseISO(a.physioSlot.date);
        const [hours, minutes] = a.physioSlot.time.split(":").map(Number);

        const start = new Date(slotDate);
        start.setHours(hours, minutes, 0, 0);

        const end = new Date(start);
        end.setMinutes(end.getMinutes() + gapMinutes);

        const therapistId = a.doctorId!;
        const color = therapistColorMap.get(therapistId) ?? "#6b7280";
        const therapistName = therapistNameMap.get(therapistId) ?? a.doctor ?? "Unknown";

        return {
          id: a._id ?? `${a.physioSlot.date}-${a.physioSlot.time}`,
          title: `${a.name} - ${a.service ?? "Session"}`,
          start,
          end,
          therapistId,
          therapistName,
          color,
          service: a.service,
          patientName: a.name,
        };
      })
      .filter((e) => isValid(e.start) && isValid(e.end));
  }, [appointments, gapMinutes, therapistColorMap, therapistNameMap]);

  // Stats per therapist for the visible range
  const therapistStats = useMemo(() => {
    const stats = new Map<string, { count: number; hours: number }>();
    for (const e of events) {
      const existing = stats.get(e.therapistId) ?? { count: 0, hours: 0 };
      existing.count++;
      existing.hours += (e.end.getTime() - e.start.getTime()) / (1000 * 60 * 60);
      stats.set(e.therapistId, existing);
    }
    return stats;
  }, [events]);

  const handleNavigate = useCallback((direction: "prev" | "next" | "today") => {
    if (direction === "today") {
      setDate(startOfToday());
      return;
    }
    if (view === "week") {
      setDate((d) => direction === "prev" ? subWeeks(d, 1) : addWeeks(d, 1));
    } else if (view === "day") {
      setDate((d) => direction === "prev" ? subDays(d, 1) : addDays(d, 1));
    } else {
      setDate((d) => direction === "prev" ? subMonths(d, 1) : addMonths(d, 1));
    }
  }, [view]);

  const eventStyleGetter = useCallback((event: CalendarEvent) => ({
    style: {
      backgroundColor: event.color,
      border: "none",
      borderRadius: "4px",
      color: "white",
      fontSize: "11px",
      padding: "1px 4px",
      cursor: "pointer",
    },
  }), []);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            <CalendarDays className="h-4 w-4 mr-1" />
            Table View
          </Button>
          <div className="flex items-center gap-1 border rounded-md">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleNavigate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-3" onClick={() => handleNavigate("today")}>
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleNavigate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {format(date, view === "month" ? "MMMM yyyy" : "MMM d, yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-1 border rounded-md">
          {(["day", "week", "month"] as View[]).map((v) => (
            <Button
              key={v}
              variant={view === v ? "default" : "ghost"}
              size="sm"
              className="h-8"
              onClick={() => setView(v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Therapist legend with stats */}
      <div className="flex flex-wrap gap-3 text-xs">
        {therapists.map((t) => {
          const color = therapistColorMap.get(t._id) ?? "#6b7280";
          const stats = therapistStats.get(t._id);
          return (
            <div key={t._id} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
              <span className="font-medium">{t.name}</span>
              {stats && (
                <span className="text-muted-foreground">
                  ({stats.count} session{stats.count !== 1 ? "s" : ""})
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Calendar */}
      <div className="border rounded-lg overflow-hidden" style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}>
        <Calendar
          localizer={localizer}
          events={events}
          view={view}
          date={date}
          onView={setView}
          onNavigate={setDate}
          eventPropGetter={eventStyleGetter}
          toolbar={false}
          views={["day", "week", "month"]}
          step={15}
          timeslots={4}
          defaultView="week"
          min={new Date(2024, 0, 1, 8, 0)}
          max={new Date(2024, 0, 1, 20, 0)}
          longPressThreshold={10}
        />
      </div>
    </div>
  );
}
