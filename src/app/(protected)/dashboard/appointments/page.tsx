"use client"
import SlotBookingPage from "@/components/pages/AppointmentBookingpage";
import TherapistPersonalAppointments from "@/components/pages/TherapistPersonalAppointments";
import { AppointmentBookingColumn } from "@/components/tables/appoitmentstable";
import { useSession } from "next-auth/react";

export default function Page() {
  const session = useSession();
  // console.log(session);
  return(
    <>
    {
      session.data?.user?.role === "SUPER_ADMIN" ? (
        <SlotBookingPage columns={AppointmentBookingColumn} id={session.data?.user?.id} role={session.data?.user?.role} email={session.data?.user?.email} />
      ):(
        <TherapistPersonalAppointments columns={AppointmentBookingColumn} id={session.data?.user?.id} role={session.data?.user?.role} email={session.data?.user?.email}  />
      )
    }
    </>
    );
}
