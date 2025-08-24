"use client";

import { useCurrentRole } from "@/hooks/use-current-role";
import { UserRole } from "@prisma/client";

type RoleGateProps = {
  children: React.ReactNode;
  allowedUser: UserRole[];
};

export const RoleGate2 = ({ children, allowedUser }: RoleGateProps) => {
  const role = useCurrentRole();

  if (role) {
    if (!allowedUser.includes(role)) {
      return ;
    }
  }

  return <>{children}</>;
};