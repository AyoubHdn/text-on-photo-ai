export function Spinner() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="inline-flex items-center gap-1"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white/90 animate-pulse [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-white/90 animate-pulse [animation-delay:120ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-white/90 animate-pulse [animation-delay:240ms]" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
