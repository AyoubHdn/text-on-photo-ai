// src/lib/ga.ts
export function trackGA(event: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;
  if (!("gtag" in window)) return;

  window.gtag("event", event, params ?? {});
}

export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...(params ?? {}),
  });

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params ?? {});
  }
}
