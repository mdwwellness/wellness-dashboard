'use server'

import { db } from "@/lib/db"


export async function getAllUsers() {
    const user = await db.user.findMany();

    // if (!user) return {error: "No user found"}

    return user
}