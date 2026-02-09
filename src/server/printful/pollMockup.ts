// src/server/printful/pollMockup.ts
import { printfulRequest } from "./client";

type MockupTaskStatus = {
  result: {
    status: "pending" | "completed" | "failed";
    mockups?: {
      mockup_url: string;
    }[];
  };
};

export async function pollMockupTask(taskId: string) {
  for (let i = 0; i < 10; i++) {
    const res = await printfulRequest<MockupTaskStatus>(
      `/mockup-generator/task?task_key=${taskId}`
    );

    console.log("[TASK STATUS]", res.result.status);

    if (res.result.status === "completed") {
      return res.result.mockups?.[0]?.mockup_url;
    }

    if (res.result.status === "failed") {
        console.error("[PRINTFUL TASK FAILED]", res);
        throw new Error("Mockup generation failed");
    }


    await new Promise((r) => setTimeout(r, 1200));
  }

  throw new Error("Mockup timeout");
}
