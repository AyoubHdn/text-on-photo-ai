export async function requestProductPreview(
  productKey: string,
  imageUrl: string
) {
  const res = await fetch("/api/printful/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productKey, imageUrl }),
  });

  if (!res.ok) {
    throw new Error("Preview failed");
  }

  return res.json();
}
