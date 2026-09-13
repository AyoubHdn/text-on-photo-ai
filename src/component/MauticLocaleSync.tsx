import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

import { useLocale } from "~/hook/useLocale";
import { normalizeMauticLocale } from "~/lib/localePreference";
import { api } from "~/utils/api";

/** Syncs an explicit site-language choice to an already identified contact. */
export function MauticLocaleSync() {
  const { status } = useSession();
  const { locale, isExplicit } = useLocale();
  const { mutate: syncPreferredLocale } =
    api.user.syncPreferredLocale.useMutation();
  const lastSyncKey = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !isExplicit) return;

    const normalizedLocale = normalizeMauticLocale(locale);
    const syncKey = `${normalizedLocale}`;
    if (lastSyncKey.current === syncKey) return;
    lastSyncKey.current = syncKey;

    syncPreferredLocale(
      { locale: normalizedLocale },
      {
        onError: () => {
          lastSyncKey.current = null;
        },
      }
    );
  }, [isExplicit, locale, status, syncPreferredLocale]);

  return null;
}
