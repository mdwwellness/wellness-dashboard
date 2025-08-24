'use server'

import bcrypt from 'bcryptjs'
import * as z from 'zod';
import { RegisterSchema } from '@/type/schema';
import { db } from '@/lib/db';
import { getUserByEmail } from '@/data/user';
import { generateVerificationToken } from '@/lib/token';
import { sendVerificationEmail } from '@/lib/mail';


export const register = async (values: z.infer<typeof RegisterSchema>) => {
    const validatedFileds = RegisterSchema.safeParse(values);

    if(!validatedFileds.success) {
        return { error: "Invalid fileds" };
    }

    const { email, password, username} = validatedFileds.data;
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
        }
    });

    const verificationToken = await generateVerificationToken(email);
    const mailSent = await sendVerificationEmail(
        verificationToken.email,
        verificationToken.token
    );
    console.log(mailSent)
    return { success: "Confirmation Email Sent" };
}