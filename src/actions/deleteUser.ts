"use server"
import { getUserByEmail } from "@/data/user";
import { db } from "@/lib/db";

export default async function DeleteUser(email: string) {
    // console.log("passed");

    const existingUser = await getUserByEmail(email);

    if (!existingUser) {
        return { error: "Email doesn't exist" }
    }

    try {
        await db.user.delete({ where: { email } });
        return { success: true };
    } catch (error) {
        console.error("DeleteUser error:", error);
        return { error: "Failed to delete user." };
    }
}