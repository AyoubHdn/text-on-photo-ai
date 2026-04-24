import type { GetStaticPaths, GetStaticProps, NextPage } from "next";

import { StyleProductDetailPage } from "~/component/StyleProductSeoPage";
import {
  getStyleProductDetailConfig,
  isStyleProductSlug,
  STYLE_PRODUCT_SLUGS,
  type StyleProductSlug,
} from "~/lib/styleProductSeo";

type ArabicNameArtProductPageProps = {
  productSlug: StyleProductSlug;
};

const ArabicNameArtProductPage: NextPage<ArabicNameArtProductPageProps> = ({
  productSlug,
}) => (
  <StyleProductDetailPage
    config={getStyleProductDetailConfig("arabic-name-art", productSlug)}
  />
);

export const getStaticPaths: GetStaticPaths = () => ({
  paths: STYLE_PRODUCT_SLUGS.map((product) => ({ params: { product } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<ArabicNameArtProductPageProps> = (
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

export default ArabicNameArtProductPage;
