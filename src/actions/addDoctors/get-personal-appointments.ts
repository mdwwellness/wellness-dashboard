"use server"


const base_url = process.env.BACKEND_BASE_URL
export default async function getPersonalAppointments(id:string) {
    const options: RequestInit = {
        method: "GET",
        headers: {
            accept: "application/json"
        },
        cache: "no-cache"
    }

    try {
        const response =await fetch(`${base_url}/api/therapist/${id}`, options);
        const result = await response.json()
        
        if (result.ok) {
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