import { hasPermission, Permission, Role } from "@/constant";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Props = {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};
export type AuthUser = {
  id: string;
  userfName: string;
  userlName: string;
  userEmail: string;
  userPhone: string;
  role: Role;
  isProfileComplete: boolean;
  isActive: boolean;
  dob:string;
  gender:"Male"|"Female"
};

type AuthState = {
  user: AuthUser | null;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  can: (permission: Permission) => boolean;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,

      setUser: (user) => set({ user }),

      logout: () => {
        set({ user: null });
        localStorage.removeItem("auth-storage");
      },

      can: (permission) => {
        const { user } = get();
        if (!user) return false;
        return hasPermission(user.role, permission);
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }), 
    }
  )
);

export const AccessControl = ({ permission, children, fallback = null }: Props) => {
  const can = useAuthStore((s) => s.can);

  if (!can(permission)) return <>{fallback}</>;

  return <>{children}</>;
};