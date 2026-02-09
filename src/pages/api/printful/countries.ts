import type { NextApiRequest, NextApiResponse } from "next";
import { printfulRequest } from "~/server/printful/client";

type PrintfulState = {
  code: string;
  name: string;
};

type PrintfulCountry = {
  code: string;
  name: string;
  states?: PrintfulState[];
};

type CountriesResponse = {
  countries: PrintfulCountry[];
  fallback: boolean;
};

const FALLBACK_COUNTRIES: PrintfulCountry[] = [
  {
    code: "US",
    name: "United States",
    states: [{ code: "US", name: "States" }],
  },
  { code: "FR", name: "France", states: [] },
  { code: "MA", name: "Morocco", states: [] },
];

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let cachedCountries: { data: PrintfulCountry[]; expiresAt: number } | null = null;

export default async function handler(req: NextApiRequest, res: NextApiResponse<CountriesResponse>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  if (cachedCountries && cachedCountries.expiresAt > Date.now()) {
    return res.status(200).json({ countries: cachedCountries.data, fallback: false });
  }

  try {
    const data = await printfulRequest<{ result: PrintfulCountry[] }>("/countries");
    const countries =
      data?.result?.map((country) => ({
        code: country.code,
        name: country.name,
        states: Array.isArray(country.states) ? country.states.map((state) => ({
          code: state.code,
          name: state.name,
        })) : [],
      })) ?? [];

    if (countries.length === 0) {
      throw new Error("Empty country list");
    }

    cachedCountries = { data: countries, expiresAt: Date.now() + CACHE_TTL_MS };
    return res.status(200).json({ countries, fallback: false });
  } catch (err) {
    console.error("Printful countries fetch failed:", err);
    if (cachedCountries?.data?.length) {
      return res.status(200).json({ countries: cachedCountries.data, fallback: true });
    }
    return res.status(200).json({ countries: FALLBACK_COUNTRIES, fallback: true });
  }
}
