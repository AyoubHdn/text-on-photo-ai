import Link from "next/link";
import { FiGlobe } from "react-icons/fi";

type LanguageSwitchLinkProps = {
  href: string;
  label: string;
  className?: string;
};

export function LanguageSwitchLink({
  href,
  label,
  className = "",
}: LanguageSwitchLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full border border-cream-200 bg-white/95 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-brand-400 hover:text-brand-700 ${className}`}
    >
      <FiGlobe className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </Link>
  );
}
