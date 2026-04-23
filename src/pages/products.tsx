import { type NextPage } from "next";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { Button } from "~/component/Button";
import { ProductPreviewModal } from "~/component/printful/ProductPreviewModal";
import { SeoHead } from "~/component/SeoHead";
import {
  PRODUCT_PRESENTATION,
  PRODUCTS_PAGE_PRODUCT_KEYS,
  PRODUCT_SUPPORTED_ASPECTS,
  type ProductKey,
} from "~/config/physicalProducts";
import type { AspectRatio } from "~/server/printful/aspects";
import { api } from "~/utils/api";

type ProductEntry = {
  key: ProductKey;
  label: string;
  description: string;
  image: string;
};

type UserIcon = {
  id: string;
  prompt: string | null;
  metadata?: {
    aspectRatio?: string | null;
  } | null;
};

const DEFAULT_CREATE_PATH = "/name-art-generator";

const resolveAspectRatio = (value: unknown): AspectRatio => {
  if (value === "1:1" || value === "4:5" || value === "3:2" || value === "16:9") {
    return value;
  }
  return "1:1";
};

const getImageUrl = (imageId: string): string => {
  const region = process.env.NEXT_PUBLIC_S3_REGION ?? "us-east-1";
  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET_NAME ?? "";
  return `https://${bucket}.s3.${region}.amazonaws.com/${imageId}`;
};

const ProductsPage: NextPage = () => {
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user?.id);

  const [selectedProduct, setSelectedProduct] = useState<ProductKey | null>(null);
  const [isDesignPanelOpen, setIsDesignPanelOpen] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<{
    imageUrl: string;
    aspect: AspectRatio;
  } | null>(null);

  const designsQuery = api.icons.getIconsForUser.useQuery(undefined, {
    enabled: isLoggedIn,
  });

  const allProducts = useMemo<ProductEntry[]>(
    () =>
      PRODUCTS_PAGE_PRODUCT_KEYS.map((key) => ({
        key,
        label: PRODUCT_PRESENTATION[key].cardLabel,
        description: PRODUCT_PRESENTATION[key].cardDescription,
        image: PRODUCT_PRESENTATION[key].cardImage,
      })),
    [],
  );
  const currentProduct = useMemo(
    () => allProducts.find((product) => product.key === selectedProduct) ?? null,
    [allProducts, selectedProduct],
  );

  const allDesigns = useMemo(() => {
    return ((designsQuery.data?.icons ?? []) as UserIcon[]).map((icon) => {
      const aspect = resolveAspectRatio(icon.metadata?.aspectRatio);
      return {
        id: icon.id,
        prompt: icon.prompt,
        imageUrl: getImageUrl(icon.id),
        aspect,
      };
    });
  }, [designsQuery.data?.icons]);

  const compatibleDesigns = useMemo(() => {
    if (!selectedProduct) return [];
    const supportedAspects = PRODUCT_SUPPORTED_ASPECTS[selectedProduct];
    return allDesigns.filter((design) => supportedAspects.includes(design.aspect));
  }, [allDesigns, selectedProduct]);

  const handleChooseProduct = (productKey: ProductKey) => {
    setSelectedProduct(productKey);
    setSelectedDesign(null);
    setIsDesignPanelOpen(true);
  };

  return (
    <>
      <SeoHead
        title="Products | Name Design AI"
        description="Print your saved name art on premium physical products with product-to-design compatibility."
        path="/products"
      />

      <main className="container mx-auto min-h-screen px-4 py-8 mt-16 md:px-8">
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:px-8 md:py-7">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
            Print Your Name Art on Premium Products
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300 md:text-base">
            Select a product, choose a compatible design, and continue to checkout.
          </p>
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100 md:text-xl">
            Choose a Product
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {allProducts.map((product) => {
              const isActive = selectedProduct === product.key;
              return (
                <button
                  key={product.key}
                  type="button"
                  onClick={() => handleChooseProduct(product.key)}
                  className={`group overflow-hidden rounded-xl border bg-white text-left shadow-sm transition hover:shadow-md dark:bg-slate-900 ${
                    isActive
                      ? "border-brand-500 ring-2 ring-brand-500"
                      : "border-cream-200 hover:border-brand-300"
                  }`}
                >
                  <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800">
                    <img
                      src={product.image}
                      alt={product.label}
                      className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="space-y-1.5 p-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{product.label}</div>
                    <p className="truncate text-xs text-slate-600 dark:text-slate-400">{product.description}</p>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {PRODUCT_SUPPORTED_ASPECTS[product.key].length} ratios
                      </span>
                      <span className="rounded-md bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white transition group-hover:bg-brand-700">
                        Select
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {isDesignPanelOpen && selectedProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setIsDesignPanelOpen(false)}
        >
          <div
            className="absolute inset-x-0 bottom-0 top-10 flex flex-col rounded-t-2xl bg-white shadow-2xl dark:bg-slate-900 md:inset-8 md:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4 dark:border-slate-700 md:p-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 md:text-xl">
                  {currentProduct?.label ?? "Product"} Designs
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Select a compatible design to preview and continue to checkout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDesignPanelOpen(false)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
              {!isLoggedIn && (
                <div className="rounded-lg border border-slate-200 p-5 dark:border-slate-700">
                  <p className="mb-3 text-sm text-slate-700 dark:text-slate-300">
                    Sign in to access your saved designs.
                  </p>
                  <Button onClick={() => void signIn()}>Sign in</Button>
                </div>
              )}

              {isLoggedIn && designsQuery.isLoading && (
                <div className="rounded-lg border border-slate-200 p-5 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300">
                  Loading your designs...
                </div>
              )}

              {isLoggedIn && !designsQuery.isLoading && compatibleDesigns.length === 0 && (
                <div className="rounded-lg border border-slate-200 p-5 dark:border-slate-700">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {allDesigns.length === 0
                      ? "You do not have saved designs yet."
                      : `No saved design matches ${currentProduct?.label ?? "this product"}.`}
                  </p>
                  <Link
                    href={DEFAULT_CREATE_PATH}
                    className="mt-3 inline-flex rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    Create a design
                  </Link>
                </div>
              )}

              {isLoggedIn && compatibleDesigns.length > 0 && (
                <>
                  <div className="mb-4 border-b border-slate-100 pb-4">
                    <p className="mb-2 text-sm text-slate-500">Want a different design?</p>
                    <div className="flex flex-wrap gap-2">
                      <Link href="/name-art-generator" className="rounded-lg border border-cream-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-400 hover:bg-brand-50">
                        + Name Art
                      </Link>
                      <Link href="/arabic-name-art-generator" className="rounded-lg border border-cream-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-400 hover:bg-brand-50">
                        + Arabic Name Art
                      </Link>
                      <Link href="/couples-name-art-generator" className="rounded-lg border border-cream-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-400 hover:bg-brand-50">
                        + Couple Art
                      </Link>
                    </div>
                  </div>
                  <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                    {compatibleDesigns.length} compatible design
                    {compatibleDesigns.length > 1 ? "s" : ""}
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {compatibleDesigns.map((design) => (
                      <button
                        key={design.id}
                        type="button"
                        className="group overflow-hidden rounded-lg border border-cream-200 bg-white text-left shadow-sm transition hover:border-brand-400 hover:shadow-md"
                        onClick={() => {
                          setSelectedDesign({
                            imageUrl: design.imageUrl,
                            aspect: design.aspect,
                          });
                          setIsDesignPanelOpen(false);
                        }}
                      >
                        <img
                          src={design.imageUrl}
                          alt={design.prompt ?? "User design"}
                          className="h-40 w-full object-cover transition duration-300 group-hover:scale-[1.02] md:h-52"
                        />
                        <div className="flex items-center justify-between px-2 py-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <span className="truncate">{design.prompt ?? "Untitled design"}</span>
                          <span>{design.aspect}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ProductPreviewModal
        isOpen={Boolean(selectedProduct && selectedDesign)}
        onClose={() => setSelectedDesign(null)}
        productKey={selectedProduct}
        imageUrl={selectedDesign?.imageUrl ?? null}
        aspect={selectedDesign?.aspect ?? "1:1"}
      />
    </>
  );
};

export default ProductsPage;
