'use server'

import * as z from 'zod';
import { LoginSchema } from '@/type/schema';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { DEFAULT_LOGIN_ROUTE } from '@/route';
import { generateVerificationToken } from '@/lib/token';
import { getUserByEmail } from '@/data/user';
import { sendVerificationEmail } from '@/lib/mail';


export const login = async (values: z.infer<typeof LoginSchema>, callbackUrl?: string | null) => {
    const validatedFileds = LoginSchema.safeParse(values);

    if (!validatedFileds.success) {
        return { error: "Invalid fileds" };
    }


    const { email, password } = validatedFileds.data;

    const existingUser = await getUserByEmail(email);
    if (!existingUser || !existingUser.email || !existingUser.password) {
        return { error: "Email does not exist!" }
    }

    if (!existingUser.emailVerified) {
        const verificationToken = await generateVerificationToken(existingUser.email);

        await sendVerificationEmail(
            verificationToken.email,
            verificationToken.token
        );

        return { success: "Confirmation email sent!" };
    }


    try {
        // console.log("i am running fine");
        const result = await signIn("credentials", {
            email,
            password,
            redirectTo: callbackUrl || DEFAULT_LOGIN_ROUTE ,
        })
        
        if (!result) {
            return { error: result };
        }
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Invalid Credentials!" }
                default:
                    return { error: "Something went wrong!" }
            }
        }
        throw error;
    }
}