export type AspectRatio = "1:1" | "4:5" | "3:2" | "16:9";

export const ASPECT_POSITION_MAP: Record<
  AspectRatio,
  { width: number; height: number }
> = {
  "1:1": {
    width: 1800,
    height: 1800,
  },
  "4:5": {
    width: 1800,
    height: 2250,
  },
  "3:2": {
    width: 2400,
    height: 1600,
  },
  "16:9": {
    width: 2400,
    height: 1350,
  },
};

