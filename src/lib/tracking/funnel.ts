type TrafficType = "paid" | "organic";

type FunnelContextOptions = {
  route?: string | null;
  sourcePage?: string | null;
  orderFunnelSource?: string | null;
  paidTrafficUser?: boolean | null;
  productKey?: string | null;
  productType?: string | null;
  country?: string | null;
  query?: Record<string, unknown> | URLSearchParams | null;
};

type FunnelOverride = {
  funnel: string;
  niche: string | null;
  product_type: string;
  traffic_type: TrafficType;
};

export type FunnelContext = {
  funnel: string;
  product_type: string;
  niche: string | null;
  traffic_type: TrafficType;
  source_page: string;
  country: string | null;
};

const ROUTE_OVERRIDES: Record<string, FunnelOverride> = {
  "arabic-name-mug-v1": {
    funnel: "arabic_name_mug_v1",
    niche: "arabic_name_gift",
    product_type: "physical_product",
    traffic_type: "paid",
  },
  "couple-name-mug-v1": {
    funnel: "couple_name_mug_v1",
    niche: "romantic",
    product_type: "physical_product",
    traffic_type: "paid",
  },
  "couple-avatar-name-mug-v1": {
    funnel: "couple_avatar_name_mug_v1",
    niche: "romantic",
    product_type: "physical_product",
    traffic_type: "paid",
  },
  "couple-names-only-mug-v1": {
    funnel: "couple_names_only_mug_v1",
    niche: "romantic",
    product_type: "physical_product",
    traffic_type: "paid",
  },
  "ramadan-mug-men": {
    funnel: "ramadan_mug_men",
    niche: "muslim_men_usa",
    product_type: "physical_product",
    traffic_type: "paid",
  },
};

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function getQueryValue(
  query: FunnelContextOptions["query"],
  key: string,
): string | null {
  if (!query) return null;
  if (query instanceof URLSearchParams) {
    return query.get(key);
  }

  const raw = query[key];
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
  return null;
}

function inferSourcePage(options: FunnelContextOptions): string {
  const explicit = normalize(options.sourcePage ?? undefined);
  if (explicit) return explicit;

  const route = normalize(options.route ?? undefined);
  if (!route) return "unknown";

  const withoutQuery = route.split("?")[0] ?? route;
  return withoutQuery.replace(/^\/+/, "") || "unknown";
}

function inferFunnel(sourcePage: string, query: FunnelContextOptions["query"]): string {
  const page = normalize(sourcePage);
  if (page.includes("ramadan-mug")) {
    const segment = normalize(
      getQueryValue(query, "niche") ??
        getQueryValue(query, "segment") ??
        getQueryValue(query, "audience"),
    );
    if (segment.includes("men") || segment.includes("male")) {
      return "ramadan_mug_men";
    }
    return "ramadan_mug_women";
  }
  if (page.includes("arabic-name-art-generator")) return "arabic_generator";
  if (page.includes("couples-name-art-generator") || page.includes("couples-art-generator")) {
    return "couples_generator";
  }
  if (page.includes("name-art-generator")) return "name_art_generator";
  if (page.includes("checkout") || page.includes("order/success")) return "checkout_flow";
  if (page.includes("buy-credits") || page.includes("success")) return "credits_flow";
  return "unknown";
}

function inferNiche(funnel: string): string | null {
  if (funnel.startsWith("ramadan_mug")) return "ramadan";
  if (funnel === "arabic_generator") return "arabic_calligraphy";
  if (funnel === "couples_generator") return "romantic";
  if (funnel === "name_art_generator") return "name_art";
  return null;
}

function inferTrafficType(options: FunnelContextOptions): TrafficType {
  const orderSource = normalize(options.orderFunnelSource ?? undefined);
  const hasPaidOrderSource =
    orderSource.includes("paid-traffic") || orderSource.includes("ramadan-mug-ad");

  const source = normalize(getQueryValue(options.query, "source"));
  const utmSource = normalize(getQueryValue(options.query, "utm_source"));
  const campaign = normalize(getQueryValue(options.query, "campaign"));
  const utmCampaign = normalize(getQueryValue(options.query, "utm_campaign"));
  const fbclid = normalize(getQueryValue(options.query, "fbclid"));

  const hasPaidQuerySignals =
    source === "facebook" ||
    source === "instagram" ||
    utmSource === "facebook" ||
    utmSource === "instagram" ||
    campaign.includes("ramadan") ||
    utmCampaign.includes("ramadan") ||
    Boolean(fbclid);

  const hasPaidSessionFlag =
    typeof window !== "undefined" &&
    window.sessionStorage.getItem("isPaidTrafficUser") === "true";

  if (Boolean(options.paidTrafficUser) || hasPaidOrderSource || hasPaidQuerySignals || hasPaidSessionFlag) {
    return "paid";
  }
  return "organic";
}

function inferProductType(options: FunnelContextOptions, sourcePage: string): string {
  const explicit = normalize(options.productType ?? undefined);
  if (explicit) return explicit;

  const key = normalize(options.productKey ?? undefined);
  if (key === "mugcolorinside") return "mug_color_inside";
  if (key === "mugblackglossy") return "mug_black_glossy";
  if (key === "coaster") return "coaster";
  if (key === "mug" || key === "poster" || key === "tshirt") {
    return key;
  }

  const page = normalize(sourcePage);
  if (page.includes("checkout") || page.includes("order/success")) return "physical_product";
  if (page.includes("buy-credits") || page.includes("success")) return "credits";
  return "digital_design";
}

export function getFunnelContext(options: FunnelContextOptions = {}): FunnelContext {
  const sourcePage = inferSourcePage(options);
  const routeOverride = ROUTE_OVERRIDES[normalize(sourcePage)];
  if (routeOverride) {
    return {
      ...routeOverride,
      source_page: sourcePage,
      country: options.country ?? null,
    };
  }
  const funnel = inferFunnel(sourcePage, options.query);
  return {
    funnel,
    product_type: inferProductType(options, sourcePage),
    niche: inferNiche(funnel),
    traffic_type: inferTrafficType(options),
    source_page: sourcePage,
    country: options.country ?? null,
  };
}

export function markEventTrackedOnce(eventKey: string): boolean {
  if (typeof window === "undefined") return true;
  const seen =
    window.sessionStorage.getItem(eventKey) === "1" ||
    window.localStorage.getItem(eventKey) === "1";
  if (seen) return false;
  window.sessionStorage.setItem(eventKey, "1");
  window.localStorage.setItem(eventKey, "1");
  return true;
}
