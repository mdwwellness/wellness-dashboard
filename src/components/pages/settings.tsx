"use client";

import Image from "next/image";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Avatar from "@/assests/avatars/avatar1.svg";
import { ColumnDef } from "@tanstack/react-table";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SettingsSchema } from "@/type/schema";
import { UserDataTable } from "../tables/user-data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "../ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { settings } from "@/actions/settings";
import { useTransition, useState } from "react";
import { useSession } from "next-auth/react";
import { FormError } from "../form-error";
import { FormSuccess } from "../form-success";
import { RoleGate2 } from "../auth/role-gate-2";
import { User,UserRole } from "@prisma/client";

interface ProductDataTableProps<TData extends User, TValue extends object> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

const SettingsPageComponents = <TData extends User, TValue extends object>({
  columns,
  data,
}: ProductDataTableProps<TData, TValue>) => {
  const user = useCurrentUser();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      name: user?.name || undefined,
      email: user?.email || undefined,
      password: undefined,
      newPassword: undefined,
      role: user?.role as UserRole | undefined,
    },
  });

  const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
    startTransition(() => {
      settings(values)
        .then((data) => {
          if (data.error) setError(data.error);
          if (data.success) {
            update();
            setSuccess(data.success);
          }
        })
        .catch(() => setError("Something went wrong!"));
    });
  };

  return (
    <div className="w-full px-4 md:px-12 py-10">
      <div className="grid gap-10 grid-cols-1 md:grid-cols-3">
        {/* Profile Card */}
        <div>
          <Card className="flex flex-col items-center w-[90%] self-center justify-self-end  ">
            <CardHeader className="w-full text-center">
              <div className="flex flex-col items-center gap-4">
                <Image
                  src={user?.image || Avatar}
                  width={150}
                  height={150}
                  alt="Avatar"
                  className="rounded-full border border-muted shadow-md"
                />
                <CardTitle className="text-2xl font-semibold">{user?.name}</CardTitle>
                <CardDescription className="text-sm">{user?.email}</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="w-full flex justify-center py-4 items-center space-x-6">
              <Badge variant="outline" className="px-3 py-2  bg-black text-white ">
                {user?.role}
              </Badge>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Edit Profile</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[450px]">
                  <DialogHeader>
                    <DialogTitle>Edit profile</DialogTitle>
                    <DialogDescription>
                      Make changes to your profile below. Click save when you&apos;re done.
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...form}>
                    <form
                      className="space-y-4"
                      onSubmit={form.handleSubmit(onSubmit)}
                    >
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="John Doe"
                                disabled={isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {user?.isOAuth === false && (
                        <>
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="johndoe@example.com"
                                    disabled={isPending}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="password"
                                    placeholder="********"
                                    disabled={isPending}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="password"
                                    placeholder="********"
                                    disabled={isPending}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}

                      <FormError message={error} />
                      <FormSuccess message={success} />
                      <div className="pt-2">
                        <Button disabled={isPending} type="submit" className="w-full">
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Detials of ADMIN and SUPER_ADMIN */}
        <RoleGate2 allowedUser={[UserRole.SUPER_ADMIN]}>
          <Card className="col-span-2" >
            <CardHeader>
              <CardTitle>Admin Members</CardTitle>
              <CardDescription>
                View or manage users with dashboard access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserDataTable columns={columns} data={data} />
            </CardContent>
          </Card>
        </RoleGate2>
      </div>
    </div>
  );
};

export default SettingsPageComponents;
