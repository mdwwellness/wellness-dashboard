import { ROLES } from "@/constant";
import * as z from "zod";

export const UserRoleUpdateSchema = z.object({
  email: z.string().email(),
  role: z.enum(ROLES),
});

export const SettingsSchema = z.object({
  userfName: z.optional(z.string()),
  userlName: z.optional(z.string()),
  userEmail: z.optional(z.string().email()),
  userPassword: z.optional(
    z.string().min(6, { message: "password must contains 6 charecter" }),
  ),
  role:z.enum(ROLES).default("THERAPIST"),
  userPhone: z.string().optional(),
  gender: z.string().optional(),
  dob: z.string().optional(),
});

export const addUserSchema = z.object({
  userfName: z.string().min(1, "First name is required"),
  userlName: z.string().min(1, "Last name is required"),
  userEmail: z.string().email("Invalid email address"),
  userPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  userPassword: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(ROLES, {
    message: "Please select a role",
  }),
});

// Admin edit — same fields minus password; phone optional so partially-filled
// records can still have their role/name edited.
export const editUserSchema = z.object({
  userfName: z.string().min(1, "First name is required"),
  userlName: z.string().min(1, "Last name is required"),
  userEmail: z.string().email("Invalid email address"),
  userPhone: z.string().optional(),
  role: z.enum(ROLES),
});
export type EditUserFormType = z.infer<typeof editUserSchema>;

export const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Password must be atleast 6 character long",
  }),
});

export const LoginSchema = z.object({
  userEmailOrPhone: z.string().email(),
  userPassword: z.string().min(6, {
    message: "Password must be atleast 6 character long",
  }),
});

export const ForgotPasswordSchema = z.object({
  userEmail: z.string().email({ message: "Valid email is required" }),
});

export const ResetPasswordSchema = z
  .object({
    userEmail: z.string().email({ message: "Valid email is required" }),
    otp: z
      .string()
      .trim()
      .min(4, { message: "OTP is required" })
      .max(8, { message: "OTP is invalid" }),
    newPassword: z.string().min(8, {
      message: "New password must be at least 8 characters",
    }),
    confirmPassword: z.string().min(8, {
      message: "Confirm password must be at least 8 characters",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const RegisterSchema = z.object({
  userfName: z.string().min(2, "First name too short"),
  userlName: z.string().min(2, "last name is required"),
  userEmail: z.string().email("Invalid email"),
  userPhone: z.string().min(10, "Invalid phone number"),
  role: z.enum(ROLES),
  userPassword: z.string().min(8, "Password must be 8+ characters"),
});

export type UserRow = {
  _id?: string;
  id?: string;
  userfName?: string;
  userlName?: string;
  gender?: string;
  role?: string;
  userEmail?: string;
  userPhone?: string;
  createdAt?: string;
  emailVerified?:boolean;
  userPassword?: string;
};

