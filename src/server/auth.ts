// src/server/auth.ts
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import type { NextApiRequest } from "next";
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

type PaidTrafficDetection = {
  isPaid: boolean;
  sourcePage?: string;
  promotedProduct?: string;
  signals: string[];
};

const PAID_TRAFFIC_PAGE_PRODUCT_MAP: Record<
  string,
  { sourcePage: string; promotedProduct: string }
> = {
  "/ramadan-mug": { sourcePage: "ramadan-mug", promotedProduct: "mug" },
  "/ramadan-mug-men": { sourcePage: "ramadan-mug-men", promotedProduct: "mug" },
};

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function parseQueryCandidate(
  candidate: string | null | undefined,
): URLSearchParams | null {
  if (!candidate) return null;
  try {
    const decoded = decodeURIComponent(candidate);
    const url = decoded.startsWith("http")
      ? new URL(decoded)
      : new URL(decoded, env.HOST_NAME);
    return url.searchParams;
  } catch {
    try {
      const fallback = candidate.startsWith("http")
        ? new URL(candidate)
        : new URL(candidate, env.HOST_NAME);
      return fallback.searchParams;
    } catch {
      return null;
    }
  }
}

function parsePathCandidate(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  try {
    const decoded = decodeURIComponent(candidate);
    const url = decoded.startsWith("http")
      ? new URL(decoded)
      : new URL(decoded, env.HOST_NAME);
    return url.pathname;
  } catch {
    try {
      const fallback = candidate.startsWith("http")
        ? new URL(candidate)
        : new URL(candidate, env.HOST_NAME);
      return fallback.pathname;
    } catch {
      return null;
    }
  }
}

function detectPaidTrafficFromRequest(req?: NextApiRequest): PaidTrafficDetection {
  const callbackUrlFromQuery =
    typeof req?.query?.callbackUrl === "string" ? req.query.callbackUrl : undefined;
  const callbackUrlFromCookie =
    req?.cookies?.["__Secure-next-auth.callback-url"] ??
    req?.cookies?.["next-auth.callback-url"];
  const paidLandingCookie = req?.cookies?.paid_traffic_landing;

  const querySources = [
    parseQueryCandidate(callbackUrlFromQuery),
    parseQueryCandidate(callbackUrlFromCookie),
    parseQueryCandidate(paidLandingCookie),
  ];
  const pathSources = [
    parsePathCandidate(callbackUrlFromQuery),
    parsePathCandidate(callbackUrlFromCookie),
    parsePathCandidate(paidLandingCookie),
  ];

  let source = "";
  let utmSource = "";
  let utmCampaign = "";
  let fbclid = "";
  const signals: string[] = [];

  for (const params of querySources) {
    if (!params) continue;
    source = source || normalize(params.get("source"));
    utmSource = utmSource || normalize(params.get("utm_source"));
    utmCampaign = utmCampaign || normalize(params.get("utm_campaign"));
    fbclid = fbclid || normalize(params.get("fbclid"));
  }

  if (source === "facebook" || source === "instagram") {
    signals.push(`source:${source}`);
  }
  if (utmSource === "facebook" || utmSource === "instagram") {
    signals.push(`utm_source:${utmSource}`);
  }
  if (fbclid) {
    signals.push("fbclid");
  }
  if (utmCampaign) {
    signals.push(`utm_campaign:${utmCampaign}`);
  }

  const firstPath = pathSources.find(Boolean) ?? null;
  const offerMeta = firstPath ? PAID_TRAFFIC_PAGE_PRODUCT_MAP[firstPath] : undefined;

  return {
    isPaid: signals.length > 0,
    sourcePage: offerMeta?.sourcePage,
    promotedProduct: offerMeta?.promotedProduct,
    signals,
  };
}

export const createAuthOptions = (req?: NextApiRequest): NextAuthOptions => ({
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      console.log("Session callback:", { session, user });
      return session;
    },
    redirect({ url, baseUrl }) {
      // Allow safe in-site relative callback URLs like "/ramadan-mug?utm_source=facebook".
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      try {
        const target = new URL(url);
        const currentBase = new URL(baseUrl);
        if (target.origin === currentBase.origin) {
          return url;
        }
      } catch {
        // Ignore malformed URL and fall back to base URL.
      }
      return baseUrl;
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
          const paidDetection = detectPaidTrafficFromRequest(req);
          if (paidDetection.isPaid) {
            console.log("AUTH_DEBUG signIn paid detected", {
              userId: user.id,
              email: user.email,
              signals: paidDetection.signals,
              sourcePage: paidDetection.sourcePage,
              promotedProduct: paidDetection.promotedProduct,
            });
            await prisma.user.update({
              where: { id: user.id },
              data: { paidTrafficUser: true },
            });
          }

          // Fetch the latest user record from the database
          const latestUser = await prisma.user.findUnique({
            where: { id: user.id },
          });
          if (!latestUser) {
            console.error("User not found in database on signIn.");
            return;
          }
          const paidTrafficUserForSync =
            paidDetection.isPaid || Boolean(latestUser.paidTrafficUser);
          const result = await updateMauticContact({
            email: latestUser.email!,
            name: latestUser.name,
            brand_specific_credits: latestUser.credits,
            brand_specific_plan: latestUser.plan,
            customFields: {
              paid_traffic_user: paidTrafficUserForSync ? 1 : 0,
              has_generated_design: latestUser.hasGeneratedDesign ? 1 : 0,
              has_visited_checkout: latestUser.hasVisitedCheckout ? 1 : 0,
              paid_traffic_source_page: paidDetection.sourcePage,
              paid_traffic_promoted_product: paidDetection.promotedProduct,
            },
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
          const paidDetection = detectPaidTrafficFromRequest(req);
          if (paidDetection.isPaid) {
            console.log("AUTH_DEBUG createUser paid detected", {
              userId: user.id,
              email: user.email,
              signals: paidDetection.signals,
              sourcePage: paidDetection.sourcePage,
              promotedProduct: paidDetection.promotedProduct,
            });
            await prisma.user.update({
              where: { id: user.id },
              data: { paidTrafficUser: true },
            });
          }

          const result = await updateMauticContact({
            email: user.email,
            name: user.name,
            brand_specific_credits: 1.1, // New users start with 1.1 credits
            brand_specific_plan: "None",
            customFields: {
              paid_traffic_user: paidDetection.isPaid ? 1 : 0,
              has_generated_design: 0,
              has_visited_checkout: 0,
              paid_traffic_source_page: paidDetection.sourcePage,
              paid_traffic_promoted_product: paidDetection.promotedProduct,
            },
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
});

export const authOptions: NextAuthOptions = createAuthOptions();

export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, createAuthOptions(ctx.req as NextApiRequest));
};
