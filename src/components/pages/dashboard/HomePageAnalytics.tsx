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
import DoctorCards from "./revenue-card";
import { useGetAnalyticsData } from "@/data/dashboard/dashboard";
import { QueryWrapper } from "@/components/query-wrapper";

const formSchema = z.object({
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
});

// skeleton for stats cards
function DoctorCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border border-border p-5 rounded-xl h-28 space-y-3">
          <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
          <div className="h-8 w-1/3 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4 w-full">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: 5 }).map((_, j) => (
            <div key={j} className="h-8 flex-1 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

const DashboardPageComponents = () => {
  const {
    data: analyticsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAnalyticsData();


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dateRange: {
        from: subDays(new Date(), 30),
        to: new Date(),
      },
    },
  });

  return (
    <div className="w-full flex flex-col justify-center items-center gap-6 px-1 md:px-8 pt-10">
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
              <Button
                type="button"
                variant="secondary"
                size="lg"
                disabled
              >
                Apply
              </Button>
            </form>
          </Form>
        </div>
      </div>
      <QueryWrapper
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        skeleton={<DoctorCardsSkeleton />}
      >
        <DoctorCards
          totalDoctors={analyticsData?.totalDoctors}
          activeDoctors={analyticsData?.activeDoctors}
          totalPatients={analyticsData?.totalPatients}
          totalAppointments={analyticsData?.totalAppointments}
        />
      </QueryWrapper>
      <div className="flex flex-col xl:flex-row w-full">
        <QueryWrapper
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={refetch}
          skeleton={<TableSkeleton />}
        >
          <RecentSalesTable data={analyticsData} />
        </QueryWrapper>
      </div>

    </div>
  );
};

export default DashboardPageComponents;