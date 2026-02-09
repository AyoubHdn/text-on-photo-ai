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

        // Light mode
        "bg-white text-gray-900 border-gray-300",

        // Dark mode
        "dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700",

        // Focus state
        "focus:outline-none focus:ring-2 focus:ring-blue-500",

        className
      )}
    >
      {children}
    </select>
  );
}
