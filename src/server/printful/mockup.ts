/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { printfulRequest } from "./client";
import { PrintfulProduct } from "./products";
import { POSTER_ASPECT_CONFIG, MUG_PRINT_CONFIG, PrintAreaConfig,} from "./printAreas";
import { TSHIRT_PRINT_CONFIG } from "./tshirtPrintAreas";

type MockupTaskResponse = {
  result: {
    task_key: string;
    status: string;
  };
};

export async function createMockupTask(
  product: PrintfulProduct,
  imageUrl: string,
  variantId: number,
  aspect?: string, // posters only
) {
  let printConfig: PrintAreaConfig | undefined;
  const files: any[] = [];

  /* ---------- POSTER ---------- */
  if (product.key === "poster") {
    if (!aspect) throw new Error("Poster aspect missing");

    printConfig = POSTER_ASPECT_CONFIG[aspect as keyof typeof POSTER_ASPECT_CONFIG];
    if (!printConfig) throw new Error("Poster print config not found");

    files.push({
      type: printConfig.fileType,
      image_url: imageUrl,
      position: {
        area_width: printConfig.areaWidth,
        area_height: printConfig.areaHeight,
        width: printConfig.width,
        height: printConfig.height,
        top: printConfig.top,
        left: printConfig.left,
      },
    });
  }

  /* ---------- MUG ---------- */
  if (product.key === "mug") {
    const config = MUG_PRINT_CONFIG[variantId];
    if (!config) throw new Error("Mug print config not found");

    const { areaWidth, areaHeight } = config;

    // ONE image, already prepared (two-side / center / wrap)
    files.push({
      type: config.fileType,
      image_url: imageUrl,
      position: {
        area_width: areaWidth,
        area_height: areaHeight,
        width: areaWidth,
        height: areaHeight,
        top: 0,
        left: 0,
      },
    });
  }

  /* ---------- T-SHIRT ---------- */
  if (product.key === "tshirt") {
    const placement = "front";
    const config = TSHIRT_PRINT_CONFIG[placement];

    files.push({
      type: config.fileType, // "front"
      image_url: imageUrl,   // already positioned PNG
      position: {
        area_width: config.areaWidth,
        area_height: config.areaHeight,
        width: config.areaWidth,
        height: config.areaHeight,
        top: 0,
        left: 0,
      },
    });
  }

  if (!files.length) {
    throw new Error("No print files generated");
  }

  const payload = {
    variant_ids: [variantId],
    format: "jpg",
    files,
  };

  console.log("[PRINTFUL_CREATE_TASK_PAYLOAD]", payload);

  return printfulRequest<MockupTaskResponse>(
    `/mockup-generator/create-task/${product.printfulProductId}`,
    "POST",
    payload
  );
}
