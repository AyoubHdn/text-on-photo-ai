export {}; // Ensure the file is treated as a module

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
  }
}
