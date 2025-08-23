"use client"
import updateTherapist from "@/actions/addDoctors/update-therapist";
import { DoctorsformType } from "@/type/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type onSuccessDataType = {
    success: boolean;
    message: string;
}

export default function useUpdateTherapist() {
    const queryclient = useQueryClient();
    return useMutation({
        mutationFn: async (values: DoctorsformType) => updateTherapist(values) ,
        onSuccess: (data: onSuccessDataType) => {
            if (!data.success) {
                toast.error("Something went wrong", { description: data.message })
            }else{
                toast.success("Doctor added", { description: data.message })
            }
            queryclient.invalidateQueries({queryKey:["getAllDoctors"]})
            return data;    
        },
        onError: (error) => {
            console.error('Error posting data: on add distributor', error);
        },

    })
}
