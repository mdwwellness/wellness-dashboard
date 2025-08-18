"use client";

import React from "react";
import { subDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

//ui
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import RecentSalesTable from "./dashboard-recent-sales-table";
import DoctorCards from "../dashboard/revenue-card";

const formSchema = z.object({
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
});

const DasboardPageComponents = () => {


  // const [date, setDate] = React.useState<DateRange | undefined>({
  //   from: subDays(new Date(), 30),
  //   to: new Date(),
  // });
  // console.log("expiring ->",expiringProductsData)
  // console.log("recent sales",recentSalesData)

  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dateRange: {
        from: subDays(new Date(), 30),
        to: new Date(),
      },
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const { dateRange } = values;

    // Here you can make your API call with the date range
    // For example:
    // refetch({ from: dateRange.from, to: dateRange.to });

    toast.success("Date range updated", {
      description: `From ${format(dateRange.from, "LLL dd, y")} to ${format(
        dateRange.to,
        "LLL dd, y"
      )}`,
    });
  };


  return (
    <div className="w-full flex flex-col justify-center items-center gap-6 px-8 pt-10">
      <div className="flex justify-between items-center w-full">
        <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>
        <div className="hidden md:flex justify-center items-center gap-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex items-center gap-4"
            >
              <FormField
                control={form.control}
                name="dateRange"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                              "w-[300px] h-full justify-start gap-2 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon width={20} color="#4D525E" />
                            {field.value?.from ? (
                              field.value.to ? (
                                <>
                                  {format(field.value.from, "LLL dd, y")} -{" "}
                                  {format(field.value.to, "LLL dd, y")}
                                </>
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
                type="submit"
                variant="secondary"
                size="lg"
                className="text-md font-semibold"
                disabled={true}
              >
                Apply
              </Button>
            </form>
          </Form>
          {/* <Button
            onClick={onDownloadClick}
            variant="default"
            size="lg"
            className="text-md font-semibold"
          >
            Download
          </Button> */}
        </div>

      </div>
      <DoctorCards
        totalDoctors={45}
        activeDoctors={12}
        totalPatients={1200}
        totalAppointments={350}
      />

      <div className="flex flex-col xl:flex-row gap-6 w-full">
        {/* <SalesPurchaseChart /> */}
        {/* <SalesVsPurchaseChart /> */}
        <RecentSalesTable />
        {/* {!pendingForExpiredProductData && !pendingForExpiringProductData && (
          <ExpiredProductsTable 
          expiredProducts={expiredProductsData}
          expiringProducts={expiringProductsData}
          />
        )} */}
      </div>
    </div>
  );
};

export default DasboardPageComponents;
