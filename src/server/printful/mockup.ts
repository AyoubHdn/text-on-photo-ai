/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { isMugProductKey } from "~/config/physicalProducts";
import { printfulRequest } from "./client";
import {
  CANDLE_PRINT_CONFIG,
  CANVAS_PRINT_CONFIG,
  COASTER_PRINT_CONFIG,
  FRAMED_POSTER_PRINT_CONFIG,
  JOURNAL_PRINT_CONFIG,
  MUG_PRINT_CONFIG,
  PILLOW_PRINT_CONFIG,
  POSTCARD_PRINT_CONFIG,
  POSTER_ASPECT_CONFIG,
  type PrintAreaConfig,
} from "./printAreas";
import type { PrintfulProduct } from "./products";
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
  aspect?: string,
) {
  let printConfig: PrintAreaConfig | undefined;
  const files: any[] = [];

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

  if (product.key === "framedPoster") {
    const config = FRAMED_POSTER_PRINT_CONFIG[variantId];
    if (!config) throw new Error("Framed poster print config not found");

    files.push({
      type: config.fileType,
      image_url: imageUrl,
      position: {
        area_width: config.areaWidth,
        area_height: config.areaHeight,
        width: config.width,
        height: config.height,
        top: config.top,
        left: config.left,
      },
    });
  }

  if (product.key === "canvas") {
    const config = CANVAS_PRINT_CONFIG[variantId];
    if (!config) throw new Error("Canvas print config not found");

    files.push({
      type: config.fileType,
      image_url: imageUrl,
      position: {
        area_width: config.areaWidth,
        area_height: config.areaHeight,
        width: config.width,
        height: config.height,
        top: config.top,
        left: config.left,
      },
    });
  }

  if (product.key === "postcard") {
    const config = POSTCARD_PRINT_CONFIG[variantId];
    if (!config) throw new Error("Postcard print config not found");

    files.push({
      type: config.fileType,
      image_url: imageUrl,
      position: {
        area_width: config.areaWidth,
        area_height: config.areaHeight,
        width: config.width,
        height: config.height,
        top: config.top,
        left: config.left,
      },
    });
  }

  if (product.key === "candle") {
    const config = CANDLE_PRINT_CONFIG[variantId];
    if (!config) throw new Error("Candle print config not found");

    files.push({
      type: config.fileType,
      image_url: imageUrl,
      position: {
        area_width: config.areaWidth,
        area_height: config.areaHeight,
        width: config.width,
        height: config.height,
        top: config.top,
        left: config.left,
      },
    });
  }

  if (product.key === "pillow") {
    const config = PILLOW_PRINT_CONFIG[variantId];
    if (!config) throw new Error("Pillow print config not found");

    files.push({
      type: "front",
      image_url: imageUrl,
      position: {
        area_width: config.areaWidth,
        area_height: config.areaHeight,
        width: config.width,
        height: config.height,
        top: config.top,
        left: config.left,
      },
    });
    files.push({
      type: "back",
      image_url: imageUrl,
      position: {
        area_width: config.areaWidth,
        area_height: config.areaHeight,
        width: config.width,
        height: config.height,
        top: config.top,
        left: config.left,
      },
    });
  }

  if (product.key === "journal") {
    const config = JOURNAL_PRINT_CONFIG[variantId];
    if (!config) throw new Error("Journal print config not found");

    files.push({
      type: config.fileType,
      image_url: imageUrl,
      position: {
        area_width: config.areaWidth,
        area_height: config.areaHeight,
        width: config.width,
        height: config.height,
        top: config.top,
        left: config.left,
      },
    });
  }

  if (isMugProductKey(product.key)) {
    const config = MUG_PRINT_CONFIG[variantId];
    if (!config) throw new Error("Mug print config not found");

    files.push({
      type: config.fileType,
      image_url: imageUrl,
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

  if (product.key === "coaster") {
    const config = COASTER_PRINT_CONFIG[variantId];
    if (!config) throw new Error("Coaster print config not found");

    files.push({
      type: config.fileType,
      image_url: imageUrl,
      position: {
        area_width: config.areaWidth,
        area_height: config.areaHeight,
        width: config.width,
        height: config.height,
        top: config.top,
        left: config.left,
      },
    });
  }

  if (product.key === "tshirt") {
    const placement = "front";
    const config = TSHIRT_PRINT_CONFIG[placement];

    files.push({
      type: config.fileType,
      image_url: imageUrl,
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
    payload,
  );
}
