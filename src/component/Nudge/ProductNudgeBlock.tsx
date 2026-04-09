type ProductType = "mug" | "mugColorInside" | "tshirt" | "poster";

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
      case "mugColorInside":
        return [
          "Colored rim, inside, and handle",
          "Lead and BPA-free ceramic",
          "Dishwasher & microwave safe",
          "Shipping available in selected countries",
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
