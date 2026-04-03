// src/server/printful/pollMockup.ts
import { printfulRequest } from "./client";

type GenerationTaskExtraMockup = {
  url?: string;
};

type GenerationTaskMockup = {
  mockup_url?: string;
  extra?: GenerationTaskExtraMockup[];
};

type MockupTaskStatus = {
  result: {
    status: "pending" | "completed" | "failed";
    mockups?: GenerationTaskMockup[];
  };
};

export type PollMockupTaskResult = {
  primaryMockupUrl: string | null;
  extraMockupUrls: string[];
  allMockupUrls: string[];
};

function extractMockupUrls(mockups: GenerationTaskMockup[] | undefined): PollMockupTaskResult {
  const dedupedUrls = new Set<string>();

  for (const mockup of mockups ?? []) {
    const primaryUrl = mockup.mockup_url?.trim();
    if (primaryUrl) {
      dedupedUrls.add(primaryUrl);
    }

    for (const extra of mockup.extra ?? []) {
      const extraUrl = extra.url?.trim();
      if (extraUrl) {
        dedupedUrls.add(extraUrl);
      }
    }
  }

  const allMockupUrls = [...dedupedUrls];

  return {
    primaryMockupUrl: allMockupUrls[0] ?? null,
    extraMockupUrls: allMockupUrls.slice(1),
    allMockupUrls,
  };
}

export async function pollMockupTaskWithExtras(taskId: string): Promise<PollMockupTaskResult> {
  for (let i = 0; i < 10; i++) {
    const res = await printfulRequest<MockupTaskStatus>(
      `/mockup-generator/task?task_key=${taskId}`
    );

    console.log("[TASK STATUS]", res.result.status);

    if (res.result.status === "completed") {
      return extractMockupUrls(res.result.mockups);
    }

    if (res.result.status === "failed") {
        console.error("[PRINTFUL TASK FAILED]", res);
        throw new Error("Mockup generation failed");
    }


    await new Promise((r) => setTimeout(r, 1200));
  }

  throw new Error("Mockup timeout");
}

export async function pollMockupTask(taskId: string) {
  const result = await pollMockupTaskWithExtras(taskId);
  return result.primaryMockupUrl;
}
