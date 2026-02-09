/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { NextApiRequest, NextApiResponse } from "next";
import { printfulRequest } from "~/server/printful/client";
import { previewStore } from "~/server/printful/previewStore";

type MockupTaskStatus = {
  result: {
    status: "pending" | "completed" | "failed";
    mockups?: {
      mockup_url: string;
    }[];
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const taskKey = String(req.query.taskKey ?? "");
  if (!taskKey) {
    return res.status(400).json({ error: "Missing taskKey" });
  }

  const existing = previewStore.getTask(taskKey);
  if (existing?.status === "COMPLETED" && existing.mockupUrl) {
    return res.status(200).json({
      status: "COMPLETED",
      mockupUrl: existing.mockupUrl,
    });
  }

  if (existing?.status === "FAILED") {
    return res.status(200).json({ status: "FAILED" });
  }

  try {
    const task = await printfulRequest<MockupTaskStatus>(
      `/mockup-generator/task?task_key=${taskKey}`
    );

    if (task.result.status === "completed") {
      const mockupUrl = task.result.mockups?.[0]?.mockup_url;
      if (mockupUrl) {
        previewStore.setCompleted(taskKey, mockupUrl);
        return res.status(200).json({
          status: "COMPLETED",
          mockupUrl,
        });
      }
    }

    if (task.result.status === "failed") {
      previewStore.setFailed(taskKey);
      return res.status(200).json({ status: "FAILED" });
    }

    return res.status(200).json({ status: "PENDING" });
  } catch (error) {
    console.error("[PRINTFUL_PREVIEW_STATUS_ERROR]", error);
    return res.status(500).json({ error: "STATUS_FAILED" });
  }
}
