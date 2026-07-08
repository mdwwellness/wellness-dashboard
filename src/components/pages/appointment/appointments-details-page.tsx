"use client";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { slotBookingZodSchema, slotBookingZodType } from "@/type/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  useDeleteAppointment,
  useUpdateAppointment,
} from "@/data/appointment/appointment";
import z from "zod";

interface AppointmentDetailsPageProps {
  data: slotBookingZodType;
  onClose: () => void;
  /** Hides the visit date/time when the package block above already manages it. */
  compact?: boolean;
}

export default function AppointmentDetailsPage({
  data,
  onClose,
  compact = false,
}: AppointmentDetailsPageProps) {
  const { mutate: updateMutate, isPending: isUpdating } =
    useUpdateAppointment();
  const { mutate: deleteMutate, isPending: isDeleting } =
    useDeleteAppointment();

  // Customer identity is set during the enquiry funnel and rarely edited during
  // a visit — keep it tucked away so the drawer stays visit-focused.
  const [showCustomer, setShowCustomer] = useState(false);

  const form = useForm<z.infer<typeof slotBookingZodSchema>>({
    resolver: zodResolver(slotBookingZodSchema),
    defaultValues: buildDefaults(data),
  });

  useEffect(() => {
    form.reset(buildDefaults(data));
  }, [data._id]); // eslint-disable-line react-hooks/exhaustive-deps

  function onSubmit(values: slotBookingZodType) {
    updateMutate(values, {
      onSuccess: () => onClose(),
    });
  }

  function handleDelete() {
    if (!data._id) return;
    deleteMutate(data._id, {
      onSuccess: () => onClose(),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
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
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete appointment?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The appointment will be
                  permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button type="submit" size="sm" disabled={isUpdating || isDeleting}>
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Updating...
              </>
            ) : (
              "Update Details"
            )}
          </Button>
        </div>

        {/* Visit-focused details — customer identity is collapsed below. */}
        <div className="w-full mx-auto p-6 border rounded-lg space-y-5 [&>*]:min-w-0">
          {data.doctor && (
            <FormField
              control={form.control}
              name="doctor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Therapist</FormLabel>
                  <FormControl>
                    <Input placeholder="Therapist" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Visit date/time only when there's no package block managing it. */}
          {!compact && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="slot.date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slot.time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input placeholder="Time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Textarea placeholder="Note" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Customer details — collapsed by default. */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowCustomer((s) => !s)}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {showCustomer ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Customer details
            </button>

            {showCustomer && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
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
                        <Input placeholder="Phone Number" {...field} />
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
                        <Input placeholder="Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input placeholder="Age" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}

// Preserve every field on the record (including ones no longer shown in this
// drawer — therapist id, appointment type, package id, therapy start/end times)
// so an "Update Details" save never silently wipes them.
function buildDefaults(data: slotBookingZodType) {
  return {
    _id: data._id,
    name: data.name,
    location: data.location,
    category: data.category,
    slot: {
      date: data.slot?.date
        ? new Date(data.slot.date).toISOString().split("T")[0]
        : "",
      time: data.slot?.time ?? "",
    },
    note: data.note,
    age: data.age,
    phonenumber: data.phonenumber,
    email: data.email,
    doctor: data.doctor,
    doctorId: data.doctorId,
    status: data.status ?? "scheduled",
    therapyStartTime: data.therapyStartTime ?? "",
    therapyEndTime: data.therapyEndTime ?? "",
    typeOfappointment: data.typeOfappointment ?? "appointment",
    packageServiceId: data.packageServiceId ?? "",
  };
}
