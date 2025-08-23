import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { DialogClose } from "../ui/dialog";
import { DoctorsformType } from "@/type/schema";
import { useDeleteTherapist } from "@/data/addDoctors/delete-doctor";
import useUpdateTherapist from "@/data/addDoctors/update-therapist";

interface PharmacyDataype {
    data: DoctorsformType
}

export default function TherapistDetailsPage({ data }: PharmacyDataype) {
    const deleteDetails = useDeleteTherapist();
    const updateDetails = useUpdateTherapist();
    const { register, handleSubmit } = useForm<DoctorsformType>({
        defaultValues: {
            name: data.name,
            doctorId: data.doctorId,
            phonenumber: data.phonenumber,
            email: data.email,
            specialization: data.specialization,
            bio: data.bio,
        }
    })
    function onSubmit(values:DoctorsformType){
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
                                    deleteDetails.mutate(data.doctorId)
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
                            <Label htmlFor="name">Doctor Id</Label>
                            <Input id="name" placeholder="Name" {...register("doctorId")} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="phonenumber">Name</Label>
                            <Input id="phonenumber" placeholder="phonenumber" {...register("phonenumber")} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="fssaiNphonenumberumber">Phone Number</Label>
                            <Input id="fssaiNumber" placeholder="phonenumber" {...register("phonenumber")} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" placeholder="email" {...register("email")} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="specialization">Specialization</Label>
                            <Input id="specialization" placeholder="specialization" {...register("specialization")} />
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Input id="bio" placeholder="Pan Card" {...register("bio")} />
                        </div>
                    </div>
                </form>
            </div>
        </>
    )
}