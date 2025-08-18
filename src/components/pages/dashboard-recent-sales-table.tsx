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
import { Badge } from "../ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";

const ITEMS_PER_PAGE = 5;

interface Appointment {
  id: string;
  doctorName: string;
  doctorSpeciality: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  createdBy: string;
}

const dummyAppointments: Appointment[] = [
  {
    id: "APT-1001",
    doctorName: "Dr. Arjun Mehta",
    doctorSpeciality: "Cardiologist",
    patientName: "John Doe",
    patientEmail: "john@example.com",
    patientPhone: "+91 9876543210",
    appointmentDate: "2025-08-15",
    appointmentTime: "10:30 AM",
    status: "Completed",
    createdBy: "Admin",
  },
  {
    id: "APT-1002",
    doctorName: "Dr. Priya Sharma",
    doctorSpeciality: "Dermatologist",
    patientName: "Aditi Verma",
    patientEmail: "aditi@example.com",
    patientPhone: "+91 9123456780",
    appointmentDate: "2025-08-16",
    appointmentTime: "2:00 PM",
    status: "Upcoming",
    createdBy: "Receptionist",
  },
  {
    id: "APT-1003",
    doctorName: "Dr. Michael Lee",
    doctorSpeciality: "Neurologist",
    patientName: "Rahul Singh",
    patientEmail: "rahul@example.com",
    patientPhone: "+91 9012345678",
    appointmentDate: "2025-08-17",
    appointmentTime: "11:00 AM",
    status: "Cancelled",
    createdBy: "Admin",
  },
  {
    id: "APT-1004",
    doctorName: "Dr. Neha Kapoor",
    doctorSpeciality: "Physiotherapist",
    patientName: "Ananya Gupta",
    patientEmail: "ananya@example.com",
    patientPhone: "+91 9765432109",
    appointmentDate: "2025-08-18",
    appointmentTime: "5:15 PM",
    status: "Upcoming",
    createdBy: "Doctor",
  },
];

const DashboardTable: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalAppointments = dummyAppointments.length;
  const totalDoctors = 25;
  const totalPatients = 120;
  const totalCompleted = dummyAppointments.filter(
    (a) => a.status === "Completed"
  ).length;

  const totalPages = Math.ceil(totalAppointments / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAppointments = dummyAppointments.slice(startIndex, endIndex);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-600 text-white";
      case "upcoming":
        return "bg-blue-600 text-white";
      case "cancelled":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className={
                currentPage === 1
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
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
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              className={
                currentPage === totalPages
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-gray-200 p-5 rounded-xl shadow h-28" >
          <div className="mb-4 flex items-center justify-between " >
            <h1 className="text-md font-medium text-muted-foreground" >Total Doctors</h1>
          </div>
          <div className="text-3xl font-extrabold" >
            {totalDoctors}
          </div>
        </div>

         <div className="border border-gray-200 p-5 rounded-xl shadow h-28" >
          <div className="mb-4 flex items-center justify-between " >
            <h1 className="text-md font-medium text-muted-foreground" >Total Patients (This Month)</h1>
          </div>
          <div className="text-3xl font-extrabold" >
            {totalPatients}
          </div>
        </div>
         <div className="border border-gray-200 p-5 rounded-xl shadow h-28" >
          <div className="mb-4 flex items-center justify-between " >
            <h1 className="text-md font-medium text-muted-foreground" >Total Appointments (This Month) </h1>
          </div>
          <div className="text-3xl font-extrabold" >
            {totalAppointments}
          </div>
        </div>

         <div className="border border-gray-200 p-5 rounded-xl shadow h-28" >
          <div className="mb-4 flex items-center justify-between " >
            <h1 className="text-md font-medium text-muted-foreground" >Completed Appointments (This Month) </h1>
          </div>
          <div className="text-3xl font-extrabold" >
            {totalCompleted}
          </div>
        </div>
      </div>

      {/* Recent Appointments Table */}
      <Card className="w-full border border-muted-foreground/30 shadow-sm bg-transparent">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-lg">Recent Appointments</CardTitle>
          <CardDescription className="text-sm">
            Tracking upcoming and past appointments
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 py-2">
          {paginatedAppointments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Appointment ID</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAppointments.map((appt) => (
                  <TableRow key={appt.id}>
                    <TableCell className="font-medium">{appt.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{appt.doctorName}</span>
                        <span className="text-sm text-muted-foreground">
                          {appt.doctorSpeciality}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{appt.patientName}</span>
                        <span className="text-sm text-muted-foreground">
                          {appt.patientEmail}
                        </span>
                        <span className="text-xs">{appt.patientPhone}</span>
                      </div>
                    </TableCell>
                    <TableCell>{appt.appointmentDate}</TableCell>
                    <TableCell>{appt.appointmentTime}</TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs ${getStatusColor(appt.status)}`}
                        variant="secondary"
                      >
                        {appt.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{appt.createdBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No appointments found
            </div>
          )}
          {renderPagination()}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardTable;
