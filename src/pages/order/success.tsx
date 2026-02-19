import { useRouter } from "next/router";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { useEffect, useRef, useState } from "react";
import { trackEvent } from "~/lib/ga";

export default function OrderSuccess() {
  const router = useRouter();
  const { orderId, generator } = router.query;
  const { data: session } = useSession();
  const orderIdValue = typeof orderId === "string" ? orderId : "";
  const generatorFromQuery = typeof generator === "string" ? generator : null;
  const orderQuery = api.productOrder.getOrder.useQuery(
    { orderId: orderIdValue },
    { enabled: !!orderIdValue && !!session }
  );
  const [previewLoadFailed, setPreviewLoadFailed] = useState(false);
  const [nextGeneratorHref, setNextGeneratorHref] = useState("/name-art-generator");

  const order = orderQuery.data;
  const hasTrackedPurchaseRef = useRef(false);
  const hasTrackedMetaPurchaseRef = useRef(false);
  const productLabel =
    order?.productKey === "tshirt"
      ? "T-shirt"
      : order?.productKey === "mug"
      ? "Mug"
      : order?.productKey === "poster"
      ? "Poster"
      : "Product";

  const variantSummary =
    order?.productKey === "tshirt"
      ? [order?.size, order?.color].filter(Boolean).join(" • ")
      : order?.productKey === "mug"
      ? [order?.size, order?.previewMode].filter(Boolean).join(" • ")
      : order?.productKey === "poster"
      ? [order?.variantName, order?.size].filter(Boolean).join(" • ")
      : "";

  const previewUrl = order?.mockupUrl || order?.imageUrl || "";
  const shouldShowPreview = !!previewUrl && !previewLoadFailed;

  useEffect(() => {
    const mapToHref = (value: string | null) => {
      if (value === "arabic") return "/arabic-name-art-generator";
      if (value === "couples") return "/couples-name-art-generator";
      return "/name-art-generator";
    };

    if (generatorFromQuery) {
      setNextGeneratorHref(mapToHref(generatorFromQuery));
      return;
    }

    try {
      const fromStorage = window.localStorage.getItem("last-generator");
      setNextGeneratorHref(mapToHref(fromStorage));
    } catch {
      setNextGeneratorHref("/name-art-generator");
    }
  }, [generatorFromQuery]);

  useEffect(() => {
    if (!order || hasTrackedPurchaseRef.current) return;
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
    });
    hasTrackedPurchaseRef.current = true;
  }, [order, orderIdValue]);

  useEffect(() => {
    if (!order || !orderIdValue || hasTrackedMetaPurchaseRef.current) return;
    if (typeof window === "undefined") return;

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
      },
      { eventID: `physical_order_${orderIdValue}` },
    );

    window.sessionStorage.setItem(key, "1");
    hasTrackedMetaPurchaseRef.current = true;
  }, [order, orderIdValue]);

  return (
    <div className="max-w-xl mx-auto p-8 text-center bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-2">Your order is confirmed!</h1>
      <p className="text-muted-foreground mb-6">
        We are preparing your product and will notify you when it ships.
      </p>

      <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
        <div className="font-semibold">Your personalized product is now being prepared.</div>
        <div className="mt-1">Want another design? Create one now while your inspiration is fresh.</div>
      </div>

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
  );
}
