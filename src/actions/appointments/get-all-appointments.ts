"use server"

import { userType } from "@/components/pages/TherapistPersonalAppointments";


const base_url = process.env.BACKEND_BASE_URL
export default async function getAllAppointments(user?:userType) {
    const options: RequestInit = {
        method: "GET",
        headers: {
            accept: "application/json",
        },
    }

    try {
        const response =await fetch(`${base_url}/api/appointments?role=${user?.role}&id=${user?.id}&email=${user?.email}`, options);
        const result =await  response.json();
        // console.log(result);        
        if (!result.success) {
            return {
                success: false,
                message: "Something went wrong"
            }
        }
        return {
            success: true,
            message: "Data fetched successfully",
            data:result.data
        }
    } catch (error) {
        console.log(error)
        return {
            success: false,
            message: error
        }
    }
}