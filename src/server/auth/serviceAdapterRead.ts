import type {
  AdapterAccount,
  AdapterSession,
  AdapterUser,
} from "next-auth/adapters";
import {
  authGetSessionAndUserFromService,
  authGetUserByAccountFromService,
  authGetUserByEmailFromService,
  authGetUserFromService,
} from "~/server/cloudflare/dbService";

type ServiceUser = {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: string | null;
  image: string | null;
};

function toAdapterUser(user: ServiceUser): AdapterUser {
  if (!user.email) {
    throw new Error("Auth service returned a user without an email.");
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
    image: user.image,
  };
}

export async function getUser(id: string): Promise<AdapterUser | null> {
  const user = await authGetUserFromService({ userId: id });
  return user ? toAdapterUser(user) : null;
}

export async function getUserByEmail(email: string): Promise<AdapterUser | null> {
  const user = await authGetUserByEmailFromService({ email });
  return user ? toAdapterUser(user) : null;
}

export async function getUserByAccount(
  account: Pick<AdapterAccount, "provider" | "providerAccountId">,
): Promise<AdapterUser | null> {
  const user = await authGetUserByAccountFromService(account);
  return user ? toAdapterUser(user) : null;
}

export async function getSessionAndUser(sessionToken: string): Promise<{
  session: AdapterSession;
  user: AdapterUser;
} | null> {
  const result = await authGetSessionAndUserFromService({ sessionToken });
  if (!result) return null;
  return {
    session: {
      sessionToken: result.session.sessionToken,
      userId: result.session.userId,
      expires: new Date(result.session.expires),
    },
    user: toAdapterUser(result.user),
  };
}
