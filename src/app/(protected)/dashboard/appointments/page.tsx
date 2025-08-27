"use client";

import { useSession } from "next-auth/react";
import SlotBookingPage from "@/components/pages/AppointmentBookingpage";
import { AppointmentBookingColumn } from "@/components/tables/appoitmentstable";

export default function Page() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const { role, id, email } = session.user;

  const commonProps = {
    columns: AppointmentBookingColumn,
    id,
    role,
    email,
  };

  return <SlotBookingPage {...commonProps} />
}
