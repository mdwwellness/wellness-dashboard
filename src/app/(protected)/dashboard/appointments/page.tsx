import SlotBookingPage from "@/components/pages/AppointmentBookingpage";
import { AppointmentBookingColumn } from "@/components/tables/appoitmentstable";

export default function Page() {
  return <SlotBookingPage columns={AppointmentBookingColumn} />;
}
