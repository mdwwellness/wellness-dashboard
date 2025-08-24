"use client";

import { useCurrentRole } from "@/hooks/use-current-role";
import { FormError } from "../form-error";
import { toast } from "sonner"
import { UserRole } from "@prisma/client";


type RoleGateProps = {
  children: React.ReactNode;
  allowedUser: UserRole[];
};

export const RoleGate = ({ children, allowedUser }: RoleGateProps) => {
  const role = useCurrentRole();
  // console.log(role);  
  if (role) {
    if (!allowedUser.includes(role)) {
      return (
        toast(<FormError message="You do not have permission to view this content!" />,)
      );
    }
  }

  return <>{children}</>;
};