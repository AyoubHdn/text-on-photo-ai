/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { useEffect, useRef, useState } from "react";
import { Input } from "~/component/Input";
import { SeoHead } from "~/component/SeoHead";
import { Select } from "~/component/Select";
import { TRPCClientError } from "@trpc/client";
import { trackEvent } from "~/lib/ga";
import { getFunnelContext, markEventTrackedOnce } from "~/lib/tracking/funnel";
import { SHIPPING_COUNTRY_OPTIONS } from "~/config/shippingCountries";
import { PRODUCT_PRESENTATION, isMugProductKey } from "~/config/physicalProducts";

const KNOWN_SOURCE_PAGES = new Set([
  "arabic-calligraphy-generator",
  "arabic-name-mug-v1",
  "couple-name-mug-v1",
  "couple-avatar-name-mug-v1",
  "couple-names-only-mug-v1",
  "couples-art-generator",
  "name-art-generator",
  "ramadan-mug-v2",
  "ramadan-mug-men",
  "ramadan-mug",
  "checkout",
]);

const COUNTRIES_REQUIRING_STATE = new Set(["US", "CA", "AU"]);

export function formatPrice(value: number) {
  return value.toFixed(2);
}

function getDeliveryEstimate(productKey: string, countryCode: string): string {
  if (!isMugProductKey(productKey)) {
    return "Estimated delivery shown at payment step";
  }

  switch (countryCode) {
    case "GB":
      return "Estimated delivery: 4-5 business days";
    case "CA":
      return "Estimated delivery: 4-7 business days";
    case "US":
      return "Estimated delivery: 5-7 business days";
    case "AU":
      return "Estimated delivery: 5-9 business days";
    case "NZ":
      return "Estimated delivery: 8-11 business days";
    default:
      return "Estimated delivery shown at payment step";
  }
}

function getCheckoutCopy(productKey: string) {
  switch (productKey) {
    case "poster":
      return {
        personalizedLabel: "Your personalized poster",
        subtitle: "Personalized custom poster",
        fallbackDesignLabel: "Custom design selected for your poster",
        benefitsTitle: "Why customers choose this poster",
        benefits: [
          "Premium poster print",
          "Custom artwork selected for your order",
          "Printed with premium inks",
          "Free shipping included",
        ],
      };
    case "framedPoster":
      return {
        personalizedLabel: "Your personalized framed poster",
        subtitle: "Enhanced Matte Paper Framed Poster (in)",
        fallbackDesignLabel: "Custom design selected for your framed poster",
        benefitsTitle: "Why customers choose this framed poster",
        benefits: [
          "Enhanced matte paper in a lightweight wooden frame",
          "Acrylite front protector included",
          "Hanging hardware included",
          "Free shipping included",
        ],
      };
    case "canvas":
      return {
        personalizedLabel: "Your personalized canvas",
        subtitle: "Canvas (in)",
        fallbackDesignLabel: "Custom design selected for your canvas",
        benefitsTitle: "Why customers choose this canvas",
        benefits: [
          "Fade-resistant poly-cotton blend canvas",
          "Hand-stretched over solid wood stretcher bars",
          "Mounting brackets included",
          "Free shipping included",
        ],
      };
    case "postcard":
      return {
        personalizedLabel: "Your personalized postcard",
        subtitle: "Standard Postcard",
        fallbackDesignLabel: "Custom design selected for your postcard",
        benefitsTitle: "Why customers choose this postcard",
        benefits: [
          "Thick matte cardboard paper",
          "Standard 4 x 6 in postcard format",
          "Coated outer surface for a clean finish",
          "Free shipping included",
        ],
      };
    case "candle":
      return {
        personalizedLabel: "Your personalized candle",
        subtitle: "Scented Soy Candle, 9oz",
        fallbackDesignLabel: "Custom design selected for your candle",
        benefitsTitle: "Why customers choose this candle",
        benefits: [
          "100% natural soy wax with a cotton wick",
          "Smooth glass jar with a custom front label",
          "Burn time of 50-60 hours",
          "Free shipping included",
        ],
      };
    case "pillow":
      return {
        personalizedLabel: "Your personalized pillow",
        subtitle: "All-Over Print Basic Pillow",
        fallbackDesignLabel: "Custom design selected for your pillow",
        benefitsTitle: "Why customers choose this pillow",
        benefits: [
          "100% polyester case and insert included",
          "Hidden zipper closure",
          "Same design printed on both sides",
          "Free shipping included",
        ],
      };
    case "journal":
      return {
        personalizedLabel: "Your personalized journal",
        subtitle: "Hardcover Journal Matte",
        fallbackDesignLabel: "Custom design selected for your journal",
        benefitsTitle: "Why customers choose this journal",
        benefits: [
          "Matte laminated hardcover",
          "150 lined cream-colored pages",
          "Perforated pages for easy tear-out",
          "Free shipping included",
        ],
      };
    case "tshirt":
      return {
        personalizedLabel: "Your personalized t-shirt",
        subtitle: "Personalized custom t-shirt",
        fallbackDesignLabel: "Custom design selected for your t-shirt",
        benefitsTitle: "Why customers choose this t-shirt",
        benefits: [
          "Unisex t-shirt ready for everyday wear",
          "Custom design selected for your order",
          "Printed with premium inks",
          "Free shipping included",
        ],
      };
    case "mug":
      return {
        personalizedLabel: "Your personalized mug",
        subtitle: "Personalized Arabic Calligraphy Mug",
        fallbackDesignLabel: "Custom Arabic name design",
        benefitsTitle: "Why customers choose this mug",
        benefits: [
          "High-quality glossy ceramic",
          "Dishwasher & microwave safe",
          "Printed with premium inks",
          "Free shipping included",
        ],
      };
    case "mugBlackGlossy":
      return {
        personalizedLabel: "Your personalized mug",
        subtitle: "Black Glossy Mug",
        fallbackDesignLabel: "Custom Arabic name design",
        benefitsTitle: "Why customers choose this mug",
        benefits: [
          "Glossy black ceramic finish",
          "Lead and BPA-free material",
          "Dishwasher & microwave safe",
          "Free shipping included",
        ],
      };
    case "mugColorInside":
      return {
        personalizedLabel: "Your personalized mug",
        subtitle: "White Ceramic Mug with Color Inside",
        fallbackDesignLabel: "Custom Arabic name design",
        benefitsTitle: "Why customers choose this mug",
        benefits: [
          "Colored rim, inside, and handle",
          "Lead and BPA-free ceramic",
          "Dishwasher & microwave safe",
          "Free shipping included",
        ],
      };
    case "coaster":
      return {
        personalizedLabel: "Your personalized coaster",
        subtitle: "Cork-Back Coaster",
        fallbackDesignLabel: "Custom design selected for your coaster",
        benefitsTitle: "Why customers choose this coaster",
        benefits: [
          "Glossy hardboard top with cork backing",
          "Rounded corners and non-slip base",
          "Water-repellent and heat-resistant",
          "Free shipping included",
        ],
      };
    default:
      return {
        personalizedLabel: "Your personalized mug",
        subtitle: "Personalized Arabic Calligraphy Mug",
        fallbackDesignLabel: "Custom Arabic name design",
        benefitsTitle: "Why customers choose this mug",
        benefits: [
          "High-quality glossy ceramic",
          "Dishwasher & microwave safe",
          "Printed with premium inks",
          "Free shipping included",
        ],
      };
  }
}

function normalizeSourcePage(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim();
  return KNOWN_SOURCE_PAGES.has(normalized) ? normalized : null;
}

function getCheckoutSourcePage(options?: {
  query?: Record<string, unknown>;
  fallbackSourcePage?: string | null;
}) {
  const querySourcePage = normalizeSourcePage(
    typeof options?.query?.sourcePage === "string"
      ? options.query.sourcePage
      : typeof options?.query?.generator === "string"
      ? options.query.generator
      : null,
  );
  if (querySourcePage) return querySourcePage;

  if (typeof window === "undefined") {
    return normalizeSourcePage(options?.fallbackSourcePage) ?? "checkout";
  }
  const generatorKey = window.localStorage.getItem("last-generator");
  const sourcePage =
    generatorKey === "arabic"
    ? "arabic-calligraphy-generator"
    : generatorKey === "arabic-name-mug-v1"
    ? "arabic-name-mug-v1"
    : generatorKey === "couple-name-mug-v1"
    ? "couple-name-mug-v1"
    : generatorKey === "couple-avatar-name-mug-v1"
    ? "couple-avatar-name-mug-v1"
    : generatorKey === "couple-names-only-mug-v1"
    ? "couple-names-only-mug-v1"
    : generatorKey === "couples"
    ? "couples-art-generator"
    : generatorKey === "default"
    ? "name-art-generator"
    : generatorKey === "ramadan-mug-v2"
    ? "ramadan-mug-v2"
    : generatorKey === "ramadan-mug-men"
    ? "ramadan-mug-men"
    : generatorKey === "ramadan-mug"
    ? "ramadan-mug"
    : normalizeSourcePage(options?.fallbackSourcePage) ?? "checkout";

  return normalizeSourcePage(sourcePage) ?? "checkout";
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const part of cookies) {
    const [k, ...rest] = part.split("=");
    if (k === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

function getMetaTrackingParams() {
  const fbp = readCookie("_fbp");
  let fbc = readCookie("_fbc");
  const fbclid =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("fbclid")
      : null;
  if (!fbc && fbclid) {
    fbc = `fb.1.${Date.now()}.${fbclid}`;
  }
  return {
    fbp: fbp ?? undefined,
    fbc: fbc ?? undefined,
  };
}

function isSecurePaymentConfigError(message: string): boolean {
  return (
    message.includes("Expired API Key provided") ||
    message.includes("Invalid API Key provided") ||
    message.includes("Stripe checkout is not configured correctly.") ||
    message.includes("Secure payment is temporarily unavailable.")
  );
}

function getPaidMugStorageKey(sourcePage?: string | null): string | null {
  if (sourcePage === "arabic-name-mug-v1") return "arabic-name-mug-v1:funnel:v1";
  if (sourcePage === "couple-name-mug-v1") return "couple-name-mug-v1:funnel:v1";
  if (sourcePage === "couple-avatar-name-mug-v1") {
    return "couple-avatar-name-mug-v1:funnel:v1";
  }
  if (sourcePage === "couple-names-only-mug-v1") {
    return "couple-names-only-mug-v1:funnel:v1";
  }
  if (sourcePage === "ramadan-mug-v2") return "ramadan-mug-v2:funnel:v4";
  return null;
}

function getStoredPaidMugName(sourcePage?: string | null): string | null {
  if (typeof window === "undefined") return null;

  try {
    const storageKey = getPaidMugStorageKey(sourcePage);
    if (!storageKey) return null;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      name?: unknown;
      herName?: unknown;
      hisName?: unknown;
    };
    if (
      typeof parsed.herName === "string" &&
      parsed.herName.trim().length > 0 &&
      typeof parsed.hisName === "string" &&
      parsed.hisName.trim().length > 0
    ) {
      return `${parsed.herName.trim()} & ${parsed.hisName.trim()}`;
    }
    if (typeof parsed.name === "string" && parsed.name.trim().length > 0) {
      return parsed.name.trim();
    }
  } catch {
    // ignore invalid cached funnel state
  }

  return null;
}

function getStoredPaidMugCheckoutEmail(sourcePage?: string | null): string | null {
  if (typeof window === "undefined") return null;

  try {
    const storageKey = getPaidMugStorageKey(sourcePage);
    if (!storageKey) return null;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { email?: unknown };
    if (typeof parsed.email === "string") {
      const normalizedEmail = parsed.email.trim().toLowerCase();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return normalizedEmail;
      }
    }
  } catch {
    // ignore invalid cached funnel state
  }

  return null;
}

function detectCountryFromBrowser(availableCodes: string[]): string | null {
  if (typeof navigator === "undefined") return null;

  const extractRegion = (value: string | undefined | null) => {
    if (!value) return null;
    const normalized = value.replace("_", "-");
    const parts = normalized.split("-");
    const region = parts.length > 1 ? parts[parts.length - 1] : null;
    if (!region || !/^[A-Za-z]{2}$/.test(region)) return null;
    return region.toUpperCase();
  };

  const localeCandidates = [
    navigator.language,
    ...(navigator.languages ?? []),
    Intl.DateTimeFormat().resolvedOptions().locale,
  ];

  for (const locale of localeCandidates) {
    const region = extractRegion(locale);
    if (region && availableCodes.includes(region)) {
      return region;
    }
  }

  return null;
}

function isCountryAvailabilityError(message?: string | null) {
  if (!message) return false;
  return (
    message.includes("Pricing not available for this variant.") ||
    message.includes("This product variant is not available in this country.") ||
    message.includes("Physical shipping is not available in this country yet.")
  );
}

function fireMetaInitiateCheckout(params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const maybeFbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (typeof maybeFbq === "function") {
    maybeFbq("track", "InitiateCheckout", params ?? {});
  }
}

function fireMetaAddPaymentInfo(params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const maybeFbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (typeof maybeFbq === "function") {
    maybeFbq("track", "AddPaymentInfo", params ?? {});
  }
}

type ShippingCountry = {
  code: string;
  name: string;
};

export default function CheckoutPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const isLoggedIn = Boolean(session?.user?.id);
    const { orderId, accessToken } = router.query;
    const accessTokenValue =
      typeof accessToken === "string" ? accessToken : undefined;

    const [address, setAddress] = useState({
        email: "",
        name: "",
        address1: "",
        city: "",
        country: "US",
        state: "",
        zip: "",
    });
    const [showShippingValidation, setShowShippingValidation] = useState(false);
    const [shippingNotice, setShippingNotice] = useState<string | null>(null);
    const [productNotice, setProductNotice] = useState<string | null>(null);
    const [backendFieldErrors, setBackendFieldErrors] = useState<Record<string, string>>({});
    const [countries, setCountries] = useState<ShippingCountry[]>([]);
    const [checkoutMockupUrl, setCheckoutMockupUrl] = useState<string | null>(null);
    const [previewStatus, setPreviewStatus] = useState<"idle" | "generating" | "error" | "ready">("idle");
    const [previewError, setPreviewError] = useState<"RATE_LIMIT" | null>(null);
    const [previewCooldown, setPreviewCooldown] = useState<number | null>(null);
    const [variantIdUsedForPreview, setVariantIdUsedForPreview] = useState<number | null>(null);
    const [personalizedName, setPersonalizedName] = useState<string | null>(null);
    const hasAttemptedFinalizeRef = useRef(false);
    const autoFinalizeStartedRef = useRef(false);
    const hasTrackedBeginCheckoutRef = useRef(false);
    const lastCapturedCheckoutEmailRef = useRef<string | null>(null);
    const checkoutEmailCaptureInFlightRef = useRef<string | null>(null);
    const checkoutEmailCapturePromiseRef = useRef<Promise<void> | null>(null);

    type OrderType = {
        id: string;
        userId: string;
        productKey: string;
        variantId: number;
        quantity: number;
        aspect: string | null;
        previewMode: string | null;
        imageUrl: string;
        mockupUrl: string;
        basePrice: number;
        margin: number;
        totalPrice: number;
        color?: string;
        colorHex?: string;
        size?: string;
        variantName?: string;
        isBackgroundRemoved?: boolean;
        previewVariantId?: number | null;
        funnelSource?: string | null;
        snapshotVariantId?: number | null;
        snapshotSize?: string | null;
        snapshotColor?: string | null;
        snapshotPrintPosition?: string | null;
        snapshotBackgroundRemoved?: boolean | null;
        createdAt: Date;
        updatedAt: Date;
    };

    const orderQuery = api.productOrder.getOrder.useQuery(
        { orderId: String(orderId), accessToken: accessTokenValue },
        { enabled: !!orderId }
        );
    const order = orderQuery.data as OrderType | undefined;
    const isLoading = orderQuery.isLoading;
    const orderError = orderQuery.error;
    const checkoutPricingQuery = api.productOrder.getCheckoutPricing.useQuery(
        {
          orderId: String(orderId),
          accessToken: accessTokenValue,
          countryCode: address.country,
        },
        {
          enabled: !!orderId && !!address.country,
          retry: false,
        },
    );

    const captureCheckoutEmail = api.productOrder.captureCheckoutEmail.useMutation();
    const updateOrderQuantity = api.productOrder.updateQuantity.useMutation();
    const createStripeSession = api.printfulCheckout.createCheckout.useMutation();
    const ensureFinalPreview = api.checkout.ensureFinalPreview.useMutation();
    const fallbackSourcePage =
      order?.funnelSource === "ramadan-mug-ad"
        ? "ramadan-mug"
        : order?.funnelSource === "paid-traffic-offer" && order?.productKey === "mug"
        ? "ramadan-mug-v2"
        : null;
    const checkoutSourcePage = getCheckoutSourcePage({
      query: router.query as Record<string, unknown>,
      fallbackSourcePage,
    });
    const isSubmittingCheckout = createStripeSession.isLoading;
    const isUpdatingQuantity = updateOrderQuantity.isLoading;


    const previewCooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startPreviewCooldown = (seconds: number | null) => {
    if (previewCooldownTimerRef.current) {
        clearInterval(previewCooldownTimerRef.current);
        previewCooldownTimerRef.current = null;
    }
    if (!seconds || seconds <= 0) {
        setPreviewCooldown(null);
        return;
    }
    setPreviewCooldown(seconds);
    previewCooldownTimerRef.current = setInterval(() => {
        setPreviewCooldown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
            if (previewCooldownTimerRef.current) {
            clearInterval(previewCooldownTimerRef.current);
            previewCooldownTimerRef.current = null;
            }
            return null;
        }
        return prev - 1;
        });
    }, 1000);
    };

    const loadCountries = async () => {
      if (countries.length > 0) return;
      setCountries(SHIPPING_COUNTRY_OPTIONS);
    };

    useEffect(() => {
      if (!isLoggedIn) return;
      const sessionEmail = session?.user?.email?.trim() ?? "";
      if (!sessionEmail) return;
      setAddress((prev) => ({ ...prev, email: sessionEmail }));
    }, [isLoggedIn, session?.user?.email]);

    useEffect(() => {
      if (isLoggedIn || !order) return;
      const normalizedEmail = address.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return;
      if (lastCapturedCheckoutEmailRef.current === normalizedEmail) return;

      const timer = window.setTimeout(() => {
        void captureCheckoutEmailIfNeeded(normalizedEmail);
      }, 700);

      return () => window.clearTimeout(timer);
    }, [address.email, isLoggedIn, order]);



    const selectedCountry = countries.find((country) => country.code === address.country);
    const requiresState = COUNTRIES_REQUIRING_STATE.has(address.country);

    const validateShipping = (nextAddress = address, nextRequiresState = requiresState) => {
        const errors: Record<string, string> = {};
        const name = (nextAddress.name ?? "").trim();
        const email = (nextAddress.email ?? "").trim();
        const address1 = (nextAddress.address1 ?? "").trim();
        const city = (nextAddress.city ?? "").trim();
        const country = (nextAddress.country ?? "").trim();
        const zip = (nextAddress.zip ?? "").trim();
        const state = (nextAddress.state ?? "").trim();

        if (!email) {
        errors.email = "Email is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Enter a valid email address.";
        }
        if (!name) errors.name = "Full name is required.";
        if (!address1) errors.address1 = "Address line 1 is required.";
        if (!city) errors.city = "City is required.";
        if (!country) errors.country = "Country is required.";
        if (!zip) {
        errors.zip = "ZIP / Postal code is required.";
        } else if (country === "US") {
        if (!/^\d{5}(-\d{4})?$/.test(zip)) {
            errors.zip = "ZIP code must be 5 digits or ZIP+4.";
        }
        }

        if (nextRequiresState && !state) {
        errors.state =
            country === "US"
            ? "State is required for US shipping."
            : country === "CA"
            ? "Province is required for Canada shipping."
            : "State/region is required.";
        }

        return errors;
    };

    const localShippingErrors = validateShipping();

    // ✅ Normalize numbers ONCE
    const totalPrice = Number(
      checkoutPricingQuery.data?.totalPrice ?? order?.totalPrice ?? 0,
    );
    const orderQuantity = Math.max(
      1,
      Number(checkoutPricingQuery.data?.quantity ?? order?.quantity ?? 1),
    );
    const fullPriceTotal = Number(
      checkoutPricingQuery.data?.fullPriceTotal ?? totalPrice,
    );
    const discountAmount = Number(
      checkoutPricingQuery.data?.discountAmount ?? 0,
    );
    const discountedQuantity = Math.max(
      0,
      Number(checkoutPricingQuery.data?.discountedQuantity ?? Math.max(orderQuantity - 1, 0)),
    );
    const hasExtraMugDiscount =
      isMugProductKey(order?.productKey) && discountAmount > 0;
    const checkoutCopy = getCheckoutCopy(order?.productKey ?? "mug");
    const quantityItemLabel =
      order?.productKey === "tshirt"
        ? "t-shirt"
        : order?.productKey === "postcard"
        ? "postcard"
        : order?.productKey === "candle"
        ? "candle"
        : order?.productKey === "coaster"
        ? "coaster"
        : order?.productKey === "pillow"
        ? "pillow"
        : order?.productKey === "canvas"
        ? "canvas print"
        : order?.productKey === "journal"
        ? "journal"
        : order?.productKey === "framedPoster"
        ? "framed poster"
        : order?.productKey === "poster"
        ? "poster"
        : "mug";
    const deliveryEstimate = getDeliveryEstimate(
      order?.productKey ?? "mug",
      address.country,
    );
    const quantityOfferCopy =
      isMugProductKey(order?.productKey)
        ? hasExtraMugDiscount
          ? `20% off applied to ${discountedQuantity} extra mug${discountedQuantity > 1 ? "s" : ""}. You save $${formatPrice(discountAmount)}.`
          : "Add more mugs and get 20% off every mug after the first."
        : null;
    const displayedNameLabel = personalizedName
      ? `Name on mug: ${personalizedName}`
      : checkoutCopy.fallbackDesignLabel;

    const PRODUCT_LABELS = {
    poster: PRODUCT_PRESENTATION.poster.title,
    postcard: PRODUCT_PRESENTATION.postcard.title,
    candle: PRODUCT_PRESENTATION.candle.title,
    framedPoster: PRODUCT_PRESENTATION.framedPoster.title,
    canvas: PRODUCT_PRESENTATION.canvas.title,
    pillow: PRODUCT_PRESENTATION.pillow.title,
    journal: PRODUCT_PRESENTATION.journal.title,
    tshirt: PRODUCT_PRESENTATION.tshirt.title,
    mug: PRODUCT_PRESENTATION.mug.title,
    mugBlackGlossy: PRODUCT_PRESENTATION.mugBlackGlossy.title,
    mugColorInside: PRODUCT_PRESENTATION.mugColorInside.title,
    coaster: PRODUCT_PRESENTATION.coaster.title,
    };

    const isFieldInvalid = (field: string) =>
        (showShippingValidation && Boolean(localShippingErrors[field])) ||
        Boolean(backendFieldErrors[field]);
    const lightFieldClassName =
        "!border-cream-200 !bg-white !text-gray-900 placeholder:!text-gray-500";
    const fieldErrorMessage = (field: string) => {
        if (showShippingValidation && localShippingErrors[field]) return localShippingErrors[field];
        if (backendFieldErrors[field]) return backendFieldErrors[field];
        return null;
    };

    const updateCheckoutQuantity = async (nextQuantity: number) => {
        if (!order) return;
        if (nextQuantity === orderQuantity || isUpdatingQuantity) return;

        setProductNotice(null);
        setShippingNotice(null);

        try {
          await updateOrderQuantity.mutateAsync({
            orderId: order.id,
            accessToken: accessTokenValue,
            quantity: nextQuantity,
            countryCode: address.country,
          });

          await Promise.all([orderQuery.refetch(), checkoutPricingQuery.refetch()]);

          setBackendFieldErrors((prev) => {
            if (!prev.country) return prev;
            const next = { ...prev };
            delete next.country;
            return next;
          });
        } catch (error) {
          const message =
            error instanceof TRPCClientError
              ? error.message
              : error instanceof Error
              ? error.message
              : "Unable to update quantity.";

          if (isCountryAvailabilityError(message)) {
            setBackendFieldErrors((prev) => ({
              ...prev,
              country: "Shipping is not available in this country yet.",
            }));
            setShippingNotice(null);
            return;
          }

          setProductNotice(message);
        }
    };

    const getProductConfigErrors = () => {
        if (!order) return [];
        const issues: string[] = [];
        if (!order.variantId) issues.push("variantId");

        if (order.productKey === "tshirt") {
        if (!order.size) issues.push("size");
        if (!order.color) issues.push("color");
        }

        if (isMugProductKey(order.productKey)) {
        if (!order.size) issues.push("size");
        if ((order.productKey === "mugColorInside" || order.productKey === "mugBlackGlossy") && !order.color) {
          issues.push("color");
        }
        if (!order.previewMode) issues.push("printPosition");
        }

        if (order.productKey === "candle") {
        if (!order.size) issues.push("size");
        if (!order.color) issues.push("color");
        }

        if (order.productKey === "coaster" && !order.size) {
        issues.push("size");
        }

        if (order.productKey === "pillow" && !order.size) {
        issues.push("size");
        }

        if (order.productKey === "journal" && !order.size) {
        issues.push("size");
        }

        if (
          order.productKey === "poster" ||
          order.productKey === "postcard" ||
          order.productKey === "framedPoster" ||
          order.productKey === "canvas"
        ) {
        if (!order.variantName) issues.push("variantName");
        if (!order.size) issues.push("size");
        if (order.productKey === "framedPoster" && !order.color) issues.push("color");
        }

        return issues;
    };

    const isApparel = order?.productKey === "tshirt";
    const currentMockupUrl = checkoutMockupUrl ?? order?.mockupUrl ?? null;
    const effectivePreviewVariantId = variantIdUsedForPreview ?? order?.previewVariantId ?? null;
    const previewMismatch = Boolean(
        order &&
        isApparel &&
        (!currentMockupUrl ||
            (effectivePreviewVariantId !== null &&
                effectivePreviewVariantId !== order.variantId))
    );
    const shouldAutoFinalize = Boolean(
        order &&
        isApparel &&
        !effectivePreviewVariantId
    );
    const isPreviewReady = !isApparel || (previewStatus === "ready" && !previewMismatch);

    useEffect(() => {
      void loadCountries();
    }, []);

    useEffect(() => {
      if (countries.length === 0) return;
      if (countries.some((country) => country.code === address.country)) return;
      setAddress((prev) => ({ ...prev, country: countries[0]?.code ?? "US" }));
    }, [countries, address.country]);

    useEffect(() => {
      if (countries.length === 0) return;
      if (address.country !== "US") return;

      const availableCodes = countries.map((country) => country.code);
      const detectedCountry = detectCountryFromBrowser(availableCodes);
      if (!detectedCountry || detectedCountry === "US") return;

      setAddress((prev) => ({ ...prev, country: detectedCountry }));
    }, [countries, address.country]);

    useEffect(() => {
      if (!order || order.productKey !== "mug") return;
      setPersonalizedName(getStoredPaidMugName(checkoutSourcePage));
    }, [checkoutSourcePage, order]);

    useEffect(() => {
      if (isLoggedIn || address.email.trim()) return;
      if (!order || order.productKey !== "mug") return;

      const storedEmail = getStoredPaidMugCheckoutEmail(checkoutSourcePage);
      if (!storedEmail) return;

      setAddress((prev) => ({ ...prev, email: storedEmail }));
    }, [address.email, checkoutSourcePage, isLoggedIn, order]);

    useEffect(() => {
      if (!order) return;

      const funnelContext = getFunnelContext({
        route: router.pathname,
        sourcePage: checkoutSourcePage,
        orderFunnelSource: order.funnelSource ?? null,
        productKey: order.productKey,
        productType: "physical_product",
        country: address.country,
        query: router.query as Record<string, unknown>,
      });
      const initiateCheckoutKey = `tracking_meta_initiate_checkout_${order.id}`;

      if (!markEventTrackedOnce(initiateCheckoutKey)) return;

      fireMetaInitiateCheckout({
        content_type: "product",
        content_ids: [order.productKey],
        content_category: "physical_product",
        value: Number(checkoutPricingQuery.data?.totalPrice ?? order.totalPrice ?? 0),
        currency: "USD",
        order_id: order.id,
        ...funnelContext,
      });
    }, [
      address.country,
      checkoutSourcePage,
      checkoutPricingQuery.data?.totalPrice,
      order,
      router.pathname,
      router.query,
    ]);

    function finalizePreviewById(orderIdValue: string) {
        if (previewStatus === "generating") return Promise.resolve({ status: "generating" as const });

        setPreviewStatus("generating");
        setPreviewError(null);

        return ensureFinalPreview.mutateAsync({ orderId: orderIdValue }).then((res) => {
        if (res.status === "ready") {
            if (res.mockupUrl) {
            setCheckoutMockupUrl(res.mockupUrl);
            }
            setVariantIdUsedForPreview(res.previewVariantId ?? null);
            setPreviewStatus("ready");
            setPreviewError(null);
            return { status: "ready" as const };
        }

        if (res.status === "rate_limit") {
            setPreviewStatus("error");
            setPreviewError("RATE_LIMIT");
            startPreviewCooldown(typeof res.retryAfter === "number" ? res.retryAfter : null);
            return { status: "rate_limit" as const };
        }

        if (res.status === "invalid") {
            setPreviewStatus("error");
            return { status: "invalid" as const };
        }

        setPreviewStatus("error");
        return { status: "error" as const };
        });
    }

    const captureCheckoutEmailIfNeeded = async (rawEmail: string) => {
        if (isLoggedIn || !order) return;

        const normalizedEmail = rawEmail.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return;
        if (lastCapturedCheckoutEmailRef.current === normalizedEmail) return;
        if (
          checkoutEmailCaptureInFlightRef.current === normalizedEmail &&
          checkoutEmailCapturePromiseRef.current
        ) {
          await checkoutEmailCapturePromiseRef.current;
          return;
        }

        let capturePromise: Promise<void>;
        capturePromise = (async () => {
          try {
            await captureCheckoutEmail.mutateAsync({
                orderId: order.id,
                accessToken: accessTokenValue,
                email: normalizedEmail,
                sourcePage: checkoutSourcePage,
                promotedProduct: order.productKey,
            });
            lastCapturedCheckoutEmailRef.current = normalizedEmail;
          } catch (err) {
            console.error("Failed to capture checkout email:", err);
          }
        })().finally(() => {
          if (checkoutEmailCapturePromiseRef.current === capturePromise) {
            checkoutEmailCapturePromiseRef.current = null;
            checkoutEmailCaptureInFlightRef.current = null;
          }
        });

        checkoutEmailCaptureInFlightRef.current = normalizedEmail;
        checkoutEmailCapturePromiseRef.current = capturePromise;
        await capturePromise;
    };



    if (isLoading) return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-white text-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        <p className="text-sm text-slate-500">Loading your order…</p>
      </div>
    );
    const orderErrorCode =
      orderError instanceof TRPCClientError ? orderError.data?.code : undefined;
    if (orderErrorCode === "UNAUTHORIZED") {
      return (
        <>
          <SeoHead
            title="Checkout | Name Design AI"
            description="Product checkout page."
            path="/checkout"
            noindex
          />
          <div className="mx-auto max-w-xl px-4 py-16 text-center text-slate-900">
            <h1 className="text-2xl font-semibold">This checkout link is no longer valid</h1>
            <p className="mt-3 text-sm text-gray-600">
              Return to your design and reopen checkout to continue your order.
            </p>
          </div>
        </>
      );
    }
    if (!order) {
      return (
        <>
          <SeoHead
            title="Checkout | Name Design AI"
            description="Product checkout page."
            path="/checkout"
            noindex
          />
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-white px-4 text-center text-slate-900">
            <p className="text-lg font-semibold">We couldn&apos;t find your order.</p>
            <p className="text-sm text-slate-500">Return to your design and open checkout again.</p>
            <a href="/name-art-generator" className="mt-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700">
              Back to generator
            </a>
          </div>
        </>
      );
    }

    return (
    <>
    <SeoHead
      title="Checkout | Name Design AI"
      description="Product checkout page."
      path="/checkout"
      noindex
    />
    <div
      className="bg-white px-3 py-4 text-slate-900 md:px-6 md:py-8"
      style={{ colorScheme: "light" }}
    >
    <div className="mx-auto max-w-6xl grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">

    {/* LEFT — PRODUCT SUMMARY */}
    <div className="md:col-span-2 space-y-6">

        {/* Product card */}
        <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4 shadow-sm md:p-6">
        <div className="flex flex-col md:flex-row gap-4">

            <div className="relative w-full md:w-48 rounded-2xl bg-white p-3">
            <img
                src={currentMockupUrl ?? order.mockupUrl}
                className="w-full h-auto rounded-lg object-contain bg-white"
            />
            {isApparel && previewStatus === "generating" && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70 text-xs text-gray-700">
                Finalizing your product preview…
                </div>
            )}
            </div>

            <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-900">
                {PRODUCT_LABELS[order.productKey as keyof typeof PRODUCT_LABELS]}
            </h2>
            <p className="mt-1 text-sm font-medium text-gray-700">
                {checkoutCopy.subtitle}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
                {displayedNameLabel}
            </p>

            <div className="mt-2 text-sm text-gray-600 space-y-1">
                {(order.productKey === "poster" || order.productKey === "framedPoster") && order.variantName && (
                <div>
                    <strong>Variant:</strong> {order.variantName}
                </div>
                )}

                {(order.productKey === "poster" || order.productKey === "postcard" || order.productKey === "framedPoster" || order.productKey === "canvas" || order.productKey === "pillow" || order.productKey === "candle") && order.size && (
                <div>
                    <strong>Size:</strong> {order.size}
                </div>
                )}

                {order.productKey === "candle" && order.color && (
                <div>
                    <strong>Scent:</strong> {order.color}
                </div>
                )}

                {order.productKey === "framedPoster" && order.color && (
                <div className="flex items-center gap-2">
                    <strong>Frame color:</strong>
                    {order.colorHex && (
                    <span
                    className="inline-block w-4 h-4 rounded-full border"
                    style={{ backgroundColor: order.colorHex }}
                    />
                    )}
                    {order.color}
                </div>
                )}

                {order.productKey === "tshirt" && order.size && (
                <div>
                    <strong>Size:</strong> {order.size}
                </div>
                )}

                {order.productKey === "coaster" && order.size && (
                <div>
                    <strong>Size:</strong> {order.size}
                </div>
                )}

                {order.productKey === "journal" && order.size && (
                <div>
                    <strong>Size:</strong> {order.size}
                </div>
                )}

                {(order.productKey === "tshirt" || order.productKey === "mugBlackGlossy" || order.productKey === "mugColorInside") && order.color && (
                <div className="flex items-center gap-2">
                    <strong>Color:</strong>
                    <span
                    className="inline-block w-4 h-4 rounded-full border"
                    style={{ backgroundColor: order.colorHex }}
                    />
                    {order.color}
                </div>
                )}

                {isMugProductKey(order.productKey) && order.size && (
                <div>
                    <strong>Size:</strong> {order.size}
                </div>
                )}

                <div>
                    <strong>Quantity:</strong> {orderQuantity}
                </div>

                {isMugProductKey(order.productKey) && order.previewMode && (
                <div>
                    <strong>Print position:</strong>{" "}
                    {order.previewMode === "two-side"
                    ? "Two-side"
                    : order.previewMode === "full-wrap"
                    ? "Full wrap"
                    : "Center"}
                </div>
                )}
            </div>
            {false && (
            <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                <div className="font-semibold">Finalizing preview</div>
                <div className="mt-1 text-xs text-gray-500">
                We are finalizing your product preview automatically.
                </div>
                {previewStatus === "generating" && (
                <div className="mt-2 text-xs text-gray-500">Finalizing your product preview…</div>
                )}
                {previewStatus === "error" && previewError === "RATE_LIMIT" && (
                <div className="mt-2 text-xs text-gray-500">
                    Preview temporarily unavailable due to high demand.
                </div>
                )}
                {previewStatus === "error" && (
                <div className="mt-3 flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => {
                    if (!order) return;
                    autoFinalizeStartedRef.current = true;
                    void finalizePreviewById(order.id);
                    }}
                    disabled={previewCooldown !== null}
                    className="inline-flex items-center rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-50"
                >
                    {previewCooldown !== null
                    ? `Retry preview in ${previewCooldown}s`
                    : "Retry preview"}
                </button>
                </div>
                )}
            </div>
            )}
            </div>

            <div className="text-right">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
                    {checkoutCopy.personalizedLabel}
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                    <span>${formatPrice(totalPrice)}</span>
                </div>
                {hasExtraMugDiscount && (
                  <div className="mt-1 text-xs font-semibold text-emerald-700">
                    Includes 20% off every extra mug after the first
                  </div>
                )}
                <div className="mt-1 text-xs text-gray-500">Free shipping included</div>
                <div className="mt-1 text-xs text-gray-500">Printed only after you order</div>
    </div>
    </div>
        </div>

        {/* Shipping address */}
        <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4 shadow-sm md:p-6">
        <h3 className="text-lg font-semibold mb-4">
            Shipping address
        </h3>
        {(productNotice || shippingNotice || (showShippingValidation && Object.keys(localShippingErrors).length > 0)) && (
        <div className="mb-3 text-sm text-red-600">
            {productNotice ?? shippingNotice ?? "Please fix the highlighted shipping fields before continuing."}
        </div>
        )}
        {isCountryAvailabilityError(checkoutPricingQuery.error?.message) && (
        <div className="mb-3 text-sm text-red-600">
            Shipping is not available in this country yet.
        </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {!isLoggedIn && (
        <>
        <Input
            className={`input-lg md:col-span-2 ${lightFieldClassName} ${isFieldInvalid("email") ? "!border-red-500" : ""}`}
            placeholder="Email"
            type="email"
            value={address.email}
            onChange={(e) =>
            setAddress({ ...address, email: e.target.value })
            }
            onBlur={() => {
            void captureCheckoutEmailIfNeeded(address.email);
            }}
        />
        {fieldErrorMessage("email") && (
        <div className="md:col-span-2 text-xs text-red-600">{fieldErrorMessage("email")}</div>
        )}
        </>
        )}

        <Input
            className={`input-lg ${lightFieldClassName} ${isFieldInvalid("name") ? "!border-red-500" : ""}`}
            placeholder="Full name"
            value={address.name}
            onChange={(e) =>
            setAddress({ ...address, name: e.target.value })
            }
        />
        {fieldErrorMessage("name") && (
        <div className="text-xs text-red-600">{fieldErrorMessage("name")}</div>
        )}

        <Input
            className={`input-lg ${lightFieldClassName} ${isFieldInvalid("city") ? "!border-red-500" : ""}`}
            placeholder="City"
            value={address.city}
            onChange={(e) =>
            setAddress({ ...address, city: e.target.value })
            }
        />
        {fieldErrorMessage("city") && (
        <div className="text-xs text-red-600">{fieldErrorMessage("city")}</div>
        )}

        <Input
            className={`md:col-span-2 input-lg ${lightFieldClassName} ${isFieldInvalid("address1") ? "!border-red-500" : ""}`}
            placeholder="Address"
            value={address.address1}
            onChange={(e) =>
            setAddress({ ...address, address1: e.target.value })
            }
        />
        {fieldErrorMessage("address1") && (
        <div className="md:col-span-2 text-xs text-red-600">{fieldErrorMessage("address1")}</div>
        )}

        <Input
            className={`input-lg ${lightFieldClassName} ${isFieldInvalid("zip") ? "!border-red-500" : ""}`}
            placeholder="ZIP / Postal code"
            value={address.zip}
            onChange={(e) => {
            setAddress({ ...address, zip: e.target.value });
            if (backendFieldErrors.zip) {
                setBackendFieldErrors((prev) => {
                const next = { ...prev };
                delete next.zip;
                return next;
                });
            }
            }}
        />
        {fieldErrorMessage("zip") && (
        <div className="text-xs text-red-600">{fieldErrorMessage("zip")}</div>
        )}

        {requiresState && (
        <Input
            placeholder={address.country === "CA" ? "Province (e.g. QC, ON)" : "State (e.g. CA, NY)"}
            className={`${lightFieldClassName} ${isFieldInvalid("state") ? "!border-red-500" : ""}`}
            value={address.state}
            onChange={(e) => {
            setAddress({ ...address, state: e.target.value.toUpperCase() });
            if (backendFieldErrors.state) {
                setBackendFieldErrors((prev) => {
                const next = { ...prev };
                delete next.state;
                return next;
                });
            }
            }}
        />
        )}
        {requiresState && fieldErrorMessage("state") && (
        <div className="text-xs text-red-600">{fieldErrorMessage("state")}</div>
        )}

        <div className="relative">
        <Select
            value={address.country}
            onChange={(e) =>
            setAddress({ ...address, country: e.target.value })
            }
            onFocus={() => void loadCountries()}
            onClick={() => void loadCountries()}
            className={`pr-10 ${lightFieldClassName} ${isFieldInvalid("country") ? "!border-red-500" : ""}`}
        >
            <option value="">Select country</option>
            {countries.map((country) => (
            <option key={country.code} value={country.code}>
                {country.name}
            </option>
            ))}
        </Select>

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            ▼
        </span>
        </div>
        {fieldErrorMessage("country") && (
        <div className="text-xs text-red-600">{fieldErrorMessage("country")}</div>
        )}
        </div>
    </div>
  </div>

  {/* RIGHT — ORDER TOTAL */}
  <div className="md:col-span-1">
    <div className="sticky top-6 rounded-2xl border border-cream-200 bg-cream-50 p-4 shadow-sm md:p-6 space-y-4">

        <h3 className="text-lg font-semibold">Order summary</h3>

        <div className="rounded-xl border border-cream-200 bg-white p-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-gray-900">Quantity</div>
              <div className="mt-1 text-xs text-gray-500">
                Update how many {quantityItemLabel}s you want before payment.
              </div>
              {quantityOfferCopy && (
                <div className="mt-2 text-xs font-semibold text-emerald-700">
                  {quantityOfferCopy}
                </div>
              )}
            </div>

            <div className="inline-flex items-center rounded-xl border border-cream-200 bg-white">
              <button
                type="button"
                onClick={() => void updateCheckoutQuantity(Math.max(1, orderQuantity - 1))}
                disabled={orderQuantity <= 1 || isUpdatingQuantity || isSubmittingCheckout}
                className="px-4 py-3 text-lg font-semibold text-slate-900 transition hover:bg-cream-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <div className="min-w-[3.25rem] border-x border-cream-200 px-4 py-3 text-center text-base font-semibold text-slate-900">
                {orderQuantity}
              </div>
              <button
                type="button"
                onClick={() => void updateCheckoutQuantity(Math.min(6, orderQuantity + 1))}
                disabled={orderQuantity >= 6 || isUpdatingQuantity || isSubmittingCheckout}
                className="px-4 py-3 text-lg font-semibold text-slate-900 transition hover:bg-cream-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {isUpdatingQuantity && (
            <div className="mt-2 text-xs text-gray-500">Updating quantity...</div>
          )}
        </div>

        <div className="flex justify-between text-sm">
        <span>
          Product price ({orderQuantity} {quantityItemLabel}
          {orderQuantity > 1 ? "s" : ""})
        </span>
        <span>${formatPrice(hasExtraMugDiscount ? fullPriceTotal : totalPrice)}</span>
        </div>

        {hasExtraMugDiscount && (
          <div className="flex justify-between text-sm text-emerald-700">
            <span>Extra mug discount (20%)</span>
            <span>-${formatPrice(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>
              {checkoutPricingQuery.isLoading && address.country ? "Updating..." : "FREE"}
            </span>
        </div>

        <div className="border-t pt-3 flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>${formatPrice(totalPrice)}</span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700">
          <div className="font-semibold text-gray-900">{checkoutCopy.benefitsTitle}</div>
          <div className="mt-2 space-y-1">
            {checkoutCopy.benefits.map((benefit) => (
              <div key={benefit}>• {benefit}</div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
          Your design is printed only after your order - no mass production.
        </div>

        <button
            className="w-full py-3 rounded-lg bg-emerald-600 text-white font-semibold transition hover:bg-emerald-700 disabled:opacity-50"
        disabled={
          previewStatus === "generating" ||
          checkoutPricingQuery.isLoading ||
          isUpdatingQuantity ||
          isSubmittingCheckout
        }
        onClick={async () => { if (!order) return;

            const productIssues = getProductConfigErrors();
            if (productIssues.length > 0) {
            setProductNotice("Please review your product options before continuing.");
            return;
            }

            setProductNotice(null);

            const validationErrors = validateShipping();
            if (Object.keys(validationErrors).length > 0) {
            setShowShippingValidation(true);
            setShippingNotice("Please fix the highlighted shipping fields before continuing.");
            setBackendFieldErrors({});
            return;
            }

            setShowShippingValidation(false);
            setShippingNotice(null);
            setBackendFieldErrors({});

            if (checkoutPricingQuery.error) {
            if (isCountryAvailabilityError(checkoutPricingQuery.error.message)) {
                setBackendFieldErrors({
                  country: "Shipping is not available in this country yet.",
                });
                setShippingNotice(null);
                return;
            }
            setShippingNotice("We couldn't refresh the latest price. Please try again.");
            return;
            }

            if (!checkoutPricingQuery.data) {
            setShippingNotice("We couldn't refresh the latest price. Please try again.");
            return;
            }

            try {
            await captureCheckoutEmailIfNeeded(address.email);
            const res = await createStripeSession.mutateAsync({
                orderId: order.id,
                accessToken: accessTokenValue,
                submittedTotalPrice: checkoutPricingQuery.data.totalPrice,
                tracking: getMetaTrackingParams(),
                sourcePage: checkoutSourcePage,
                promotedProduct: order.productKey,
                address: {
                email: address.email,
                name: address.name,
                address1: address.address1,
                country: address.country,
                city: address.city,
                zip: address.zip,
                state: requiresState ? address.state : undefined,
                },
            });

            if (res.url) {
                const funnelContext = getFunnelContext({
                  route: router.pathname,
                  sourcePage: checkoutSourcePage,
                  orderFunnelSource: order.funnelSource ?? null,
                  productKey: order.productKey,
                  productType: "physical_product",
                  country: address.country,
                  query: router.query as Record<string, unknown>,
                });
                const beginCheckoutKey = `tracking_begin_checkout_${order.id}`;
                if (!hasTrackedBeginCheckoutRef.current && markEventTrackedOnce(beginCheckoutKey)) {
                  if (
                    order.funnelSource === "paid-traffic-offer" ||
                    order.funnelSource === "ramadan-mug-ad"
                  ) {
                    trackEvent("paid_traffic_checkout_started", {
                      product: order.productKey,
                      ...funnelContext,
                    });
                    const maybeFbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
                    if (typeof maybeFbq === "function") {
                      maybeFbq("trackCustom", "paid_traffic_checkout_started", {
                        product: order.productKey,
                        ...funnelContext,
                      });
                    }
                  } else {
                    trackEvent("begin_checkout", {
                      product: order.productKey,
                      user_credits_before_action: null,
                      required_credits: 0,
                      ...funnelContext,
                    });
                  }
                  hasTrackedBeginCheckoutRef.current = true;
                }
                const addShippingInfoKey = `tracking_add_shipping_info_${order.id}`;
                if (markEventTrackedOnce(addShippingInfoKey)) {
                  trackEvent("add_shipping_info", {
                    product: order.productKey,
                    ...funnelContext,
                  });
                }
                const addPaymentInfoKey = `tracking_meta_add_payment_info_${order.id}`;
                if (markEventTrackedOnce(addPaymentInfoKey)) {
                  fireMetaAddPaymentInfo({
                    content_type: "product",
                    content_ids: [order.productKey],
                    content_category: "physical_product",
                    value: Number(checkoutPricingQuery.data.totalPrice ?? order.totalPrice ?? 0),
                    currency: "USD",
                    order_id: order.id,
                    ...funnelContext,
                  });
                }
                window.location.href = res.url;
            }
            } catch (err: unknown) {
            if (err instanceof TRPCClientError) {
                if (err.message.includes("Invalid US ZIP code")) {
                setShowShippingValidation(true);
                setBackendFieldErrors({
                    zip: "ZIP code is not valid for a US address.",
                });
                setShippingNotice(null);
                return;
                }
                if (err.message.includes("Shipping address state and ZIP code don't match.")) {
                setShowShippingValidation(true);
                setBackendFieldErrors({
                    zip: "ZIP code doesn't match the selected state.",
                    state: "State doesn't match the provided ZIP code.",
                });
                setShippingNotice(null);
                return;
                }
                if (err.message.includes("Physical shipping is not available in this country yet.")) {
                setShowShippingValidation(true);
                setBackendFieldErrors({
                    country: "Shipping is not available in this country yet.",
                });
                setShippingNotice(null);
                return;
                }
                if (err.message.includes("Price mismatch.")) {
                setShowShippingValidation(false);
                setShippingNotice("Price changed. Please return to preview and try again.");
                setBackendFieldErrors({});
                return;
                }
                if (isSecurePaymentConfigError(err.message)) {
                setShowShippingValidation(false);
                setShippingNotice(err.message);
                setBackendFieldErrors({});
                return;
                }

                const fieldErrors = err.data?.zodError?.fieldErrors ?? {};
                const nextFieldErrors: Record<string, string> = {};

                if (fieldErrors.email) nextFieldErrors.email = "Enter a valid email address.";
                if (fieldErrors.name) nextFieldErrors.name = "This field is required.";
                if (fieldErrors.address1) nextFieldErrors.address1 = "This field is required.";
                if (fieldErrors.city) nextFieldErrors.city = "This field is required.";
                if (fieldErrors.country) nextFieldErrors.country = "This field is required.";
                if (fieldErrors.zip) nextFieldErrors.zip = "This field is required.";
                if (fieldErrors.state) {
                nextFieldErrors.state =
                    selectedCountry?.code === "US"
                    ? "State is required for US shipping."
                    : selectedCountry?.code === "CA"
                    ? "Province is required for Canada shipping."
                    : "State/region is required.";
                }

                if (Object.keys(nextFieldErrors).length > 0) {
                setShowShippingValidation(true);
                setShippingNotice("Please fix the highlighted shipping fields before continuing.");
                setBackendFieldErrors(nextFieldErrors);
                return;
                }

                setShowShippingValidation(false);
                setShippingNotice("We couldn't start secure payment. Please try again.");
                setBackendFieldErrors({});
            } else {
                setShowShippingValidation(false);
                setShippingNotice("We couldn't start secure payment. Please try again.");
                setBackendFieldErrors({});
            }
            }

        }}
        >
        {isSubmittingCheckout ? "Redirecting..." : "Continue to Secure Payment"}
        </button>

        <p className="text-center text-xs text-gray-500">
          {deliveryEstimate}
        </p>

        <div className="rounded-xl border border-cream-200 bg-cream-50 px-3 py-3 text-sm text-slate-700">
          <div className="flex items-center gap-3">
            <img
              src="/images/stripe-wordmark.svg"
              alt="Stripe"
              className="h-7 w-auto"
            />
            <div className="text-sm font-semibold text-slate-900">
              Secure payment powered by Stripe
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div>Encrypted checkout for card payments</div>
            <div>Printed after you order</div>
            <div>Free replacement if damaged</div>
          </div>
        </div>
        </div>
    </div>
</div>
</div>
    </>

    );
}
