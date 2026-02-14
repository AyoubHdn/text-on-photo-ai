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
    trust: "Printed in the USA • High-quality materials",
  },
  arabic: {
    hero: "Turn your name into elegant Arabic calligraphy - perfect for your home, desk, or as a meaningful gift.",
    trust: "✨ Customers are turning their names into real products every day.",
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
          ? "mt-3 text-sm text-blue-700 dark:text-blue-300"
          : "mt-3 text-center text-xs text-gray-600 dark:text-gray-300"
      }
    >
      {COPY[generatorType][section]}
    </p>
  );
}

