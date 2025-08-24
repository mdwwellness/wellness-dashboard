import { RoleGate } from "@/components/auth/role-gate";
import type { Metadata } from "next";
import { UserRole } from "@prisma/client";

export const metadata: Metadata = {
  title: "Doctors Page",
  description: "View all your doctors",
};

export default async function DistributorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
 return <RoleGate allowedUser={[UserRole.SUPER_ADMIN]}>{children}</RoleGate>;
}
