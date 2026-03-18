// @ts-nocheck
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function truncateAlt(value, maxLength = 160) {
  if (value.length <= maxLength) return value;
  const shortened = value.slice(0, maxLength).trim();
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, lastSpace > 0 ? lastSpace : maxLength).trim()}.`;
}

function cleanPromptText(prompt, kind) {
  const genericName = kind === "arabic" ? "custom Arabic name" : "custom name";

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

function shouldSkipClause(clause) {
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

function summarizePrompt(prompt, kind) {
  const cleaned = cleanPromptText(prompt, kind);
  const clauses = cleaned
    .split(/[.,;]/)
    .map((part) => part.trim())
    .filter((part) => !shouldSkipClause(part));

  const summary = clauses.slice(0, 2).join(", ");
  return summary || cleaned.split(/[.]/)[0]?.trim() || cleaned;
}

function buildPromptImageAlt(prompt, { kind, title }) {
  const subject =
    kind === "couple"
      ? "couple name art"
      : kind === "arabic"
        ? "Arabic name art"
        : "name art";

  const summary = summarizePrompt(prompt, kind);
  const prefix = title ? `${title} ${subject} example: ` : `${subject} example: `;
  return truncateAlt(`${prefix}${summary}`);
}

function escapeText(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function populateSingleLineFile(filePath, kind) {
  const absolutePath = path.join(root, filePath);
  const current = fs.readFileSync(absolutePath, "utf8");
  const next = current.replace(
    /\{\s*(?:altText: "(?:[^"\\]|\\.)*",\s*)?src: "([^"]+)",\s*allowCustomColors: (true|false),\s*basePrompt: "((?:[^"\\]|\\.)*)"\s*\}/g,
    (_match, src, allowCustomColors, basePrompt) => {
      const titleMatch = src.match(/\/([^/]+)\/s\d+/i);
      const title = titleMatch?.[1] ?? undefined;
      const altText = escapeText(
        buildPromptImageAlt(basePrompt, {
          kind,
          title,
        }),
      );
      return `{ altText: "${altText}", src: "${src}", allowCustomColors: ${allowCustomColors}, basePrompt: "${basePrompt}" }`;
    },
  );

  fs.writeFileSync(absolutePath, next);
}

function populateObjectBlockFile(filePath, kind) {
  const absolutePath = path.join(root, filePath);
  const current = fs.readFileSync(absolutePath, "utf8");
  const lines = current.split(/\r?\n/);
  const output = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!/^\s*\{\s*$/.test(line)) {
      output.push(line);
      continue;
    }

    const block = [line];
    let endIndex = index + 1;
    while (endIndex < lines.length) {
      block.push(lines[endIndex]);
      if (/^\s*\},?\s*$/.test(lines[endIndex])) break;
      endIndex += 1;
    }

    const blockText = block.join("\n");
    const srcMatch = blockText.match(/^(\s*)src: "([^"]+)",[^\n]*$/m);
    const nameMatch = blockText.match(/^\s*name: "([^"]+)",$/m);
    const promptMatch = blockText.match(/^\s*basePrompt: "((?:[^"\\]|\\.)*)",$/m);

    if (!srcMatch || !promptMatch) {
      output.push(...block);
      index = endIndex;
      continue;
    }

    const indent = srcMatch[1] || "        ";
    const name = nameMatch?.[1];
    const basePrompt = promptMatch[1];
    const altText = escapeText(
      buildPromptImageAlt(basePrompt, {
        kind,
        title: name,
      }),
    );

    const cleanedBlock = block.filter(
      (entryLine, entryIndex) =>
        entryIndex === 0 || !/^\s*altText: "/.test(entryLine),
    );
    cleanedBlock.splice(1, 0, `${indent}altText: "${altText}",`);

    output.push(...cleanedBlock);
    index = endIndex;
  }

  fs.writeFileSync(absolutePath, output.join("\n"));
}

populateSingleLineFile("src/data/stylesData.ts", "name");
populateObjectBlockFile("src/data/coupleStylesData.ts", "couple");
populateObjectBlockFile("src/data/arabicStylesData.ts", "arabic");

console.log("Alt text populated in style data files.");
