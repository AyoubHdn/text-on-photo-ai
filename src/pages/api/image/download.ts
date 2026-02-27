import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { prisma } from "~/server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { imageUrl, paidTrafficUser } = req.body as {
    imageUrl?: string;
    paidTrafficUser?: boolean;
  };

  if (!imageUrl) {
    return res.status(400).json({ error: "Missing imageUrl" });
  }

  if (paidTrafficUser) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        paidTrafficUser: true,
        productOrders: {
          where: {
            funnelSource: { in: ["paid-traffic-offer", "ramadan-mug-ad"] },
            status: { in: ["paid", "fulfilled"] },
          },
          select: { id: true },
          take: 1,
        },
      },
    });

    const hasPurchasedPaidTrafficOffer = (user?.productOrders?.length ?? 0) > 0;
    if (user?.paidTrafficUser && !hasPurchasedPaidTrafficOffer) {
      return res.status(403).json({
        error: "DOWNLOAD_DISABLED_FOR_PAID_TRAFFIC_FUNNEL",
      });
    }
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    return res.status(400).json({ error: "Failed to fetch image" });
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  res.setHeader("Content-Type", response.headers.get("content-type") ?? "image/png");
  res.setHeader("Content-Disposition", 'attachment; filename="generated-design.png"');
  return res.status(200).send(buffer);
}
