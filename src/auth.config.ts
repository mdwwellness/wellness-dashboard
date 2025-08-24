import Github from 'next-auth/providers/github';
import Google from "next-auth/providers/google";
import Credentials from 'next-auth/providers/credentials'
import type { NextAuthConfig } from 'next-auth';
import bcrypt from 'bcryptjs'

import { LoginSchema } from './type/schema';
import { getUserByEmail } from './data/user';


export default {
    // providers: [Google, Github],
    providers: [
        Github({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }),
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Credentials({
            //@ts-expect-error error
        async authorize(credentials) {
            const validateFileds = LoginSchema.safeParse(credentials);

            if(validateFileds.success) {
                const { email, password } = validateFileds.data

                const user = await getUserByEmail(email);
                if (!user || !user.password) return null;

                const passwordMatch = await bcrypt.compare(
                    password,
                    user.password,
                );

                if(passwordMatch) return user;
            }

            return null;
        }
    })]
} satisfies NextAuthConfig