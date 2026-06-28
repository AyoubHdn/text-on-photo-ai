import type { Locale } from "~/hook/useLocale";

const strings = {
  en: {
    create: "Create",
    gallery: "Gallery",
    myDesigns: "My Designs",
    pricing: "Pricing",
    credits: "Credits",
    buyCredits: "Buy Credits",
    signIn: "Sign In",
    signOut: "Sign Out",
    toggleToAr: "العربية",
    toggleToEn: "English",
    giftIdeas: "Gift Ideas",
  },
  ar: {
    create: "إنشاء",
    gallery: "المعرض",
    myDesigns: "تصاميمي",
    pricing: "الأسعار",
    credits: "الرصيد",
    buyCredits: "شراء رصيد",
    signIn: "تسجيل الدخول",
    signOut: "تسجيل الخروج",
    toggleToAr: "العربية",
    toggleToEn: "English",
    giftIdeas: "أفكار هدايا",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type HeaderStringKey = keyof (typeof strings)["en"];

export function useHeaderStrings(locale: Locale) {
  const t = (key: HeaderStringKey): string => strings[locale][key];
  return { t };
}
