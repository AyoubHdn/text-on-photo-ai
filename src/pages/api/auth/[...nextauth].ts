import NextAuth from "next-auth";
import type { NextApiRequest, NextApiResponse } from "next";
import { createAuthOptions } from "~/server/auth";

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  return await NextAuth(req, res, createAuthOptions(req));
}
