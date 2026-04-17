import clsx from "clsx";

export function Input({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"input">) {
  return (
    <input
      {...props}
      className={clsx(
        // Base design
        "w-full rounded-lg border px-4 py-3 text-base",
        
        // Colors
        "bg-white text-gray-900 border-cream-200",

        // Focus state
        "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400",
        
        // Allow overrides
        className
      )}
    />
  );
}
