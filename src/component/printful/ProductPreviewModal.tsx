// src/component/printful/ProductPreviewModal.tsx
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "~/component/Button";
import { api } from "~/utils/api";
import type { AspectRatio } from "~/server/printful/aspects";
import { useRouter } from "next/router";
import { trackEvent } from "~/lib/ga";
import { getFunnelContext } from "~/lib/tracking/funnel";
import { ProductNudgeBlock } from "~/component/Nudge/ProductNudgeBlock";
import { CreditUpgradeModal } from "~/component/Credits/CreditUpgradeModal";
import {
  CANVAS_VARIANT_INFO,
  COASTER_VARIANT_INFO,
  FRAMED_POSTER_VARIANT_INFO,
  JOURNAL_VARIANT_INFO,
  MUG_BLACK_GLOSSY_VARIANT_INFO,
  MUG_COLOR_INSIDE_VARIANT_INFO,
  MUG_VARIANT_INFO,
  POSTER_VARIANT_INFO,
  TSHIRT_SIZE_INFO,
} from "~/config/productVariantInfo";
import { SHIPPING_COUNTRY_OPTIONS } from "~/config/shippingCountries";
import {
  PRODUCT_PRESENTATION,
  isMugProductKey,
  type ProductKey,
} from "~/config/physicalProducts";

type Variant = {
  id: number;
  name: string;
  color?: string;
  size?: string;
  color_code?: string;
  price?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  productKey: ProductKey | null;
  imageUrl: string | null;
  aspect: AspectRatio;
  onCooldownStart?: (seconds: number) => void;
  funnelMode?: "default" | "paid_traffic_offer";
  paidTrafficUser?: boolean;
  transparentImageUrl?: string | null;
  useTransparent?: boolean;
};

type SelectedProductConfig = {
  productKey: ProductKey;
  variantId: number;
  variantName: string;
  size?: string;
  color?: string;
  colorHex?: string;
  printPosition?: "two-side" | "center";
  aspect?: AspectRatio;
  variantIdUsedForPreview?: number | null;
  pricingVariant: string;
  shippingCountry: string;
  price: number;
  previewImageUrl: string;
  isBackgroundRemoved: boolean;
};

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

export function ProductPreviewModal({
  isOpen,
  onClose,
  productKey,
  imageUrl,
  aspect,
  onCooldownStart,
  funnelMode = "default",
  paidTrafficUser = false,
  transparentImageUrl: initialTransparentImageUrl = null,
  useTransparent: initialUseTransparent = false,
}: Props) {
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [useTransparent, setUseTransparent] = useState(false);
  const [transparentImageUrl, setTransparentImageUrl] = useState<string | null>(null);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);

  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantId, setVariantId] = useState<number | null>(null);
  const [previewVariantId, setPreviewVariantId] = useState<number | null>(null);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const [mugVariantId, setMugVariantId] = useState<number | null>(null);
  const [mugPreviewMode, setMugPreviewMode] = useState<
    "two-side" | "center" | "full-wrap"
  >("two-side");

  const router = useRouter();
  const sourcePage = useMemo(() => {
    const pathname = router.pathname;
    if (pathname.includes("ramadan-mug-v2")) return "ramadan-mug-v2";
    if (pathname.includes("ramadan-mug-men")) return "ramadan-mug-men";
    if (pathname.includes("ramadan-mug")) return "ramadan-mug";
    if (pathname.includes("arabic-name-art-generator")) return "arabic-name-art-generator";
    if (pathname.includes("couples-name-art-generator") || pathname.includes("couples-art-generator")) {
      return "couples-art-generator";
    }
    return "name-art-generator";
  }, [router.pathname]);
  const isPaidTrafficFunnel = funnelMode === "paid_traffic_offer" && paidTrafficUser;
  const funnelContext = getFunnelContext({
    route: router.pathname,
    sourcePage,
    paidTrafficUser: isPaidTrafficFunnel,
    productKey,
    country: null,
    query: router.query as Record<string, unknown>,
  });

  const [error, setError] = useState<string | null>(null);
  const [pricingCountryCode, setPricingCountryCode] = useState<string>("US");
  const [pricingTotal, setPricingTotal] = useState<number | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [hasAutoSelectedCountry, setHasAutoSelectedCountry] = useState(false);
  const [offerEndsAtMs, setOfferEndsAtMs] = useState<number | null>(null);
  const [offerRemainingSeconds, setOfferRemainingSeconds] = useState(0);
  const shippingCountries = SHIPPING_COUNTRY_OPTIONS;
  const isRamadanMugOffer = productKey === "mug" && sourcePage === "ramadan-mug";
  const isTshirt = productKey === "tshirt";
  const isCoaster = productKey === "coaster";
  const isFramedPoster = productKey === "framedPoster";
  const isCanvas = productKey === "canvas";
  const isJournal = productKey === "journal";
  const isMugProduct = isMugProductKey(productKey);
  const isMugBlackGlossy = productKey === "mugBlackGlossy";
  const isMugColorInside = productKey === "mugColorInside";

  const [previewCooldown, setPreviewCooldown] = useState<number | null>(null);
  const [creditUpgradeOpen, setCreditUpgradeOpen] = useState(false);
  const [creditUpgradeContext, setCreditUpgradeContext] = useState<"generate" | "preview" | "remove_background">("preview");
  const [creditUpgradeRequired, setCreditUpgradeRequired] = useState(0);
  const pendingCreditActionRef = useRef<null | (() => void)>(null);
  const hasInitializedRef = useRef(false);
  const lastProductKeyRef = useRef<Props["productKey"]>(null);
  const creditsQuery = api.user.getCredits.useQuery(undefined, {
    enabled: isOpen && !isPaidTrafficFunnel,
  });
  const hasBackgroundCredits = (creditsQuery.data ?? 0) >= 1;
  const requiresBackgroundCredits = !transparentImageUrl;
  const openCreditUpgrade = (
    context: "generate" | "preview" | "remove_background",
    requiredCredits: number,
    retryAction: () => void,
  ) => {
    pendingCreditActionRef.current = retryAction;
    setCreditUpgradeContext(context);
    setCreditUpgradeRequired(requiredCredits);
    setCreditUpgradeOpen(true);
  };
  const trackPreviewEvent = (payload: {
    variantId?: number;
    chargedCredits: number;
  }) => {
    if (isPaidTrafficFunnel) {
      trackEvent("ramadan_mug_preview", {
        variantId: payload.variantId,
        user_credits_before_action: creditsQuery.data ?? null,
        required_credits: payload.chargedCredits,
        ...funnelContext,
        country: pricingCountryCode,
      });
      const maybeFbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
      if (typeof maybeFbq === "function") {
        maybeFbq("trackCustom", "ramadan_mug_preview", {
          variantId: payload.variantId,
          user_credits_before_action: creditsQuery.data ?? null,
          required_credits: payload.chargedCredits,
          ...funnelContext,
          country: pricingCountryCode,
        });
      }
      return;
    }

    trackEvent("generate_product_preview", {
      product: productKey,
      variantId: payload.variantId,
      user_credits_before_action: creditsQuery.data ?? null,
      required_credits: payload.chargedCredits,
      ...funnelContext,
      country: pricingCountryCode,
    });
  };

  useEffect(() => {
    if (isOpen) return;
    hasInitializedRef.current = false;
    lastProductKeyRef.current = null;
  }, [isOpen]);

  const selectedVariant = variants.find(v => v.id === variantId);
  const DEFAULT_TSHIRT_VARIANT_ID = 4013; // M

  const originalImageUrl = imageUrl;
  const previewImageUrl =
    useTransparent && transparentImageUrl
      ? transparentImageUrl
      : originalImageUrl;

  const parseJsonSafely = async (res: Response) => {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text) as any;
    } catch {
      return null;
    }
  };

  const extractImageId = (value: string | null) => {
    if (!value) return null;
    try {
      const url = new URL(value);
      const parts = url.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] ?? null;
    } catch {
      const parts = value.split("/").filter(Boolean);
      return parts[parts.length - 1] ?? null;
    }
  };

  const POSTER_VARIANTS_BY_ASPECT: Record<AspectRatio, number[]> = {
    "1:1": [6239, 4464, 6240, 4465, 6242], // 10x10, 12x12, 14x14, 16x16, 18x18
    "4:5": [3877, 4463],            // 16x20, 8x10
    "3:2": [16365, 2],              // 20x30, 24x36
    "16:9": [],                     // intentionally unsupported
  };

  const CANVAS_VARIANTS_BY_ASPECT: Record<AspectRatio, number[]> = {
    "1:1": [19296, 823, 824, 19308, 19314],
    "4:5": [19293, 6, 19315, 19323],
    "3:2": [19299, 19311, 825],
    "16:9": [],
  };

  const FRAMED_POSTER_SIZE_KEYS_BY_ASPECT: Record<AspectRatio, string[]> = {
    "1:1": ["10x10", "12x12", "14x14", "16x16", "18x18"],
    "4:5": ["8x10", "16x20"],
    "3:2": ["12x18", "20x30", "24x36"],
    "16:9": [],
  };

  const FRAMED_POSTER_DEFAULT_VARIANT_BY_ASPECT: Partial<Record<AspectRatio, number>> = {
    "1:1": 4652,
    "4:5": 4399,
    "3:2": 19520,
  };

  // Unicode-safe poster size helpers (do not touch mug/t-shirt logic).
  const normalizePosterSizeKey = (size?: string | null): string | null => {
    if (!size) return null;

    return size
      .replace(/\u2033/g, "")
      .replace(/"/g, "")
      .replace(/\u00d7/g, "x")
      .replace(/×/g, "x")
      .replace(/\s+/g, "")
      .trim();
  };

  const extractPosterSizeKeySafe = (value?: string | null): string | null => {
    const normalized = normalizePosterSizeKey(value);
    if (!normalized) return null;

    const match = normalized.match(/(\d+)x(\d+)/i);
    if (!match) return null;

    return `${match[1]}x${match[2]}`;
  };

  const formatPosterSizeLabelSafe = (sizeKey: string) => {
    const match = sizeKey.match(/^(\d+)x(\d+)$/);
    if (!match) return sizeKey;
    return `${match[1]}\u2033\u00d7${match[2]}\u2033`;
  };

  // NOTE: Printful poster sizes use special Unicode characters (″ ×)
  // Always normalize before lookup.
  const normalizePosterSize = (size?: string | null): string | null => {
    if (!size) return null;

    return size
      .replace(/″/g, "")
      .replace(/×/g, "x")
      .trim();
  };

  const extractPosterSizeKey = (value?: string | null): string | null => {
    if (!value) return null;

    const match = value.match(/(\d+)\s*[″"]?\s*[x×]\s*(\d+)\s*[″"]?/i);
    if (!match) return null;

    return `${match[1]}x${match[2]}`;
  };

  const formatPosterSizeLabel = (sizeKey: string) =>
    sizeKey.replace(/x/g, "″×") + "″";

  const normalizeCoasterSizeKey = (value?: string | null): string | null => {
    if (!value) return null;

    const normalized = value
      .replace(/\u2033/g, "")
      .replace(/"/g, "")
      .replace(/\u00d7/g, "x")
      .replace(/×/g, "x")
      .replace(/\s+/g, "")
      .trim();

    const match = normalized.match(/(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)/i);
    if (!match) return null;

    return `${match[1]}x${match[2]}`;
  };

  const normalizeJournalSizeKey = (value?: string | null): string | null => {
    if (!value) return null;

    const normalized = value
      .replace(/\u2033/g, "")
      .replace(/"/g, "")
      .replace(/\u00d7/g, "x")
      .replace(/×/g, "x")
      .replace(/\s+/g, "")
      .trim();

    const match = normalized.match(/(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)/i);
    if (!match) return null;

    return `${match[1]}x${match[2]}`;
  };

  const getPosterVariantSizeKey = (variant?: Variant | null): string | null =>
    extractPosterSizeKeySafe(variant?.size) ??
    extractPosterSizeKeySafe(variant?.name) ??
    normalizePosterSizeKey(variant?.size);

  const selectedPosterSizeKey = getPosterVariantSizeKey(selectedVariant);
  const posterInfoText =
    productKey === "poster" && selectedPosterSizeKey
      ? POSTER_VARIANT_INFO[selectedPosterSizeKey]
      : undefined;
  const canvasInfoText =
    productKey === "canvas" && selectedPosterSizeKey
      ? CANVAS_VARIANT_INFO[selectedPosterSizeKey]
      : undefined;
  const framedPosterInfoText =
    productKey === "framedPoster" && (selectedSize ?? selectedPosterSizeKey)
      ? FRAMED_POSTER_VARIANT_INFO[selectedSize ?? selectedPosterSizeKey ?? ""]
      : undefined;
  const journalSizeKey =
    productKey === "journal"
      ? normalizeJournalSizeKey(selectedVariant?.size) ??
        normalizeJournalSizeKey(selectedVariant?.name)
      : undefined;
  const journalInfoText =
    productKey === "journal" && journalSizeKey
      ? JOURNAL_VARIANT_INFO[journalSizeKey]
      : undefined;

  const framedPosterVariantsForAspect = useMemo(() => {
    if (!isFramedPoster) return [];

    return variants.filter((variant) => {
      const sizeKey = getPosterVariantSizeKey(variant);
      return sizeKey
        ? FRAMED_POSTER_SIZE_KEYS_BY_ASPECT[aspect]?.includes(sizeKey)
        : false;
    });
  }, [aspect, isFramedPoster, variants]);

  const getVariantInfo = () => {
    if (!productKey) return "";

    if (productKey === "poster") {
      return posterInfoText ?? "";
    }

    if (productKey === "canvas") {
      return canvasInfoText ?? "";
    }

    if (productKey === "framedPoster") {
      return framedPosterInfoText ?? "";
    }

    if (productKey === "journal") {
      return journalInfoText ?? "";
    }

    if (productKey === "mug") {
      const mugName = selectedVariant?.name ?? "";
      const mugMatch = Object.keys(MUG_VARIANT_INFO).find((key) =>
        mugName.includes(key)
      );
      return mugMatch ? MUG_VARIANT_INFO[mugMatch] : "";
    }

    if (productKey === "mugBlackGlossy") {
      const mugName = selectedVariant?.name ?? "";
      const mugMatch = Object.keys(MUG_BLACK_GLOSSY_VARIANT_INFO).find((key) =>
        mugName.includes(key),
      );
      return mugMatch ? MUG_BLACK_GLOSSY_VARIANT_INFO[mugMatch] : "";
    }

    if (productKey === "mugColorInside") {
      const mugName = selectedVariant?.name ?? "";
      const mugMatch = Object.keys(MUG_COLOR_INSIDE_VARIANT_INFO).find((key) =>
        mugName.includes(key),
      );
      return mugMatch ? MUG_COLOR_INSIDE_VARIANT_INFO[mugMatch] : "";
    }

    if (productKey === "coaster") {
      const coasterSize =
        normalizeCoasterSizeKey(selectedVariant?.size) ??
        normalizeCoasterSizeKey(selectedVariant?.name);
      return coasterSize ? COASTER_VARIANT_INFO[coasterSize] ?? "" : "";
    }

    if (productKey === "tshirt") {
      return selectedSize ? TSHIRT_SIZE_INFO[selectedSize] ?? "" : "";
    }

    return "";
  };

  const availableSizes = useMemo(
    () => {
      const sizeOptions: Array<string | null | undefined> = isFramedPoster
        ? framedPosterVariantsForAspect
            .filter((v) => !selectedColor || v.color === selectedColor)
            .map((v) => getPosterVariantSizeKey(v))
        : variants
            .filter((v) => !isMugColorInside || !selectedColor || v.color === selectedColor)
            .map((v) => v.size);

      return Array.from(
        new Set(
          sizeOptions.filter((value): value is string => Boolean(value)),
        ),
      );
    },
    [framedPosterVariantsForAspect, isFramedPoster, isMugColorInside, selectedColor, variants],
  );

  const availableColors = useMemo(
    () => {
      const colorOptions: Array<string | null | undefined> = isFramedPoster
        ? framedPosterVariantsForAspect
            .filter((v) => !selectedSize || getPosterVariantSizeKey(v) === selectedSize)
            .map((v) => v.color)
        : variants
            .filter((v) => !selectedSize || v.size === selectedSize)
            .map((v) => v.color);

      return Array.from(
        new Set(
          colorOptions.filter((value): value is string => Boolean(value)),
        ),
      );
    },
    [framedPosterVariantsForAspect, isFramedPoster, selectedSize, variants],
  );

  const ensureDefaultSelection = (
    key: Props["productKey"],
    nextVariants: Variant[]
  ) => {
    if (!key || !nextVariants.length) return;

    if (key === "poster") {
      if (variantId && nextVariants.find((v) => v.id === variantId)) return;
      const allowed = POSTER_VARIANTS_BY_ASPECT[aspect];
      const defaultVariant = nextVariants.find((v) => allowed?.includes(v.id));
      if (defaultVariant) {
        setVariantId(defaultVariant.id);
      } else {
        setVariantId(null);
      }
      return;
    }

    if (key === "canvas") {
      if (variantId && nextVariants.find((v) => v.id === variantId)) return;
      const allowed = CANVAS_VARIANTS_BY_ASPECT[aspect];
      const defaultVariant =
        nextVariants.find((v) => allowed?.includes(v.id)) ??
        nextVariants[0];
      if (defaultVariant) {
        setVariantId(defaultVariant.id);
      } else {
        setVariantId(null);
      }
      return;
    }

    if (key === "framedPoster") {
      const eligibleVariants = nextVariants.filter((variant) => {
        const sizeKey = getPosterVariantSizeKey(variant);
        return sizeKey
          ? FRAMED_POSTER_SIZE_KEYS_BY_ASPECT[aspect]?.includes(sizeKey)
          : false;
      });

      if (eligibleVariants.length === 0) {
        setVariantId(null);
        setSelectedSize(null);
        setSelectedColor(null);
        return;
      }

      const currentMatch =
        selectedSize && selectedColor
          ? eligibleVariants.find(
              (variant) =>
                getPosterVariantSizeKey(variant) === selectedSize &&
                variant.color === selectedColor,
            )
          : null;

      if (currentMatch) {
        setVariantId(currentMatch.id);
        return;
      }

      const defaultVariant =
        eligibleVariants.find(
          (variant) => variant.id === FRAMED_POSTER_DEFAULT_VARIANT_BY_ASPECT[aspect],
        ) ??
        eligibleVariants.find((variant) => variant.color === "Black") ??
        eligibleVariants[0];
      const defaultSize =
        getPosterVariantSizeKey(defaultVariant) ?? getPosterVariantSizeKey(eligibleVariants[0]);
      const colorsForSize = eligibleVariants
        .filter((variant) => getPosterVariantSizeKey(variant) === defaultSize)
        .map((variant) => variant.color)
        .filter(Boolean);
      const defaultColor =
        defaultVariant?.color && colorsForSize.includes(defaultVariant.color)
          ? defaultVariant.color
          : colorsForSize.includes("Black")
          ? "Black"
          : colorsForSize[0];

      if (defaultSize) setSelectedSize(defaultSize);
      if (defaultColor) setSelectedColor(defaultColor);

      const match =
        eligibleVariants.find(
          (variant) =>
            getPosterVariantSizeKey(variant) === defaultSize &&
            variant.color === defaultColor,
        ) ?? defaultVariant;

      if (match) {
        setVariantId(match.id);
      } else {
        setVariantId(null);
      }
      return;
    }

    if (key === "mug") {
      const existingVariant =
        (variantId && nextVariants.find((v) => v.id === variantId)) ||
        (mugVariantId && nextVariants.find((v) => v.id === mugVariantId));
      if (existingVariant) {
        setMugVariantId(existingVariant.id);
        setVariantId(existingVariant.id);
        return;
      }
      const defaultMug =
        nextVariants.find((v) => v.id === 1320) ??
        nextVariants.find((v) => (v.size ?? v.name)?.toLowerCase().includes("11 oz")) ??
        nextVariants[0];
      if (defaultMug) {
        setMugVariantId(defaultMug.id);
        setVariantId(defaultMug.id);
      }
      return;
    }

    if (key === "mugBlackGlossy") {
      const existingVariant =
        (variantId && nextVariants.find((v) => v.id === variantId)) ||
        (mugVariantId && nextVariants.find((v) => v.id === mugVariantId));
      if (existingVariant) {
        setSelectedColor(existingVariant.color ?? null);
        setMugVariantId(existingVariant.id);
        setVariantId(existingVariant.id);
        return;
      }
      const defaultMug =
        nextVariants.find((v) => v.id === 9323) ??
        nextVariants.find((v) => (v.size ?? v.name)?.toLowerCase().includes("11 oz")) ??
        nextVariants[0];
      if (defaultMug) {
        setSelectedColor(defaultMug.color ?? null);
        setMugVariantId(defaultMug.id);
        setVariantId(defaultMug.id);
      }
      return;
    }

    if (key === "mugColorInside") {
      const currentMatch =
        selectedSize && selectedColor
          ? nextVariants.find(
              (v) => v.size === selectedSize && v.color === selectedColor,
            )
          : null;
      if (currentMatch) {
        setMugVariantId(currentMatch.id);
        setVariantId(currentMatch.id);
        return;
      }

      const defaultVariant =
        nextVariants.find((v) => v.size === "11 oz" && v.color === "Black") ??
        nextVariants.find((v) => v.size === "11 oz") ??
        nextVariants[0];
      const defaultSize = defaultVariant?.size ?? nextVariants[0]?.size;
      const colorsForSize = nextVariants
        .filter((v) => v.size === defaultSize)
        .map((v) => v.color)
        .filter(Boolean);
      const defaultColor =
        defaultVariant?.color && colorsForSize.includes(defaultVariant.color)
          ? defaultVariant.color
          : colorsForSize.includes("Black")
          ? "Black"
          : colorsForSize[0];

      if (defaultSize) setSelectedSize(defaultSize);
      if (defaultColor) setSelectedColor(defaultColor);

      const match =
        nextVariants.find((v) => v.size === defaultSize && v.color === defaultColor) ??
        defaultVariant;
      if (match) {
        setMugVariantId(match.id);
        setVariantId(match.id);
      } else {
        setVariantId(null);
        setMugVariantId(null);
      }
      return;
    }

    if (key === "coaster") {
      const existingVariant = variantId && nextVariants.find((v) => v.id === variantId);
      if (existingVariant) {
        setSelectedSize(existingVariant.size ?? existingVariant.name ?? null);
        setVariantId(existingVariant.id);
        return;
      }

      const defaultVariant =
        nextVariants.find((v) => v.id === 15662) ??
        nextVariants.find((v) => (v.size ?? v.name)?.includes("3.74")) ??
        nextVariants[0];

      if (defaultVariant) {
        setSelectedSize(defaultVariant.size ?? defaultVariant.name ?? null);
        setVariantId(defaultVariant.id);
      } else {
        setVariantId(null);
        setSelectedSize(null);
      }
      return;
    }

    if (key === "journal") {
      const existingVariant = variantId && nextVariants.find((v) => v.id === variantId);
      if (existingVariant) {
        setSelectedSize(existingVariant.size ?? existingVariant.name ?? null);
        setVariantId(existingVariant.id);
        return;
      }

      const defaultVariant =
        nextVariants.find((v) => v.id === 22658) ??
        nextVariants.find((v) => (v.size ?? v.name)?.includes("5.75")) ??
        nextVariants[0];

      if (defaultVariant) {
        setSelectedSize(defaultVariant.size ?? defaultVariant.name ?? null);
        setVariantId(defaultVariant.id);
      } else {
        setVariantId(null);
        setSelectedSize(null);
      }
      return;
    }

    if (key === "tshirt") {
      const currentMatch =
        selectedSize && selectedColor
          ? nextVariants.find(
              (v) => v.size === selectedSize && v.color === selectedColor,
            )
          : null;
      if (currentMatch) {
        setVariantId(currentMatch.id);
        return;
      }

      const defaultVariant =
        nextVariants.find((v) => v.id === DEFAULT_TSHIRT_VARIANT_ID) ??
        nextVariants.find((v) => v.size === "M") ??
        nextVariants.find((v) => v.size) ??
        nextVariants[0];

      const defaultSize = defaultVariant?.size ?? nextVariants[0]?.size;
      const colorsForSize = nextVariants
        .filter((v) => v.size === defaultSize)
        .map((v) => v.color)
        .filter(Boolean);
      const defaultColor = colorsForSize.includes("White")
        ? "White"
        : colorsForSize.includes("Black")
        ? "Black"
        : colorsForSize[0];

      if (defaultSize) setSelectedSize(defaultSize);
      if (defaultColor) setSelectedColor(defaultColor);

      const match = nextVariants.find(
        (v) => v.size === defaultSize && v.color === defaultColor
      );
      if (match) {
        setVariantId(match.id);
      } else {
        setVariantId(null);
      }
    }
  };

  /* ---------------------------------------------------
     1) Generate preview
  --------------------------------------------------- */
  const requestInitialPreview = async () => {
    if (!isOpen || !productKey || !originalImageUrl) return;

    setLoadingPreview(true);
    setError(null);
    if (!hasInitializedRef.current || lastProductKeyRef.current !== productKey) {
      setMockupUrl(null);
      setPreviewVariantId(null);
      setVariants([]);
      setVariantId(null);
      setSelectedColor(null);
      setSelectedSize(null);
      setMugVariantId(null);
      hasInitializedRef.current = true;
      lastProductKeyRef.current = productKey;
    }

    try {
      const res = await fetch("/api/printful/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productKey,
          imageUrl: originalImageUrl,
          aspect,
          paidTrafficUser: isPaidTrafficFunnel,
        }),
      });
      const data = await parseJsonSafely(res);
      const fallbackError = "Preview unavailable. Please try again in a moment.";

      if (!data) throw new Error(fallbackError);

      if (!res.ok) {
        if (data.error === "PRINTFUL_RATE_LIMIT" && data.retryAfter) {
          setPreviewCooldown(data.retryAfter);
          onCooldownStart?.(data.retryAfter);
          return;
        }
        throw new Error(data.error || fallbackError);
      }

      if (!data.mockupUrl) return;
      setMockupUrl(data.mockupUrl);
      setPreviewVariantId(null);
      trackPreviewEvent({
        variantId: variantId ?? undefined,
        chargedCredits:
          typeof data.chargedCredits === "number" ? data.chargedCredits : 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview unavailable. Please try again.");
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    void requestInitialPreview();
  }, [isOpen, productKey, originalImageUrl]);

  useEffect(() => {
    if (!originalImageUrl) return;
    setUseTransparent(Boolean(initialUseTransparent && initialTransparentImageUrl));
    setTransparentImageUrl(initialTransparentImageUrl);
    setIsRemovingBackground(false);
  }, [initialTransparentImageUrl, initialUseTransparent, originalImageUrl]);

  /* ---------------------------------------------------
     2) Fetch LIVE variants from Printful
  --------------------------------------------------- */
  useEffect(() => {
    if (!isOpen || !productKey) return;

    const controller = new AbortController();
    const params = new URLSearchParams({
      productKey,
      countryCode: pricingCountryCode,
    });
    setAvailabilityError(null);

    fetch(`/api/printful/variants?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        const nextVariants = data.variants || [];
        const hasAspectCompatibleVariant =
          productKey === "poster"
            ? nextVariants.some((variant: Variant) =>
                POSTER_VARIANTS_BY_ASPECT[aspect]?.includes(variant.id),
              )
            : productKey === "canvas"
            ? nextVariants.some((variant: Variant) =>
                CANVAS_VARIANTS_BY_ASPECT[aspect]?.includes(variant.id),
              )
            : productKey === "framedPoster"
            ? nextVariants.some((variant: Variant) => {
                const sizeKey = getPosterVariantSizeKey(variant);
                return sizeKey
                  ? FRAMED_POSTER_SIZE_KEYS_BY_ASPECT[aspect]?.includes(sizeKey)
                  : false;
              })
            : true;
        setVariants(nextVariants);
        if (nextVariants.length === 0 || !hasAspectCompatibleVariant) {
          setVariantId(null);
          setPreviewVariantId(null);
          setSelectedColor(null);
          setSelectedSize(null);
          setMugVariantId(null);
          setAvailabilityError(
            nextVariants.length === 0
              ? "This product is not available in the selected country."
              : "This design aspect is not available in the selected country.",
          );
          return;
        }
        ensureDefaultSelection(productKey, nextVariants);
      })
      .catch((err: unknown) => {
        if ((err as Error).name === "AbortError") return;
        setError("Failed to load product options");
        setAvailabilityError("Failed to load availability for the selected country.");
      });

    return () => controller.abort();
  }, [isOpen, productKey, aspect, pricingCountryCode]);

  useEffect(() => {
    if (previewCooldown === null) return;

    if (previewCooldown <= 0) {
      setPreviewCooldown(null);
      return;
    }

    const timer = setInterval(() => {
      setPreviewCooldown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [previewCooldown]);

  useEffect(() => {
    if (!isTshirt || !selectedColor || !selectedSize) return;

    const match = variants.find(
      v => v.color === selectedColor && v.size === selectedSize
    );

    if (match) {
      setVariantId(match.id);
    }
  }, [selectedColor, selectedSize, variants, isTshirt]);

  useEffect(() => {
    if (!isTshirt) return;
    if (!selectedSize) return;

    const colorsForSize = variants
      .filter(v => v.size === selectedSize)
      .map(v => v.color)
      .filter(Boolean) as string[];

    if (colorsForSize.length === 0) return;

    if (!selectedColor || !colorsForSize.includes(selectedColor)) {
      const firstColor = colorsForSize[0];
      if (firstColor) {
        setSelectedColor(firstColor);
      }
    }
  }, [selectedSize, variants, isTshirt]);

  useEffect(() => {
    if (!isMugColorInside || !selectedColor || !selectedSize) return;

    const match = variants.find(
      (v) => v.color === selectedColor && v.size === selectedSize,
    );

    if (match) {
      setMugVariantId(match.id);
      setVariantId(match.id);
    }
  }, [selectedColor, selectedSize, variants, isMugColorInside]);

  useEffect(() => {
    if (!isFramedPoster || !selectedColor || !selectedSize) return;

    const match = framedPosterVariantsForAspect.find(
      (variant) =>
        variant.color === selectedColor && getPosterVariantSizeKey(variant) === selectedSize,
    );

    if (match) {
      setVariantId(match.id);
    }
  }, [selectedColor, selectedSize, framedPosterVariantsForAspect, isFramedPoster]);

  useEffect(() => {
    if (!isFramedPoster || !selectedSize) return;

    const colorsForSize = framedPosterVariantsForAspect
      .filter((variant) => getPosterVariantSizeKey(variant) === selectedSize)
      .map((variant) => variant.color)
      .filter(Boolean) as string[];

    if (colorsForSize.length === 0) return;

    if (!selectedColor || !colorsForSize.includes(selectedColor)) {
      const fallbackColor =
        colorsForSize.includes("Black") ? "Black" : colorsForSize[0];
      if (fallbackColor) {
        setSelectedColor(fallbackColor);
      }
    }
  }, [selectedColor, selectedSize, framedPosterVariantsForAspect, isFramedPoster]);

  useEffect(() => {
    if (!isFramedPoster || !selectedColor) return;

    const sizesForColor = framedPosterVariantsForAspect
      .filter((variant) => variant.color === selectedColor)
      .map((variant) => getPosterVariantSizeKey(variant))
      .filter(Boolean) as string[];

    if (sizesForColor.length === 0) return;

    if (!selectedSize || !sizesForColor.includes(selectedSize)) {
      const defaultSizeFromAspect = FRAMED_POSTER_DEFAULT_VARIANT_BY_ASPECT[aspect]
        ? getPosterVariantSizeKey(
            framedPosterVariantsForAspect.find(
              (variant) =>
                variant.id === FRAMED_POSTER_DEFAULT_VARIANT_BY_ASPECT[aspect] &&
                variant.color === selectedColor,
            ),
          )
        : null;
      const fallbackSize =
        defaultSizeFromAspect && sizesForColor.includes(defaultSizeFromAspect)
          ? defaultSizeFromAspect
          : sizesForColor[0];

      if (fallbackSize) {
        setSelectedSize(fallbackSize);
      }
    }
  }, [selectedColor, selectedSize, framedPosterVariantsForAspect, isFramedPoster, aspect]);

  useEffect(() => {
    if (!isMugColorInside || !selectedSize) return;

    const colorsForSize = variants
      .filter((v) => v.size === selectedSize)
      .map((v) => v.color)
      .filter(Boolean) as string[];

    if (colorsForSize.length === 0) return;

    if (!selectedColor || !colorsForSize.includes(selectedColor)) {
      const fallbackColor =
        colorsForSize.includes("Black") ? "Black" : colorsForSize[0];
      if (fallbackColor) {
        setSelectedColor(fallbackColor);
      }
    }
  }, [selectedColor, selectedSize, variants, isMugColorInside]);

  useEffect(() => {
    if (!isMugColorInside || !selectedColor) return;

    const sizesForColor = variants
      .filter((v) => v.color === selectedColor)
      .map((v) => v.size)
      .filter(Boolean) as string[];

    if (sizesForColor.length === 0) return;

    if (!selectedSize || !sizesForColor.includes(selectedSize)) {
      const fallbackSize = sizesForColor.includes("11 oz") ? "11 oz" : sizesForColor[0];
      if (fallbackSize) {
        setSelectedSize(fallbackSize);
      }
    }
  }, [selectedColor, selectedSize, variants, isMugColorInside]);


  const colorHexMap = new Map<string, string>();

  variants.forEach((v) => {
    if (v.color && (v as any).color_code) {
      if (!colorHexMap.has(v.color)) {
        colorHexMap.set(v.color, (v as any).color_code);
      }
    }
  });
  useEffect(() => {
    if (shippingCountries.some((country) => country.code === pricingCountryCode)) return;
    setPricingCountryCode("US");
  }, [pricingCountryCode, shippingCountries]);

  useEffect(() => {
    if (!isOpen) {
      setHasAutoSelectedCountry(false);
      return;
    }
    if (hasAutoSelectedCountry) return;

    const availableCodes = shippingCountries.map((country) => country.code);
    const detectedCountry = detectCountryFromBrowser(availableCodes);

    if (detectedCountry && detectedCountry !== pricingCountryCode) {
      setPricingCountryCode(detectedCountry);
    } else if (!detectedCountry && pricingCountryCode !== "US") {
      setPricingCountryCode("US");
    }

    setHasAutoSelectedCountry(true);
  }, [hasAutoSelectedCountry, isOpen, pricingCountryCode, shippingCountries]);

  useEffect(() => {
    if (!isOpen || !isRamadanMugOffer) {
      setOfferEndsAtMs(null);
      setOfferRemainingSeconds(0);
      return;
    }
    setOfferEndsAtMs(Date.now() + 24 * 60 * 60 * 1000);
  }, [isOpen, isRamadanMugOffer]);

  useEffect(() => {
    if (!offerEndsAtMs) return;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((offerEndsAtMs - Date.now()) / 1000));
      setOfferRemainingSeconds(remaining);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [offerEndsAtMs]);

  const createOrder = api.productOrder.createPendingOrder.useMutation();

  const infoText = getVariantInfo();
  const infoLines = infoText ? infoText.split("\n") : [];
  const formatOfferCountdown = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
  };

  const getPosterSizeLabel = () => {
    const sizeKey =
      (productKey === "framedPoster" ? selectedSize : null) ??
      getPosterVariantSizeKey(selectedVariant);
    return sizeKey ? formatPosterSizeLabelSafe(sizeKey) : selectedVariant?.name;
  };

  const getProductSelectionLabel = () => {
    if (!productKey) return "";

    if (productKey === "poster") {
      const sizeLabel = getPosterSizeLabel();
      return sizeLabel ? `Premium Poster (${sizeLabel})` : "Premium Poster";
    }

    if (productKey === "canvas") {
      const sizeLabel = getPosterSizeLabel();
      return sizeLabel ? `Canvas (${sizeLabel})` : "Canvas";
    }

    if (productKey === "framedPoster") {
      const sizeLabel = selectedSize ? formatPosterSizeLabelSafe(selectedSize) : getPosterSizeLabel();
      const details = [sizeLabel, selectedColor].filter(Boolean).join(" / ");
      return details
        ? `Enhanced Matte Paper Framed Poster (${details})`
        : "Enhanced Matte Paper Framed Poster";
    }

    if (productKey === "mug") {
      const sizeLabel = selectedVariant?.size ?? selectedVariant?.name;
      return sizeLabel ? `White Glossy Mug (${sizeLabel})` : "White Glossy Mug";
    }

    if (productKey === "mugBlackGlossy") {
      const sizeLabel = selectedVariant?.size ?? selectedVariant?.name;
      return sizeLabel ? `Black Glossy Mug (${sizeLabel})` : "Black Glossy Mug";
    }

    if (productKey === "mugColorInside") {
      const details = [selectedVariant?.size, selectedVariant?.color]
        .filter(Boolean)
        .join(" / ");
      return details
        ? `White Ceramic Mug with Color Inside (${details})`
        : "White Ceramic Mug with Color Inside";
    }

    if (productKey === "coaster") {
      const sizeLabel = selectedSize ?? selectedVariant?.size ?? selectedVariant?.name;
      return sizeLabel ? `Cork-Back Coaster (${sizeLabel})` : "Cork-Back Coaster";
    }

    if (productKey === "journal") {
      const sizeLabel = selectedSize ?? selectedVariant?.size ?? selectedVariant?.name;
      return sizeLabel
        ? `Hardcover Journal Matte (${sizeLabel})`
        : "Hardcover Journal Matte";
    }

    if (productKey === "tshirt") {
      const size = selectedSize;
      const color = selectedColor;
      const details = [size, color].filter(Boolean).join(" / ");
      return details ? `Unisex T-Shirt (${details})` : "Unisex T-Shirt";
    }

    return "";
  };

  const getPricingVariant = (): string | null => {
    if (!productKey || !selectedVariant) return null;

    if (productKey === "tshirt") {
      return selectedSize?.trim().toUpperCase() ?? null;
    }

    if (
      productKey === "poster" ||
      productKey === "canvas" ||
      productKey === "framedPoster"
    ) {
      return (
        extractPosterSizeKeySafe(selectedVariant?.size) ??
        extractPosterSizeKeySafe(selectedVariant?.name) ??
        normalizePosterSizeKey(selectedVariant?.size)
      );
    }

    if (isMugProductKey(productKey)) {
      const mugSource = `${selectedVariant?.size ?? ""} ${selectedVariant?.name ?? ""}`.trim();
      const mugMatch = mugSource.match(/(11|15|20)\s*oz/i);
      return mugMatch ? `${mugMatch[1]} oz` : null;
    }

    if (productKey === "coaster") {
      return (
        normalizeCoasterSizeKey(selectedVariant?.size) ??
        normalizeCoasterSizeKey(selectedVariant?.name)
      );
    }

    if (productKey === "journal") {
      return (
        normalizeJournalSizeKey(selectedVariant?.size) ??
        normalizeJournalSizeKey(selectedVariant?.name)
      );
    }

    return null;
  };

  const pricingVariant = getPricingVariant();

  useEffect(() => {
    if (!productKey || !pricingVariant || !pricingCountryCode) {
      setPricingTotal(null);
      setPricingError(null);
      return;
    }

    const controller = new AbortController();

    fetch("/api/pricing/product-price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productType: productKey,
        variant: pricingVariant,
        countryCode: pricingCountryCode,
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const payload = (await parseJsonSafely(res)) as
          | { totalPrice?: number; error?: string }
          | null;

        if (!res.ok || !payload || typeof payload.totalPrice !== "number") {
          throw new Error(payload?.error ?? "Failed to calculate price");
        }

        setPricingTotal(payload.totalPrice);
        setPricingError(null);
      })
      .catch((err: unknown) => {
        if ((err as Error).name === "AbortError") return;
        setPricingTotal(null);
        setPricingError(err instanceof Error ? err.message : "Failed to calculate price");
      });

    return () => controller.abort();
  }, [productKey, pricingVariant, pricingCountryCode]);

  const selectedProductConfig = useMemo<SelectedProductConfig | null>(() => {
    if (!productKey || !variantId || !selectedVariant || !pricingVariant || pricingTotal === null) {
      return null;
    }

    const colorHex =
      productKey === "tshirt" ||
      productKey === "mugBlackGlossy" ||
      productKey === "mugColorInside" ||
      productKey === "framedPoster"
        ? selectedColor
          ? colorHexMap.get(selectedColor)
          : undefined
        : undefined;
    const posterSize =
      productKey === "poster" || productKey === "canvas" || productKey === "framedPoster"
        ? getPosterSizeLabel()
        : undefined;
    const mugSize = isMugProduct
      ? (selectedVariant.size ?? selectedVariant.name)
      : undefined;

    const printPosition =
      isMugProduct
        ? mugPreviewMode === "center"
          ? "center"
          : "two-side"
        : undefined;

    return {
      productKey,
      variantId,
      variantName: selectedVariant.name,
      size:
        productKey === "tshirt"
          ? selectedSize ?? undefined
          : productKey === "poster" || productKey === "canvas" || productKey === "framedPoster"
          ? posterSize ?? undefined
          : productKey === "coaster"
          ? selectedSize ?? selectedVariant.size ?? selectedVariant.name ?? undefined
          : productKey === "journal"
          ? selectedSize ?? selectedVariant.size ?? selectedVariant.name ?? undefined
          : isMugProduct
          ? mugSize ?? undefined
          : undefined,
      color:
        productKey === "tshirt" ||
        productKey === "mugBlackGlossy" ||
        productKey === "mugColorInside" ||
        productKey === "framedPoster"
          ? selectedColor ?? undefined
          : undefined,
      colorHex:
        productKey === "tshirt" ||
        productKey === "mugBlackGlossy" ||
        productKey === "mugColorInside" ||
        productKey === "framedPoster"
          ? colorHex
          : undefined,
      printPosition,
      aspect,
      variantIdUsedForPreview: previewVariantId,
      pricingVariant,
      shippingCountry: pricingCountryCode,
      price: pricingTotal,
      previewImageUrl: previewImageUrl ?? "",
      isBackgroundRemoved: Boolean(useTransparent && transparentImageUrl),
    };
  }, [
    productKey,
    variantId,
    selectedVariant,
    pricingTotal,
    pricingVariant,
    pricingCountryCode,
    selectedSize,
    selectedColor,
    mugPreviewMode,
    previewImageUrl,
    useTransparent,
    transparentImageUrl,
    previewVariantId,
    aspect,
  ]);

  const regeneratePreview = async () => {
    if (isPaidTrafficFunnel) return;
    if (!variantId || !previewImageUrl || !productKey) return;

    try {
      setLoadingPreview(true);
      setError(null);

      const res = await fetch("/api/printful/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productKey,
          imageUrl: previewImageUrl,
          aspect,
          variantId, // 🔥 IMPORTANT
          paidTrafficUser: isPaidTrafficFunnel,
        }),
      });

      const data = await parseJsonSafely(res);
      const fallbackError = "Preview unavailable. Please try again in a moment.";

      if (!data) {
        throw new Error(fallbackError);
      }

      if (data.error === "INSUFFICIENT_CREDITS") {
        setError(null);
        openCreditUpgrade("preview", 0.1, () => {
          void regeneratePreview();
        });
        return;
      }

      if (!res.ok) {
        if (data.error === "PRINTFUL_RATE_LIMIT" && data.retryAfter) {
          setPreviewCooldown(data.retryAfter);
          onCooldownStart?.(data.retryAfter);
          return;
        }

        throw new Error(data.error || fallbackError);
      }

      setMockupUrl(data.mockupUrl);
      setPreviewVariantId(variantId);
      trackPreviewEvent({
        variantId,
        chargedCredits:
          typeof data.chargedCredits === "number" ? data.chargedCredits : 0.1,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const refreshPreview = async (
    imageForPreview: string,
    override?: {
      variantId?: number;
      previewMode?: "two-side" | "center" | "full-wrap";
    }
  ) => {
    if (!productKey || !imageForPreview) return;

    const nextPreviewVariantId = override?.variantId ?? variantId ?? null;
    try {
      setLoadingPreview(true);
      setError(null);

      const res = await fetch("/api/printful/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productKey,
          imageUrl: imageForPreview,
          aspect,
          variantId: override?.variantId ?? variantId ?? undefined,
          previewMode: override?.previewMode,
          paidTrafficUser: isPaidTrafficFunnel,
        }),
      });

      const data = await parseJsonSafely(res);
      const fallbackError = "Preview unavailable. Please try again in a moment.";

      if (!data) {
        throw new Error(fallbackError);
      }

      if (data.error === "INSUFFICIENT_CREDITS") {
        setError(null);
        openCreditUpgrade("preview", 0.1, () => {
          void refreshPreview(imageForPreview, override);
        });
        return;
      }

      if (!res.ok) {
        if (data.error === "PRINTFUL_RATE_LIMIT" && data.retryAfter) {
          setPreviewCooldown(data.retryAfter);
          onCooldownStart?.(data.retryAfter);
          return;
        }

        throw new Error(data.error || fallbackError);
      }

      setMockupUrl(data.mockupUrl);
      setPreviewVariantId(nextPreviewVariantId);
      trackPreviewEvent({
        variantId: nextPreviewVariantId ?? undefined,
        chargedCredits:
          typeof data.chargedCredits === "number" ? data.chargedCredits : 0.1,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleToggleTransparent = async () => {
    if (!originalImageUrl) return;
    if (requiresBackgroundCredits && !hasBackgroundCredits) {
      openCreditUpgrade("remove_background", 1, () => {
        void handleToggleTransparent();
      });
      return;
    }
    const previewOverride =
      isMugProduct
        ? { variantId: mugVariantId ?? undefined, previewMode: mugPreviewMode }
        : { variantId: variantId ?? undefined };

    if (useTransparent) {
      setUseTransparent(false);
      await refreshPreview(originalImageUrl, previewOverride);
      return;
    }

    if (transparentImageUrl) {
      setUseTransparent(true);
      await refreshPreview(transparentImageUrl, previewOverride);
      return;
    }

    const imageId = extractImageId(originalImageUrl);
    if (!imageId) {
      setError("Failed to determine image id");
      return;
    }

    try {
      setIsRemovingBackground(true);
      setError(null);

      const res = await fetch("/api/image/remove-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId, paidTrafficUser: isPaidTrafficFunnel }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.error === "INSUFFICIENT_CREDITS") {
          setError(null);
          openCreditUpgrade("remove_background", 1, () => {
            void handleToggleTransparent();
          });
          return;
        }
        throw new Error(data?.error || "Background removal failed");
      }

      const nextTransparentUrl = data?.transparentImageUrl as string | undefined;
      if (!nextTransparentUrl) {
        throw new Error("Background removal failed");
      }

      setTransparentImageUrl(nextTransparentUrl);
      setUseTransparent(true);
      trackEvent("remove_background", {
        source: "preview",
        user_credits_before_action: creditsQuery.data ?? null,
        required_credits: 1,
        ...funnelContext,
        country: pricingCountryCode,
      });
      await refreshPreview(nextTransparentUrl, previewOverride);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRemovingBackground(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-4xl relative max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Product Preview
          </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-black dark:hover:text-white"
        >
          ✕
        </button>
        </div>

        <div className="px-4 sm:px-6 py-4 overflow-y-auto">

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-3">
            {error === "INSUFFICIENT_CREDITS" ? (
              <>
                <div className="font-semibold">Preview is currently unavailable</div>
                <div>
                  Product preview is free now. Please try again in a moment.
                </div>
              </>
            ) : error === "BACKGROUND_INSUFFICIENT_CREDITS" ? (
              <>
                <div className="font-semibold">Background removal requires credits</div>
                <div>
                  Buy credits to remove the background from this image.{" "}
                  <Link
                    href="/buy-credits"
                    className="underline font-semibold"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Buy credits
                  </Link>
                </div>
              </>
            ) : (
              error
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* LEFT COLUMN — IMAGE */}
          <div className="relative flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            {loadingPreview && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 text-gray-700">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                <div>Generating preview…</div>
              </div>
            )}
            {mockupUrl && (
              <img
                src={mockupUrl}
                alt="Product preview"
                className="max-h-[420px] w-auto rounded-md"
              />
            )}
          </div>

          {/* RIGHT COLUMN — PRODUCT INFO */}
          <div>
            {/* Product title */}
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-xl font-semibold capitalize">
                {productKey ? PRODUCT_PRESENTATION[productKey].title : ""}
              </h4>
              {infoText && (
                <span className="relative inline-flex items-center group/info">
                  <button
                    type="button"
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:text-gray-300 dark:hover:text-white"
                    aria-label="Product info"
                  >
                    i
                  </button>
                  <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-52 -translate-x-1/2 rounded-md bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/info:opacity-100 group-focus-within/info:opacity-100">
                    {infoLines.map((line, index) => (
                      <div key={index} className={index === 0 ? "font-semibold" : ""}>
                        {line}
                      </div>
                    ))}
                  </span>
                </span>
              )}
            </div>

            <div className="mb-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Remove background
                  </div>
                  <div className="text-xs text-gray-500">
                    Costs 1 credit (one-time per image)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleTransparent}
                  disabled={
                    !originalImageUrl ||
                    isRemovingBackground ||
                    loadingPreview ||
                    previewCooldown !== null
                  }
                  aria-pressed={useTransparent}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition
                    ${useTransparent ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"}
                    ${(isRemovingBackground || loadingPreview || previewCooldown !== null || (requiresBackgroundCredits && !hasBackgroundCredits)) ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"}
                  `}
                >
                  {isRemovingBackground ? "Removing" : useTransparent ? "On" : "Off"}
                </button>
              </div>
              {requiresBackgroundCredits && !hasBackgroundCredits && (
                <div className="mt-2 text-xs text-gray-500">
                  Removing the background costs 1 credit.
                </div>
              )}
            </div>

            {previewCooldown !== null && (
              <div className="mb-4 rounded-lg bg-yellow-100 text-yellow-900 px-4 py-3 text-sm">
                ⏳ Preview temporarily paused due to high demand.
                <br />
                You can try again in <strong>{previewCooldown}s</strong>.
              </div>
            )}

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Printed on demand • High-quality materials
            </p>

            {(productKey === "poster" || productKey === "canvas") && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                {productKey === "canvas" ? "Canvas size" : "Poster size"}
              </h4>

              <div className="flex flex-wrap gap-2">
                {variants
                  .filter(v =>
                    productKey === "canvas"
                      ? CANVAS_VARIANTS_BY_ASPECT[aspect]?.includes(v.id)
                      : POSTER_VARIANTS_BY_ASPECT[aspect]?.includes(v.id),
                  )
                  .map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVariantId(v.id)}
                      className={`px-4 py-2 rounded-md border text-sm transition
                        ${
                          variantId === v.id
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "border-gray-300 text-gray-900 hover:border-gray-400 dark:border-gray-600 dark:text-white dark:hover:border-gray-400"
                        }
                      `}
                    >
                      {(() => {
                        const sizeKey =
                          extractPosterSizeKeySafe(v.size) ??
                          extractPosterSizeKeySafe(v.name) ??
                          normalizePosterSizeKey(v.size);
                        return sizeKey ? formatPosterSizeLabelSafe(sizeKey) : v.name;
                      })()}
                    </button>
                  ))}
              </div>
            </div>
          )}

            {isFramedPoster && (
              <>
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                    Frame color
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => {
                      const resolvedColor = color ?? "";
                      const hex = colorHexMap.get(resolvedColor) ?? "#e5e7eb";
                      return (
                        <button
                          key={resolvedColor}
                          type="button"
                          onClick={() => setSelectedColor(resolvedColor)}
                          className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                            selectedColor === resolvedColor
                              ? "bg-blue-500 border-blue-500 text-white"
                              : "border-gray-300 text-gray-900 hover:border-gray-400 dark:border-gray-600 dark:text-white dark:hover:border-gray-400"
                          }`}
                        >
                          <span
                            className="h-4 w-4 rounded-full border border-black/10"
                            style={{ backgroundColor: hex }}
                          />
                          <span>{resolvedColor}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                    Framed poster size
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((sizeKey) => {
                      const normalizedSizeKey = sizeKey ?? "";
                      return (
                        <button
                          key={normalizedSizeKey}
                          type="button"
                          onClick={() => setSelectedSize(normalizedSizeKey)}
                          className={`px-4 py-2 rounded-md border text-sm transition ${
                            selectedSize === normalizedSizeKey
                              ? "bg-blue-500 border-blue-500 text-white"
                              : "border-gray-300 text-gray-900 hover:border-gray-400 dark:border-gray-600 dark:text-white dark:hover:border-gray-400"
                          }`}
                        >
                          {formatPosterSizeLabelSafe(normalizedSizeKey)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {isCoaster && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                  Coaster size
                </h4>

                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => {
                    const value = v.size ?? v.name;
                    if (!value) return null;

                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedSize(value);
                          setVariantId(v.id);
                        }}
                        className={`px-4 py-2 rounded-md border text-sm transition ${
                          variantId === v.id
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "border-gray-300 text-gray-900 hover:border-gray-400 dark:border-gray-600 dark:text-white dark:hover:border-gray-400"
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {isMugProduct && !isPaidTrafficFunnel && (
            <>
              {isMugColorInside && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                    Inside color
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => {
                      const resolvedColor = color ?? "";
                      const hex = colorHexMap.get(resolvedColor) ?? "#e5e7eb";
                      return (
                        <button
                          key={resolvedColor}
                          type="button"
                          onClick={() => setSelectedColor(resolvedColor)}
                          className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                            selectedColor === resolvedColor
                              ? "bg-blue-500 border-blue-500 text-white"
                              : "border-gray-300 text-gray-900 hover:border-gray-400 dark:border-gray-600 dark:text-white dark:hover:border-gray-400"
                          }`}
                        >
                          <span
                            className="h-4 w-4 rounded-full border border-black/10"
                            style={{ backgroundColor: hex }}
                          />
                          <span>{resolvedColor}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mug size selector */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Mug size</h4>

                <div className="flex flex-wrap gap-2">
                  {(isMugColorInside ? availableSizes : variants.map((v) => v.size ?? v.name)).map((value) => {
                    if (!value) return null;
                    const isActive = isMugColorInside
                      ? selectedSize === value
                      : variants.find((v) => v.id === mugVariantId)?.size === value ||
                        variants.find((v) => v.id === mugVariantId)?.name === value;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          if (isMugColorInside) {
                            setSelectedSize(value);
                            return;
                          }

                          const nextVariant = variants.find((v) => (v.size ?? v.name) === value);
                          if (!nextVariant) return;
                          if (isMugBlackGlossy) {
                            setSelectedColor(nextVariant.color ?? null);
                          }
                          setMugVariantId(nextVariant.id);
                          setVariantId(nextVariant.id);
                        }}
                        className={`px-4 py-2 rounded-md border text-sm transition ${
                          isActive
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "border-gray-300 text-gray-900 hover:border-gray-400 dark:border-gray-600 dark:text-white dark:hover:border-gray-400"
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Print position selector */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Print position</h4>

                <div className="flex gap-2">
                  {["two-side", "center"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setMugPreviewMode(mode as any)}
                      className={`px-4 py-2 rounded-md border text-sm transition capitalize
                        ${
                          mugPreviewMode === mode
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "border-gray-300 text-gray-900 hover:border-gray-400 dark:border-gray-600 dark:text-white dark:hover:border-gray-400"
                        }
                      `}
                    >
                      {mode.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

            {/* T-Shirt variant selector */}
            {productKey === "tshirt" && (
              <>
                {/* Color selector */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Color</h4>

                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => {
                      const hex = colorHexMap.get(color!);

                      if (!hex) return null; // safety guard

                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color!)}
                          title={color}
                          className={`w-8 h-8 rounded-full border-2 transition
                            ${
                              selectedColor === color
                                ? "border-blue-500 ring-2 ring-blue-500"
                                : "border-gray-400 dark:border-gray-600"
                            }
                          `}
                          style={{ backgroundColor: hex }}
                        />
                      );
                    })}
                  </div>

                </div>

                {/* Size selector */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Size</h4>
                    {/*<button className="text-xs text-blue-400 hover:underline">
                      Size guide
                    </button>*/}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => size && setSelectedSize(size)}
                        className={`px-4 py-2 border rounded-md text-sm transition
                          ${
                            selectedSize === size
                              ? "border-blue-500 bg-blue-500 text-white"
                            : "border-gray-300 text-gray-900 hover:border-gray-400 dark:border-gray-600 dark:text-white dark:hover:border-gray-400"
                          }
                        `}
                      >
                        {size}
                      </button>
                    ))}
                  </div>

                </div>
              </>
            )}

            {productKey === "tshirt" && selectedColor && selectedSize && !isPaidTrafficFunnel && (
              <Button
                className="w-full mb-4"
                disabled={
                  loadingPreview ||
                  previewCooldown !== null ||
                  isRemovingBackground ||
                  (productKey === "tshirt" && (!selectedColor || !selectedSize))
                }
                onClick={regeneratePreview}
              >
                {loadingPreview ? "Updating preview…" : "Update preview"}
              </Button>

            )}

            {(productKey === "poster" || productKey === "canvas" || productKey === "framedPoster") && variantId && !isPaidTrafficFunnel && (
              <Button
                className="w-full mb-4"
                disabled={loadingPreview || previewCooldown !== null || isRemovingBackground}
                onClick={regeneratePreview}
              >
                {loadingPreview ? "Updating preview…" : "Update preview"}
              </Button>
            )}

            {isMugProduct && mugVariantId && !isPaidTrafficFunnel && (
            <Button
              className="w-full mb-4"
              disabled={loadingPreview || previewCooldown !== null || isRemovingBackground}
              onClick={async () => {
                try {
                  setLoadingPreview(true);
                  setError(null);
                  await refreshPreview(previewImageUrl ?? "", {
                    variantId: mugVariantId,
                    previewMode: mugPreviewMode,
                  });
                } catch (err: any) {
                  setError(err.message);
                } finally {
                  setLoadingPreview(false);
                }
              }}
            >
              {loadingPreview ? "Updating preview…" : "Update preview"}
            </Button>
          )}

            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                Shipping country
              </label>
              <select
                value={pricingCountryCode}
                onChange={(e) => setPricingCountryCode(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {shippingCountries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </option>
                ))}
              </select>
            </div>

            {(availabilityError || pricingError) && (
              <div className="mb-4 rounded-lg bg-red-100 text-red-700 p-3 text-sm">
                {availabilityError ?? pricingError}
              </div>
            )}

            {pricingTotal !== null && (
              <div className="mb-4 rounded-lg bg-gray-50 dark:bg-gray-800 p-4 text-center">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  {getProductSelectionLabel()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Product Total
                </div>
                {isRamadanMugOffer ? (
                  <>
                    <div className="mb-1 flex items-center justify-center gap-2">
                      <span className="text-base text-gray-500 line-through">
                        ${(pricingTotal * 2).toFixed(2)}
                      </span>
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                        50% OFF
                      </span>
                    </div>
                    <div className="text-3xl font-bold">${pricingTotal.toFixed(2)}</div>
                    <div className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                      Offer ends in: {formatOfferCountdown(offerRemainingSeconds)}
                    </div>
                    <div className="mt-1 text-xs text-red-600">Harry up! Offer ended</div>
                  </>
                ) : (
                  <div className="text-3xl font-bold">${pricingTotal.toFixed(2)}</div>
                )}

                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  <div>Shipping: FREE</div>
                  <div>Total: ${pricingTotal.toFixed(2)}</div>
                </div>
              </div>
            )}

            {productKey && <ProductNudgeBlock productType={productKey} />}

            {/* CTA */}
            <Button
              className="w-full"
              disabled={!variantId || isRemovingBackground}
              onClick={async () => {
              if (
                !selectedProductConfig ||
                !previewImageUrl ||
                !mockupUrl
              ) {
                return;
              }

              const res = await createOrder.mutateAsync({
                productKey: selectedProductConfig.productKey,
                variantId: selectedProductConfig.variantId,
                variantName: selectedProductConfig.variantName,
                size: selectedProductConfig.size,
                color: selectedProductConfig.color,
                colorHex: selectedProductConfig.colorHex,
                previewMode: selectedProductConfig.printPosition,
                previewVariantId: selectedProductConfig.variantIdUsedForPreview ?? undefined,
                aspect: selectedProductConfig.aspect,
                isBackgroundRemoved: selectedProductConfig.isBackgroundRemoved,
                snapshotVariantId: selectedProductConfig.variantId,
                snapshotSize: selectedProductConfig.size,
                snapshotColor: selectedProductConfig.color,
                snapshotPrintPosition: selectedProductConfig.printPosition,
                snapshotBackgroundRemoved: selectedProductConfig.isBackgroundRemoved,
                imageUrl: previewImageUrl,
                mockupUrl,
                pricingVariant: selectedProductConfig.pricingVariant,
                shippingCountry: selectedProductConfig.shippingCountry,
                price: selectedProductConfig.price,
                currency: "USD",
                funnelSource: isPaidTrafficFunnel ? "paid-traffic-offer" : undefined,
              });

              const checkoutQuery = res.accessToken
                ? `orderId=${res.orderId}&accessToken=${encodeURIComponent(res.accessToken)}`
                : `orderId=${res.orderId}`;
              const sourceQuery = sourcePage
                ? `&sourcePage=${encodeURIComponent(sourcePage)}&generator=${encodeURIComponent(sourcePage)}`
                : "";
              void router.push(`/checkout?${checkoutQuery}${sourceQuery}`);
            }}
            >
              Continue to checkout
            </Button>

            {isMugProduct && (
              <p className="mt-2 text-center text-xs text-gray-600 dark:text-gray-400">
                Order today - ships in 2–4 business days.
              </p>
            )}
            {productKey === "tshirt" && (
              <p className="mt-2 text-center text-xs text-gray-600 dark:text-gray-400">
                Printed on demand in the USA.
              </p>
            )}
            {productKey === "poster" && (
              <p className="mt-2 text-center text-xs text-gray-600 dark:text-gray-400">
                Ready to frame and display.
              </p>
            )}
            {productKey === "canvas" && (
              <p className="mt-2 text-center text-xs text-gray-600 dark:text-gray-400">
                Hand-stretched canvas with mounting brackets included.
              </p>
            )}
            {productKey === "framedPoster" && (
              <p className="mt-2 text-center text-xs text-gray-600 dark:text-gray-400">
                Ready to hang with included hardware.
              </p>
            )}
            {isCoaster && (
              <p className="mt-2 text-center text-xs text-gray-600 dark:text-gray-400">
                Water-repellent coaster with cork backing.
              </p>
            )}
            {isJournal && (
              <p className="mt-2 text-center text-xs text-gray-600 dark:text-gray-400">
                Matte hardcover journal with 150 lined pages.
              </p>
            )}

            <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-2">
              Payments secured by Stripe
            </p>
          </div>
        </div>
        </div>
        <CreditUpgradeModal
          isOpen={creditUpgradeOpen}
          requiredCredits={creditUpgradeRequired}
          currentCredits={creditsQuery.data ?? 0}
          context={creditUpgradeContext}
          sourcePage={sourcePage}
          country={pricingCountryCode}
          onClose={() => setCreditUpgradeOpen(false)}
          onSuccess={() => {
            setCreditUpgradeOpen(false);
            trackEvent("generation_resumed_after_upgrade", {
              context: creditUpgradeContext,
              user_credits_before_action: creditsQuery.data ?? null,
              required_credits: creditUpgradeRequired,
              ...funnelContext,
              country: pricingCountryCode,
            });
            const action = pendingCreditActionRef.current;
            pendingCreditActionRef.current = null;
            action?.();
          }}
        />
      </div>
    </div>
  );
}

