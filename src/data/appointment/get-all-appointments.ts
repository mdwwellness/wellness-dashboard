"use client"
import getAllAppointments from "@/actions/appointments/get-all-appointments";
import { UserType } from "@/components/pages/AppointmentBookingpage";
import { useQuery } from "@tanstack/react-query";


export function useGetAllAppointments(user: UserType){
    return useQuery({
        queryKey:["getAllAppointments",user],
        queryFn:async () => await getAllAppointments(user)
    })
}