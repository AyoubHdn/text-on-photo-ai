import type { NextPage } from "next";

import { StyleProductHubPage } from "~/component/StyleProductSeoPage";
import { getStyleProductHubConfig } from "~/lib/styleProductSeo";

const CouplesArtProductsPage: NextPage = () => (
  <StyleProductHubPage config={getStyleProductHubConfig("couples-art")} />
);

export default CouplesArtProductsPage;
