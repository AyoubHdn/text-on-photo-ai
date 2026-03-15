import Link from "next/link";
import { useRouter } from "next/router";

const GENERATOR_HREFS: Record<string, string> = {
  "ramadan-mug-v2": "/ramadan-mug-v2",
  "ramadan-mug-men": "/ramadan-mug-men",
  "ramadan-mug": "/ramadan-mug",
  arabic: "/arabic-name-art-generator",
  "arabic-name-art-generator": "/arabic-name-art-generator",
  couples: "/couples-name-art-generator",
  "couples-art-generator": "/couples-name-art-generator",
  "couples-name-art-generator": "/couples-name-art-generator",
  default: "/name-art-generator",
  "name-art-generator": "/name-art-generator",
};

function getGeneratorHref(value: string | null | undefined) {
  if (!value) return "/name-art-generator";
  return GENERATOR_HREFS[value] ?? "/name-art-generator";
}

export default function OrderCancel() {
  const router = useRouter();
  const orderId = typeof router.query.orderId === "string" ? router.query.orderId : null;
  const accessToken =
    typeof router.query.accessToken === "string" ? router.query.accessToken : null;
  const sourcePage =
    typeof router.query.sourcePage === "string"
      ? router.query.sourcePage
      : typeof router.query.generator === "string"
      ? router.query.generator
      : null;

  const checkoutHref = orderId
    ? `/checkout?orderId=${encodeURIComponent(orderId)}${
        accessToken ? `&accessToken=${encodeURIComponent(accessToken)}` : ""
      }${sourcePage ? `&sourcePage=${encodeURIComponent(sourcePage)}` : ""}${
        sourcePage ? `&generator=${encodeURIComponent(sourcePage)}` : ""
      }`
    : null;

  return (
    <div className="max-w-xl mx-auto p-8 text-center bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-2">Payment was canceled</h1>
      <p className="text-muted-foreground mb-6">
        Your order draft is still saved. You can continue checkout anytime.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {checkoutHref ? (
          <Link
            href={checkoutHref}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-secondary-foreground font-semibold hover:bg-blue-700 transition"
          >
            Return to checkout
          </Link>
        ) : (
          <Link
            href={getGeneratorHref(sourcePage)}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-secondary-foreground font-semibold hover:bg-blue-700 transition"
          >
            Return to your design
          </Link>
        )}
        <a
          href="mailto:support@namedesignai.com"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-semibold text-foreground hover:border-gray-400 transition"
        >
          Contact support
        </a>
      </div>
    </div>
  );
}
