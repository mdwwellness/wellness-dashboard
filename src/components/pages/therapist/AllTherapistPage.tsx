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
import { QueryWrapper } from "@/components/query-wrapper";
import { useGetAllTherapist } from "@/data/therapist/therapist";
import { TherapistformType } from "@/type/schema";

interface ColumnDataType<TData extends TherapistformType> {
  columns: ColumnDef<TData>[];
}

export default function AllTherapistPage({
  columns,
}: ColumnDataType<TherapistformType>) {
  const { data: DoctorsDetail, isLoading, isError, error } = useGetAllTherapist();
  const [selected, setSelected] = useState<TherapistformType | null>(null);

  return (
    <QueryWrapper isLoading={isLoading} isError={isError} error={error}>
      <Card>
        <CardHeader className="flex flex-row justify-start items-center gap-2">
          <div className="flex flex-col gap-2">
            <CardTitle>Therapist List</CardTitle>
            <CardDescription>Manage all your Therapist.</CardDescription>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <AddDoctorForm />
          </div>
        </CardHeader>
        <CardContent>
          <DoctorsDataTable
            columns={columns}
            data={DoctorsDetail ?? []}
            onRowClick={(row) => setSelected(row)}
          />
        </CardContent>
      </Card>

      <TherapistDetailDrawer
        therapist={selected}
        onClose={() => setSelected(null)}
      />
    </QueryWrapper>
  );
}
