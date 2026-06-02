// src/lib/ga.ts
export function trackGA(event: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;
  if (!("gtag" in window)) return;

  window.gtag("event", event, params ?? {});
}

export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;

  const payload = {
    event: eventName,
    ...(params ?? {}),
  };

  if (eventName === "credit_upgrade_viewed") {
    console.log("[trackEvent] eventName:", eventName);
    console.log("[trackEvent] params snapshot:", { ...(params ?? {}) });
    console.log("[trackEvent] dataLayer payload snapshot:", { ...payload });
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);

  if (typeof window.gtag === "function") {
    if (eventName === "credit_upgrade_viewed") {
      console.log("[trackEvent -> gtag] eventName:", eventName);
      console.log("[trackEvent -> gtag] params snapshot:", { ...(params ?? {}) });
    }
    window.gtag("event", eventName, params ?? {});
  }
}
