import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
  VerificationToken,
} from "next-auth/adapters";
import {
  authCreateSessionFromService,
  authCreateUserFromService,
  authCreateVerificationTokenFromService,
  authDeleteSessionFromService,
  authDeleteUserFromService,
  authGetSessionAndUserFromService,
  authGetUserByAccountFromService,
  authGetUserByEmailFromService,
  authGetUserFromService,
  authLinkAccountFromService,
  authUnlinkAccountFromService,
  authUpdateSessionFromService,
  authUpdateUserFromService,
  authUseVerificationTokenFromService,
} from "~/server/cloudflare/dbService";

function user(value: { id: string; name: string | null; email: string | null; emailVerified: string | null; image: string | null }): AdapterUser {
  if (!value.email) throw new Error("Auth service returned a user without an email.");
  return { id: value.id, name: value.name, email: value.email, emailVerified: value.emailVerified ? new Date(value.emailVerified) : null, image: value.image };
}

export function ServiceAdapter(): Adapter {
  return {
    async createUser(data: Omit<AdapterUser, "id">) {
      return user(await authCreateUserFromService({ name: data.name ?? null, email: data.email, emailVerified: data.emailVerified?.toISOString() ?? null, image: data.image ?? null }));
    },
    async getUser(id) { const result = await authGetUserFromService({ userId: id }); return result ? user(result) : null; },
    async getUserByEmail(email) { const result = await authGetUserByEmailFromService({ email }); return result ? user(result) : null; },
    async getUserByAccount(account) { const result = await authGetUserByAccountFromService(account); return result ? user(result) : null; },
    async updateUser(data) {
      const input: { id: string; name?: string | null; email?: string; emailVerified?: string | null; image?: string | null } = { id: data.id };
      if (Object.prototype.hasOwnProperty.call(data, "name")) input.name = data.name ?? null;
      if (Object.prototype.hasOwnProperty.call(data, "email")) input.email = data.email;
      if (Object.prototype.hasOwnProperty.call(data, "emailVerified")) input.emailVerified = data.emailVerified?.toISOString() ?? null;
      if (Object.prototype.hasOwnProperty.call(data, "image")) input.image = data.image ?? null;
      return user(await authUpdateUserFromService(input));
    },
    async deleteUser(id) { return user(await authDeleteUserFromService({ userId: id })); },
    async linkAccount(account: AdapterAccount) { return await authLinkAccountFromService(account as unknown as Record<string, unknown>) as AdapterAccount; },
    async unlinkAccount(account: Pick<AdapterAccount, "provider" | "providerAccountId">) { return await authUnlinkAccountFromService(account); },
    async createSession(data) { return await authCreateSessionFromService(data) as AdapterSession; },
    async getSessionAndUser(token) {
      const result = await authGetSessionAndUserFromService({ sessionToken: token });
      return result ? { session: { ...result.session, expires: new Date(result.session.expires) }, user: user(result.user) } : null;
    },
    async updateSession(data) {
      return await authUpdateSessionFromService({ sessionToken: data.sessionToken, ...(data.userId !== undefined ? { userId: data.userId } : {}), ...(data.expires !== undefined ? { expires: data.expires } : {}) }) as AdapterSession;
    },
    async deleteSession(token) { return await authDeleteSessionFromService({ sessionToken: token }) as AdapterSession; },
    async createVerificationToken(data) { return await authCreateVerificationTokenFromService(data) as VerificationToken; },
    async useVerificationToken(data) { return await authUseVerificationTokenFromService(data) as VerificationToken | null; },
  };
}
