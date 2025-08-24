"use client"
import getAllAppointments from "@/actions/appointments/get-all-appointments";
import { userType } from "@/components/pages/TherapistPersonalAppointments";
import { useQuery } from "@tanstack/react-query";


export function useGetAllAppointments(user?: userType){
    return useQuery({
        queryKey:["getAllAppointments",user],
        queryFn:async () => await getAllAppointments(user)
    })
}