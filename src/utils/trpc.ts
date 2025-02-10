// src/utils/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "~/server/api/routers/_app";

export const trpc = createTRPCReact<AppRouter>();
