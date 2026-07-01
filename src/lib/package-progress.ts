import type { ServiceType, slotBookingZodType } from "@/type/schema";

export type PackageProgress = {
  packageName: string;
  packageServiceId: string;
  total: number;
  completed: number;
  /** e.g. "2 of 6 completed" */
  label: string;
  currentLabel?: string;
};

export function getSessionPackages(services: ServiceType[]): ServiceType[] {
  return services.filter(
    (s) =>
      s.isPackage &&
      s.packageUnit === "sessions" &&
      s.packageCount &&
      s.packageCount > 0,
  );
}

function appointmentMatchesPackage(
  appointment: slotBookingZodType,
  pkg: ServiceType,
): boolean {
  if (appointment.packageServiceId && appointment.packageServiceId === pkg.serviceId) {
    return true;
  }
  const serviceName = appointment.service?.trim();
  if (serviceName && serviceName === pkg.name) return true;
  return false;
}

function resolvePackageForAppointment(
  appointment: slotBookingZodType,
  services: ServiceType[],
): ServiceType | null {
  const sessionPackages = getSessionPackages(services);

  if (appointment.packageServiceId) {
    const byId = sessionPackages.find(
      (s) => s.serviceId === appointment.packageServiceId,
    );
    if (byId) return byId;
  }

  const serviceName = appointment.service?.trim();
  if (serviceName) {
    const byName = sessionPackages.find((s) => s.name === serviceName);
    if (byName) return byName;
  }

  return null;
}

/**
 * Compute session package progress for a customer (e.g. "2 of 6 completed").
 */
export function getPackageProgressForAppointment(
  appointment: slotBookingZodType,
  allAppointments: slotBookingZodType[],
  services: ServiceType[],
): PackageProgress | null {
  const pkg = resolvePackageForAppointment(appointment, services);
  if (!pkg?.packageCount) return null;

  const total = pkg.packageCount;
  const phone = appointment.phonenumber;

  const completed = allAppointments.filter(
    (a) =>
      a.phonenumber === phone &&
      appointmentMatchesPackage(a, pkg) &&
      a.status === "completed" &&
      a.appointmentKind !== "recommended",
  ).length;

  const inProgress =
    appointment.status !== "completed" && appointment.status !== "cancelled";
  const currentSession = completed + (inProgress ? 1 : 0);

  return {
    packageName: pkg.name,
    packageServiceId: pkg.serviceId,
    total,
    completed,
    label: `${completed} of ${total} completed`,
    currentLabel: inProgress
      ? `This visit: session ${Math.min(currentSession, total)} of ${total}`
      : undefined,
  };
}

export function countConfirmedAddons(appointment: slotBookingZodType): number {
  return (appointment.recommendedServices ?? []).filter(
    (r) => r.status === "confirmed",
  ).length;
}

export function countPendingAddons(appointment: slotBookingZodType): number {
  return (appointment.recommendedServices ?? []).filter(
    (r) => r.status === "pending",
  ).length;
}

export function getConfirmedAddonNames(appointment: slotBookingZodType): string[] {
  return (appointment.recommendedServices ?? [])
    .filter((r) => r.status === "confirmed")
    .map((r) => r.serviceName);
}

/** Home-therapy funnel should pick a session package before payment. */
export function needsTherapyPackage(appointment: slotBookingZodType): boolean {
  if (appointment.service === "Vitals Check") return false;
  if (appointment.service === "Home Therapy") return true;
  // Consult-first path: physio booked after consult → package required at payment
  if (
    appointment.physioAssignmentConfirmed &&
    appointment.physioSlot?.date
  ) {
    return true;
  }
  return false;
}

export function canBookNextSession(progress: PackageProgress | null): boolean {
  return progress != null && progress.completed < progress.total;
}

export function resolveNextSessionNumber(
  appointment: slotBookingZodType,
  allAppointments: slotBookingZodType[],
  services: ServiceType[],
): number {
  const pkg = resolvePackageForAppointment(appointment, services);
  if (!pkg) return 1;

  const phone = appointment.phonenumber;
  const related = allAppointments.filter(
    (a) =>
      a.phonenumber === phone && appointmentMatchesPackage(a, pkg),
  );
  const maxSession = related.reduce(
    (max, a) => Math.max(max, a.sessionNumber ?? 0),
    0,
  );
  return maxSession > 0 ? maxSession + 1 : 1;
}
