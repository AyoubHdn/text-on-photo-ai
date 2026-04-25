import type { GetStaticPaths, GetStaticProps, NextPage } from "next";

import { getProductPageContent } from "~/data/productPageContent";
import { StyleProductDetailPage } from "~/component/StyleProductSeoPage";
import {
  getStyleProductDetailConfig,
  isStyleProductSlug,
  STYLE_PRODUCT_SLUGS,
  type StyleProductSlug,
} from "~/lib/styleProductSeo";

type CouplesArtProductPageProps = {
  productSlug: StyleProductSlug;
};

const CouplesArtProductPage: NextPage<CouplesArtProductPageProps> = ({
  productSlug,
}) => (
  <StyleProductDetailPage
    config={getStyleProductDetailConfig("couples-art", productSlug)}
    content={getProductPageContent("couples-art", productSlug)}
  />
);

export const getStaticPaths: GetStaticPaths = () => ({
  paths: STYLE_PRODUCT_SLUGS.map((product) => ({ params: { product } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<CouplesArtProductPageProps> = (
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

export default CouplesArtProductPage;
