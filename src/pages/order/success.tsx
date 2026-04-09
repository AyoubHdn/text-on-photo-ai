import { useRouter } from "next/router";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { SeoHead } from "~/component/SeoHead";
import { api } from "~/utils/api";
import { useEffect, useRef, useState } from "react";
import { trackEvent } from "~/lib/ga";
import { PRODUCT_PRESENTATION, isMugProductKey } from "~/config/physicalProducts";

export default function OrderSuccess() {
  const router = useRouter();
  const { orderId, generator, accessToken, sourcePage } = router.query;
  const { data: session } = useSession();
  const orderIdValue = typeof orderId === "string" ? orderId : "";
  const accessTokenValue =
    typeof accessToken === "string" ? accessToken : undefined;
  const generatorFromQuery = typeof generator === "string" ? generator : null;
  const sourcePageFromQuery = typeof sourcePage === "string" ? sourcePage : null;
  const isLoggedIn = Boolean(session?.user?.id);
  const shouldShowSaveDesignCta = Boolean(accessTokenValue) && !isLoggedIn;
  const orderQuery = api.productOrder.getOrder.useQuery(
    { orderId: orderIdValue, accessToken: accessTokenValue },
    { enabled: !!orderIdValue }
  );
  const [previewLoadFailed, setPreviewLoadFailed] = useState(false);
  const [nextGeneratorHref, setNextGeneratorHref] = useState("/name-art-generator");

  const order = orderQuery.data;
  const hasTrackedPurchaseRef = useRef(false);
  const hasTrackedMetaPurchaseRef = useRef(false);
  const hasTrackedMetaPhysicalPurchaseRef = useRef(false);
  const getPaidFunnelPurchaseContext = () => {
    const lastGenerator =
      typeof window !== "undefined" ? window.localStorage.getItem("last-generator") : null;
    const source = generatorFromQuery ?? sourcePageFromQuery ?? lastGenerator;

    if (source === "arabic-name-mug-v1") {
      return {
        funnel: "arabic_name_mug_v1",
        product_type: "physical_product",
        niche: "arabic_name_gift",
        traffic_type: "paid" as const,
        source_page: "arabic-name-mug-v1",
      };
    }

    if (source === "couple-name-mug-v1") {
      return {
        funnel: "couple_name_mug_v1",
        product_type: "physical_product",
        niche: "romantic",
        traffic_type: "paid" as const,
        source_page: "couple-name-mug-v1",
      };
    }

    if (source === "couple-avatar-name-mug-v1") {
      return {
        funnel: "couple_avatar_name_mug_v1",
        product_type: "physical_product",
        niche: "romantic",
        traffic_type: "paid" as const,
        source_page: "couple-avatar-name-mug-v1",
      };
    }

    if (source === "couple-names-only-mug-v1") {
      return {
        funnel: "couple_names_only_mug_v1",
        product_type: "physical_product",
        niche: "romantic",
        traffic_type: "paid" as const,
        source_page: "couple-names-only-mug-v1",
      };
    }

    if (source === "ramadan-mug-v2") {
      return {
        funnel: "ramadan_mug_v2",
        traffic_type: "paid" as const,
        source_page: "ramadan-mug-v2",
      };
    }

    return null;
  };
  const productLabel =
    order?.productKey === "tshirt"
      ? PRODUCT_PRESENTATION.tshirt.title
      : order?.productKey === "mug"
      ? PRODUCT_PRESENTATION.mug.title
      : order?.productKey === "mugBlackGlossy"
      ? PRODUCT_PRESENTATION.mugBlackGlossy.title
      : order?.productKey === "mugColorInside"
      ? PRODUCT_PRESENTATION.mugColorInside.title
      : order?.productKey === "coaster"
      ? PRODUCT_PRESENTATION.coaster.title
      : order?.productKey === "canvas"
      ? PRODUCT_PRESENTATION.canvas.title
      : order?.productKey === "framedPoster"
      ? PRODUCT_PRESENTATION.framedPoster.title
      : order?.productKey === "poster"
      ? PRODUCT_PRESENTATION.poster.title
      : "Product";

  const variantSummaryLegacy =
    order?.productKey === "tshirt"
      ? [order?.size, order?.color].filter(Boolean).join(" • ")
      : order?.productKey === "mug"
      ? [order?.size, order?.previewMode].filter(Boolean).join(" • ")
      : order?.productKey === "poster"
      ? [order?.variantName, order?.size].filter(Boolean).join(" • ")
      : "";

  const variantSummary =
    order?.productKey === "tshirt"
      ? [order?.size, order?.color].filter(Boolean).join(" / ")
      : isMugProductKey(order?.productKey)
      ? [order?.size, order?.color, order?.previewMode].filter(Boolean).join(" / ")
      : order?.productKey === "coaster"
      ? [order?.size].filter(Boolean).join(" / ")
      : order?.productKey === "canvas"
      ? [order?.size].filter(Boolean).join(" / ")
      : order?.productKey === "framedPoster"
      ? [order?.size, order?.color].filter(Boolean).join(" / ")
      : order?.productKey === "poster"
      ? [order?.variantName, order?.size].filter(Boolean).join(" / ")
      : "";

  const previewUrl = order?.mockupUrl || order?.imageUrl || "";
  const shouldShowPreview = !!previewUrl && !previewLoadFailed;

  useEffect(() => {
    const mapToHref = (value: string | null) => {
      if (value === "arabic-name-mug-v1") return "/arabic-name-mug-v1";
      if (value === "couple-name-mug-v1") return "/couple-name-mug-v1";
      if (value === "couple-avatar-name-mug-v1") return "/couple-avatar-name-mug-v1";
      if (value === "couple-names-only-mug-v1") return "/couple-names-only-mug-v1";
      if (value === "ramadan-mug-men") return "/ramadan-mug-men";
      if (value === "ramadan-mug-v2") return "/ramadan-mug-v2";
      if (value === "ramadan-mug") return "/ramadan-mug";
      if (value === "arabic-name-art-generator") return "/arabic-name-art-generator";
      if (value === "arabic") return "/arabic-name-art-generator";
      if (value === "couples-art-generator") return "/couples-name-art-generator";
      if (value === "couples") return "/couples-name-art-generator";
      return "/name-art-generator";
    };

    const preferredSource = generatorFromQuery ?? sourcePageFromQuery;
    if (preferredSource) {
      setNextGeneratorHref(mapToHref(preferredSource));
      return;
    }

    try {
      const fromStorage = window.localStorage.getItem("last-generator");
      setNextGeneratorHref(mapToHref(fromStorage));
    } catch {
      setNextGeneratorHref("/name-art-generator");
    }
  }, [generatorFromQuery, sourcePageFromQuery]);

  useEffect(() => {
    if (!order || hasTrackedPurchaseRef.current) return;
    const paidFunnelContext = getPaidFunnelPurchaseContext();
    if (typeof window !== "undefined" && orderIdValue) {
      const key = `ga4_purchase_${orderIdValue}`;
      if (window.sessionStorage.getItem(key)) {
        hasTrackedPurchaseRef.current = true;
        return;
      }
      window.sessionStorage.setItem(key, "1");
    }
    trackEvent("purchase", {
      value: Number(order.totalPrice ?? 0),
      currency: "USD",
      order_id: orderIdValue,
      ...(paidFunnelContext ?? {}),
    });
    hasTrackedPurchaseRef.current = true;
  }, [generatorFromQuery, order, orderIdValue, sourcePageFromQuery]);

  useEffect(() => {
    if (!order || !orderIdValue || hasTrackedMetaPurchaseRef.current) return;
    if (typeof window === "undefined") return;
    const paidFunnelContext = getPaidFunnelPurchaseContext();

    const key = `meta_purchase_${orderIdValue}`;
    if (window.sessionStorage.getItem(key)) {
      hasTrackedMetaPurchaseRef.current = true;
      return;
    }

    const maybeFbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
    if (typeof maybeFbq !== "function") return;

    maybeFbq(
      "track",
      "Purchase",
      {
        value: Number(order.totalPrice ?? 0),
        currency: "USD",
        content_type: "product",
        content_ids: [order.productKey],
        content_category: "physical_product",
        order_id: orderIdValue,
        ...(paidFunnelContext ?? {}),
      },
      { eventID: `physical_order_${orderIdValue}` },
    );

    window.sessionStorage.setItem(key, "1");
    hasTrackedMetaPurchaseRef.current = true;
  }, [generatorFromQuery, order, orderIdValue, sourcePageFromQuery]);

  useEffect(() => {
    if (!order || !orderIdValue || hasTrackedMetaPhysicalPurchaseRef.current) return;
    if (typeof window === "undefined") return;
    const paidFunnelContext = getPaidFunnelPurchaseContext();

    const key = `meta_physical_purchase_${orderIdValue}`;
    if (window.sessionStorage.getItem(key)) {
      hasTrackedMetaPhysicalPurchaseRef.current = true;
      return;
    }

    const maybeFbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
    if (typeof maybeFbq !== "function") return;

    maybeFbq(
      "trackCustom",
      "PhysicalPurchase",
      {
        value: Number(order.totalPrice ?? 0),
        currency: "USD",
        content_type: "product",
        content_ids: [order.productKey],
        content_category: "physical_product",
        order_id: orderIdValue,
        ...(paidFunnelContext ?? {}),
      },
      { eventID: `physical_purchase_${orderIdValue}` },
    );

    window.sessionStorage.setItem(key, "1");
    hasTrackedMetaPhysicalPurchaseRef.current = true;
  }, [generatorFromQuery, order, orderIdValue, sourcePageFromQuery]);

  return (
    <>
      <SeoHead
        title="Order Success | Name Design AI"
        description="Product order success page."
        path="/order/success"
        noindex
      />
      <div className="max-w-xl mx-auto p-8 text-center bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-2">Your order is confirmed!</h1>
      <p className="text-muted-foreground mb-6">
        We are preparing your product and will notify you when it ships.
      </p>

      <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
        <div className="font-semibold">Your personalized product is now being prepared.</div>
        <div className="mt-1">Want another design? Create one now while your inspiration is fresh.</div>
      </div>

      {shouldShowSaveDesignCta ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-left text-sm text-amber-950">
          <div className="font-semibold">Save this design to your account</div>
          <div className="mt-1">
            Sign in with the same email you used at checkout so you can come back to this purchase and design later without depending on this private link.
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                void signIn(undefined, { callbackUrl: router.asPath });
              }}
              className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white transition hover:bg-amber-700"
            >
              Sign In To Save Design
            </button>
          </div>
        </div>
      ) : null}

      {shouldShowPreview && (
        <div className="mb-6 overflow-hidden rounded-xl border bg-white shadow-sm">
          <img
            src={previewUrl}
            alt="Your product preview"
            className="w-full h-auto object-cover"
            onError={() => setPreviewLoadFailed(true)}
          />
        </div>
      )}

      <div className="mb-6 rounded-lg border bg-background p-4 text-left">
        <div className="text-sm text-muted-foreground">Order summary</div>
        <div className="text-lg font-semibold">{productLabel}</div>
        {variantSummary && (
          <div className="text-sm text-muted-foreground">{variantSummary}</div>
        )}
        {typeof order?.quantity === "number" && (
          <div className="text-sm text-muted-foreground">
            Quantity: {order.quantity}
          </div>
        )}
        {order?.country && (
          <div className="text-sm text-muted-foreground">Shipping: {order.country}</div>
        )}
        {orderIdValue && (
          <div className="mt-2 text-xs text-muted-foreground">
            Order number: {orderIdValue}
          </div>
        )}
      </div>

      <div className="mb-6 rounded-lg border bg-background p-4 text-left">
        <div className="text-sm font-semibold mb-2 text-foreground">What happens next?</div>
        <ol className="text-sm text-muted-foreground list-decimal list-inside">
          <li>Your order is sent to production</li>
          <li>You will receive a shipping email</li>
          <li>Delivery usually takes 5-10 days</li>
        </ol>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={nextGeneratorHref}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-semibold text-foreground hover:border-gray-400 transition"
        >
          Create Another Design
        </Link>
      </div>
      </div>
    </>
  );
}
