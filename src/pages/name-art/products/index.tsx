import type { NextPage } from "next";

import { StyleProductHubPage } from "~/component/StyleProductSeoPage";
import { getStyleProductHubConfig } from "~/lib/styleProductSeo";

const NameArtProductsPage: NextPage = () => (
  <StyleProductHubPage config={getStyleProductHubConfig("name-art")} />
);

export default NameArtProductsPage;
