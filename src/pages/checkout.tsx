/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { useEffect, useRef, useState } from "react";
import { Input } from "~/component/Input";
import { Select } from "~/component/Select";
import { TRPCClientError } from "@trpc/client";
import { trackEvent } from "~/lib/ga";
import { ProductNudgeBlock } from "~/component/Nudge/ProductNudgeBlock";

export function formatPrice(value: number) {
  return value.toFixed(2);
}

type ShippingCountry = {
  code: string;
  name: string;
};

export default function CheckoutPage() {
    const router = useRouter();
    const { orderId } = router.query;

    const [address, setAddress] = useState({
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
    const hasAttemptedFinalizeRef = useRef(false);
    const autoFinalizeStartedRef = useRef(false);
    const hasTrackedBeginCheckoutRef = useRef(false);

    type OrderType = {
        id: string;
        userId: string;
        productKey: string;
        variantId: number;
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
        snapshotVariantId?: number | null;
        snapshotSize?: string | null;
        snapshotColor?: string | null;
        snapshotPrintPosition?: string | null;
        snapshotBackgroundRemoved?: boolean | null;
        createdAt: Date;
        updatedAt: Date;
    };

    const { data: order, isLoading } = api.productOrder.getOrder.useQuery(
        { orderId: String(orderId) },
        { enabled: !!orderId }
        ) as { data: OrderType | undefined, isLoading: boolean };

    const createStripeSession = api.printfulCheckout.createCheckout.useMutation();
    const ensureFinalPreview = api.checkout.ensureFinalPreview.useMutation();


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
      setCountries([{ code: "US", name: "United States" }]);
    };



    const selectedCountry = countries.find((country) => country.code === address.country);
    const requiresState = address.country === "US";

    const validateShipping = (nextAddress = address, nextRequiresState = requiresState) => {
        const errors: Record<string, string> = {};
        const name = (nextAddress.name ?? "").trim();
        const address1 = (nextAddress.address1 ?? "").trim();
        const city = (nextAddress.city ?? "").trim();
        const country = (nextAddress.country ?? "").trim();
        const zip = (nextAddress.zip ?? "").trim();
        const state = (nextAddress.state ?? "").trim();

        if (!name) errors.name = "Full name is required.";
        if (!address1) errors.address1 = "Address line 1 is required.";
        if (!city) errors.city = "City is required.";
        if (!country) errors.country = "Country is required.";
        if (!zip) {
        errors.zip = "ZIP / Postal code is required.";
        } else if (country === "US" || country === "FR" || country === "MA") {
        if (!/^\d{5}$/.test(zip)) {
            errors.zip = "ZIP code must be 5 digits.";
        }
        }

        if (nextRequiresState && !state) {
        errors.state = country === "US"
            ? "State is required for US shipping."
            : "State/region is required.";
        }

        return errors;
    };

    const localShippingErrors = validateShipping();

    // ✅ Normalize numbers ONCE
    const productPrice = Number(order?.totalPrice ?? 0);
    const totalPrice = Number(order?.totalPrice ?? 0);

    const PRODUCT_LABELS = {
    poster: "Premium Poster",
    tshirt: "Unisex T-Shirt",
    mug: "White Glossy Mug",
    };

    const isFieldInvalid = (field: string) =>
        (showShippingValidation && Boolean(localShippingErrors[field])) ||
        Boolean(backendFieldErrors[field]);
    const fieldErrorMessage = (field: string) => {
        if (showShippingValidation && localShippingErrors[field]) return localShippingErrors[field];
        if (backendFieldErrors[field]) return backendFieldErrors[field];
        return null;
    };

    const getProductConfigErrors = () => {
        if (!order) return [];
        const issues: string[] = [];
        if (!order.variantId) issues.push("variantId");

        if (order.productKey === "tshirt") {
        if (!order.size) issues.push("size");
        if (!order.color) issues.push("color");
        }

        if (order.productKey === "mug") {
        if (!order.size) issues.push("size");
        if (!order.previewMode) issues.push("printPosition");
        }

        if (order.productKey === "poster") {
        if (!order.variantName) issues.push("variantName");
        if (!order.size) issues.push("size");
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
        if (!order || hasTrackedBeginCheckoutRef.current) return;
        if (typeof window !== "undefined") {
            const key = `ga4_begin_checkout_${order.id}`;
            if (window.sessionStorage.getItem(key)) {
                hasTrackedBeginCheckoutRef.current = true;
                return;
            }
            window.sessionStorage.setItem(key, "1");
        }
        const generatorKey =
          typeof window !== "undefined" ? window.localStorage.getItem("last-generator") : null;
        const sourcePage =
          generatorKey === "arabic"
            ? "arabic-name-art-generator"
            : generatorKey === "couples"
            ? "couples-art-generator"
            : generatorKey === "default"
            ? "name-art-generator"
            : "checkout";
        trackEvent("begin_checkout", {
            product: order.productKey,
            source_page: sourcePage,
            user_credits_before_action: null,
            required_credits: 0,
            country: address.country,
        });
        hasTrackedBeginCheckoutRef.current = true;
    }, [order, address.country]);

    useEffect(() => {
        return;
    }, []);

    useEffect(() => {
      void loadCountries();
    }, []);

    useEffect(() => {
      if (countries.length === 0) return;
      if (countries.some((country) => country.code === address.country)) return;
      setAddress((prev) => ({ ...prev, country: countries[0]?.code ?? "US" }));
    }, [countries, address.country]);

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



    if (isLoading) return <div>Loading...</div>;
    if (!order) return <div>Order not found</div>;

    return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">

    {/* LEFT — PRODUCT SUMMARY */}
    <div className="md:col-span-2 space-y-6">

        {/* Product card */}
        <div className="rounded-xl border bg-white dark:bg-gray-900 p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4">

            <div className="relative w-full md:w-48">
            <img
                src={currentMockupUrl ?? order.mockupUrl}
                className="w-full h-auto rounded-lg object-contain bg-gray-50 dark:bg-gray-800"
            />
            {isApparel && previewStatus === "generating" && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70 text-xs text-gray-700">
                Finalizing your product preview…
                </div>
            )}
            </div>

            <div className="flex-1">
            <h2 className="text-xl font-semibold">
                {PRODUCT_LABELS[order.productKey as keyof typeof PRODUCT_LABELS]}
            </h2>

            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                {order.productKey === "poster" && order.variantName && (
                <div>
                    <strong>Variant:</strong> {order.variantName}
                </div>
                )}

                {order.productKey === "poster" && order.size && (
                <div>
                    <strong>Size:</strong> {order.size}
                </div>
                )}

                {order.productKey === "tshirt" && order.size && (
                <div>
                    <strong>Size:</strong> {order.size}
                </div>
                )}

                {order.productKey === "tshirt" && order.color && (
                <div className="flex items-center gap-2">
                    <strong>Color:</strong>
                    <span
                    className="inline-block w-4 h-4 rounded-full border"
                    style={{ backgroundColor: order.colorHex }}
                    />
                    {order.color}
                </div>
                )}

                {order.productKey === "mug" && order.size && (
                <div>
                    <strong>Size:</strong> {order.size}
                </div>
                )}

                {order.productKey === "mug" && order.previewMode && (
                <div>
                    <strong>Print position:</strong>{" "}
                    {order.previewMode === "two-side"
                    ? "Two-side"
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

            <div className="text-lg font-semibold">
                <span>${formatPrice(productPrice)}</span>
            </div>
        </div>
        </div>

        {/* Shipping address */}
        <div className="rounded-xl border bg-white dark:bg-gray-900 p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4">
            Shipping address
        </h3>
        {(productNotice || shippingNotice || (showShippingValidation && Object.keys(localShippingErrors).length > 0)) && (
        <div className="mb-3 text-sm text-red-600">
            {productNotice ?? shippingNotice ?? "Please fix the highlighted shipping fields before continuing."}
        </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <Input
            className={`input-lg ${isFieldInvalid("name") ? "border-red-500" : ""}`}
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
            className={`input-lg ${isFieldInvalid("city") ? "border-red-500" : ""}`}
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
            className={`md:col-span-2 input-lg ${isFieldInvalid("address1") ? "border-red-500" : ""}`}
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
            className={`input-lg ${isFieldInvalid("zip") ? "border-red-500" : ""}`}
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
            placeholder="State (e.g. CA, NY)"
            className={isFieldInvalid("state") ? "border-red-500" : ""}
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
            className={`pr-10 ${isFieldInvalid("country") ? "border-red-500" : ""}`}
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
    <div className="sticky top-6 rounded-xl border bg-white dark:bg-gray-900 p-4 md:p-6 space-y-4">

        <h3 className="text-lg font-semibold">Order summary</h3>

        <div className="flex justify-between text-sm">
        <span>Product price</span>
        <span>${formatPrice(productPrice)}</span>
        </div>

        <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>FREE</span>
        </div>

        <div className="border-t pt-3 flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>${formatPrice(totalPrice)}</span>
        </div>

        {(order.productKey === "mug" || order.productKey === "tshirt" || order.productKey === "poster") && (
          <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 dark:border-blue-900 dark:bg-blue-950/30">
            <ProductNudgeBlock productType={order.productKey} />
          </div>
        )}




        <button
            className="w-full py-3 rounded-lg bg-black text-white font-semibold disabled:opacity-50"
        disabled={previewStatus === "generating"}
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

            try {
            const res = await createStripeSession.mutateAsync({
                orderId: order.id,
                submittedTotalPrice: totalPrice,
                address: {
                name: address.name,
                address1: address.address1,
                country: address.country,
                city: address.city,
                zip: address.zip,
                state: requiresState ? address.state : undefined,
                },
            });

            if (res.url) {
                trackEvent("add_shipping_info", {
                    country: address.country,
                });
                window.location.href = res.url;
            }
            } catch (err: unknown) {
            setShowShippingValidation(true);
            setShippingNotice("Please fix the highlighted shipping fields before continuing.");

            if (err instanceof TRPCClientError) {
                if (err.message.includes("Invalid US ZIP code")) {
                setBackendFieldErrors({
                    zip: "ZIP code is not valid for a US address.",
                });
                setShippingNotice(null);
                return;
                }
                if (err.message.includes("Shipping address state and ZIP code don't match.")) {
                setBackendFieldErrors({
                    zip: "ZIP code doesn't match the selected state.",
                    state: "State doesn't match the provided ZIP code.",
                });
                setShippingNotice(null);
                return;
                }
                if (err.message.includes("Physical shipping is not available in this country yet.")) {
                setBackendFieldErrors({
                    country: "Shipping is not available in this country yet.",
                });
                setShippingNotice(null);
                return;
                }
                if (err.message.includes("Price mismatch.")) {
                setShippingNotice("Price changed. Please return to preview and try again.");
                setBackendFieldErrors({});
                return;
                }

                const fieldErrors = err.data?.zodError?.fieldErrors ?? {};
                const nextFieldErrors: Record<string, string> = {};

                if (fieldErrors.name) nextFieldErrors.name = "This field is required.";
                if (fieldErrors.address1) nextFieldErrors.address1 = "This field is required.";
                if (fieldErrors.city) nextFieldErrors.city = "This field is required.";
                if (fieldErrors.country) nextFieldErrors.country = "This field is required.";
                if (fieldErrors.zip) nextFieldErrors.zip = "This field is required.";
                if (fieldErrors.state) {
                nextFieldErrors.state =
                    selectedCountry?.code === "US"
                    ? "State is required for US shipping."
                    : "State/region is required.";
                }

                setBackendFieldErrors(nextFieldErrors);
            } else {
                setBackendFieldErrors({});
            }
            }

        }}
        >
        Continue to payment
        </button>

        <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
          <div>🔒 Secure payment powered by Stripe</div>
          <div>✔ Free US shipping included</div>
          <div>✔ Easy replacement if damaged</div>
          <div>✔ Printed & shipped from the USA</div>
        </div>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Your design is printed only after you order - no mass production.
        </p>
        </div>
    </div>
</div>

    );
}
