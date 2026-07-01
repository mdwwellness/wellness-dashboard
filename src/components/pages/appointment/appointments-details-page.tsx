"use client";
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
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
  useDeleteAppointment,
  useUpdateAppointment,
} from "@/data/appointment/appointment";
import { useGetServices } from "@/data/service/service";
import { getSessionPackages } from "@/lib/package-progress";
import z from "zod";

interface AppointmentDetailsPageProps {
  data: slotBookingZodType;
  onClose: () => void; // ← receives close handler from parent
}

export default function AppointmentDetailsPage({
  data,
  onClose,
}: AppointmentDetailsPageProps) {
  const { mutate: updateMutate, isPending: isUpdating } =
    useUpdateAppointment();
  const { mutate: deleteMutate, isPending: isDeleting } =
    useDeleteAppointment();
  const { data: services = [] } = useGetServices();
  const sessionPackages = getSessionPackages(services);

  const form = useForm<z.infer<typeof slotBookingZodSchema>>({
    resolver: zodResolver(slotBookingZodSchema),
    defaultValues: {
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
    },
  });

  useEffect(() => {
    form.reset({
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
    });
  }, [data._id]); // eslint-disable-line react-hooks/exhaustive-deps

  function onSubmit(values: slotBookingZodType) {
    updateMutate(values, {
      onSuccess: () => onClose(),
    });
  }

  function handleDelete() {
    if (!data._id) return; // ← guard against undefined _id
    deleteMutate(data._id, {
      onSuccess: () => onClose(), // ← close only on success
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

          {/* update */}
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

        {/* form fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mx-auto p-6 border rounded-lg">
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

          {data.doctor && data.doctorId && (
            <>
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
            </>
          )}

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

          <FormField
            control={form.control}
            name="packageServiceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Therapy package</FormLabel>
                <Select
                  value={field.value || "none"}
                  onValueChange={(v) =>
                    field.onChange(v === "none" ? "" : v)
                  }
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select package (for session progress)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No package</SelectItem>
                    {sessionPackages.map((pkg) => (
                      <SelectItem key={pkg.serviceId} value={pkg.serviceId}>
                        {pkg.name} ({pkg.packageCount} sessions)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="scheduled">
                      Scheduled (Not Started)
                    </SelectItem>
                    <SelectItem value="ongoing">Therapy Started</SelectItem>
                    <SelectItem value="completed">Therapy Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
<FormField
  control={form.control}
  name="typeOfappointment"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Appointment Type</FormLabel>
      <Select defaultValue={field.value} onValueChange={field.onChange}>
        <FormControl>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="appointment">Appointment</SelectItem>
          <SelectItem value="consultation">Consultation</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
          <FormField
            control={form.control}
            name="therapyStartTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Therapy Start Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="therapyEndTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Therapy End Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem className="md:col-span-3">
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Textarea placeholder="Note" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
}
