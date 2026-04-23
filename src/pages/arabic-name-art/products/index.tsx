import type { NextPage } from "next";

import { StyleProductHubPage } from "~/component/StyleProductSeoPage";
import { getStyleProductHubConfig } from "~/lib/styleProductSeo";

const ArabicNameArtProductsPage: NextPage = () => (
  <StyleProductHubPage config={getStyleProductHubConfig("arabic-name-art")} />
);

export default ArabicNameArtProductsPage;
