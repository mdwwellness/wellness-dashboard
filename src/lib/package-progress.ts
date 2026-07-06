import type { ServiceType, slotBookingZodType } from "@/type/schema";

export type PackageProgress = {
  packageName: string;
  packageServiceId: string;
  total: number;
  completed: number;
  currentSession: number;
  /** e.g. "2 of 6 completed" */
  label: string;
  currentLabel?: string;
  packageDone: boolean;
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

export function resolvePackageForAppointment(
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
 * Package progress from this single row (sessionsCompleted counter).
 */
export function getPackageProgressForAppointment(
  appointment: slotBookingZodType,
  _allAppointments: slotBookingZodType[],
  services: ServiceType[],
): PackageProgress | null {
  const pkg = resolvePackageForAppointment(appointment, services);
  if (!pkg?.packageCount) return null;

  const total = pkg.packageCount;
  const completed = appointment.sessionsCompleted ?? 0;
  const currentSession =
    appointment.sessionNumber ??
    Math.min(completed + (appointment.status !== "completed" ? 1 : 0), total);
  const inProgress =
    appointment.status !== "cancelled" && completed < total;

  return {
    packageName: pkg.name,
    packageServiceId: pkg.serviceId,
    total,
    completed,
    currentSession,
    label: `${completed} of ${total} completed`,
    currentLabel: inProgress
      ? `This visit: session ${currentSession} of ${total}`
      : completed >= total
        ? "Package complete"
        : undefined,
    packageDone: completed >= total,
  };
}
export function dedupePackageAppointments(
  appointments: slotBookingZodType[],
): slotBookingZodType[] {
  const nonPackage: slotBookingZodType[] = [];
  const packageBest = new Map<string, slotBookingZodType>();

  for (const a of appointments) {
    if (!a.packageServiceId) {
      nonPackage.push(a);
      continue;
    }
    const key = `${a.phonenumber}-${a.packageServiceId}`;
    const existing = packageBest.get(key);
    if (!existing) {
      packageBest.set(key, a);
      continue;
    }
    const score = (r: slotBookingZodType) =>
      (r.packageOriginId === r._id ? 1000 : 0) +
      (r.sessionsCompleted ?? 0) * 10 +
      (r.sessionNumber ?? 0);
    if (score(a) >= score(existing)) {
      packageBest.set(key, a);
    }
  }

  return [...nonPackage, ...packageBest.values()];
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
  if (
    appointment.physioAssignmentConfirmed &&
    appointment.physioSlot?.date
  ) {
    return true;
  }
  return false;
}

export function visitStatusLabel(status?: string): string {
  switch (status) {
    case "scheduled":
      return "Scheduled";
    case "ongoing":
      return "In progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Unknown";
  }
}
