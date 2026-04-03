import sharp from "sharp";
import type { CoupleNameMugMode } from "~/config/coupleNameMugV1Style";

const SIDE_CANVAS_SIZE = 1024;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getFontSize(name: string, mode: CoupleNameMugMode) {
  const baseSize = mode === "names_only" ? 148 : 108;
  const extraChars = Math.max(0, name.trim().length - 8);
  const nextSize = baseSize - extraChars * (mode === "names_only" ? 6 : 4);
  return Math.max(mode === "names_only" ? 88 : 72, nextSize);
}

function buildOverlaySvg(name: string, mode: CoupleNameMugMode) {
  const escapedName = escapeXml(name.trim());
  const fontSize = getFontSize(name, mode);
  const plaqueWidth = mode === "names_only" ? 760 : 720;
  const plaqueHeight = mode === "names_only" ? 214 : 184;
  const plaqueX = Math.round((SIDE_CANVAS_SIZE - plaqueWidth) / 2);
  const plaqueY = mode === "names_only" ? 404 : 780;
  const textY = plaqueY + plaqueHeight / 2 + fontSize * 0.28;

  return `
    <svg width="${SIDE_CANVAS_SIZE}" height="${SIDE_CANVAS_SIZE}" viewBox="0 0 ${SIDE_CANVAS_SIZE} ${SIDE_CANVAS_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="rgba(83,49,35,0.22)" />
        </filter>
      </defs>
      <rect
        x="${plaqueX}"
        y="${plaqueY}"
        width="${plaqueWidth}"
        height="${plaqueHeight}"
        rx="${Math.round(plaqueHeight / 2)}"
        fill="rgba(255,249,243,0.84)"
        stroke="rgba(176,126,86,0.34)"
        stroke-width="3"
        filter="url(#shadow)"
      />
      <text
        x="512"
        y="${textY}"
        text-anchor="middle"
        fill="#6C3E2D"
        font-size="${fontSize}"
        font-style="italic"
        font-weight="700"
        font-family="Georgia, 'Times New Roman', serif"
        letter-spacing="1"
      >${escapedName}</text>
    </svg>
  `;
}

export async function composeCoupleMugSideArtwork(params: {
  artworkBuffer: Buffer;
  name: string;
  mode: CoupleNameMugMode;
}) {
  const resizedArtwork = await sharp(params.artworkBuffer)
    .resize({
      width: SIDE_CANVAS_SIZE,
      height: SIDE_CANVAS_SIZE,
      fit: "cover",
      position: "centre",
    })
    .png()
    .toBuffer();

  return sharp(resizedArtwork)
    .composite([
      {
        input: Buffer.from(buildOverlaySvg(params.name, params.mode)),
        left: 0,
        top: 0,
      },
    ])
    .png({ quality: 100 })
    .withMetadata({ density: 300 })
    .toBuffer();
}
