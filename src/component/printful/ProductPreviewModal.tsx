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
import { ProductNudgeBlock } from "~/component/Nudge/ProductNudgeBlock";
import { CreditUpgradeModal } from "~/component/Credits/CreditUpgradeModal";
import {
  POSTER_VARIANT_INFO,
  MUG_VARIANT_INFO,
  TSHIRT_SIZE_INFO,
} from "~/config/productVariantInfo";

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
  productKey: "poster" | "tshirt" | "mug" | null;
  imageUrl: string | null;
  aspect: AspectRatio;
  onCooldownStart?: (seconds: number) => void;
};

type SelectedProductConfig = {
  productKey: "poster" | "tshirt" | "mug";
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

export function ProductPreviewModal({
  isOpen,
  onClose,
  productKey,
  imageUrl,
  aspect,
  onCooldownStart,
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
    if (pathname.includes("arabic-name-art-generator")) return "arabic-name-art-generator";
    if (pathname.includes("couples-name-art-generator") || pathname.includes("couples-art-generator")) {
      return "couples-art-generator";
    }
    return "name-art-generator";
  }, [router.pathname]);

  const [error, setError] = useState<string | null>(null);

  const [previewCooldown, setPreviewCooldown] = useState<number | null>(null);
  const [creditUpgradeOpen, setCreditUpgradeOpen] = useState(false);
  const [creditUpgradeContext, setCreditUpgradeContext] = useState<"generate" | "preview" | "remove_background">("preview");
  const [creditUpgradeRequired, setCreditUpgradeRequired] = useState(0);
  const pendingCreditActionRef = useRef<null | (() => void)>(null);
  const hasInitializedRef = useRef(false);
  const lastProductKeyRef = useRef<Props["productKey"]>(null);
  const creditsQuery = api.user.getCredits.useQuery(undefined, { enabled: isOpen });
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

  // Poster info depends on async variant selection (Printful)
  // Must be derived reactively from selectedVariant
  const posterInfoText = useMemo(() => {
    if (productKey !== "poster") return undefined;
    const sizeKey =
      extractPosterSizeKeySafe(selectedVariant?.size) ??
      extractPosterSizeKeySafe(selectedVariant?.name) ??
      (normalizePosterSizeKey(selectedVariant?.size) || null);
    if (!sizeKey) return undefined;

    return POSTER_VARIANT_INFO[sizeKey];
  }, [productKey, selectedVariant]);

  const getVariantInfo = () => {
    if (!productKey) return "";

    if (productKey === "poster") {
      return posterInfoText ?? "";
    }

    if (productKey === "mug") {
      const mugName = selectedVariant?.name ?? "";
      const mugMatch = Object.keys(MUG_VARIANT_INFO).find((key) =>
        mugName.includes(key)
      );
      return mugMatch ? MUG_VARIANT_INFO[mugMatch] : "";
    }

    if (productKey === "tshirt") {
      return selectedSize ? TSHIRT_SIZE_INFO[selectedSize] ?? "" : "";
    }

    return "";
  };

  const isTshirt = productKey === "tshirt";

  const colors = isTshirt
    ? Array.from(
        new Map(
          variants
            .filter(v => v.color)
            .map(v => [v.color!, v])
        ).keys()
      )
    : [];

  const sizes = isTshirt
    ? Array.from(
        new Set(
          variants
            .filter(v => v.size)
            .map(v => v.size!)
        )
      )
    : [];

    const availableSizes = Array.from(
      new Set(variants.map(v => v.size).filter(Boolean))
    );

  const availableColors = Array.from(
    new Set(
      variants
        .filter(v => !selectedSize || v.size === selectedSize)
        .map(v => v.color)
        .filter(Boolean)
    )
  );

  const ensureDefaultSelection = (
    key: Props["productKey"],
    nextVariants: Variant[]
  ) => {
    if (!key || !nextVariants.length) return;

    if (key === "poster") {
      if (variantId) return;
      const allowed = POSTER_VARIANTS_BY_ASPECT[aspect];
      const defaultVariant = nextVariants.find((v) => allowed?.includes(v.id));
      if (defaultVariant) {
        setVariantId(defaultVariant.id);
      }
      return;
    }

    if (key === "mug") {
      if (variantId || mugVariantId) return;
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

    if (key === "tshirt") {
      if (selectedSize || selectedColor) return;
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
      if (match) setVariantId(match.id);
    }
  };

  /* ---------------------------------------------------
     1) Generate preview (already costs 0.1 credit)
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
        body: JSON.stringify({ productKey, imageUrl: originalImageUrl, aspect }),
      });
      const data = await parseJsonSafely(res);
      const fallbackError = "Preview unavailable. Please try again in a moment.";

      if (!data) throw new Error(fallbackError);

      if (data.error === "INSUFFICIENT_CREDITS") {
        setError(null);
        openCreditUpgrade("preview", 0.1, () => {
          void requestInitialPreview();
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

      if (!data.mockupUrl) return;
      setMockupUrl(data.mockupUrl);
      setPreviewVariantId(null);
      trackEvent("generate_product_preview", {
        product: productKey,
        variantId: variantId ?? undefined,
        source_page: sourcePage,
        user_credits_before_action: creditsQuery.data ?? null,
        required_credits: 0.1,
        country: pricingCountryCode,
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
    setUseTransparent(false);
    setTransparentImageUrl(null);
    setIsRemovingBackground(false);
  }, [originalImageUrl]);

  /* ---------------------------------------------------
     2) Fetch LIVE variants from Printful
  --------------------------------------------------- */
  useEffect(() => {
    if (!isOpen || !productKey) return;

    fetch(`/api/printful/variants?productKey=${productKey}`)
      .then((res) => res.json())
      .then((data) => {
        const nextVariants = data.variants || [];
        setVariants(nextVariants);
        ensureDefaultSelection(productKey, nextVariants);
      })
      .catch(() => {
        setError("Failed to load product options");
      });
  }, [productKey]);

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


  const colorHexMap = new Map<string, string>();

  variants.forEach((v) => {
    if (v.color && (v as any).color_code) {
      if (!colorHexMap.has(v.color)) {
        colorHexMap.set(v.color, (v as any).color_code);
      }
    }
  });

  const [pricingCountryCode, setPricingCountryCode] = useState<string>("US");
  const [pricingTotal, setPricingTotal] = useState<number | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const shippingCountries = useMemo(() => ["US"], []);

  useEffect(() => {
    if (shippingCountries.includes(pricingCountryCode)) return;
    setPricingCountryCode("US");
  }, [pricingCountryCode, shippingCountries]);

  const createOrder = api.productOrder.createPendingOrder.useMutation();

  const infoText = getVariantInfo();
  const infoLines = infoText ? infoText.split("\n") : [];

  const getPosterSizeLabel = () => {
    const sizeKey =
      extractPosterSizeKeySafe(selectedVariant?.size) ??
      extractPosterSizeKeySafe(selectedVariant?.name) ??
      normalizePosterSizeKey(selectedVariant?.size);
    return sizeKey ? formatPosterSizeLabelSafe(sizeKey) : selectedVariant?.name;
  };

  const getProductSelectionLabel = () => {
    if (!productKey) return "";

    if (productKey === "poster") {
      const sizeLabel = getPosterSizeLabel();
      return sizeLabel ? `Premium Poster (${sizeLabel})` : "Premium Poster";
    }

    if (productKey === "mug") {
      const sizeLabel = selectedVariant?.size ?? selectedVariant?.name;
      return sizeLabel ? `White Glossy Mug (${sizeLabel})` : "White Glossy Mug";
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

    if (productKey === "poster") {
      return (
        extractPosterSizeKeySafe(selectedVariant?.size) ??
        extractPosterSizeKeySafe(selectedVariant?.name) ??
        normalizePosterSizeKey(selectedVariant?.size)
      );
    }

    const mugSource = `${selectedVariant?.size ?? ""} ${selectedVariant?.name ?? ""}`.trim();
    const mugMatch = mugSource.match(/(11|15|20)\s*oz/i);
    return mugMatch ? `${mugMatch[1]} oz` : null;
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

    const colorHex = selectedColor ? colorHexMap.get(selectedColor) : undefined;
    const posterSize = productKey === "poster" ? getPosterSizeLabel() : undefined;
    const mugSize = productKey === "mug" ? (selectedVariant.size ?? selectedVariant.name) : undefined;

    const printPosition =
      productKey === "mug"
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
          : productKey === "poster"
          ? posterSize ?? undefined
          : productKey === "mug"
          ? mugSize ?? undefined
          : undefined,
      color: productKey === "tshirt" ? selectedColor ?? undefined : undefined,
      colorHex: productKey === "tshirt" ? colorHex : undefined,
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
      trackEvent("generate_product_preview", {
        product: productKey,
        variantId,
        source_page: sourcePage,
        user_credits_before_action: creditsQuery.data ?? null,
        required_credits: 0.1,
        country: pricingCountryCode,
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
      trackEvent("generate_product_preview", {
        product: productKey,
        variantId: nextPreviewVariantId ?? undefined,
        source_page: sourcePage,
        user_credits_before_action: creditsQuery.data ?? null,
        required_credits: 0.1,
        country: pricingCountryCode,
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
      productKey === "mug"
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
        body: JSON.stringify({ imageId }),
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
        source_page: sourcePage,
        user_credits_before_action: creditsQuery.data ?? null,
        required_credits: 1,
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
                <div className="font-semibold">Product previews require credits</div>
                <div>
                  Buy credits to generate a product preview and complete your purchase.{" "}
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
                {productKey === "poster" && "Premium Poster"}
                {productKey === "tshirt" && "Unisex T-Shirt"}
                {productKey === "mug" && "White Glossy Mug"}
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

            {productKey === "poster" && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                Poster size
              </h4>

              <div className="flex flex-wrap gap-2">
                {variants
                  .filter(v => POSTER_VARIANTS_BY_ASPECT[aspect]?.includes(v.id))
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

            {productKey === "mug" && (
            <>
              {/* Mug size selector */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Mug size</h4>

                <div className="flex gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setMugVariantId(v.id);
                        setVariantId(v.id);
                      }}
                      className={`px-4 py-2 rounded-md border text-sm transition
                        ${
                          mugVariantId === v.id
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "border-gray-300 text-gray-900 hover:border-gray-400 dark:border-gray-600 dark:text-white dark:hover:border-gray-400"
                        }
                      `}
                    >
                      {v.size ?? v.name}
                    </button>
                  ))}
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

            {productKey === "tshirt" && selectedColor && selectedSize && (
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

            {productKey === "poster" && variantId && (
              <Button
                className="w-full mb-4"
                disabled={loadingPreview || previewCooldown !== null || isRemovingBackground}
                onClick={regeneratePreview}
              >
                {loadingPreview ? "Updating preview…" : "Update preview"}
              </Button>
            )}

            {productKey === "mug" && mugVariantId && (
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
                {shippingCountries.map((code) => (
                  <option key={code} value={code}>
                    United States ({code})
                  </option>
                ))}
              </select>
            </div>

            {pricingError && (
              <div className="mb-4 rounded-lg bg-red-100 text-red-700 p-3 text-sm">
                {pricingError}
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

                <div className="text-3xl font-bold">
                  ${pricingTotal.toFixed(2)}
                </div>

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
              });

              void router.push(`/checkout?orderId=${res.orderId}`);
            }}
            >
              Continue to checkout
            </Button>

            {productKey === "mug" && (
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
              source_page: sourcePage,
              user_credits_before_action: creditsQuery.data ?? null,
              required_credits: creditUpgradeRequired,
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

