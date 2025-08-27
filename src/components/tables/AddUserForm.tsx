"use client";
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { startTransition, useState } from 'react';
import AddUser from '@/actions/addUser';
import { AddUserBySuperAdmin } from '@/type/schema';
import { UserRole } from '@prisma/client'; // Make sure UserRole is from Prisma
import z from 'zod';
import { FormError } from '../form-error';
import { FormSuccess } from '../form-success';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function UserDialog() {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const router = useRouter()

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      role: "",
    }
  });

  const onSubmit = (values: z.infer<typeof AddUserBySuperAdmin>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      // console.log(values)
      AddUser(values)
        .then((data) => {
          if (data.success) {
            router.refresh()
          }
          setError(data.error);
          setSuccess(data.success);
        })
    })
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add User</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg w-full mx-auto p-6">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            type="text"
            placeholder="Enter username"
            {...register('username', { required: 'Username is required' })}
          />
          {errors.username && <p className="text-red-500">{errors.username.message}</p>}

          <Input
            type="email"
            placeholder="Enter email"
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email && <p className="text-red-500">{errors.email.message}</p>}

          <div className="relative w-full">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password"
              className="w-full"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute top-1/2 right-3 transform -translate-y-1/2"
            >
              {showPassword ? (
                <EyeOff/>
              ) : (
                <Eye/>
              )}
            </button>
          </div>

          {/* Use Select for the role */}
          <Select
            onValueChange={(value: string) => setValue('role', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
              <SelectItem value="DOCTOR">DOCTOR</SelectItem>
            </SelectContent>
          </Select>
          <FormError message={error} />
          <FormSuccess message={success} />
          <Button type="submit">Submit</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
