"use server"
import { slotBookingZodType } from "@/type/schema";



const base_url = process.env.BACKEND_BASE_URL
export default async function updateAppointment(values: slotBookingZodType) {
    const options: RequestInit = {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
    }

    try {
        const response =await fetch(`${base_url}/api/appointments/${values._id}`, options);
        const result = await response.json()

        if (result.ok) {
            return {
                success: false,
                message: "Something went wrong"
            }
        }
        return {
            success: true,
            message: "Data Updated Successfully",
        }
    } catch (err) {
        console.error(err);
        return { success: false, message: "Something went wrong" }; 
    }

}