type PreviewRecord = {
  status: "PENDING" | "COMPLETED" | "FAILED";
  mockupUrl?: string;
  cacheKey?: string;
  createdAt: number;
};

const taskStore = new Map<string, PreviewRecord>();
const cacheStore = new Map<string, string>();

export const previewStore = {
  getTask(taskKey: string) {
    return taskStore.get(taskKey);
  },
  setTask(taskKey: string, record: PreviewRecord) {
    taskStore.set(taskKey, record);
  },
  setCompleted(taskKey: string, mockupUrl: string) {
    const existing = taskStore.get(taskKey);
    taskStore.set(taskKey, {
      status: "COMPLETED",
      mockupUrl,
      cacheKey: existing?.cacheKey,
      createdAt: existing?.createdAt ?? Date.now(),
    });
    if (existing?.cacheKey) {
      cacheStore.set(existing.cacheKey, mockupUrl);
    }
  },
  setFailed(taskKey: string) {
    const existing = taskStore.get(taskKey);
    taskStore.set(taskKey, {
      status: "FAILED",
      cacheKey: existing?.cacheKey,
      createdAt: existing?.createdAt ?? Date.now(),
    });
  },
  getCached(cacheKey: string) {
    return cacheStore.get(cacheKey);
  },
  setCached(cacheKey: string, mockupUrl: string) {
    cacheStore.set(cacheKey, mockupUrl);
  },
};
