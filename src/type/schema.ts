import z from "zod";
import { UserRole } from "@prisma/client";

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
  name: z.optional(z.string()),
  role: z.nativeEnum(UserRole),
  email: z.optional(z.string().email()),
  password: z.optional(z.string().min(6, { message: "password must contains 6 charecter" })),
  newPassword: z.optional(z.string().min(6, { message: "New password must contains 6 charecter" })),
})
  .refine((data) => {
    if (data.password && !data.newPassword) {
      return false
    }

    return true
  }, {
    message: "New password is required",
    path: ["newPassword"]
  })
  .refine((data) => {
    if (data.newPassword && !data.password) {
      return false
    }

    return true
  }, {
    message: "Password is required",
    path: ["password"]
  })


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
  role: z.nativeEnum(UserRole),
});

export const ResetSchema = z.object({
  email: z.string().email({ message: "Email is required!" }),
});

export const slotBookingZodSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  location: z.string(),
  doctor: z.string().optional(),
  doctorId: z.string().optional(),
  category: z.string(),
  age: z.number(),
  type: z.enum(["consultant","appointment"]) ,
  slot: z.object({
    date: z.coerce.date(),
    time: z.string(),
  }),
  phonenumber: z.number(),
  note: z.string(),
  therapyStartTime: z.string().optional(),
  therapyEndTime: z.string().optional(),
  email: z.string().email("Invalid email address"),
  status: z.enum(["completed", "ongoing", "cancelled", "scheduled"]).default("scheduled").optional()
});

export type slotBookingZodType = z.infer<typeof slotBookingZodSchema>



export const DoctorsformSchema = z.object({
  name: z.string().min(1, "Name is required"),
  doctorId: z.string().min(1, "ID is required"),
  gender:z.enum(["male","female"]),
  email: z.string().email("Invalid email"),
  phonenumber: z.string().regex(/^\d{10}$/, "Must be 10 digits"),
  specialization: z.string().array(),
  bio: z.string().optional(),
  isActive: z.boolean().default(true).optional()
});
export type DoctorsformType = z.infer<typeof DoctorsformSchema>