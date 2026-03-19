import AllDoctorsPage from "@/components/pages/therapist/AllTherapistPage";
import { DoctorsListColumn } from "@/components/pages/therapist/doctorslisttable";


export default function AllDoctors(){
    return(
        <>
         <AllDoctorsPage columns={DoctorsListColumn}/>
        </>
    )
}