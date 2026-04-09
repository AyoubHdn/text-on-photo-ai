import { AspectRatio } from "./aspects";

export type PrintAreaConfig = {
  fileType: string;
  areaWidth: number;
  areaHeight: number;
  width: number;
  height: number;
  top: number;
  left: number;
};

/* ---------------- POSTERS ---------------- */

export const POSTER_ASPECT_CONFIG: Record<AspectRatio, PrintAreaConfig> = {
  "1:1": {
    fileType: "default",
    areaWidth: 1800,
    areaHeight: 1800,
    width: 1800,
    height: 1800,
    top: 0,
    left: 0,
  },

  "4:5": {
    fileType: "default",
    areaWidth: 1800,
    areaHeight: 2250,
    width: 1800,
    height: 2250,
    top: 0,
    left: 0,
  },

  "3:2": {
    fileType: "default",
    areaWidth: 2400,
    areaHeight: 1600,
    width: 2400,
    height: 1600,
    top: 0,
    left: 0,
  },

  "16:9": {
    fileType: "default",
    areaWidth: 2400,
    areaHeight: 1350,
    width: 2400,
    height: 1350,
    top: 0,
    left: 0,
  },
};

/* ---------------- MUGS ---------------- */

const MUG_11OZ_PRINT_AREA: PrintAreaConfig = {
  fileType: "default",
  areaWidth: 2700,
  areaHeight: 1050,
  width: 2700,
  height: 1050,
  top: 0,
  left: 0,
};

const MUG_15OZ_PRINT_AREA: PrintAreaConfig = {
  fileType: "default",
  areaWidth: 2700,
  areaHeight: 1140,
  width: 2700,
  height: 1140,
  top: 0,
  left: 0,
};

const MUG_20OZ_PRINT_AREA: PrintAreaConfig = {
  fileType: "default",
  areaWidth: 3070,
  areaHeight: 1200,
  width: 3070,
  height: 1200,
  top: 0,
  left: 0,
};

function createPrintAreaMap(
  variantIds: number[],
  config: PrintAreaConfig,
): Record<number, PrintAreaConfig> {
  return Object.fromEntries(variantIds.map((variantId) => [variantId, config]));
}

export const MUG_PRINT_CONFIG: Record<number, PrintAreaConfig> = {
  ...createPrintAreaMap([1320], MUG_11OZ_PRINT_AREA),
  ...createPrintAreaMap([4830], MUG_15OZ_PRINT_AREA),
  ...createPrintAreaMap([16586], MUG_20OZ_PRINT_AREA),
  ...createPrintAreaMap(
    [11051, 11050, 12579, 12578, 11049, 11048, 17362, 17359, 17358, 17361],
    MUG_11OZ_PRINT_AREA,
  ),
  ...createPrintAreaMap([17196, 17197, 22373, 17200, 17199, 17360], MUG_15OZ_PRINT_AREA),
};

/* ---------------- T-SHIRT (DTG) ---------------- */

export const TSHIRT_FRONT_PRINT_CONFIG = {
  fileType: "default",
  areaWidth: 4500,
  areaHeight: 5400,
  width: 4500,
  height: 5400,
  top: 0,
  left: 0,
};
