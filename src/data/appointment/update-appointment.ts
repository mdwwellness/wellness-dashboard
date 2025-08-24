"use client"
import updateAppointment from "@/actions/appointments/update-appointment";
import { slotBookingZodType } from "@/type/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type onSuccessDataType = {
    success: boolean;
    message: string;
}

export default function useUpdateAppointment() {
    const queryclient = useQueryClient();
    return useMutation({
        mutationFn: async (values: slotBookingZodType) => updateAppointment(values) ,
        onSuccess: (data: onSuccessDataType) => {
            if (!data.success) {
                toast.error("Something went wrong", { description: data.message })
            }else{
                toast.success("Appointment update", { description: data.message })
            }
            queryclient.invalidateQueries({queryKey:["getAllAppointments"]})
            return data;    
        },
        onError: (error) => {
            console.error('Error posting data: on add distributor', error);
        },

    })
}
