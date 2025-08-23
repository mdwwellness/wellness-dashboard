"use server"
import { DoctorsformType } from "@/type/schema";



const base_url = process.env.BACKEND_BASE_URL
export default async function deleteTherapist(id: string) {
    const options: RequestInit = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
    }

    try {
        const response = fetch(`${base_url}/api/therapist/${id}`, options).then(res => res.json());
        const result = await response

        if (result.ok) {
            return {
                success: false,
                message: "Something went wrong"
            }
        }
        return {
            success: true,
            message: "Data posted successfully",
        }
    } catch (err) {
        console.error(err);
        return { success: false, message: "Something went wrong" }; 
    }

}