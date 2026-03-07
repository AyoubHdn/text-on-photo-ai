export type ShippingCountryOption = {
  code: string;
  name: string;
};

export const SHIPPING_COUNTRY_OPTIONS: ShippingCountryOption[] = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
];
