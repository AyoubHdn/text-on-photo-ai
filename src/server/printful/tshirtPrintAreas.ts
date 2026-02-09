import { PrintAreaConfig } from "./printAreas";

export const TSHIRT_PRINT_CONFIG: Record<
  "front" | "back",
  PrintAreaConfig
> = {
  front: {
    fileType: "front",
    areaWidth: 3810,
    areaHeight: 4572,
    width: 3810,
    height: 4572,
    top: 0,
    left: 0,
  },

  back: {
    fileType: "back",
    areaWidth: 3810,
    areaHeight: 4572,
    width: 3810,
    height: 4572,
    top: 0,
    left: 0,
  },
};
