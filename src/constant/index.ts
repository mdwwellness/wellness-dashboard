export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",

  ENQUIRY_VIEW: "enquiry.view",
  ENQUIRY_CREATE: "enquiry.create",
  ENQUIRY_EDIT: "enquiry.edit",
  ENQUIRY_DELETE: "enquiry.delete",

  APPOINTMENT_VIEW: "appointment.view",
  APPOINTMENT_CREATE: "appointment.create",
  APPOINTMENT_EDIT: "appointment.edit",
  APPOINTMENT_DELETE: "appointment.delete",

  THERAPIST_VIEW: "therapist.view",
  THERAPIST_CREATE: "therapist.create",
  THERAPIST_EDIT: "therapist.edit",
  THERAPIST_DELETE: "therapist.delete",

  ADMIN_VIEW: "admin.view",
  ADMIN_CREATE: "admin.create",
  ADMIN_EDIT: "admin.edit",

  EXPORT_DATA: "export.data",
  USER_FORCE_LOGOUT: "user.force_logout",
  MODULE_LOCK: "module.lock",
} as const;

export const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "THERAPIST",
  "STAFF",
  "CUSTOMER_CARE",
] as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "THERAPIST"
  | "STAFF"
  | "CUSTOMER_CARE";

export const ROLE_PERMISSIONS: Record<Role, Permission[] | ["*"]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: ["*"],
  THERAPIST: ["*"],
  STAFF: ["*"],
  CUSTOMER_CARE: ["*"],
};

export const hasPermission = (role: Role, permission: Permission): boolean => {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms[0] === "*") return true;
  return (perms as Permission[]).includes(permission);
};

export const base_url = process.env.BACKEND_BASE_URL;
