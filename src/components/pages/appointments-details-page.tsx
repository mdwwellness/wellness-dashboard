import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { DialogClose } from "../ui/dialog";
import { slotBookingZodSchema, slotBookingZodType } from "@/type/schema";
import z from "zod";
import { Textarea } from "../ui/textarea";
import { useDeleteAppointment } from "@/data/appointment/delete-appointment";
import useUpdateAppointment from "@/data/appointment/update-appointment";


interface AppointmentDataType {
    data: slotBookingZodType
}

export default function AppointmentDetailsPage({ data }: AppointmentDataType) {
    const deleteDetails = useDeleteAppointment();
    const updateDetails = useUpdateAppointment();
    const { register, handleSubmit } = useForm<z.infer<typeof slotBookingZodSchema>>({
        defaultValues: {
            _id:data._id,
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
        }
    })
    function onSubmit(values: slotBookingZodType) {
        updateDetails.mutate(values);
    }
    return (
        <>
            <div>
                <form
                    className="grid grid-cols-1"
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <div className="hidden items-center gap-2 md:ml-auto md:flex float-right mb-3">
                        <DialogClose asChild >
                            <Button
                                type="button"
                                disabled={deleteDetails.isPending}
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                    deleteDetails.mutate(data._id!)
                                }
                            >
                                Delete Details
                            </Button>
                        </DialogClose>
                        <DialogClose asChild >
                            <Button
                                type="submit"
                                size="sm"
                                disabled={updateDetails.isPending}
                            >
                                Update Details
                            </Button>
                        </DialogClose>
                    </div>
                    <div
                        className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mx-auto p-6 border rounded-lg shadow-sm"
                    >
                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" placeholder="Name" {...register("name")} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" placeholder="Location" {...register("location")} />
                        </div>
                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="doctor">Doctor</Label>
                            <Input id="doctor" placeholder="Doctor" {...register("doctor")} />
                        </div>
                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="doctorid">Location</Label>
                            <Input id="doctorid" placeholder="Doctor ID" {...register("doctorId")} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="age">Age</Label>
                            <Input id="age" placeholder="age" {...register("age")} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="phonenumber">Phone Number</Label>
                            <Input id="phonenumber" placeholder="phonenumber" {...register("phonenumber")} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" placeholder="email" {...register("email")} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input id="date" placeholder="date" {...register("slot.date")} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="Time">Time</Label>
                            <Input id="Time" placeholder="Time" {...register("slot.time")} />
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="note">Note </Label>
                            <Textarea id="note" placeholder="Note" {...register("note")} />
                        </div>
                    </div>
                </form>
            </div>
        </>
    )
}