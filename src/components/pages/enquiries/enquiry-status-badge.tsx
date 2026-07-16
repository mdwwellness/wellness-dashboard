"use client";

import { Badge } from "@/components/ui/badge";
import {
  STAGE_LABELS,
  deriveStage,
  type FunnelStage,
} from "./stage";
import type { EnquiryType } from "@/type/schema";

const STAGE_CLASSES: Record<FunnelStage, string> = {
  enquiry: "border-yellow-600 text-yellow-700 bg-yellow-50",
  follow_up: "border-orange-600 text-orange-700 bg-orange-50",
  reached_out: "border-blue-600 text-blue-700 bg-blue-50",
  booked: "border-indigo-600 text-indigo-700 bg-indigo-50",
  paid: "border-emerald-600 text-emerald-700 bg-emerald-50",
  assigned: "border-green-700 text-green-800 bg-green-100",
  completed: "border-emerald-700 text-emerald-800 bg-emerald-200",
  cancelled: "border-red-600 text-red-700 bg-red-50",
};

export function EnquiryStatusBadge({ record }: { record: EnquiryType }) {
  const stage = deriveStage(record);
  return (
    <Badge variant="outline" className={STAGE_CLASSES[stage]}>
      {STAGE_LABELS[stage]}
    </Badge>
  );
}
