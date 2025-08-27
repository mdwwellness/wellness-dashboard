"use client";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import { useGetAllAppointments } from "@/data/appointment/get-all-appointments";
import { AnalyticsType, slotBookingZodType } from "@/type/schema";
import { useSession } from "next-auth/react";

const ITEMS_PER_PAGE = 5;

interface AppointmentDetailsTable extends slotBookingZodType {
  _id: string;
}

const DashboardTable = ({data}:{data:AnalyticsType}) => {
  const { data: session } = useSession();
  const { role, id, email } = session?.user ?? {};

  const [currentPage, setCurrentPage] = useState(1);
  const { data: RecentAppointmentdata, isLoading, isError } = useGetAllAppointments(
    {
      role,
      id,
      email,
    }
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Something went wrong</div>;
  }

  const totalAppointments = RecentAppointmentdata?.data?.length || 0;
  const totalDoctors = 25;
  const totalPatients = 120;

  const totalPages = Math.ceil(totalAppointments / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAppointments = RecentAppointmentdata?.data?.slice(startIndex, endIndex) || [];

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <Pagination className="mt-4 w-full">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>

          {[...Array(totalPages)].map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                onClick={() => setCurrentPage(i + 1)}
                isActive={currentPage === i + 1}
                className="cursor-pointer"
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-gray-200 p-5 rounded-xl shadow h-28">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-md font-medium text-muted-foreground">Total Doctors</h1>
          </div>
          <div className="text-3xl font-extrabold">{data.totalDoctors}</div>
        </div>

        <div className="border border-gray-200 p-5 rounded-xl shadow h-28">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-md font-medium text-muted-foreground">Total Patients (This Month)</h1>
          </div>
          <div className="text-3xl font-extrabold">{data.patientsInCurrentMonth}</div>
        </div>
        <div className="border border-gray-200 p-5 rounded-xl shadow h-28">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-md font-medium text-muted-foreground">Total Appointments (This Month)</h1>
          </div>
          <div className="text-3xl font-extrabold">{data.appointmentsInCurrentMonth}</div>
        </div>

        <div className="border border-gray-200 p-5 rounded-xl shadow h-28">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-md font-medium text-muted-foreground">Completed Appointments (This Month)</h1>
          </div>
          <div className="text-3xl font-extrabold">0</div>
        </div>
      </div>

      {/* Recent Appointments Table */}
      <Card className="w-full border border-muted-foreground/30 shadow-sm bg-transparent">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-lg">Recent Appointments</CardTitle>
          <CardDescription className="text-sm">Tracking upcoming and past appointments</CardDescription>
        </CardHeader>
        <CardContent className="px-4 py-2">
          {Array.isArray(RecentAppointmentdata?.data) && RecentAppointmentdata.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Appointment ID</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAppointments.map((appt: AppointmentDetailsTable) => (
                    <TableRow key={appt._id}>
                      <TableCell className="font-medium">{appt._id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{appt.doctor}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-lg">{appt.name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{appt.email}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{appt.phonenumber}</span>
                      </TableCell>
                      <TableCell>
                        {`${new Date(appt.slot.date).getDate()}-${new Date(appt.slot.date).getMonth()}-${new Date(appt.slot.date).getFullYear()}`}
                      </TableCell>
                      <TableCell>{appt.slot.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No appointments found</div>
          )}
          {renderPagination()}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardTable;
