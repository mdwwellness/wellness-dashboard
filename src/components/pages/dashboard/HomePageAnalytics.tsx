"use client";

import React from "react";
import { subDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "../../ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import RecentSalesTable from "./dashboard-recent-sales-table";
import { MetricCard, MetricCardsRow } from "@/components/metric-card";
import { QueryWrapper } from "@/components/query-wrapper";
import { useAuthStore } from "@/providers/permission-provider";
import { useGetAllEnquiries } from "@/data/enquiry/enquiry";
import { useGetServices } from "@/data/service/service";
import { useGetAllTherapist } from "@/data/therapist/therapist";
import { deriveCustomers } from "@/data/customer/customer";
import { isFollowUp } from "@/components/pages/enquiries/stage";
import type { EnquiryType } from "@/type/schema";

const formSchema = z.object({
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
});

// Statuses that count as a real booked appointment (vs a raw enquiry/lead).
const APPOINTMENT_STATUSES = ["scheduled", "ongoing", "completed"];

function TotalsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="border border-border p-5 rounded-xl h-24 space-y-3"
        >
          <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
          <div className="h-8 w-1/3 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

const DashboardPageComponents = () => {
  const { user } = useAuthStore();
  const { id, role, userEmail } = user || {};

  // All totals are derived client-side from the lists the app already fetches.
  const enq = useGetAllEnquiries({ role, id, userEmail });
  const therapists = useGetAllTherapist();
  const services = useGetServices();

  const records = React.useMemo(
    () => (enq.data ?? []) as EnquiryType[],
    [enq.data],
  );

  const totals = React.useMemo(() => {
    const therapistList = (therapists.data ?? []) as { isActive?: boolean }[];
    const statusOf = (r: EnquiryType) => r.status ?? "enquiry";
    return {
      totalTherapists: therapistList.length,
      activeTherapists: therapistList.filter((t) => t.isActive).length,
      totalCustomers: deriveCustomers(records).length,
      totalEnquiries: records.filter((r) => statusOf(r) === "enquiry").length,
      totalAppointments: records.filter((r) =>
        APPOINTMENT_STATUSES.includes(statusOf(r)),
      ).length,
      completedAppointments: records.filter((r) => statusOf(r) === "completed")
        .length,
      totalServices: services.data?.length ?? 0,
      openFollowUps: records.filter(isFollowUp).length,
    };
  }, [records, therapists.data, services.data]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dateRange: {
        from: subDays(new Date(), 30),
        to: new Date(),
      },
    },
  });

  const loading = enq.isLoading || therapists.isLoading || services.isLoading;

  return (
    <div className="w-full flex flex-col justify-center items-center gap-6 px-3 sm:px-4 md:px-8 pt-10">
      <div className="flex justify-between items-center w-full">
        <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>

        <div className="hidden md:flex justify-center items-center gap-6">
          <Form {...form}>
            <form className="flex items-center gap-4">
              <FormField
                control={form.control}
                name="dateRange"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-[300px] h-full justify-start gap-2 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon width={20} />
                            {field.value?.from ? (
                              field.value.to ? (
                                <>{format(field.value.from, "LLL dd, y")} — {format(field.value.to, "LLL dd, y")}</>
                              ) : (
                                format(field.value.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={field.value?.from}
                          selected={field.value}
                          onSelect={field.onChange}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" variant="secondary" size="lg" disabled>
                Apply
              </Button>
            </form>
          </Form>
        </div>
      </div>

      <QueryWrapper
        isLoading={loading}
        isError={enq.isError}
        error={enq.error}
        onRetry={enq.refetch}
        skeleton={<TotalsSkeleton />}
      >
        <MetricCardsRow className="w-full">
          <MetricCard label="Total Therapists" value={totals.totalTherapists} />
          <MetricCard label="Active Therapists" value={totals.activeTherapists} />
          <MetricCard label="Total Customers" value={totals.totalCustomers} />
          <MetricCard label="Total Enquiries" value={totals.totalEnquiries} />
          <MetricCard
            label="Total Appointments"
            value={totals.totalAppointments}
          />
          <MetricCard
            label="Completed Appointments"
            value={totals.completedAppointments}
          />
          <MetricCard label="Total Services" value={totals.totalServices} />
          <MetricCard label="Open Follow-ups" value={totals.openFollowUps} />
        </MetricCardsRow>
      </QueryWrapper>

      <div className="flex flex-col xl:flex-row w-full">
        <RecentSalesTable />
      </div>
    </div>
  );
};

export default DashboardPageComponents;
