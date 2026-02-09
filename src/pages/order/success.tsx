import { useRouter } from "next/router";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { useState } from "react";

export default function OrderSuccess() {
  const { orderId } = useRouter().query;
  const { data: session } = useSession();
  const orderIdValue = typeof orderId === "string" ? orderId : "";
  const orderQuery = api.productOrder.getOrder.useQuery(
    { orderId: orderIdValue },
    { enabled: !!orderIdValue && !!session }
  );
  const [previewLoadFailed, setPreviewLoadFailed] = useState(false);

  const order = orderQuery.data;
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

  return (
    <div className="max-w-xl mx-auto p-8 text-center bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-2">🎉 Your order is confirmed!</h1>
      <p className="text-muted-foreground mb-6">
        We’re preparing your product and will notify you when it ships.
      </p>

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
          <li>You’ll receive a shipping email</li>
          <li>Delivery usually takes 5–10 days</li>
        </ol>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {/*<Link
          href={`/my-orders/${orderIdValue || ""}`}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-secondary-foreground font-semibold hover:bg-blue-700 transition"
        >
          View my order
        </Link> */}
        <Link
          href="/name-art-generator"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-semibold text-foreground hover:border-gray-400 transition"
        >
          Create another design
        </Link>
      </div>
    </div>
  );
}
