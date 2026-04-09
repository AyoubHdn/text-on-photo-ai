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

/* ---------------- FRAMED POSTERS ---------------- */

const FRAMED_POSTER_8X10_PRINT_AREA: PrintAreaConfig = {
  fileType: "default",
  areaWidth: 3000,
  areaHeight: 2400,
  width: 3000,
  height: 2400,
  top: 0,
  left: 0,
};

const FRAMED_POSTER_10X10_PRINT_AREA: PrintAreaConfig = {
  fileType: "default",
  areaWidth: 3000,
  areaHeight: 3000,
  width: 3000,
  height: 3000,
  top: 0,
  left: 0,
};

const FRAMED_POSTER_11X14_PRINT_AREA: PrintAreaConfig = {
  fileType: "default",
  areaWidth: 4200,
  areaHeight: 3300,
  width: 4200,
  height: 3300,
  top: 0,
  left: 0,
};

const FRAMED_POSTER_12X12_PRINT_AREA: PrintAreaConfig = {
  fileType: "default",
  areaWidth: 3600,
  areaHeight: 3600,
  width: 3600,
  height: 3600,
  top: 0,
  left: 0,
};

const FRAMED_POSTER_12X16_PRINT_AREA: PrintAreaConfig = {
  fileType: "default",
  areaWidth: 4800,
  areaHeight: 3600,
  width: 4800,
  height: 3600,
  top: 0,
  left: 0,
};

const FRAMED_POSTER_12X18_PRINT_AREA: PrintAreaConfig = {
  fileType: "default",
  areaWidth: 5400,
  areaHeight: 3600,
  width: 5400,
  height: 3600,
  top: 0,
  left: 0,
};

const FRAMED_POSTER_14X14_PRINT_AREA: PrintAreaConfig = {
  fileType: "default",
  areaWidth: 4200,
  areaHeight: 4200,
  width: 4200,
  height: 4200,
  top: 0,
  left: 0,
};

const FRAMED_POSTER_16X16_PRINT_AREA: PrintAreaConfig = {
  fileType: "default",
  areaWidth: 4800,
  areaHeight: 4800,
  width: 4800,
  height: 4800,
  top: 0,
  left: 0,
};

const FRAMED_POSTER_16X20_PRINT_AREA: PrintAreaConfig = {
  fileType: "default",
  areaWidth: 6000,
  areaHeight: 4800,
  width: 6000,
  height: 4800,
  top: 0,
  left: 0,
};

const FRAMED_POSTER_18X18_PRINT_AREA: PrintAreaConfig = {
  fileType: "default",
  areaWidth: 5400,
  areaHeight: 5400,
  width: 5400,
  height: 5400,
  top: 0,
  left: 0,
};

const FRAMED_POSTER_18X24_PRINT_AREA: PrintAreaConfig = {
  fileType: "default",
  areaWidth: 7200,
  areaHeight: 5400,
  width: 7200,
  height: 5400,
  top: 0,
  left: 0,
};

const FRAMED_POSTER_20X30_PRINT_AREA: PrintAreaConfig = {
  fileType: "default",
  areaWidth: 9000,
  areaHeight: 6000,
  width: 9000,
  height: 6000,
  top: 0,
  left: 0,
};

const FRAMED_POSTER_24X36_PRINT_AREA: PrintAreaConfig = {
  fileType: "default",
  areaWidth: 10800,
  areaHeight: 7200,
  width: 10800,
  height: 7200,
  top: 0,
  left: 0,
};

export const FRAMED_POSTER_PRINT_CONFIG: Record<number, PrintAreaConfig> = {
  ...createPrintAreaMap([4651, 15021, 10754], FRAMED_POSTER_8X10_PRINT_AREA),
  ...createPrintAreaMap([4652, 15022, 10755], FRAMED_POSTER_10X10_PRINT_AREA),
  ...createPrintAreaMap([14292, 15023, 14293], FRAMED_POSTER_11X14_PRINT_AREA),
  ...createPrintAreaMap([4653, 15024, 10756], FRAMED_POSTER_12X12_PRINT_AREA),
  ...createPrintAreaMap([1350, 15025, 10751], FRAMED_POSTER_12X16_PRINT_AREA),
  ...createPrintAreaMap([4398, 15026, 10752], FRAMED_POSTER_12X18_PRINT_AREA),
  ...createPrintAreaMap([4654, 15027, 10757], FRAMED_POSTER_14X14_PRINT_AREA),
  ...createPrintAreaMap([4655, 15028, 10758], FRAMED_POSTER_16X16_PRINT_AREA),
  ...createPrintAreaMap([4399, 15029, 10753], FRAMED_POSTER_16X20_PRINT_AREA),
  ...createPrintAreaMap([4656, 15030, 10759], FRAMED_POSTER_18X18_PRINT_AREA),
  ...createPrintAreaMap([3, 15031, 10749], FRAMED_POSTER_18X24_PRINT_AREA),
  ...createPrintAreaMap([19520, 19521, 19522], FRAMED_POSTER_20X30_PRINT_AREA),
  ...createPrintAreaMap([4, 15032, 10750], FRAMED_POSTER_24X36_PRINT_AREA),
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
  ...createPrintAreaMap([9323], MUG_11OZ_PRINT_AREA),
  ...createPrintAreaMap([9324], MUG_15OZ_PRINT_AREA),
  ...createPrintAreaMap(
    [11051, 11050, 12579, 12578, 11049, 11048, 17362, 17359, 17358, 17361],
    MUG_11OZ_PRINT_AREA,
  ),
  ...createPrintAreaMap([17196, 17197, 22373, 17200, 17199, 17360], MUG_15OZ_PRINT_AREA),
};

/* ---------------- COASTER ---------------- */

const COASTER_PRINT_AREA: PrintAreaConfig = {
  fileType: "default",
  areaWidth: 1181,
  areaHeight: 1181,
  width: 1181,
  height: 1181,
  top: 0,
  left: 0,
};

export const COASTER_PRINT_CONFIG: Record<number, PrintAreaConfig> = {
  ...createPrintAreaMap([15662], COASTER_PRINT_AREA),
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
