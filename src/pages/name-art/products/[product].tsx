import type { GetStaticPaths, GetStaticProps, NextPage } from "next";

import { getProductPageContent } from "~/data/productPageContent";
import { StyleProductDetailPage } from "~/component/StyleProductSeoPage";
import {
  getStyleProductDetailConfig,
  isStyleProductSlug,
  STYLE_PRODUCT_SLUGS,
  type StyleProductSlug,
} from "~/lib/styleProductSeo";

type NameArtProductPageProps = {
  productSlug: StyleProductSlug;
};

const NameArtProductPage: NextPage<NameArtProductPageProps> = ({
  productSlug,
}) => (
  <StyleProductDetailPage
    config={getStyleProductDetailConfig("name-art", productSlug)}
    content={getProductPageContent("name-art", productSlug)}
  />
);

export const getStaticPaths: GetStaticPaths = () => ({
  paths: STYLE_PRODUCT_SLUGS.map((product) => ({ params: { product } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<NameArtProductPageProps> = (
  context,
) => {
  const product = context.params?.product;

  if (typeof product !== "string" || !isStyleProductSlug(product)) {
    return { notFound: true };
  }

  return {
    props: {
      productSlug: product,
    },
  };
};

export default NameArtProductPage;
