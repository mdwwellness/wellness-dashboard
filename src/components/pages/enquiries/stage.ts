import type { EnquiryType } from "@/type/schema";

export type FunnelStage =
  | "enquiry"
  | "follow_up"
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
  // Tried to call but couldn't connect yet → needs a follow-up.
  if ((r.reachAttempts ?? 0) > 0) return "follow_up";
  return "enquiry";
}

/** A lead we've attempted but not yet connected with — surfaced on /dashboard/follow-ups. */
export const isFollowUp = (r: EnquiryType): boolean => deriveStage(r) === "follow_up";

export const STAGE_LABELS: Record<FunnelStage, string> = {
  enquiry: "Enquiry",
  follow_up: "Follow-up",
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
  "follow_up",
  "reached_out",
  "consult_booked",
  "consult_done",
  "physio_booked",
  "assigned",
  "ongoing",
  "completed",
  "cancelled",
];
