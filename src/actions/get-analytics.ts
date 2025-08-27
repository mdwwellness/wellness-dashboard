"use server"

const base_url = process.env.BACKEND_BASE_URL
export default async function getAnalyticsData() {
    const options: RequestInit = {
        method: "GET",
        headers: {
            accept: "application/json",
        },
    }

    try {
        const response =await fetch(`${base_url}/api/metrics`, options);
        const result =await  response.json();
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