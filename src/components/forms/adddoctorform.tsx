"use client"; // Optional depending on your setup

import { useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

import { DoctorsformSchema, DoctorsformType } from "@/type/schema";
import useAddDoctor from "@/data/addDoctors/add-doctor";

import { THERAPY_CATEGORYES } from "@/lib/constant";
import { cn } from "@/lib/utils";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { CirclePlus, Check, X } from "lucide-react";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

export default function AddDoctorForm() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [open, setOpen] = useState(false);
    const [categoryValue, setCategoryValue] = useState<string[]>([]);
    const [searchValue, setSearchValue] = useState("");

    const mutation = useAddDoctor();
    const form = useForm<z.infer<typeof DoctorsformSchema>>({
        resolver: zodResolver(DoctorsformSchema),
        mode: "onChange",
        defaultValues: {
            name: "",
            doctorId: "",
            phonenumber: undefined,
            email: "",
            specialization: [],
            bio: "",
        },
    });

    const handleSetValue = (val: string) => {
        if (!categoryValue.includes(val)) {
            setCategoryValue((prev) => [...prev, val]);
        }
        setSearchValue("");
        setOpen(false);
    };

    const handleRemoveValue = (val: string) => {
        setCategoryValue((prev) => prev.filter((item) => item !== val));
    };

    const filteredTherapies = useMemo(() => {
        return THERAPY_CATEGORYES.filter(
            (therapy) =>
                therapy.label.toLowerCase().includes(searchValue.toLowerCase()) &&
                !categoryValue.includes(therapy.value)
        );
    }, [searchValue, categoryValue]);

    const onSubmit = (values: DoctorsformType) => {
        const formData = {
            ...values,
            specialization: categoryValue,
        };
        console.log(formData);
        
        mutation.mutate(formData, {
            onSuccess: () => {
                setIsDialogOpen(false);
                form.reset();
                setCategoryValue([]);
                setSearchValue("");
            },
        });
    };

    return (
        <>
            <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) {
                        form.reset();
                        setCategoryValue([]);
                        setSearchValue("");
                    }
                }}
            >
                <DialogTrigger asChild>
                    <Button className="flex justify-center items-center gap-1">
                        <CirclePlus className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Add Therapist
                        </span>
                    </Button>
                </DialogTrigger>

                <DialogContent className="w-full max-w-3xl h-[92vh] md:h-fit overflow-y-scroll">
                    <DialogHeader className="font-bold text-xl">
                        Add Therapist
                        <DialogTitle>Add Therapist with the required fields below</DialogTitle>
                    </DialogHeader>

                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6 space-x-3 grid grid-cols-1 md:grid-cols-2 mt-5"
                        >
                            {/* Name */}
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

                            {/* Therapist ID */}
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

                            {/* Email */}
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Email" type="email" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Phone Number */}
                            <FormField
                                control={form.control}
                                name="phonenumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <Input type="tel" placeholder="Phone number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Specialization */}
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
                                                        setOpen(true);
                                                    }}
                                                    onFocus={() => setOpen(true)}
                                                />
                                            </div>
                                            {open && (
                                                <div className="absolute mt-2 bg-white border border-gray-200 shadow-md z-10">
                                                    <Command>
                                                        <CommandEmpty>No specialization found.</CommandEmpty>
                                                        <CommandGroup>
                                                            <CommandList>
                                                                {filteredTherapies.map((therapy) => (
                                                                    <CommandItem
                                                                        key={therapy.value}
                                                                        onSelect={() => handleSetValue(therapy.value)}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <Check className="mr-2 h-4 w-4 opacity-0" />
                                                                        {therapy.label}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandList>
                                                        </CommandGroup>
                                                    </Command>
                                                </div>
                                            )}

                                            {/* Selected Values Container */}
                                            {categoryValue.length > 0 && (
                                                <div className="border rounded-md p-2 bg-gray-50">
                                                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                                                        {categoryValue.map((val, i) => (
                                                            <div
                                                                key={i}
                                                                className="flex items-center gap-1 px-3 py-1 rounded-sm border bg-blue-100 text-sm font-medium text-blue-800"
                                                            >
                                                                <span className="whitespace-nowrap">
                                                                    {
                                                                        THERAPY_CATEGORYES.find(
                                                                            (therapy) => therapy.value === val
                                                                        )?.label
                                                                    }
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveValue(val)}
                                                                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
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

                            {/* Bio */}
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

                            {/* Submit */}
                            <Button type="submit" className="md:col-start-2 col-start-1">
                                Submit
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}
