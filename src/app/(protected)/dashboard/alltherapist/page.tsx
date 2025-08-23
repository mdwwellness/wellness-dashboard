import AllDoctorsPage from "@/components/pages/AllTherapistPage";
import { DoctorsListColumn } from "@/components/tables/doctorslisttable";


export default function AllDoctors(){
    return(
        <>
         <AllDoctorsPage columns={DoctorsListColumn}/>
        </>
    )
}