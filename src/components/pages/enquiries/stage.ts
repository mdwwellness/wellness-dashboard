import type { EnquiryType } from "@/type/schema";

export type FunnelStage =
  | "enquiry"
  | "reached_out"
  | "consult_booked"
  | "consult_done"
  | "physio_booked"
  | "assigned"
  | "ongoing"
  | "completed"
  | "cancelled";

export function deriveStage(r: EnquiryType): FunnelStage {
  if (r.status === "cancelled") return "cancelled";
  if (r.status === "completed") return "completed";
  if (r.paymentReceived) return "ongoing";
  if (r.physioAssignmentConfirmed) return "assigned";
  if (r.physioSlot?.date && r.physioSlot?.time) return "physio_booked";
  if (r.consultationCompleted) return "consult_done";
  if (r.consultationSlot?.date && r.consultationSlot?.time) return "consult_booked";
  if (r.executiveReachedOut) return "reached_out";
  return "enquiry";
}

export const STAGE_LABELS: Record<FunnelStage, string> = {
  enquiry: "Enquiry",
  reached_out: "Reached out",
  consult_booked: "Consult booked",
  consult_done: "Consult done",
  physio_booked: "Physio booked",
  assigned: "Assigned",
  ongoing: "Ongoing",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STAGE_ORDER: FunnelStage[] = [
  "enquiry",
  "reached_out",
  "consult_booked",
  "consult_done",
  "physio_booked",
  "assigned",
  "ongoing",
  "completed",
  "cancelled",
];
