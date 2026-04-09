type ProductType =
  | "mug"
  | "mugBlackGlossy"
  | "mugColorInside"
  | "coaster"
  | "canvas"
  | "journal"
  | "framedPoster"
  | "tshirt"
  | "poster";

type ProductNudgeBlockProps = {
  productType: ProductType;
};

export function ProductNudgeBlock({ productType }: ProductNudgeBlockProps) {
  const points = (() => {
    switch (productType) {
      case "mug":
        return [
          "High-quality glossy ceramic",
          "Dishwasher & microwave safe",
          "Printed with premium quality",
          "Shipping available in selected countries",
        ];
      case "mugBlackGlossy":
        return [
          "Glossy black ceramic finish",
          "Lead and BPA-free material",
          "Dishwasher & microwave safe",
          "Shipping available in selected countries",
        ];
      case "mugColorInside":
        return [
          "Colored rim, inside, and handle",
          "Lead and BPA-free ceramic",
          "Dishwasher & microwave safe",
          "Shipping available in selected countries",
        ];
      case "coaster":
        return [
          "Glossy top with cork backing",
          "Rounded corners and non-slip base",
          "Water-repellent and heat-resistant",
          "Shipping available in selected countries",
        ];
      case "framedPoster":
        return [
          "Enhanced matte paper with ayous wood frame",
          "Acrylite front protector included",
          "Ready to hang with included hardware",
          "Shipping available in selected countries",
        ];
      case "canvas":
        return [
          "Fade-resistant poly-cotton blend canvas",
          "Hand-stretched over solid wood stretcher bars",
          "1.25 in thick canvas profile",
          "Shipping available in selected countries",
        ];
      case "journal":
        return [
          "Matte laminated hardcover",
          "150 lined cream-colored pages",
          "Perforated pages for easy tear-out",
          "Available in the US",
        ];
      case "tshirt":
        return [
          "Premium Bella + Canvas 3001",
          "Soft, lightweight fabric",
          "True-to-size fit",
          "Shipping available in selected countries",
        ];
      case "poster":
        return [
          "Museum-quality print",
          "Thick matte paper",
          "Perfect for home decor",
          "Shipping available in selected countries",
        ];
      default:
        return [];
    }
  })();

  return (
    <ul className="mb-4 space-y-1 text-sm text-gray-700 dark:text-gray-300">
      {points.map((point) => (
        <li key={point} className="flex items-start gap-2">
          <span className="text-blue-500">✔</span>
          <span>{point}</span>
        </li>
      ))}
    </ul>
  );
}
