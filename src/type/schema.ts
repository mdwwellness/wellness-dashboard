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

  // ── Legacy fields preserved for back-compat with existing appointment records ──
  slot: z.object({ date: z.string(), time: z.string() }).optional(),
  therapyStartTime: z.string().optional(),
  therapyEndTime: z.string().optional(),
});

export type EnquiryType = z.infer<typeof enquirySchema>;

// Back-compat aliases — existing call sites import these names.
// New code should import `enquirySchema` / `EnquiryType` directly.
export const slotBookingZodSchema = enquirySchema;
export type slotBookingZodType = EnquiryType;



export const TherapistformSchema = z.object({
  name: z.string().min(1, "Name is required"),
  doctorId: z.string().min(1, "ID is required"),
  gender:z.enum(["male","female"]),
  email: z.string().email("Invalid email"),
  phonenumber: z.string().regex(/^\d{10}$/, "Must be 10 digits"),
  specialization: z.string().array(),
  bio: z.string().optional(),
  isActive: z.boolean().default(true).optional()
});
export type TherapistformType = z.infer<typeof TherapistformSchema>

export type UserType = {
  id: string | undefined;
  role: string | undefined;
  userEmail: string | undefined | null;
};