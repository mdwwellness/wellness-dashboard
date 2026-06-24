import z from "zod";
import { ROLES } from "@/constant";

export const AnalyticsSchema = z.object({
  totalDoctors: z.number(),
  activeDoctors: z.number(),
  totalPatients: z.number(),
  totalAppointments: z.number(),
  totalActiveDoctors:z.number(),
  patientsInCurrentMonth: z.number(),
  appointmentsInCurrentMonth: z.number(),
  completedAppointments: z.number()
})

export type AnalyticsType = z.infer<typeof AnalyticsSchema>

export const SettingsSchema = z.object({
  userfName: z.optional(z.string()),
  userlName: z.optional(z.string()),
  userEmail: z.optional(z.string().email()),
  userPassword: z.optional(
    z.string().min(6, { message: "password must contains 6 charecter" }),
  ),
  userPhone: z.string().optional(),
  gender: z.string().optional(),
  dob: z.string().optional(),
});



export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, {
    message: "Password must be atleast 6 character long"
  })
});

export const AddUserBySuperAdmin = z.object({
  username: z.string().min(1, { message: "Username required" }),
  email: z.string().email(),
  password: z.string(), // Enum validation
  role: z.string()
});

export const RegisterSchema = z.object({
  username: z.string().min(1, {
    message: "Username required"
  }),
  email: z.string().email(),
  password: z.string().min(6, {
    message: "Password must be atleast 6 character long"
  })
});

export const UserRoleUpdateSchema = z.object({
  email: z.string().email(),
  role: z.enum(ROLES),
});

export const ResetSchema = z.object({
  email: z.string().email({ message: "Email is required!" }),
});

// Superset schema for the executive enquiry funnel.
// Existing appointment records validate against this because every legacy
// field stays optional or unchanged. Stage transitions are driven by the
// checkpoint booleans below.
export const enquirySchema = z.object({
  _id: z.string().optional(),

  // ── Required for any record ──
  name: z.string().min(2, "Name must be at least 2 characters"),
  phonenumber: z.number(),
  // status keeps the old `.default().optional()` pattern so existing forms
  // that omit it in defaultValues still type-check.
  status: z
    .enum(["enquiry", "scheduled", "ongoing", "completed", "cancelled"])
    .default("enquiry")
    .optional(),

  // ── Optional / collected as the funnel progresses ──
  // preferredReachOutTime is a structured time window the client wants to
  // be reached in. Required at the intake form level (see the intake
  // modal's mini-schema) but optional here so legacy records and mid-funnel
  // records that omit it still validate. Stored as 24h "HH:MM" strings;
  // formatted for display via formatTimeRange in ./components/pages/enquiries/time-range.
  preferredReachOutTime: z
    .object({ from: z.string(), to: z.string() })
    .optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  age: z.number().optional(),
  location: z.string().optional(),
  category: z.string().optional(),
  note: z.string().optional(),
  typeOfappointment: z.enum(["consultation", "appointment"]).optional(),

  // ── Which offering the customer is approaching (from the public site):
  // "Online Consultation" | "Home Therapy" | "Vitals Check". ──
  service: z.string().optional(),
  // ── Vitals Check sub-selections (e.g. "Blood Pressure (BP)", "Other: ..."). ──
  vitals: z.array(z.string()).optional(),

  // ── Checkpoint: executive reached out ──
  // Booleans are optional (not .default(false)) so existing forms with
  // defaultValues that omit these still type-check. Consumers read with `?? false`.
  // The backend Mongoose schema still has default:false so server records
  // are never undefined in practice.
  executiveReachedOut: z.boolean().optional(),
  executiveReachedOutAt: z.string().datetime().optional(),

  // ── Checkpoint: online consultation ──
  consultationSlot: z
    .object({ date: z.string(), time: z.string() })
    .optional(),
  consultationCompleted: z.boolean().optional(),
  consultationCompletedAt: z.string().datetime().optional(),

  // ── Checkpoint: physio assignment ──
  physioSlot: z.object({ date: z.string(), time: z.string() }).optional(),
  doctorId: z.string().optional(),
  doctor: z.string().optional(),
  physioAssignmentConfirmed: z.boolean().optional(),
  physioAssignmentConfirmedAt: z.string().datetime().optional(),

  // ── Checkpoint: payment (patient → clinic) ──
  // Recording payment auto-advances status to "ongoing". Fields persist only
  // once the backend model accepts them (see FUNNEL_COMPLETION_BACKEND_PATCH.md).
  paymentReceived: z.boolean().optional(),
  paymentAmount: z.number().nonnegative().optional(),
  paymentMethod: z.enum(["cash", "upi", "card", "bank", "other"]).optional(),
  paymentReceivedAt: z.string().datetime().optional(),

  // ── Checkpoint: completion ──
  // Manual; gated behind paymentReceived. Sets status "completed".
  completedAt: z.string().datetime().optional(),

  // ── Sequential enquiry ID (assigned by backend on creation) ──
  // Human-readable, e.g. "ENQ-0001". Optional because pre-backfill records
  // may not have one.
  enquiryId: z.string().optional(),

  // ── Back-office assignee (who is handling this lead) ──
  // userId is the assignee's User._id; name is denormalized for display.
  assignedTo: z
    .object({
      userId: z.string(),
      name: z.string(),
    })
    .optional(),

  // ── Audit field: who FIRST claimed this lead (different from assignedTo).
  // Set once on the first action (reach-out tick, slot booked, etc.) and
  // treated as immutable in the UI for non-admins. Used as the permission
  // gate for who can edit lead status.
  reachedOutBy: z
    .object({
      userId: z.string(),
      name: z.string(),
    })
    .optional(),

  // ── Activity log: append-only audit of who did what, when. ──
  // Persisted by the backend once it supports the field (see
  // scripts/ENQUIRY_BACKEND_PATCH.md). Until then it's session-only; the UI
  // also derives a read-only timeline from the timestamp fields above.
  activityLog: z
    .array(
      z.object({
        at: z.string(),
        userId: z.string().optional(),
        name: z.string(),
        action: z.string(),
      }),
    )
    .optional(),

  // ── How many times this person re-submitted a booking while this lead
  // stayed OPEN. The backend bumps this (and logs the repeat in activityLog)
  // instead of creating a duplicate row. Defaults to 1 server-side. ──
  repeatCount: z.number().optional(),

  // ── Follow-up tracking: how many times an executive tried to call but
  // couldn't connect (no answer), and when the last attempt was. Drives the
  // /dashboard/follow-ups view. ──
  reachAttempts: z.number().optional(),
  lastAttemptAt: z.string().datetime().optional(),

  // ── Reason captured when a status is manually overridden. ──
  statusNote: z.string().optional(),

  // ── Legacy fields preserved for back-compat with existing appointment records ──
  slot: z.object({ date: z.string(), time: z.string() }).optional(),
  therapyStartTime: z.string().optional(),
  therapyEndTime: z.string().optional(),
});

export type ActivityEntry = {
  at: string;
  userId?: string;
  name: string;
  action: string;
};

export type EnquiryType = z.infer<typeof enquirySchema>;

// Back-compat aliases — existing call sites import these names.
// New code should import `enquirySchema` / `EnquiryType` directly.
export const slotBookingZodSchema = enquirySchema;
export type slotBookingZodType = EnquiryType;



export const certificateSchema = z.object({
  label: z.string().min(1, "Label required"),
  url: z.string().url("Invalid URL"),
});
export type Certificate = z.infer<typeof certificateSchema>;

export const TherapistformSchema = z.object({
  name: z.string().min(1, "Name is required"),
  doctorId: z.string().min(1, "ID is required"),
  gender:z.enum(["male","female"]),
  email: z.string().email("Invalid email"),
  phonenumber: z.string().regex(/^\d{10}$/, "Must be 10 digits"),
  specialization: z.string().array(),
  bio: z.string().optional(),
  isActive: z.boolean().default(true).optional(),
  profileImage: z.string().optional().or(z.literal("")),
  certificates: z.array(certificateSchema).optional(),
});
export type TherapistformType = z.infer<typeof TherapistformSchema>

// ── Service catalog ──────────────────────────────────────────────────────────
// serviceId is auto-allocated (SRV-0001…) by the backend atomic counter, so it
// is NOT part of the form. The form captures only what staff type in.
export const serviceFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  price: z
    .number({ error: "Price is required" })
    .nonnegative("Price can't be negative"),
  category: z.string().min(1, "Category is required"),
  hsnCode: z
    .string()
    .min(1, "HSN/SAC code is required")
    .regex(/^\d{4,8}$/, "HSN/SAC must be 4–8 digits"),
});
export type ServiceFormType = z.infer<typeof serviceFormSchema>;

export type ServiceType = ServiceFormType & {
  _id?: string;
  serviceId: string; // e.g. "SRV-0001"
};

export type UserType = {
  id: string | undefined;
  role: string | undefined;
  userEmail: string | undefined | null;
};