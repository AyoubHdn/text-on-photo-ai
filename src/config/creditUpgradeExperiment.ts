export type CreditUpgradeVariant = "A" | "B";

export type CreditUpgradeLayoutMode = "plans_first" | "cpx_first_for_cold_users";

export const CREDIT_UPGRADE_EXPERIMENT = {
  cookieName: "cu_variant",
  cookieMaxAgeDays: 365,
  variants: {
    A: {
      label: "champion",
      layout: "plans_first" as CreditUpgradeLayoutMode,
    },
    B: {
      label: "challenger",
      layout: "cpx_first_for_cold_users" as CreditUpgradeLayoutMode,
    },
  },
} as const;

export function getCreditUpgradeVariantConfig(variant: CreditUpgradeVariant) {
  return CREDIT_UPGRADE_EXPERIMENT.variants[variant];
}
