"use server"

import * as z from "zod"
import { SettingsSchema } from "@/type/schema"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { getUserByEmail, getUserById } from "@/data/user"
import { currentUser } from "@/lib/auth"
import { generateVerificationToken } from "@/lib/token"
import { sendVerificationEmail } from "@/lib/mail"

export const settings = async(values: z.infer<typeof SettingsSchema>) => {

    const user = await currentUser()

    if (!user) {
        return {error: "Unauthorized"}
    }

    const dbUser = await getUserById(user.id as string)

    if(!dbUser) {
        return {error: "Unauthorized"}
    }

    if(user.isOAuth) {
        values.email = undefined;
        values.password = undefined;
        values.newPassword = undefined;
    }

    if(values.email && values.email !== user.email) {
        const existingUser = await getUserByEmail(values.email)

        if(existingUser && existingUser.id !== user.id) {
            return {error: "Email already in use"}
        }

        const verficationToken = await generateVerificationToken(values.email)
        await sendVerificationEmail(
            verficationToken.email,
            verficationToken.token
        )

        return {success: "Verification email sent"}
    }

    if(values.password && values.newPassword && dbUser.password) {
        const passwordMatch = await bcrypt.compare(
            values.password,
            dbUser.password,
        )

        if(!passwordMatch) {
            return {error: "Incorect password"}
        }

        const hashedPassword = await bcrypt.hash(values.newPassword, 10)

        values.password = hashedPassword
        values.newPassword = undefined
    }

    await db.user.update({
        where: {id: dbUser.id},
        data: {
            ...values,
        }
    })

    return {success: "Your profile Updated"}

}