"use server"

import * as z from "zod"
import { db } from "@/lib/db"
import { getUserByEmail } from "@/data/user"
import { currentUser } from "@/lib/auth"
import { UserRoleUpdateSchema } from "@/type/schema"
import { UserRole } from "@prisma/client"

export const updateUserRole = async (values: z.infer<typeof UserRoleUpdateSchema>) => {

    const user = await currentUser()

    if (!user || user.role !== UserRole.SUPER_ADMIN) {
        return {error: "Unauthorized"}
    }

    const dbUser = await getUserByEmail(values.email);

    if(!dbUser) {
        return {error: "User Not found"}
    }

    await db.user.update({
        where: {id: dbUser.id},
        data: {
            role: values.role
        }
    })

    return {success: "User role updated successfully!"}
}