"use client";
import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DoctorsDataTable } from "./Doctorsdatatable";
import AddDoctorForm from "./adddoctorform";
import { TherapistDetailDrawer } from "./therapist-detail-drawer";
import { TherapistCalendarView } from "./therapist-calendar-view";
import { QueryWrapper } from "@/components/query-wrapper";
import { useGetAllTherapist } from "@/data/therapist/therapist";
import { TherapistformType } from "@/type/schema";
import { Button } from "@/components/ui/button";
import { CalendarDays, Table2 } from "lucide-react";

interface ColumnDataType<TData extends TherapistformType> {
  columns: ColumnDef<TData>[];
}

export default function AllTherapistPage({
  columns,
}: ColumnDataType<TherapistformType>) {
  const { data: DoctorsDetail, isLoading, isError, error } = useGetAllTherapist();
  const [selected, setSelected] = useState<TherapistformType | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");

  return (
    <QueryWrapper isLoading={isLoading} isError={isError} error={error}>
      <Card>
        <CardHeader className="flex flex-row flex-wrap justify-start items-center gap-2">
          <div className="flex flex-col gap-2">
            <CardTitle>Therapist List</CardTitle>
            <CardDescription>Manage all your Therapist.</CardDescription>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode(viewMode === "table" ? "calendar" : "table")}
              className="flex items-center gap-1"
            >
              {viewMode === "table" ? (
                <>
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendar</span>
                </>
              ) : (
                <>
                  <Table2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Table</span>
                </>
              )}
            </Button>
            <AddDoctorForm />
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "table" ? (
            <DoctorsDataTable
              columns={columns}
              data={DoctorsDetail ?? []}
              onRowClick={(row) => setSelected(row)}
            />
          ) : (
            <TherapistCalendarView onBack={() => setViewMode("table")} />
          )}
        </CardContent>
      </Card>

      <TherapistDetailDrawer
        therapist={selected}
        onClose={() => setSelected(null)}
      />
    </QueryWrapper>
  );
}
