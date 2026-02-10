// src/lib/ga.ts
export function trackGA(event: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;
  if (!("gtag" in window)) {
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = (...args: any[]) => {
      window.dataLayer.push(args);
    };
  }

  window.gtag("event", event, params ?? {});
}

export function trackEvent(event: string, params?: Record<string, any>) {
  trackGA(event, params);
}
