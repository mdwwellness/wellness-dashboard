"use server"
import { DoctorsformType } from "@/type/schema";



const base_url = process.env.BACKEND_BASE_URL
export default async function updateTherapist(values: DoctorsformType) {
    const options: RequestInit = {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
    }

    try {
        const response = fetch(`${base_url}/api/therapist/${values.doctorId}`, options).then(res => res.json());
        const result = await response

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