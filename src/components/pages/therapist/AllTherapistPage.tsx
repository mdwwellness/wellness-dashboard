"use client";
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
          <DoctorsDataTable columns={columns} data={DoctorsDetail ?? []} />
        </CardContent>
      </Card>
    </QueryWrapper>
  );
}
