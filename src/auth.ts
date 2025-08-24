import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from "./lib/db";
import { getUserById } from "./data/user";
import { getAccountByUserId } from "./data/account";
 
export const { handlers, signIn, signOut, auth } = NextAuth({

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },

  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() }
      })
    }
  },

  callbacks: {

    async signIn({ user, account }) {

      // console.log({
      //   user,
      //   account,
      // })

      // Allow OAuth email without verification
      if(account?.provider !== "credentials") return true;

      // ignore this user.id type error, idk why its showing user as undifined while everything is ok
      // @ts-expect-error error
        const existingUser = await getUserById(user.id);

      //Prevent sign in without email verification
      if(!existingUser?.emailVerified) return false

      // todo: add 2FA check
      return true
    },

    async session({token, session}) {
      // console.log({session: token})
      if(token.sub && session.user) {
        session.user.id = token.sub
      }
      
      if(token.role && session.user) {
        session.user.role = token.role
      }
      // console.log(session.user)

      if(session.user) {
        session.user.name = token.name
        session.user.email = token.email as string
        session.user.isOAuth = token.isOAuth
      }
      
      return session
    },

    async jwt({token}) {
      if(!token.sub) return token

      // this one update the user role if changed user role changed with just a page relode
      const existingUser = await getUserById(token.sub)
      if(!existingUser) return token

      const existingAccount = await getAccountByUserId(existingUser.id)

      token.isOAuth = !!existingAccount
      token.role = existingUser.role
      token.name = existingUser.name
      token.email = existingUser.email
      
      // this does not automaticaly update you have to re login to see updated user role
      // if(!user) return token
      // token.role = user.role

      return token
    }
  },
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  ...authConfig,
})