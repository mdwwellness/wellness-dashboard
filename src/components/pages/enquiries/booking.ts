import type { EnquiryType, ServiceType } from "@/type/schema";

/**
 * The booking an executive confirms at step 3 of the client-approved funnel:
 * an online consultation, or a home visit.
 *
 * This rides on the EXISTING `typeOfappointment` field rather than a new one —
 * the backend model is strict, so an unknown field would be silently dropped on
 * save. The two enum values map 1:1 onto the two choices, so nothing is lost.
 */
export type BookingType = NonNullable<EnquiryType["typeOfappointment"]>;

export const BOOKING_TYPES: {
  value: BookingType;
  label: string;
  /** Services-catalogue entry this booking is priced from. */
  serviceName: string;
}[] = [
  {
    value: "consultation",
    label: "Online consultation",
    serviceName: "Online Consultation",
  },
  {
    value: "appointment",
    label: "Home visit",
    serviceName: "Home Visit Consultation",
  },
];

/**
 * Label for a confirmed booking type.
 *
 * Only meaningful on enquiry-funnel records, where the value was set by the
 * drawer. Appointments booked directly from the booking form also carry
 * `typeOfappointment: "appointment"` but mean "a session", not a home visit —
 * so don't relabel that table with this.
 */
export function bookingTypeLabel(t: BookingType | undefined): string | undefined {
  return BOOKING_TYPES.find((b) => b.value === t)?.label;
}

/**
 * The catalogue fee for a booking type, or `undefined` when the executive
 * hasn't put that service on the Services page yet.
 *
 * Undefined is surfaced as a prompt to go add it — never silently priced at 0,
 * because an unpriced record generates no invoice at all.
 */
export function catalogueFee(
  t: BookingType,
  services: ServiceType[],
): number | undefined {
  const wanted = BOOKING_TYPES.find((b) => b.value === t)?.serviceName;
  if (!wanted) return undefined;
  const match = services.find(
    (s) => s.name?.trim().toLowerCase() === wanted.toLowerCase(),
  );
  return match?.originalPrice;
}

/**
 * Normalise a slot date to a comparable "yyyy-MM-dd" key.
 *
 * `slot.date` is a Date in the backend model, so it arrives as a full ISO
 * string, while the date picker produces "yyyy-MM-dd". Comparing the two raw
 * would never match — every slot would look free.
 */
export function toDayKey(d: string | undefined): string {
  if (!d) return "";
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().split("T")[0];
}

/**
 * Map a client-site `service` offering to the booking type it implies, for
 * auto-selecting step 3. Conservative: only the unambiguous "Online
 * Consultation" seeds; Home Therapy / Vitals / anything else is left for the
 * executive to pick.
 */
export function bookingTypeFromService(
  service: string | undefined,
): BookingType | undefined {
  if (service === "Online Consultation") return "consultation";
  return undefined;
}
