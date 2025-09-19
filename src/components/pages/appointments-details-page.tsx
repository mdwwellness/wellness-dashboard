import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Controller, useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { DialogClose } from "../ui/dialog";
import { slotBookingZodSchema, slotBookingZodType } from "@/type/schema";
import z from "zod";
import { Textarea } from "../ui/textarea";
import { useDeleteAppointment } from "@/data/appointment/delete-appointment";
import useUpdateAppointment from "@/data/appointment/update-appointment";
import { Form, FormControl, FormItem, FormLabel } from "../ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

interface AppointmentDataType {
    data: slotBookingZodType;
}

export default function AppointmentDetailsPage({ data }: AppointmentDataType) {
    const deleteDetails = useDeleteAppointment();
    const updateDetails = useUpdateAppointment();

    const form = useForm<z.infer<typeof slotBookingZodSchema>>({
        defaultValues: {
            _id: data._id,
            name: data.name,
            location: data.location,
            category: data.category,
            slot: {
                date: data.slot.date,
                time: data.slot.time,
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
        },
    });

    const { register, handleSubmit, control, getValues } = form;

    function onSubmit(values: slotBookingZodType) {
        updateDetails.mutate(values);
    }

    return (
        <div>
            <Form {...form}>
                <form className="grid grid-cols-1" onSubmit={handleSubmit(onSubmit)}>
                    <div className="justify-between items-center gap-2 md:ml-auto flex float-right mb-3">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                disabled={deleteDetails.isPending}
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteDetails.mutate(data._id!)}
                            >
                                Delete Details
                            </Button>
                        </DialogClose>
                        <DialogClose asChild>
                            <Button type="submit" size="sm" disabled={updateDetails.isPending}>
                                Update Details
                            </Button>
                        </DialogClose>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mx-auto p-6 border rounded-lg shadow-sm">
                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" placeholder="Name" {...register("name")} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" placeholder="Location" {...register("location")} />
                        </div>

                        {data.doctor && data.doctorId && (
                            <>
                                <div className="flex flex-col space-y-2">
                                    <Label htmlFor="doctor">Therapist</Label>
                                    <Input id="doctor" placeholder="Doctor" {...register("doctor")} />
                                </div>

                                <div className="flex flex-col space-y-2">
                                    <Label htmlFor="doctorid">Therapist ID</Label>
                                    <Input id="doctorid" placeholder="Doctor ID" {...register("doctorId")} />
                                </div>
                            </>
                        )}

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="age">Age</Label>
                            <Input id="age" placeholder="Age" {...register("age")} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="phonenumber">Phone Number</Label>
                            <Input id="phonenumber" placeholder="Phone Number" {...register("phonenumber")} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" placeholder="Email" {...register("email")} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input id="date" placeholder="Date" {...register("slot.date")} value={getValues("slot.date") ? new Date(getValues("slot.date")).toLocaleDateString() : ""} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="time">Time</Label>
                            <Input id="time" placeholder="Time" {...register("slot.time")} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Controller
                                control={control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select defaultValue={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select Status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="scheduled">Scheduled (Not Started)</SelectItem>
                                                <SelectItem value="ongoing">Therapy Started</SelectItem>
                                                <SelectItem value="completed">Therapy Completed</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="therapyStartTime">Therapy Start Time</Label>
                            <Input
                                id="therapyStartTime"
                                type="datetime-local"
                                {...register("therapyStartTime")}
                            />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="therapyEndTime">Therapy End Time</Label>
                            <Input
                                id="therapyEndTime"
                                type="datetime-local"
                                {...register("therapyEndTime")}
                            />
                        </div>

                        <div className="flex flex-col space-y-2 md:col-span-3">
                            <Label htmlFor="note">Note</Label>
                            <Textarea id="note" placeholder="Note" {...register("note")} />
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}
