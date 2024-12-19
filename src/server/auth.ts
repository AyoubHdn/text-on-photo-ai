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
      // Add redirect callback to handle URLs properly
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
  // Add these configurations
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
    signIn: (message) => {
      console.log("SignIn event:", message);
    },
    signOut: (message) => {
      console.log("SignOut event:", message);
    },
    createUser: (message) => {
      console.log("CreateUser event:", message);
    },
    updateUser: (message) => {
      console.log("UpdateUser event:", message);
    },
    linkAccount: (message) => {
      console.log("LinkAccount event:", message);
    },
    session: (message) => {
      console.log("Session event:", message);
    }
  }
}

export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};