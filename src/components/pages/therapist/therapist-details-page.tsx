// therapist-details-page.tsx
'use client'

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";

import { useDeleteTherapist } from "@/data/therapist/therapist";
import { useUpdateTherapist } from "@/data/therapist/therapist";
import { THERAPY_CATEGORYES } from "@/lib/constant";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { TherapistformSchema, TherapistformType } from "@/type/schema";

interface TherapistDetailsPageProps {
  data: TherapistformType;
  onClose: () => void;
}

export default function TherapistDetailsPage({ data, onClose }: TherapistDetailsPageProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const { mutate: updateMutate, isPending: isUpdating } = useUpdateTherapist();
  const { mutate: deleteMutate, isPending: isDeleting } = useDeleteTherapist();

  const form = useForm<z.infer<typeof TherapistformSchema>>({
    resolver: zodResolver(TherapistformSchema),
    defaultValues: {
      name: data.name,
      doctorId: data.doctorId,
      phonenumber: data.phonenumber,
      email: data.email,
      isActive: data.isActive,
      specialization: data.specialization ?? [],
      gender: data.gender,
      bio: data.bio,
    },
  });

  const specialization = form.watch("specialization");

  const filteredTherapies = useMemo(() => {
    return THERAPY_CATEGORYES.filter(
      (therapy) =>
        therapy.label.toLowerCase().includes(searchValue.toLowerCase()) &&
        !specialization?.includes(therapy.value)
    );
  }, [searchValue, specialization]);

  function handleAddSpecialization(val: string) {
    const current = form.getValues("specialization") ?? [];
    if (!current.includes(val)) {
      form.setValue("specialization", [...current, val], { shouldValidate: true });
    }
    setSearchValue("");
    setIsDropdownOpen(false);
  }

  function handleRemoveSpecialization(val: string) {
    const current = form.getValues("specialization") ?? [];
    form.setValue(
      "specialization",
      current.filter((item) => item !== val),
      { shouldValidate: true }
    );
  }

  function onSubmit(values: z.infer<typeof TherapistformSchema>) {
    updateMutate(values, {
      onSuccess: () => onClose(), // ← close only on success
    });
  }

  function handleDelete() {
    if (!data.doctorId) return;
    deleteMutate(data.doctorId, {
      onSuccess: () => onClose(),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>

        {/* action buttons */}
        <div className="flex justify-end items-center gap-2 mb-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={isDeleting || isUpdating}
              >
                {isDeleting ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Deleting...</>
                ) : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete therapist?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The therapist will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            type="submit"
            size="sm"
            disabled={isUpdating || isDeleting}
          >
            {isUpdating ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Updating...</>
            ) : "Update Details"}
          </Button>
        </div>

        {/* form fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full p-6 border rounded-lg">

          <FormField
            control={form.control}
            name="doctorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Therapist ID</FormLabel>
                <FormControl>
                  <Input placeholder="Therapist ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phonenumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="Phone Number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(val === "true")}
                  defaultValue={field.value ? "true" : "false"}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Not Active</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* specialization — fully controlled by form */}
          <FormField
            control={form.control}
            name="specialization"
            render={() => (
              <FormItem className="md:col-span-2">
                <FormLabel>Specialization</FormLabel>
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      placeholder="Search and select specializations..."
                      value={searchValue}
                      onChange={(e) => {
                        setSearchValue(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                    />
                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-md max-h-52 overflow-y-auto">
                        <Command>
                          <CommandList>
                            <CommandEmpty>No specialization found.</CommandEmpty>
                            <CommandGroup>
                              {filteredTherapies.map((therapy) => (
                                <CommandItem
                                  key={therapy.value}
                                  onSelect={() => handleAddSpecialization(therapy.value)}
                                  className="cursor-pointer"
                                >
                                  {therapy.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </div>
                    )}
                  </div>

                  {specialization?.length > 0 && (
                    <div className="border border-border rounded-md p-2 bg-muted/30">
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                        {specialization.map((val) => (
                          <div
                            key={val}
                            className="flex items-center gap-1 px-3 py-1 rounded-md border border-border bg-secondary text-secondary-foreground text-sm font-medium"
                          >
                            <span className="whitespace-nowrap">
                              {THERAPY_CATEGORYES.find((t) => t.value === val)?.label ?? val}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSpecialization(val)}
                              className="ml-1 hover:bg-muted rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea placeholder="Bio" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>

      {/* close dropdown on outside click */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsDropdownOpen(false);
            setSearchValue("");
          }}
        />
      )}
    </Form>
  );
}