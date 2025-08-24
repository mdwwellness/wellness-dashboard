"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserRoleUpdateSchema } from "@/type/schema";
import { updateUserRole } from "@/actions/updateUserRole";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useTransition, useState } from "react";
import { useSession } from "next-auth/react";
import { FormError } from "../form-error";
import { FormSuccess } from "../form-success";
import { User,UserRole } from "@prisma/client";

const UserRoleUpdateForm = ({ user }: { user: User }) => {
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const form = useForm<z.infer<typeof UserRoleUpdateSchema>>({
    resolver: zodResolver(UserRoleUpdateSchema),
    defaultValues: {
      email: user?.email || undefined,
      role: user?.role,
    },
  });

  const onSubmit = (values: z.infer<typeof UserRoleUpdateSchema>) => {
    startTransition(() => {
      updateUserRole(values)
        .then((data) => {
          if (data.error) {
            setError(data.error);
          }

          if (data.success) {
            update();
            setSuccess(data.success);
          }
        })
        .catch(() => setError("Something went wrong!"));
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="John Doe"
                    disabled={true}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select
                  disabled={isPending}
                  onValueChange={field.onChange}
                  defaultValue={field.value as unknown as UserRole}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={UserRole.DOCTOR}>DOCTOR</SelectItem>
                    <SelectItem value={UserRole.SUPER_ADMIN}>SUPER_ADMIN</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormError message={error} />
        <FormSuccess message={success} />
        <Button disabled={isPending} type="submit">
          Save changes
        </Button>
      </form>
    </Form>
  );
};

export default UserRoleUpdateForm;
