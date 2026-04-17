import clsx from "clsx";

export function Select({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"select">) {
  return (
    <select
      {...props}
      className={clsx(
        // Base design
        "w-full rounded-lg border px-4 py-3 text-base",

        // Remove native styles (IMPORTANT)
        "appearance-none",

        // Colors
        "bg-white text-gray-900 border-cream-200",

        // Focus state
        "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400",

        className
      )}
    >
      {children}
    </select>
  );
}
