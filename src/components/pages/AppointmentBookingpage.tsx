"use client"
import { slotBookingZodType } from "@/type/schema";
import AppointmentBookingForm from "../forms/appointmentbookingform";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { AppointmentDataTable } from "../tables/Appoinmentsdatatable";
import { useGetAllAppointments } from "@/data/appointment/get-all-appointments";


export type UserType ={
    id: string | undefined,
  role: string | undefined,
  email: string | undefined | null,
}

interface ColumnDataType<
  TData extends slotBookingZodType
> {
  columns: ColumnDef<TData>[];
  id: string | undefined,
  role: string | undefined,
  email: string | undefined | null,
}


export default function SlotBookingPage({ columns, id, role, email }: ColumnDataType<slotBookingZodType>) {
  const { data: appointments, isLoading, isError } = useGetAllAppointments({ id, role, email });
  if (isLoading) {
    return (
      <>
        <div>Loading...</div>
      </>
    )
  }
  if (isError) {
    return (
      <>
        <div>
          Error
        </div>
      </>
    )
  }
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row justify-start items-center gap-2">
          <div className="flex flex-col gap-2">
            <CardTitle>Appointments</CardTitle>
            <CardDescription>
              Manage all your appointments.
            </CardDescription>
          </div>
          {role === "SUPER_ADMIN" && <div className="ml-auto flex items-center gap-2">
            <AppointmentBookingForm />
          </div>}
        </CardHeader>
        <CardContent>
          <AppointmentDataTable columns={columns} data={appointments?.data ?? []} />
        </CardContent>
      </Card>
    </>
  )
}