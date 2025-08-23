import NextAuth from "next-auth"
import authConfig from "./auth.config"
import client, { getDB } from "./lib/db";
import { getUserById } from "./data/user";
import { getAccountByUserId } from "./data/account";
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { ObjectId } from "mongodb";
import { UserRole } from "./type/types";

export const { handlers, signIn, signOut, auth } = NextAuth({

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },

  events: {
    async linkAccount({ user }) {
      const db = await getDB();
      const usersCollection = db.collection("test");
      console.log("i am from link account",{user:user},usersCollection);
      await usersCollection.updateOne(
        { _id: new ObjectId(user.id) },
        { $set: { emailVerified: new Date() } }
      )
    }
  },

  callbacks: {
    async signIn({ user, account }) {

      console.log({
        user,
        account,
      })

      // Allow OAuth email without verification      
      console.log("i am from signin",user,account);
      if (account?.provider !== "credentials") return true;

      // ignore this user.id type error, idk why its showing user as undifined while everything is ok

      const existingUser = await getUserById(user?.id || "");

      //Prevent sign in without email verification
      if (!existingUser?.emailVerified) return false

      return true
    },

    async session({ token, session }) {
      // console.log("i am from session",session,token)
      if (token.sub && session.user) {
        session.user.id = token.sub
      }

      if (token.role && session.user) {
        session.user.role = token.role
      }
      // console.log(session.user)

      if (session.user) {
        session.user.name = token.name
        session.user.email = token.email as string
        session.user.isOAuth = token.isOAuth
      }

      return session
    },

    async jwt({ token }) {
      // console.log("i am from jwt",token);
      if (!token.sub) return token

      // this one update the user role if changed user role changed with just a page relode
      const existingUser = await getUserById(token.sub)
      if (!existingUser) return token

      const existingAccount = await getAccountByUserId(existingUser._id)

      token.isOAuth = !!existingAccount
      token.role = existingUser.role as UserRole
      token.name = existingUser.name
      token.email = existingUser.email

      // this does not automaticaly update you have to re login to see updated user role
      // if(!user) return token
      // token.role = user.role

      return token
    }
  },
  adapter: MongoDBAdapter(Promise.resolve(client)),
  session: { strategy: "jwt" },
  ...authConfig,
})