import { arabicStylesData } from "~/data/arabicStylesData";
import { coupleStylesData } from "~/data/coupleStylesData";
import { stylesData } from "~/data/stylesData";

type PromptKind = "name" | "couple" | "arabic";

type PromptAltOptions = {
  kind: PromptKind;
  title?: string;
};

type CommunityStyleAltParams = {
  kind: PromptKind;
  templateAlt?: string | null;
  primaryText?: string | null;
  secondaryText?: string | null;
  styleLabel?: string | null;
};

type CommunityImageMetadata = {
  communityAlt?: string | null;
  communityTitle?: string | null;
};

type StylePromptEntry = {
  altText?: string;
  prompt: string;
  kind: PromptKind;
  title?: string;
};

function normalizeNameArtSrc(src: string) {
  if (!src.startsWith("/styles/name-art/")) return src;
  if (src.endsWith("e.webp")) return src;
  return src.replace(/\.webp$/i, "e.webp");
}

function normalizeCouplesSrc(src: string) {
  if (!src.startsWith("/styles/couples/")) return src;
  if (src.endsWith("e.webp")) return src;
  return src.replace(/\.webp$/i, "e.webp");
}

function normalizeStyleSrc(src: string) {
  return normalizeCouplesSrc(normalizeNameArtSrc(src));
}

function truncateAlt(value: string, maxLength = 160) {
  if (value.length <= maxLength) return value;
  const shortened = value.slice(0, maxLength).trim();
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > 0 ? lastSpace : maxLength).trim()}.`;
}

function normalizeInlineText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function cleanPromptText(prompt: string, kind: PromptKind) {
  const genericName =
    kind === "arabic" ? "custom Arabic name" : "custom name";

  return prompt
    .replace(/''Text''/gi, genericName)
    .replace(/'Text'/gi, genericName)
    .replace(/\[NAME1\]\s*(?:&|and)\s*\[NAME2\]/gi, "two names")
    .replace(/'\[NAME1\]'\s*(?:&|and)\s*'\[NAME2\]'/gi, "two names")
    .replace(/\[NAME1\]/gi, "first name")
    .replace(/\[NAME2\]/gi, "second name")
    .replace(/["']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shouldSkipClause(clause: string) {
  const normalized = clause.trim().toLowerCase();
  if (!normalized) return true;

  const skipPatterns = [
    /^no /,
    /^premium\b/,
    /^print-ready\b/,
    /^high resolution\b/,
    /^8k\b/,
    /^full-bleed\b/,
    /^centered\b/,
    /^clean\b/,
    /^sharp\b/,
    /^crisp\b/,
    /^balanced\b/,
    /^controlled\b/,
    /^minimal\b/,
    /^soft ambient\b/,
    /^soft grounded\b/,
    /^subtle\b/,
    /^luxury\b/,
    /^modern premium\b/,
    /^high-end\b/,
    /^studio lighting\b/,
  ];

  return skipPatterns.some((pattern) => pattern.test(normalized));
}

function summarizePrompt(prompt: string, kind: PromptKind) {
  const cleaned = cleanPromptText(prompt, kind);
  const clauses = cleaned
    .split(/[.,;]/)
    .map((part) => part.trim())
    .filter((part) => !shouldSkipClause(part));

  const summary = clauses.slice(0, 2).join(", ");
  return summary || cleaned.split(/[.]/)[0]?.trim() || cleaned;
}

export function buildPromptImageAlt(prompt: string, options: PromptAltOptions) {
  const subject =
    options.kind === "couple"
      ? "couple name art"
      : options.kind === "arabic"
        ? "Arabic name art"
        : "name art";

  const summary = summarizePrompt(prompt, options.kind);
  const prefix = options.title
    ? `${options.title} ${subject} example: `
    : `${subject} example: `;

  return truncateAlt(`${prefix}${summary}`);
}

const styleImagePromptMap = new Map<string, StylePromptEntry>();

function addPromptEntry(src: string, entry: StylePromptEntry) {
  const normalized = normalizeStyleSrc(src);
  styleImagePromptMap.set(src, entry);
  styleImagePromptMap.set(normalized, entry);
}

for (const [groupTitle, substyles] of Object.entries(stylesData)) {
  for (const [substyleTitle, entries] of Object.entries(substyles)) {
    for (const entry of entries) {
      addPromptEntry(entry.src, {
        altText: entry.altText,
        prompt: entry.basePrompt,
        kind: "name",
        title: substyleTitle || groupTitle,
      });
    }
  }
}

for (const [groupTitle, substyles] of Object.entries(coupleStylesData)) {
  for (const [substyleTitle, entries] of Object.entries(substyles)) {
    for (const entry of entries) {
      addPromptEntry(entry.src, {
        altText: entry.altText,
        prompt: entry.basePrompt,
        kind: "couple",
        title: substyleTitle || groupTitle,
      });
    }
  }
}

for (const [groupTitle, substyles] of Object.entries(arabicStylesData)) {
  for (const [substyleTitle, entries] of Object.entries(substyles)) {
    for (const entry of entries) {
      addPromptEntry(entry.src, {
        altText: entry.altText,
        prompt: entry.basePrompt,
        kind: "arabic",
        title: entry.name || substyleTitle || groupTitle,
      });
    }
  }
}

export function getStyleImageAlt(
  src: string,
  fallback?: { kind?: PromptKind; title?: string; fallbackAlt?: string },
) {
  const entry = styleImagePromptMap.get(normalizeStyleSrc(src));

  if (entry) {
    if (entry.altText) {
      return entry.altText;
    }
    return buildPromptImageAlt(entry.prompt, {
      kind: entry.kind,
      title: fallback?.title ?? entry.title,
    });
  }

  if (fallback?.kind && fallback?.title) {
    return `${fallback.title} ${fallback.kind === "arabic" ? "Arabic name art" : fallback.kind === "couple" ? "couple name art" : "name art"} example`;
  }

  return fallback?.fallbackAlt ?? "Style image example";
}

export function getEnhancedNameArtSrc(src: string) {
  return normalizeNameArtSrc(src);
}

function extractPromptSubject(prompt: string) {
  const quotedValues = Array.from(prompt.matchAll(/['"]([^'"\[\]]{1,40})['"]/g))
    .map((match) => match[1]?.trim() ?? "")
    .filter(
      (value): value is string =>
        Boolean(value) &&
        !/^(text|name1|name2|wow|true love)$/i.test(value),
    );

  if (quotedValues.length >= 2) {
    return `${quotedValues[0]} and ${quotedValues[1]}`;
  }

  if (quotedValues[0]) {
    return quotedValues[0];
  }

  const explicitName = prompt.match(
    /\b(?:name|text|called|for)\s+([A-Za-z\u0600-\u06FF][A-Za-z0-9\u0600-\u06FF&\-\s]{1,40})/i,
  )?.[1];

  return explicitName?.trim() ?? null;
}

function getCommunitySubject(params: CommunityStyleAltParams) {
  const primaryText = normalizeInlineText(params.primaryText);
  const secondaryText = normalizeInlineText(params.secondaryText);

  if (params.kind === "couple") {
    const parts = [primaryText, secondaryText].filter(Boolean);
    return parts.length > 0 ? parts.join(" and ") : "two names";
  }

  if (primaryText) {
    return primaryText;
  }

  return params.kind === "arabic" ? "custom Arabic name" : "custom name";
}

function getCommunityFallbackAlt(params: CommunityStyleAltParams) {
  const subject = getCommunitySubject(params);
  const label =
    params.kind === "couple"
      ? "Couple name art"
      : params.kind === "arabic"
        ? "Arabic name art"
        : "Name art";

  return truncateAlt(`${label} featuring ${subject}`);
}

export function buildCommunityAltFromStyle(params: CommunityStyleAltParams) {
  const templateAlt = normalizeInlineText(params.templateAlt);
  if (!templateAlt) {
    return getCommunityFallbackAlt(params);
  }

  const primaryText = normalizeInlineText(params.primaryText);
  const secondaryText = normalizeInlineText(params.secondaryText);
  const subject = getCommunitySubject(params);
  let alt = templateAlt;

  if (params.kind === "couple") {
    if (primaryText) {
      alt = alt.replace(/\bfirst name\b/gi, primaryText);
    }
    if (secondaryText) {
      alt = alt.replace(/\bsecond name\b/gi, secondaryText);
    }
    alt = alt.replace(/\btwo names\b/gi, subject);
  } else if (primaryText) {
    alt = alt.replace(/custom Arabic name/gi, primaryText);
    alt = alt.replace(/custom name/gi, primaryText);
  }

  alt = alt.replace(/\bexample:/i, `featuring ${subject}:`);

  return truncateAlt(normalizeInlineText(alt));
}

export function buildCommunityTitleFromStyle(params: CommunityStyleAltParams) {
  const primaryText = normalizeInlineText(params.primaryText);
  const secondaryText = normalizeInlineText(params.secondaryText);
  const styleLabel = normalizeInlineText(params.styleLabel);

  let subject = "";

  if (params.kind === "couple") {
    const parts = [primaryText, secondaryText].filter(Boolean);
    subject = parts.length > 0 ? parts.join(" & ") : "Couple design";
  } else {
    subject =
      primaryText || (params.kind === "arabic" ? "Arabic design" : "Name design");
  }

  return styleLabel ? `${subject} - ${styleLabel}` : subject;
}

function extractCommunityImageMetadata(
  metadata?: unknown,
): CommunityImageMetadata | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const maybeMetadata = metadata as Record<string, unknown>;
  const communityAlt =
    typeof maybeMetadata.communityAlt === "string"
      ? maybeMetadata.communityAlt
      : null;
  const communityTitle =
    typeof maybeMetadata.communityTitle === "string"
      ? maybeMetadata.communityTitle
      : null;

  if (!communityAlt && !communityTitle) {
    return null;
  }

  return { communityAlt, communityTitle };
}

export function getCommunityImagePresentation(params: {
  metadata?: unknown;
  prompt?: string | null;
}) {
  const communityMetadata = extractCommunityImageMetadata(params.metadata);
  const alt =
    normalizeInlineText(communityMetadata?.communityAlt) ||
    buildCommunityImageAlt(params.prompt);
  const title =
    normalizeInlineText(communityMetadata?.communityTitle) || alt;

  return { alt, title };
}

export function buildCommunityImageAlt(prompt?: string | null) {
  if (!prompt) {
    return "Community-generated personalized design";
  }

  const subject = extractPromptSubject(prompt);
  if (subject) {
    return `Community design featuring ${subject}`;
  }

  if (/arabic|calligraphy/i.test(prompt)) {
    return "Community-generated Arabic name art";
  }

  if (/couple|wedding|anniversary|\[name1\]|\[name2\]|two names/i.test(prompt)) {
    return "Community-generated couple name art";
  }

  return "Community-generated personalized name art";
}
