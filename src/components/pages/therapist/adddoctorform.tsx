"use client";

import { useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { THERAPY_CATEGORYES } from "@/lib/constant";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CirclePlus, X, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddTherapist } from "@/data/therapist/therapist";
import { TherapistformSchema, TherapistformType } from "@/type/schema";

export default function AddDoctorForm() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const mutation = useAddTherapist();

  const form = useForm<z.infer<typeof TherapistformSchema>>({
    resolver: zodResolver(TherapistformSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      doctorId: "",
      gender: "male",
      phonenumber: undefined,
      email: "",
      specialization: [], // ← managed inside form now
      bio: "",
    },
  });

  const specialization = form.watch("specialization"); // ← watch form value directly

  const filteredTherapies = useMemo(() => {
    return THERAPY_CATEGORYES.filter(
      (therapy) =>
        therapy.label.toLowerCase().includes(searchValue.toLowerCase()) &&
        !specialization.includes(therapy.value),
    );
  }, [searchValue, specialization]);

  function handleAddSpecialization(val: string) {
    const current = form.getValues("specialization");
    if (!current.includes(val)) {
      form.setValue("specialization", [...current, val], {
        shouldValidate: true,
      });
    }
    setSearchValue("");
    setIsDropdownOpen(false);
  }

  function handleRemoveSpecialization(val: string) {
    const current = form.getValues("specialization");
    form.setValue(
      "specialization",
      current.filter((item) => item !== val),
      { shouldValidate: true },
    );
  }

  function onSubmit(values: TherapistformType) {
    mutation.mutate(values, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
        setSearchValue("");
      },
    });
  }

  function handleDialogChange(open: boolean) {
    setIsDialogOpen(open);
    if (!open) {
      form.reset();
      setSearchValue("");
      setIsDropdownOpen(false);
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button className="flex justify-center items-center gap-1">
          <CirclePlus className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Therapist
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="w-full max-w-3xl h-[92vh] md:h-fit overflow-y-scroll">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add Therapist</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Add a therapist with the required fields below
          </p>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5"
          >
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

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value} // ← shows "male" by default
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
                              <CommandEmpty>
                                No specialization found.
                              </CommandEmpty>
                              <CommandGroup>
                                {filteredTherapies.map((therapy) => (
                                  <CommandItem
                                    key={therapy.value}
                                    onSelect={() =>
                                      handleAddSpecialization(therapy.value)
                                    }
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

                    {/* selected tags */}
                    {specialization.length > 0 && (
                      <div className="border border-border rounded-md p-2 bg-muted/30">
                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                          {specialization.map((val: any) => (
                            <div
                              key={val}
                              className="flex items-center gap-1 px-3 py-1 rounded-md border border-border bg-secondary text-secondary-foreground text-sm font-medium"
                            >
                              <span className="whitespace-nowrap">
                                {THERAPY_CATEGORYES.find((t) => t.value === val)
                                  ?.label ?? val}
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

            <Button
              type="submit"
              className="md:col-start-2 col-start-1"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                "Add Therapist"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>

      {/* close dropdown when clicking outside */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsDropdownOpen(false);
            setSearchValue("");
          }}
        />
      )}
    </Dialog>
  );
}
