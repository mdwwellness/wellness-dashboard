"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown, CirclePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { slotBookingZodSchema, TherapistformType } from "@/type/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBookAppointment } from "@/data/appointment/appointment";
import { useGetAllTherapist } from "@/data/therapist/therapist";

type GenderType = "All" | "Male" | "Female";

export default function AppointmentBookingForm() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedGender, setSelectedGender] = useState<GenderType>("All");

  const mutation = useBookAppointment();
  const { data: doctorsData, isLoading, isError, refetch } = useGetAllTherapist();

  const form = useForm<z.infer<typeof slotBookingZodSchema>>({
    resolver: zodResolver(slotBookingZodSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      location: "",
      category: "",
      typeOfappointment: "appointment",
      slot: {
        date: format(new Date(), "yyyy-MM-dd"),
        time: "",
      },
      note: "",
      age: 0,
      phonenumber: 0,
      email: "",
      doctor: "",
      therapyEndTime: "",
      therapyStartTime: "",
      doctorId: "",
      status: "scheduled",
    },
  });

  const watchDoctorId = form.watch("doctorId");
  const watchCategory = form.watch("category");

  const filteredDoctors = useMemo(() => {
    if (!doctorsData) return [];
    let list = doctorsData;

    if (selectedGender !== "All") {
      list = list.filter(
        (d: TherapistformType) => d.gender?.toLowerCase() === selectedGender.toLowerCase()
      );
    }

    if (watchCategory && !watchDoctorId) {
      list = list.filter((d: TherapistformType) =>
        d.specialization.includes(watchCategory)
      );
    }

    return list;
  }, [doctorsData, selectedGender, watchCategory, watchDoctorId]);

  const doctorCategories = useMemo(() => {
    if (!watchDoctorId || !doctorsData) return [];
    return doctorsData.find(
      (d: TherapistformType) => d.doctorId === watchDoctorId
    )?.specialization ?? [];
  }, [watchDoctorId, doctorsData]);

  function handleGenderChange(gender: GenderType) {
    setSelectedGender(gender);
    form.setValue("doctor", "");
    form.setValue("doctorId", "");
  }

  function onSubmit(values: z.infer<typeof slotBookingZodSchema>) {
    mutation.mutate(values, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
        setSelectedGender("All");
      },
    });
  }

  function handleDialogChange(open: boolean) {
    setIsDialogOpen(open);
    if (!open) {
      form.reset();
      setSelectedGender("All");
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button className="flex justify-center items-center gap-1">
          <CirclePlus className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Book Appointment
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="w-full max-w-3xl h-[92vh] md:h-fit overflow-y-scroll">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Book an Appointment</DialogTitle>
          <p className="text-sm text-muted-foreground">Book an appointment from the dates below</p>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-5"
          >
            <div className="w-full space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

                {/* gender filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Therapist Gender</label>
                  <Select
                    value={selectedGender}
                    onValueChange={(v: GenderType) => handleGenderChange(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Genders</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <FormField
                  control={form.control}
                  name="typeOfappointment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type of appointment</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Appointment Type" />
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
              </div>

              {/* therapist selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="doctor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Therapist</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(selectedName) => {
                          const selected = filteredDoctors.find(
                            (d: TherapistformType) => d.name === selectedName
                          );
                          form.setValue("doctor", selected?.name ?? "");
                          form.setValue("doctorId", selected?.doctorId ?? "");
                          field.onChange(selected?.name ?? "");
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Therapist" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoading ? (
                            <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Loading therapists...
                            </div>
                          ) : isError ? (
                            <div className="flex flex-col gap-2 p-3">
                              <p className="text-sm text-destructive">Failed to load therapists</p>
                              <button
                                type="button"
                                onClick={() => refetch()}
                                className="text-xs text-muted-foreground underline text-left"
                              >
                                Try again
                              </button>
                            </div>
                          ) : filteredDoctors.length > 0 ? (
                            filteredDoctors.map((doctor: TherapistformType) => (
                              <SelectItem key={doctor.doctorId} value={doctor.name}>
                                {doctor.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-3 text-sm text-muted-foreground">
                              No therapists found
                            </div>
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
                    <FormItem>
                      <FormLabel>Therapist ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Therapist ID" readOnly {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* date picker */}
              <FormField
                control={form.control}
                name="slot.date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Select Date</FormLabel>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn("w-[240px] justify-start text-left font-normal")}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => {
                            field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                            setIsCalendarOpen(false);
                          }}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* time */}
              <FormField
                control={form.control}
                name="slot.time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Time</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["9:30", "10:30", "11:30", "12:30", "13:30", "14:30",
                          "15:30", "16:30", "17:30", "18:30", "19:30", "20:30"].map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
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

            <div className="w-full space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input placeholder="Your name" {...field} /></FormControl>
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
                    <FormControl><Input placeholder="Your location" {...field} /></FormControl>
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
                    {doctorCategories.length > 0 ? (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {doctorCategories.map((cat: string) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <CategoryDropDown field={field} />
                    )}
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
                        type="number"
                        placeholder="Age"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                        type="number"
                        placeholder="Phone Number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Booking...
                  </span>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

type CategoryData = { [key: string]: { [key: string]: string[] } };

const CategoryDropDown = ({ field }: { field: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");

  const categories: CategoryData = {
    Therapists: {
      "Physical Therapy & Rehabilitation": ["Orthopedic Therapy", "Neurological Therapy", "Sports Therapy", "Post-Surgery Rehabilitation", "Posture Correction"],
      "Massage Therapy": ["Swedish Massage", "Deep Tissue Massage", "Thai Massage", "Aromatherapy Massage", "Hot Stone Massage", "Head/Neck/Shoulder Massage", "Foot & Reflexology Massage"],
      "Pain Management Therapies": ["Electrotherapy", "Dry Needling/Trigger Point Therapy", "Myofascial Release", "IASTM", "Active Release Therapy"],
      "Cupping & Alternate Therapies": ["Wet Cupping", "Dry Cupping", "Acupuncture", "Yoga Therapy", "Meditation & Mindfulness Therapy"],
      "Wellness & Lifestyle Therapies": ["Stress Management Therapy", "Sleep Therapy", "Weight Management Therapy", "Women's Health", "Elderly Care/Geriatric Therapy"],
    },
    Nutritionists: {
      "General Nutritionist": ["Balanced Diet Planning", "Weight Loss/Gain Diets", "Child Nutrition"],
      "Clinical/Specialized Nutritionist": ["Diabetic Diet Planning", "Cardiac Diet Planning", "Renal Diet", "Gastrointestinal Diet", "Cancer Nutrition", "Pregnancy & Lactation Nutrition", "Pediatric Nutrition", "Geriatric Nutrition"],
      "Sports & Performance Nutritionists": ["Athlete Performance Diet", "Bodybuilding / Muscle Gain Nutrition", "Endurance & Recovery Diet"],
      "Lifestyle & Preventive Nutritionist": ["PCOS/PCOD Diet Plans", "Immunity-Boosting Diets", "Stress & Anxiety Food Plans", "Skin & Hair Nutrition"],
    },
  };

  const handleSelect = (value: string) => {
    field.onChange(value);
    setIsOpen(false);
    setSelectedCategory("");
    setSelectedSubCategory("");
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between h-10 px-3 py-2 text-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{field.value || "Select Category"}</span>
        <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-lg max-h-[300px] overflow-y-auto">
          {!selectedCategory ? (
            <div className="p-1">
              {Object.keys(categories).map((cat) => (
                <button key={cat} type="button" className="w-full text-left px-2 py-2 text-sm hover:bg-accent rounded-sm flex items-center justify-between" onClick={() => setSelectedCategory(cat)}>
                  {cat}<ChevronDown className="h-4 w-4 -rotate-90" />
                </button>
              ))}
            </div>
          ) : !selectedSubCategory ? (
            <div className="p-1">
              <button type="button" className="w-full text-left px-2 py-2 text-sm text-muted-foreground hover:bg-accent rounded-sm" onClick={() => setSelectedCategory("")}>← Back</button>
              {Object.keys(categories[selectedCategory] ?? {}).map((sub) => (
                <button key={sub} type="button" className="w-full text-left px-2 py-2 text-sm hover:bg-accent rounded-sm flex items-center justify-between" onClick={() => setSelectedSubCategory(sub)}>
                  {sub}<ChevronDown className="h-4 w-4 -rotate-90" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-1">
              <button type="button" className="w-full text-left px-2 py-2 text-sm text-muted-foreground hover:bg-accent rounded-sm" onClick={() => setSelectedSubCategory("")}>← Back</button>
              {(categories[selectedCategory]?.[selectedSubCategory] ?? []).map((opt) => (
                <button key={opt} type="button" className="w-full text-left px-2 py-2 text-sm hover:bg-accent rounded-sm" onClick={() => handleSelect(opt)}>{opt}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setSelectedCategory("");
            setSelectedSubCategory("");
          }}
        />
      )}
    </div>
  );
};