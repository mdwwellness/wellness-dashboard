"use client";

import { useMemo, useState, useCallback } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, startOfToday, parseISO, isValid } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useGetAllAppointments } from "@/data/appointment/appointment";
import { useGetAllTherapist } from "@/data/therapist/therapist";
import { useGetAllTherapistLeaves } from "@/data/therapist/therapist-leaves";
import { useGetClinicSettings } from "@/data/clinic-settings/clinic-settings";
import { useAuthStore } from "@/providers/permission-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, CalendarDays, Search, Clock, User, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TherapistformType } from "@/type/schema";

const locales = { "en-US": {} };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// Vibrant, distinguishable colors that work on dark backgrounds
const THERAPIST_COLORS = [
  "hsl(220, 70%, 60%)",  // blue
  "hsl(340, 65%, 55%)",  // rose
  "hsl(160, 55%, 45%)",  // teal
  "hsl(25, 75%, 55%)",   // orange
  "hsl(270, 60%, 60%)",  // violet
  "hsl(185, 65%, 40%)",  // cyan
  "hsl(85, 55%, 45%)",   // lime
  "hsl(0, 65%, 55%)",    // red
  "hsl(200, 70%, 50%)",  // sky
  "hsl(290, 55%, 55%)",  // purple
  "hsl(140, 50%, 45%)",  // green
  "hsl(45, 70%, 50%)",   // amber
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
  /** When set, only this therapist's sessions are shown (My Profile mode). */
  filterDoctorId?: string;
}

type TherapistWithId = TherapistformType & { _id: string };

export function TherapistCalendarView({ onBack, filterDoctorId }: TherapistCalendarViewProps) {
  const { user } = useAuthStore();
  const { data: appointments = [] } = useGetAllAppointments({ id: user?.id, role: user?.role, userEmail: user?.userEmail });
  const { data: therapists = [] } = useGetAllTherapist() as { data: TherapistWithId[] };
  const { data: clinicSettings } = useGetClinicSettings();
  const { data: allLeaves = [] } = useGetAllTherapistLeaves();

  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState<Date>(startOfToday());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTherapistId, setSelectedTherapistId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const gapMinutes = clinicSettings?.bookingGapMinutes ?? 60;

  // Map therapist names to colors (appointments use `a.doctor` name, not `t._id`)
  const therapistColorMap = useMemo(() => {
    const map = new Map<string, string>();
    therapists.forEach((t, i) => {
      map.set(t.name, THERAPIST_COLORS[i % THERAPIST_COLORS.length]);
    });
    return map;
  }, [therapists]);

  // Convert appointments with slots to calendar events
  // Check both physioSlot (new) and slot (legacy) fields for backward compatibility
  const events = useMemo<CalendarEvent[]>(() => {
    const result: CalendarEvent[] = [];
    for (const a of appointments) {
      if (!a.doctorId) continue;
      // When filterDoctorId is set, only show that therapist's sessions
      if (filterDoctorId && a.doctorId !== filterDoctorId) continue;
      // Use physioSlot if available, fall back to legacy slot
      const slotDateStr = a.physioSlot?.date || (a.slot?.date as string);
      const slotTime = a.physioSlot?.time || a.slot?.time;
      if (!slotDateStr || !slotTime) continue;

      const slotDate = parseISO(slotDateStr);
      if (!isValid(slotDate)) continue;
      const [hours, minutes] = slotTime.split(":").map(Number);

      const start = new Date(slotDate);
      start.setHours(hours, minutes, 0, 0);

      const end = new Date(start);
      end.setMinutes(end.getMinutes() + gapMinutes);
      if (!isValid(end)) continue;

      const therapistId = a.doctorId;
      const therapistName = a.doctor ?? "Unknown";
      const color = therapistColorMap.get(therapistName) ?? "#6b7280";

      result.push({
        id: a._id ?? `${slotDateStr}-${slotTime}`,
        title: a.sessionNumber && a.totalSessions
          ? `${a.name} - ${a.service ?? "Session"} (${a.sessionNumber} of ${a.totalSessions})`
          : `${a.name} - ${a.service ?? "Session"}`,
        start,
        end,
        therapistId,
        therapistName,
        color,
        service: a.service,
        patientName: a.name,
      });
    }
    return result;
  }, [appointments, gapMinutes, therapistColorMap, filterDoctorId]);

  // Generate "off-day" events from therapists' weekOffDays.
  // These fill the visible calendar range so staff know when a therapist is
  // unavailable. Uses a muted gray color to visually distinguish from sessions.
  const offDayEvents = useMemo<CalendarEvent[]>(() => {
    const result: CalendarEvent[] = [];
    // Generate events for 3 months around the current date to cover any view
    const rangeStart = subMonths(date, 1);
    const rangeEnd = addMonths(date, 1);
    const OFF_DAY_COLOR = "hsl(0, 0%, 45%)"; // muted gray

    for (const t of therapists) {
      if (!t.weekOffDays?.length || !t.doctorId) continue;
      // When filterDoctorId is set, only show that therapist's off-days
      if (filterDoctorId && t.doctorId !== filterDoctorId) continue;
      let cursor = new Date(rangeStart);
      while (cursor <= rangeEnd) {
        if (t.weekOffDays.includes(getDay(cursor))) {
          const dayStart = new Date(cursor);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(cursor);
          dayEnd.setHours(23, 59, 59, 999);
          result.push({
            id: `off-${t.doctorId}-${format(cursor, "yyyy-MM-dd")}`,
            title: `${t.name} - Off`,
            start: dayStart,
            end: dayEnd,
            therapistId: t.doctorId,
            therapistName: t.name,
            color: OFF_DAY_COLOR,
          });
        }
        cursor = addDays(cursor, 1);
      }
    }
    return result;
  }, [therapists, date, filterDoctorId]);

  // Generate leave block events from TherapistLeave records.
  // Amber-colored blocks that show when a therapist has taken time off.
  const leaveEvents = useMemo<CalendarEvent[]>(() => {
    const result: CalendarEvent[] = [];
    const LEAVE_COLOR = "hsl(38, 90%, 50%)"; // amber
    const rangeStart = subMonths(date, 1);
    const rangeEnd = addMonths(date, 1);

    for (const leave of allLeaves) {
      // When filterDoctorId is set, only show that therapist's leaves
      if (filterDoctorId && leave.doctorId !== filterDoctorId) continue;

      const therapist = therapists.find((t) => t.doctorId === leave.doctorId);
      const therapistName = therapist?.name ?? leave.doctorId;

      const leaveStart = new Date(leave.startDate + "T00:00:00");
      const leaveEnd = new Date(leave.endDate + "T00:00:00");

      // Clamp to visible range
      const effectiveStart = leaveStart < rangeStart ? rangeStart : leaveStart;
      const effectiveEnd = leaveEnd > rangeEnd ? rangeEnd : leaveEnd;

      let cursor = new Date(effectiveStart);
      while (cursor <= effectiveEnd) {
        const dayStart = new Date(cursor);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(cursor);
        dayEnd.setHours(23, 59, 59, 999);
        result.push({
          id: `leave-${leave._id}-${format(cursor, "yyyy-MM-dd")}`,
          title: `${therapistName} - Leave${leave.reason ? ` (${leave.reason})` : ""}`,
          start: dayStart,
          end: dayEnd,
          therapistId: leave.doctorId,
          therapistName,
          color: LEAVE_COLOR,
        });
        cursor = addDays(cursor, 1);
      }
    }
    return result;
  }, [allLeaves, therapists, date, filterDoctorId]);

  // Merge appointment events with off-day events
  const allEvents = useMemo<CalendarEvent[]>(
    () => [...events, ...offDayEvents, ...leaveEvents],
    [events, offDayEvents, leaveEvents],
  );

  // Stats per therapist for the visible range — keyed by name since
  // appointments use `a.doctor` (name string) not `t._id` (ObjectId)
  const therapistStats = useMemo(() => {
    const stats = new Map<string, { count: number; hours: number; customers: number; services: Map<string, number> }>();
    for (const e of events) {
      const key = e.therapistName;
      const existing = stats.get(key) ?? { count: 0, hours: 0, customers: 0, services: new Map() };
      existing.count++;
      existing.hours += (e.end.getTime() - e.start.getTime()) / (1000 * 60 * 60);
      if (e.service) {
        existing.services.set(e.service, (existing.services.get(e.service) ?? 0) + 1);
      }
      stats.set(key, existing);
    }
    // Count unique customers per therapist
    for (const [name, stat] of stats) {
      const uniqueCustomers = new Set(
        events
          .filter((e) => e.therapistName === name && e.patientName)
          .map((e) => e.patientName)
      );
      stat.customers = uniqueCustomers.size;
    }
    return stats;
  }, [events]);

  // Overall stats
  const overallStats = useMemo(() => {
    let totalSessions = 0;
    let totalHours = 0;
    for (const s of therapistStats.values()) {
      totalSessions += s.count;
      totalHours += s.hours;
    }
    return { totalSessions, totalHours, therapistCount: therapistStats.size };
  }, [therapistStats]);

  // Filtered therapists by search
  const filteredTherapists = useMemo(() => {
    if (!searchQuery.trim()) return therapists;
    const q = searchQuery.toLowerCase();
    return therapists.filter((t) =>
      t.name?.toLowerCase().includes(q) ||
      t.specialization?.some((s) => s.toLowerCase().includes(q))
    );
  }, [therapists, searchQuery]);

  // Determine which therapist names match the search query (name only, not specialization)
  // Returns null when search is empty (= no filter), empty array when no name matches
  const searchFilteredNames = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const names = therapists
      .filter((t) => t.name?.toLowerCase().includes(q))
      .map((t) => t.name);
    return names.length > 0 ? names : [];
  }, [therapists, searchQuery]);

  // Events visible on calendar: all when no search, filtered by name when searching
  const visibleEvents = useMemo(() => {
    if (searchFilteredNames === null) return allEvents;
    return allEvents.filter((e) => searchFilteredNames.includes(e.therapistName));
  }, [allEvents, searchFilteredNames]);

  // Stats computed from visible events (filters with search)
  const visibleStats = useMemo(() => {
    let totalSessions = 0;
    let totalHours = 0;
    const therapistIds = new Set<string>();
    for (const e of visibleEvents) {
      totalSessions++;
      totalHours += (e.end.getTime() - e.start.getTime()) / (1000 * 60 * 60);
      therapistIds.add(e.therapistName);
    }
    return { totalSessions, totalHours, therapistCount: therapistIds.size };
  }, [visibleEvents]);

  // Sessions for selected therapist
  const selectedTherapistSessions = useMemo(() => {
    if (!selectedTherapistId) return [];
    const selectedName = therapists.find((t) => t._id === selectedTherapistId)?.name;
    if (!selectedName) return [];
    return visibleEvents
      .filter((e) => e.therapistName === selectedName)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [visibleEvents, selectedTherapistId, therapists]);

  // Jump to session time
  const jumpToSession = useCallback((event: CalendarEvent) => {
    setDate(event.start);
    setView("day");
  }, []);

  // Sessions for selected date (when no therapist selected)
  const selectedDateSessions = useMemo(() => {
    if (!selectedDate || selectedTherapistId) return [];
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return visibleEvents
      .filter((e) => format(e.start, "yyyy-MM-dd") === dateStr)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [visibleEvents, selectedDate, selectedTherapistId]);

  // Handle day click on calendar
  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedTherapistId(null);
  }, []);

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

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const isOffDay = event.id.startsWith("off-");
    const isLeave = event.id.startsWith("leave-");
    return {
      style: {
        backgroundColor: isOffDay
          ? "hsl(0, 0%, 30%)"
          : isLeave
            ? `${event.color}33`
            : event.color,
        border: isOffDay
          ? "1px dashed hsl(0, 0%, 55%)"
          : isLeave
            ? `1px dashed ${event.color}88`
            : "none",
        borderRadius: "6px",
        color: isOffDay
          ? "hsl(0, 0%, 65%)"
          : isLeave
            ? event.color
            : "white",
        fontSize: "13px",
        padding: "3px 8px",
        cursor: "pointer",
        opacity: isOffDay ? 0.6 : isLeave ? 0.7 : 0.9,
        textShadow: isOffDay || isLeave ? "none" : "0 1px 2px rgba(0,0,0,0.3)",
      },
    };
  }, []);

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
          <span className="text-xl font-semibold ml-2">
            {format(date, view === "month" ? "MMMM yyyy" : "MMM d, yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-1 border rounded-md">
          {(["day", "week", "month"] as View[]).map((v) => (
            <Button
              key={v}
              variant={view === v ? "default" : "ghost"}
              size="sm"
              className="h-9 px-3 text-sm font-medium"
              onClick={() => setView(v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-medium">{visibleStats.totalSessions}</span>
          <span className="text-muted-foreground">sessions</span>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="font-medium">{visibleStats.totalHours.toFixed(1)}</span>
          <span className="text-muted-foreground">hours</span>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
          <span className="h-2 w-2 rounded-full bg-violet-500" />
          <span className="font-medium">{visibleStats.therapistCount}</span>
          <span className="text-muted-foreground">active</span>
        </div>
      </div>

      {/* Main content: Calendar + Sidebar */}
      <div className="flex gap-4">
        {/* Calendar */}
        <div className="flex-1 border rounded-xl overflow-hidden bg-background" style={{ height: "620px" }}>
          <style>{`
            .rbc-calendar { font-family: inherit; }
            .rbc-header { border-bottom: 1px solid hsl(var(--border)); padding: 8px 0; }
            .rbc-header > a { color: hsl(var(--foreground)); font-weight: 500; font-size: 14px; }
            .rbc-day-bg { background: hsl(var(--background)); cursor: pointer; transition: background 0.15s; }
            .rbc-day-bg:hover { background: hsl(var(--accent) / 0.15); }
            .rbc-today { background: hsl(var(--primary) / 0.08); }
            .rbc-off-range-bg { background: hsl(var(--muted) / 0.2); }
            .rbc-off-range-bg:hover { background: hsl(var(--muted) / 0.3); }
            .rbc-time-header { border-bottom: 1px solid hsl(var(--border)); }
            .rbc-time-content { border-top: none; }
            .rbc-day-slot .rbc-time-slot { border-top: 1px solid hsl(var(--border) / 0.3); }
            .rbc-time-gutter > div { color: hsl(var(--muted-foreground)); font-size: 12px; font-weight: 500; }
            .rbc-row-content { z-index: 1; }
            .rbc-show-all { display: none; }
            .rbc-allday-cell { display: none; }
            .rbc-allday-header { display: none; }
            .rbc-month-view .rbc-row-content { cursor: pointer; }
            .rbc-event { border-radius: 4px !important; font-size: 12px !important; }
          `}</style>
          <Calendar
            localizer={localizer}
            events={visibleEvents}
            view={view}
            date={date}
            onView={setView}
            onNavigate={setDate}
            onSelectSlot={(slotInfo) => {
              if (slotInfo.action === "select" || slotInfo.action === "click") {
                handleDayClick(slotInfo.start);
              }
            }}
            onSelectEvent={(event) => handleDayClick(event.start)}
            selectable
            eventPropGetter={eventStyleGetter}
            toolbar={false}
            views={["day", "week", "month"]}
            step={30}
            timeslots={2}
            defaultView="week"
            min={new Date(2024, 0, 1, 8, 0)}
            max={new Date(2024, 0, 1, 18, 0)}
            longPressThreshold={10}
          />
        </div>

        {/* Sidebar */}
        <div className="w-72 flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search therapist..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedTherapistId(null);
              }}
              className="pl-9 h-9"
            />
          </div>

          {/* Therapist list */}
          <div className="border rounded-xl bg-card">
            <div className="p-2.5 border-b bg-muted/30 flex items-center text-xs font-medium text-muted-foreground">
              <span className="flex-1">Therapist</span>
              <span className="w-12 text-right">Cust</span>
            </div>
            <div className="max-h-44 overflow-y-auto">
              {filteredTherapists.map((t) => {
                const color = therapistColorMap.get(t.name) ?? "#6b7280";
                const stats = therapistStats.get(t.name);
                const isSelected = selectedTherapistId === t._id;
                return (
                  <button
                    key={t._id}
                    onClick={() => setSelectedTherapistId(isSelected ? null : t._id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0",
                      isSelected && "bg-muted"
                    )}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="flex-1 truncate font-medium">{t.name}</span>
                    <span className="w-12 text-right text-xs text-muted-foreground">{stats?.customers ?? 0}</span>
                  </button>
                );
              })}
              {filteredTherapists.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No therapists found
                </div>
              )}
            </div>
          </div>

          {/* Sessions list */}
          <div className="border rounded-xl bg-card flex-1 min-h-0 flex flex-col">
            <div className="p-2.5 border-b bg-muted/30">
              <span className="text-xs font-medium text-muted-foreground">
                {selectedTherapistId
                  ? `Sessions (${selectedTherapistSessions.length})`
                  : selectedDate
                    ? `Sessions for ${format(selectedDate, "MMM d")} (${selectedDateSessions.length})`
                    : "Select a therapist or click a day"}
              </span>
            </div>
            <div className="overflow-y-auto flex-1">
              {selectedTherapistId && selectedTherapistSessions.map((event) => (
                <button
                  key={event.id}
                  onClick={() => jumpToSession(event)}
                  className="w-full flex items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0"
                >
                  <Clock className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{event.patientName}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
                    </div>
                    {event.service && (
                      <div className="text-xs text-muted-foreground">{event.service}</div>
                    )}
                  </div>
                </button>
              ))}

              {!selectedTherapistId && selectedDate && selectedDateSessions.map((event) => (
                <button
                  key={event.id}
                  onClick={() => jumpToSession(event)}
                  className="w-full flex items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0"
                >
                  <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: event.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{event.patientName}</div>
                    <div className="text-xs text-muted-foreground">
                      {event.therapistName} · {format(event.start, "h:mm a")} - {format(event.end, "h:mm a")}
                    </div>
                    {event.service && (
                      <div className="text-xs text-muted-foreground">{event.service}</div>
                    )}
                  </div>
                </button>
              ))}

              {selectedTherapistId && selectedTherapistSessions.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No sessions in this range
                </div>
              )}
              {!selectedTherapistId && selectedDate && selectedDateSessions.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No sessions on this day
                </div>
              )}
              {!selectedTherapistId && !selectedDate && (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  <User className="h-5 w-5 mx-auto mb-1 opacity-50" />
                  Click a therapist or day to view sessions
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
