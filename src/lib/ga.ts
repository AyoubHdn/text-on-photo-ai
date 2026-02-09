// src/lib/ga.ts
export function trackGA(event: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;
  if (!("gtag" in window)) return;

  window.gtag("event", event, params ?? {});
}

export function trackEvent(event: string, params?: Record<string, any>) {
  trackGA(event, params);
}
