type GeneratorType = "default" | "arabic" | "couples";

type GeneratorNudgeProps = {
  generatorType: GeneratorType;
  section?: "hero" | "trust";
};

const COPY: Record<
  GeneratorType,
  { hero: string; trust: string }
> = {
  default: {
    hero: "Create a unique name design and bring it to life on real products.",
    trust: "High-quality materials • Worldwide-ready fulfillment",
  },
  arabic: {
    hero: "حوّل اسمك إلى خط عربي أنيق — مثالي لصورتك الشخصية أو أعمالك الرقمية أو كلوحة فنية رقمية.",
    trust: "✨ آلاف الأسماء تتحوّل إلى فن رقمي كل يوم",
  },
  couples: {
    hero: "Celebrate your relationship with a personalized couples design - perfect for anniversaries and gifts.",
    trust: "Thousands of personalized designs created.",
  },
};

export function GeneratorNudge({
  generatorType,
  section = "hero",
}: GeneratorNudgeProps) {
  return (
    <p
      className={
        section === "hero"
          ? "mt-3 text-sm text-brand-800"
          : "mt-3 text-center text-xs text-gray-600 dark:text-gray-300"
      }
    >
      {COPY[generatorType][section]}
    </p>
  );
}
