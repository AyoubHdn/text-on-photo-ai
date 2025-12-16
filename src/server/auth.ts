// src/server/auth.ts
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { env } from "~/env.mjs";
import { prisma } from "~/server/db";
import { updateMauticContact } from "~/server/api/routers/mautic-utils";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const authOptions: NextAuthOptions = {
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      console.log("Session callback:", { session, user });
      return session;
    },
    redirect({ url, baseUrl }) {
      console.log("Redirect callback:", { url, baseUrl });
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile",
        },
      },
    }),
  ],
  secret: env.NEXTAUTH_SECRET,
  debug: true,  // Enable debug mode to log more details
  useSecureCookies: true,
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
      },
    },
  },
  events: {
    signIn: async ({ user }) => {
      if (user.email) {
        try {
          // Fetch the latest user record from the database
          const latestUser = await prisma.user.findUnique({
            where: { id: user.id },
          });
          if (!latestUser) {
            console.error("User not found in database on signIn.");
            return;
          }
          const result = await updateMauticContact({
            email: latestUser.email!,
            name: latestUser.name,
            brand_specific_credits: latestUser.credits,
            brand_specific_plan: latestUser.plan,
          },
          'namedesignai');
          console.log("Mautic updated on signIn:", result);
        } catch (err) {
          console.error("Error updating Mautic on signIn:", err);
        }
      }
    },
    signOut: (message) => {
      console.log("SignOut event:", message);
    },
    createUser: async ({ user }) => {
      if (user.email) {
        try {
          const result = await updateMauticContact({
            email: user.email,
            name: user.name,
            brand_specific_credits: 1, // New users start with 1 credit
            brand_specific_plan: "None",
          },
          'namedesignai');
          console.log("Mautic updated on createUser:", result);
        } catch (err) {
          console.error("Error updating Mautic on createUser:", err);
        }
      }
    },
    updateUser: (message) => {
      console.log("UpdateUser event:", message);
    },
    linkAccount: (message) => {
      console.log("LinkAccount event:", message);
    },
    session: (message) => {
      console.log("Session event:", message);
    },
    
  }
}

export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};