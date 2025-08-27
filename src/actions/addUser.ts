"use server"
import { getUserByEmail } from "@/data/user";
import { db } from "@/lib/db";
import { AddUserBySuperAdmin } from "@/type/schema";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import z from "zod";

export default async function AddUser(values: z.infer<typeof AddUserBySuperAdmin>) {
    const validatedFileds = AddUserBySuperAdmin.safeParse(values);
    if (!validatedFileds.success) {
        return { error: "Invalid fileds" };
    }
    console.log("passed");

    const { email, password, username,role } = validatedFileds.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
        return { error: "Email already in use!" }
    }

    await db.user.create({
        data: {
            name: username,
            email,
            password: hashedPassword,
            role: role as UserRole,
            emailVerified:new Date()
        }
    });
    console.log("created");

    return { success: "User Created" };
}