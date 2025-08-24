"use server"

const base_url = process.env.BACKEND_BASE_URL
export default async function deleteAppointment(id: string) {
    const options: RequestInit = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
    }

    try {
        const response = await fetch(`${base_url}/api/appointments/${id}`, options);
        const result = await response.json()

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