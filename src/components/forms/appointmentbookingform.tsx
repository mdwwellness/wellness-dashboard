"use client"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, CirclePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { DoctorsformType, slotBookingZodSchema, slotBookingZodType } from "@/type/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import useBookAppointment from "@/data/appointment/book-appointment";
import { useState } from "react";
import { useGetAllDoctors } from "@/data/addDoctors/get-all-doctors";


export default function AppointmentBookingForm() {
    const [isDialogOpen, setisDialogOpen] = useState<boolean>(false);
    const mutation = useBookAppointment();
    const { data: DoctorsList, isLoading, isError } = useGetAllDoctors()
    const form = useForm<z.infer<typeof slotBookingZodSchema>>({
        resolver: zodResolver(slotBookingZodSchema),
        mode:"onChange",
        defaultValues: {
            name: "",
            location: "",
            category: "",
            slot: {
                date: new Date(),
                time: "",
            },
            note: "",
            age: 0,
            phonenumber: 0,
            email: "",
            doctor: "",
            doctorId: "",
        },
    });
    const onSubmit = (values: slotBookingZodType) => {
        console.log("Booking Data:", values);
        mutation.mutate(values, {
            onSuccess: () => {
                setisDialogOpen(false);
                form.reset();
            }
        });
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setisDialogOpen(open);
            form.reset()
        }}>
            <DialogTrigger>
                <Button className="flex justify-center items-center gap-1">
                    <CirclePlus className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Book Appointment</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-3xl h-screen md:h-fit overflow-y-scroll " >
                <DialogHeader className="font-bold text-xl">
                    Book an Appointment
                    <DialogTitle className="font-medium text-sm" >Book an appointment from below dates</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-5">
                        <div className="w-full space-y-5" >
                            {/* Date Picker */}
                            <span className="grid grid-cols-1 md:grid-cols-2 space-x-2" >
                                <FormField
                                    control={form.control}
                                    name="doctor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Therapist</FormLabel>
                                            <Select onValueChange={(selectedId) => {
                                                const selectedDoctor = DoctorsList?.data.find(
                                                    (d: DoctorsformType) => d.name === selectedId
                                                )
                                                form.setValue("doctor", selectedDoctor?.name || "")
                                                form.setValue("doctorId", selectedDoctor?.doctorId || "")
                                                field.onChange(selectedDoctor?.name || "")
                                            }} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select Therapist" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {isLoading ? (
                                                        <div>Loading...</div>
                                                    ) : isError ? (
                                                        <div>Error loading doctors</div>
                                                    ) : (
                                                        DoctorsList?.data?.map((doctor: DoctorsformType) => (
                                                            <SelectItem key={doctor.doctorId} value={doctor.name}>
                                                                {doctor.name}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="doctorId"
                                    render={({ field }) => (
                                        <FormItem className="mt-2 md:mt-0" >
                                            <FormLabel>Therapist Id</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Therapist Id" readOnly {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </span>
                            <FormField
                                control={form.control}
                                name="slot.date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Select Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-[240px] justify-start text-left font-normal"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => date < new Date()}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Time Slot Picker */}
                            <FormField
                                control={form.control}
                                name="slot.time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Select Time</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} >
                                            <FormControl>
                                                <SelectTrigger className="w-full" >
                                                    <SelectValue placeholder="Select Time" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="9:30 " >9:30 </SelectItem>
                                                <SelectItem value="10:30 " >10:30 </SelectItem>
                                                <SelectItem value="11:30 " >11:30 </SelectItem>
                                                <SelectItem value="12:30 " >12:30 </SelectItem>
                                                <SelectItem value="13:30 " >13:30 </SelectItem>
                                                <SelectItem value="14:30 " >14:30 </SelectItem>
                                                <SelectItem value="15:30 " >15:30 </SelectItem>
                                                <SelectItem value="16:30 " >16:30 </SelectItem>
                                                <SelectItem value="17:30 " >17:30 </SelectItem>
                                                <SelectItem value="18:30 " >18:30 </SelectItem>
                                                <SelectItem value="19:30 " >19:30 </SelectItem>
                                                <SelectItem value="20:30 " >20:30 </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="note"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Note</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Note..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="w-full grid grid-cols-1 gap-2" >
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Your name" {...field} />
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
                                            <Input placeholder="Your location" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} >
                                            <FormControl>
                                                <SelectTrigger className="w-full" >
                                                    <SelectValue placeholder="select category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="cardiologist">Cardiologist</SelectItem>
                                                <SelectItem value="dermatologist">Dermatologist</SelectItem>
                                                <SelectItem value="dentist">Dentist</SelectItem>
                                                <SelectItem value="general-physician">General Physician</SelectItem>
                                                <SelectItem value="neurologist">Neurologist</SelectItem>
                                                <SelectItem value="orthopedic">Orthopedic</SelectItem>
                                                <SelectItem value="pediatrician">Pediatrician</SelectItem>
                                                <SelectItem value="psychiatrist">Psychiatrist</SelectItem>
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
                                            <Input type="email" placeholder="you@example.com" {...field} />
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
                                            <Input
                                                placeholder="Age"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                type="number"
                                            />
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
                                            <Input
                                                placeholder="Phone Number"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                type="number"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button type="submit" className="w-full md:col-start-2 col-start-1">
                            Confirm Booking
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}