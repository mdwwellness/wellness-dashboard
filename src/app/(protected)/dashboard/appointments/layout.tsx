import { RoleGate } from "@/components/auth/role-gate";
import { UserRole } from "@prisma/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Appontiment Booking",
  description: "Book your appointement",
};

export default async function DistributorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
 return <RoleGate allowedUser={[UserRole.SUPER_ADMIN,UserRole.DOCTOR]}>{children}</RoleGate>;
}
