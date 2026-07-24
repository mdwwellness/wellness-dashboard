// therapist-details-page.tsx
'use client'

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";

import { useUpdateTherapist } from "@/data/therapist/therapist";
import { THERAPY_CATEGORYES } from "@/lib/constant";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { TherapistformSchema, TherapistformType } from "@/type/schema";
import { ProfilePicUploader } from "./profile-pic-uploader";
import { CertificatesSection } from "./certificates-section";

interface TherapistDetailsPageProps {
  data: TherapistformType;
  onClose: () => void;
  onRequestDelete: () => void;
  isDeleting: boolean;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

export default function TherapistDetailsPage({
  data,
  onClose,
  onRequestDelete,
  isDeleting,
}: TherapistDetailsPageProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const { mutate: updateMutate, isPending: isUpdating } = useUpdateTherapist();

  const form = useForm<z.infer<typeof TherapistformSchema>>({
    resolver: zodResolver(TherapistformSchema),
    defaultValues: {
      name: data.name,
      doctorId: data.doctorId,
      phonenumber: data.phonenumber != null ? String(data.phonenumber) : "",
      email: data.email,
      isActive: data.isActive,
      specialization: data.specialization ?? [],
      gender: data.gender,
      bio: data.bio,
      profileImage: data.profileImage ?? "",
      certificates: data.certificates ?? [],
    },
  });

  const specialization = form.watch("specialization");
  const watchedName = form.watch("name");
  const watchedActive = form.watch("isActive");

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
      onSuccess: () => onClose(),
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full"
      >
        {/* ── Profile header ─────────────────────────────────────── */}
        <div className="px-5 sm:px-6 pt-6 pb-5 border-b">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 pr-8">
            <FormField
              control={form.control}
              name="profileImage"
              render={({ field }) => (
                <ProfilePicUploader
                  value={field.value}
                  onChange={field.onChange}
                  name={watchedName}
                  size="lg"
                />
              )}
            />
            <div className="min-w-0 text-center sm:text-left sm:pt-1">
              <h2 className="text-xl font-bold tracking-tight truncate">
                {watchedName || "Therapist"}
              </h2>
              <div className="mt-1.5 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                {data.doctorId && (
                  <span className="font-mono text-xs text-muted-foreground">
                    ID: {data.doctorId}
                  </span>
                )}
                <Badge
                  variant="outline"
                  className={
                    watchedActive
                      ? "border-emerald-600 text-emerald-700 bg-emerald-50"
                      : "border-red-600 text-red-700 bg-red-50"
                  }
                >
                  {watchedActive ? "Active" : "Not Active"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6">
          {/* Basic info */}
          <section className="space-y-3">
            <SectionTitle>Basic information</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                name="phonenumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <PhoneInput {...field} asString placeholder="Phone Number" />
                    </FormControl>
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
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            </div>
          </section>

          {/* Specialization */}
          <section className="space-y-3">
            <SectionTitle>Specialization</SectionTitle>
            <FormField
              control={form.control}
              name="specialization"
              render={() => (
                <FormItem>
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
                      <div className="flex flex-wrap gap-2">
                        {specialization.map((val) => (
                          <Badge
                            key={val}
                            variant="secondary"
                            className="gap-1 py-1 pl-3 pr-1.5"
                          >
                            <span className="whitespace-nowrap">
                              {THERAPY_CATEGORYES.find((t) => t.value === val)?.label ?? val}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSpecialization(val)}
                              aria-label={`Remove ${val}`}
                              className="rounded-full p-0.5 hover:bg-background/60 cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* Bio */}
          <section className="space-y-3">
            <SectionTitle>Bio</SectionTitle>
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea placeholder="Short professional bio…" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* Certificates */}
          <section className="space-y-3">
            <SectionTitle>Certificates</SectionTitle>
            <FormField
              control={form.control}
              name="certificates"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <CertificatesSection
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>
        </div>

        {/* ── Sticky footer ──────────────────────────────────────── */}
        <div className="px-5 sm:px-6 py-3.5 border-t bg-background flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-11 sm:h-10"
            disabled={isDeleting || isUpdating}
            onClick={onRequestDelete}
          >
            {isDeleting ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Deleting…</>
            ) : "Delete"}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUpdating || isDeleting}
              className="h-11 sm:h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating || isDeleting}
              className="h-11 sm:h-10"
            >
              {isUpdating ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Updating…</>
              ) : "Update Details"}
            </Button>
          </div>
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
