"use client"
import { DoctorsformType } from "@/type/schema";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { DoctorsDataTable } from "../tables/Doctorsdatatable";
import AddDoctorForm from "../forms/adddoctorform";
import { useGetAllDoctors } from "@/data/addDoctors/get-all-doctors";


interface ColumnDataType<
  TData extends DoctorsformType
> {
  columns: ColumnDef<TData>[];
}


export default function AllTherapistPage({ columns }: ColumnDataType<DoctorsformType>) {
  const {data: DoctorsDetail,isLoading,isError} = useGetAllDoctors();
  // console.log(DoctorsDetail);
  if(isLoading){
    return (
      <>
       <div>Loading...</div>
      </>
    )
  }
  if(isError){
    return(
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
            <CardTitle>Therapist List</CardTitle>
            <CardDescription>
              Manage all your Therapist.
            </CardDescription>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <AddDoctorForm />
          </div>
        </CardHeader>
        <CardContent>
          <DoctorsDataTable columns={columns} data={DoctorsDetail?.data ?? []} />
        </CardContent>
      </Card>
    </>
  )
}