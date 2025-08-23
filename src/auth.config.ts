import Google from "next-auth/providers/google";
import Credentials from 'next-auth/providers/credentials'
import type { NextAuthConfig } from 'next-auth';
import bcrypt from 'bcryptjs'

import { LoginSchema } from '@/type/schema';
import { getUserByEmail } from './data/user';
import Resend from "next-auth/providers/resend"



export default {
    // providers: [Google, Github],
    providers: [
        Resend,
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        Credentials({
            // @ts-expect-error causing error onfulfilled
            async authorize(credentials) {
                const validateFileds = LoginSchema.safeParse(credentials);
                
                if (validateFileds.success) {
                    const { email, password } = validateFileds.data

                    const user = await getUserByEmail(email);
                    if (!user || !user.password) return null;

                    const passwordMatch = bcrypt.compareSync(
                        password,
                        user.password,
                    );
                    if (passwordMatch) return user;
                }
                return null;
            }
        })]
} satisfies NextAuthConfig