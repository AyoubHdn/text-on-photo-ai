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

  const { imageUrl, ramadanAdUser } = req.body as {
    imageUrl?: string;
    ramadanAdUser?: boolean;
  };

  if (!imageUrl) {
    return res.status(400).json({ error: "Missing imageUrl" });
  }

  if (ramadanAdUser) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        ramadanAdUser: true,
        productOrders: {
          where: {
            funnelSource: "ramadan-mug-ad",
            status: { in: ["paid", "fulfilled"] },
          },
          select: { id: true },
          take: 1,
        },
      },
    });

    const hasPurchasedRamadanMug = (user?.productOrders?.length ?? 0) > 0;
    if (user?.ramadanAdUser && !hasPurchasedRamadanMug) {
      return res.status(403).json({
        error: "DOWNLOAD_DISABLED_FOR_RAMADAN_FUNNEL",
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
