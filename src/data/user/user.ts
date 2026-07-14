"use client";

import { RegisterUser } from "@/actions/admin/addUser";
import { deleteUser } from "@/actions/admin/deleteUser";
import { editUser } from "@/actions/admin/editUser";
import getAllUsers from "@/actions/admin/get-all-users";
import { Login } from "@/actions/user/login";
import updateProfile from "@/actions/user/update-profile";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useLogin() {
  return useMutation({
    mutationFn: async (values: {
      userEmailOrPhone: string;
      userPassword: string;
    }) => {
      const result = await Login(values);

      if (!result.success) {
        throw new Error(result.message || "failed to login");
      }

      return result.data;
    },
    onSuccess: () => {
      toast.success("Login successful");
    },
  });
}
export function useAddUser() {
  return useMutation({
    mutationFn: async (values:any) => {
      const result = await RegisterUser(values);
      if (!result.success) {
        throw new Error(result.message || "failed to add user");
      }

      return result.data;
    },
    onSuccess: () => {
      toast.success("user created successfully");
    },
  });
}
export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      const result = await deleteUser(values);
      if (!result.success) {
        throw new Error(result.message || "failed to delete user");
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("User deleted");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useEditUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
      const result = await editUser(values);
      if (!result.success) {
        throw new Error(result.message || "failed to update user");
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("User updated");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateUserProfile() {
  return useMutation({
    mutationFn: async (values:any) => {
      const result = await updateProfile(values);
      if (!result.success) {
        throw new Error(result.message || "failed to update profile");
      }

      return result.data;
    },
    onSuccess: () => {
      toast.success("profile updated successfully");
    },
  });
}

export function useGetAllUsers(){
  return useQuery({
    queryKey:['users'],
    queryFn: async ()=> {
     const result = await getAllUsers()
     if(!result.success){
      throw new Error(result.message)
     }
     return result.data;
    } 
  })
}