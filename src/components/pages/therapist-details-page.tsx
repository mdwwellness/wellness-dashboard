import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useForm, Controller } from "react-hook-form";
import { Button } from "../ui/button";
import { DialogClose } from "../ui/dialog";
import { DoctorsformType } from "@/type/schema";
import { useDeleteTherapist } from "@/data/addDoctors/delete-doctor";
import useUpdateTherapist from "@/data/addDoctors/update-therapist";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";

interface PharmacyDataype {
    data: DoctorsformType;
}

export default function TherapistDetailsPage({ data }: PharmacyDataype) {
    const deleteDetails = useDeleteTherapist();
    const updateDetails = useUpdateTherapist();
    const { register, handleSubmit, control } = useForm<DoctorsformType>({
        defaultValues: {
            name: data.name,
            doctorId: data.doctorId,
            phonenumber: data.phonenumber,
            email: data.email,
            isActive: data.isActive,
            specialization: data.specialization,
            gender:data.gender,
            bio: data.bio,
        }
    });

    function onSubmit(values: DoctorsformType) {
        updateDetails.mutate(values);
    }

    return (
        <>
            <div>
                <form
                    className="grid grid-cols-1"
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <div className="items-center justify-between flex gap-2 md:ml-auto md:float-right mb-3">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                disabled={deleteDetails.isPending}
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteDetails.mutate(data.doctorId)}
                            >
                                Delete Details
                            </Button>
                        </DialogClose>
                        <DialogClose asChild>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={updateDetails.isPending}
                            >
                                Update Details
                            </Button>
                        </DialogClose>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mx-auto p-6 border rounded-lg shadow-sm">
                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="doctorId">Therapist Id</Label>
                            <Input id="doctorId" placeholder="Therapist Id" {...register("doctorId")} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" placeholder="Name" {...register("name")} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="phonenumber">Phone Number</Label>
                            <Input id="phonenumber" placeholder="Phone Number" {...register("phonenumber")} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Input id="gender" placeholder="Gender" {...register("gender")} readOnly />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" placeholder="Email" {...register("email")} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="specialization">Specialization</Label>
                            <Input id="specialization" placeholder="Specialization" {...register("specialization")} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Input id="bio" placeholder="Bio" {...register("bio")} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="isActive">State</Label>
                            <Controller
                                name="isActive"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        value={field.value ? "true" : "false"}  // Make sure it's a string for Select
                                        onValueChange={(value) => field.onChange(value === "true")}  // Convert to boolean on change
                                    >
                                        <SelectTrigger>
                                            {field.value ? "Active" : "Not Active"}
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="true">Active</SelectItem>
                                            <SelectItem value="false">Not Active</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}
