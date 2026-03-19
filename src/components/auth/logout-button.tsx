"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/user/logout";
import { useAuthStore } from "@/providers/permission-provider";

export const LogoutButton = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    useAuthStore.getState().logout(); 
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <Button variant="ghost" onClick={handleLogout}>
      Logout
    </Button>
  );
};
