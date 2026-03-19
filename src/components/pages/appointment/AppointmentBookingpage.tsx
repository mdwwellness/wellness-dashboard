"use client";

import AppointmentBookingForm from "./appointmentbookingform";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppointmentDataTable } from "./Appoinmentsdatatable";
import { useAuthStore } from "@/providers/permission-provider";
import { AppointmentBookingColumn } from "./appoitmentstable";
import { useGetAllAppointments } from "@/data/appointment/appointment";
import { QueryWrapper } from "@/components/query-wrapper";

function AppointmentTableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: 6 }).map((_, j) => (
            <div
              key={j}
              className="h-8 flex-1 rounded bg-muted animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function SlotBookingPage() {
  const { user } = useAuthStore();
  const { id, role, userEmail } = user || {};
  const {
    data: appointments,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllAppointments({ role, id, userEmail });
  return (
    <Card>
      <CardHeader className="flex flex-row justify-start items-center gap-2">
        <div className="flex flex-col gap-2">
          <CardTitle>Appointments</CardTitle>
          <CardDescription>Manage all your appointments.</CardDescription>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <AppointmentBookingForm />
        </div>
      </CardHeader>
      <CardContent>
        <QueryWrapper
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={refetch}
          skeleton={<AppointmentTableSkeleton />}
        >
          <AppointmentDataTable
            columns={AppointmentBookingColumn}
            data={appointments ?? []}
          />
        </QueryWrapper>
      </CardContent>
    </Card>
  );
}
