import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import test from "node:test";
import * as esbuild from "esbuild";
import React from "react";
import { act, create } from "react-test-renderer";

process.env.NEXT_PUBLIC_ASYNC_GENERATION_FEATURE_ENABLED = "true";

/**
 * @typedef {{generationRequestId: string, prompt: string, numberOfImages: number, aspectRatio: string, model: string, sourcePage: string}} RequestInput
 * @typedef {{kind: "error", error: Error} | {requestId: string, generationRequestId?: string, status: string, imageUrls?: string[], errorMessage?: string}} MockResult
 * @typedef {{start: (input: RequestInput) => Promise<unknown>, resumeStatus: () => Promise<unknown>, generationRequestId: string | null, canResumeStatus: boolean, pendingInput?: unknown}} HookState
 * @typedef {{submissions: RequestInput[], get: (id: string) => MockResult | null | undefined, set: (id: string, result: MockResult | null) => void, subscribe: (id: string, listener: () => void) => void, unsubscribe: (id: string, listener: () => void) => void, submit: (input: RequestInput) => Promise<MockResult>}} GenerationMock
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundlePath = path.join(root, ".tmp-async-hook.mjs");
const mockApi = [
  "import * as React from 'react';",
  "const mock = () => globalThis.__asyncGenerationMock;",
  "function useMutation() { return { mutateAsync: (input) => mock().submit(input), isLoading: false, error: null }; }",
  "function useQuery(input, options) {",
  "  const id = input.generationRequestId;",
  "  const [state, setState] = React.useState({ data: undefined, error: null });",
  "  const onErrorRef = React.useRef(options.onError);",
  "  const onSuccessRef = React.useRef(options.onSuccess);",
  "  const intervalRef = React.useRef(options.refetchInterval);",
  "  onErrorRef.current = options.onError;",
  "  onSuccessRef.current = options.onSuccess;",
  "  intervalRef.current = options.refetchInterval;",
  "  const apply = React.useCallback(() => {",
  "    const result = mock().get(id);",
  "    if (result?.kind === 'error') { setState({ data: undefined, error: result.error }); onErrorRef.current?.(result.error); }",
  "    else { setState({ data: result === undefined ? undefined : result, error: null }); onSuccessRef.current?.(result); }",
  "  }, [id]);",
  "  React.useEffect(() => {",
  "    if (!options.enabled) return undefined;",
  "    const current = mock(); current.subscribe(id, apply); apply();",
  "    const interval = typeof intervalRef.current === 'function' ? intervalRef.current(undefined) : false;",
  "    const timer = interval ? setInterval(apply, Math.min(interval, 20)) : undefined;",
  "    return () => { current.unsubscribe(id, apply); if (timer) clearInterval(timer); };",
  "  }, [apply, id, options.enabled]);",
  "  const refetch = React.useCallback(async () => { apply(); return { data: mock().get(id) }; }, [apply, id]);",
  "  const remove = React.useCallback(() => setState({ data: undefined, error: null }), []);",
  "  return { data: state.data, error: state.error, refetch, remove };",
  "}",
  "export const api = { generate: { generateIconAsync: { useMutation }, getGenerationStatus: { useQuery } } };",
].join("\n");

await esbuild.build({
  entryPoints: [path.join(root, "src/hook/useAsyncGeneration.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: bundlePath,
  resolveExtensions: [".ts", ".tsx", ".mjs", ".js"],
  define: { "process.env.NEXT_PUBLIC_ASYNC_GENERATION_FEATURE_ENABLED": '"true"' },
  external: ["react", "react-test-renderer"],
  plugins: [{
    name: "async-hook-test-resolver",
    setup(build) {
      build.onResolve({ filter: /^~\/utils\/api$/ }, () => ({ path: "async-hook-test-api", namespace: "mock" }));
      build.onResolve({ filter: /^~\// }, (args) => ({ path: path.join(root, "src", args.path.slice(2) + ".ts") }));
      build.onLoad({ filter: /^async-hook-test-api$/, namespace: "mock" }, () => ({ contents: mockApi, loader: "js" }));
    },
  }],
});

const { useAsyncGeneration } = await import(pathToFileURL(bundlePath).href + "?test=" + Date.now());

class MemoryStorage {
  /** @type {Map<string, string>} */
  #values = new Map();
  get length() { return this.#values.size; }
  clear() { this.#values.clear(); }
  /** @param {number} index */
  key(index) { return [...this.#values.keys()][index] ?? null; }
  /** @param {string} key */
  getItem(key) { return this.#values.get(key) ?? null; }
  /** @param {string} key @param {string} value */
  setItem(key, value) { this.#values.set(key, String(value)); }
  /** @param {string} key */
  removeItem(key) { this.#values.delete(key); }
}
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: { localStorage: new MemoryStorage() },
});
/** @type {{localStorage: Storage}} */
const testWindow = Reflect.get(globalThis, "window");
/** @type {typeof globalThis & {__asyncGenerationMock?: GenerationMock}} */
const testGlobal = globalThis;

/** @returns {GenerationMock} */
function makeMock() {
  /** @type {Map<string, MockResult | null>} */
  const results = new Map();
  /** @type {Map<string, Set<() => void>>} */
  const listeners = new Map();
  /** @type {GenerationMock} */
  const mock = {
    submissions: [],
    /** @param {string} id */
    get: (id) => results.get(id),
    /** @param {string} id @param {MockResult | null} result */
    set(id, result) { results.set(id, result); for (const listener of listeners.get(id) ?? []) listener(); },
    /** @param {string} id @param {() => void} listener */
    subscribe(id, listener) { const set = listeners.get(id) ?? new Set(); set.add(listener); listeners.set(id, set); },
    /** @param {string} id @param {() => void} listener */
    unsubscribe(id, listener) { listeners.get(id)?.delete(listener); },
    /** @param {RequestInput} input */
    submit: async (input) => {
      mock.submissions.push(input);
      mock.set(input.generationRequestId, { requestId: input.generationRequestId, status: "processing" });
      return { requestId: input.generationRequestId, generationRequestId: input.generationRequestId, status: "started" };
    },
  };
  testGlobal.__asyncGenerationMock = mock;
  return mock;
}

/**
 * @param {{options: Parameters<typeof useAsyncGeneration>[0], onRender: (value: HookState) => void}} props
 */
function Harness({ options, onRender }) {
  onRender(useAsyncGeneration(options));
  return null;
}

/** @type {HookState | undefined} */
let latestState;
function current() {
  if (!latestState) throw new Error("hook has not rendered");
  return latestState;
}

async function settle() {
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
}

/** @param {string} id @param {string} [sourcePage] @returns {RequestInput} */
const input = (id, sourcePage = "name-art-generator") => ({
  generationRequestId: id,
  prompt: "test",
  numberOfImages: 1,
  aspectRatio: "1:1",
  model: "flux-schnell",
  sourcePage,
});

test("authenticated completion is handled once and clears scoped persistence", async () => {
  const mock = makeMock();
  latestState = undefined;
  let completed = 0;
  const renderer = create(React.createElement(Harness, {
    options: {
      enabled: true,
      userId: "user-1",
      sourcePage: "name-art-generator",
      onCompleted: () => { completed += 1; },
    },
    onRender: (value) => { latestState = value; },
  }));
  await settle();
  await act(async () => { await current().start(input("complete-1")); });
  const done = {
    requestId: "complete-1",
    status: "completed",
    imageUrls: ["https://example.test/one.webp"],
  };
  mock.set("complete-1", done);
  await settle();
  mock.set("complete-1", done);
  await settle();
  assert.equal(mock.submissions.length, 1);
  assert.equal(completed, 1);
  assert.equal(
    testWindow.localStorage.getItem(
      "name-art:pending-async-generation:v1:user-1:name-art-generator",
    ),
    null,
  );
  renderer.unmount();
});

test("guest fallback never submits to the protected async mutation", async () => {
  const mock = makeMock();
  latestState = undefined;
  const renderer = create(React.createElement(Harness, {
    options: { enabled: false, userId: null, sourcePage: "name-art-generator" },
    onRender: (value) => { latestState = value; },
  }));
  await settle();
  await assert.rejects(() => current().start(input("guest-1")), /disabled/);
  assert.equal(mock.submissions.length, 0);
  renderer.unmount();
});

test("late POST completion cannot restore a terminal request", async () => {
  const mock = makeMock();
  /** @type {(result: MockResult) => void} */
  let resolveSubmit;
  mock.submit = async (request) => {
    mock.submissions.push(request);
    return new Promise((resolve) => { resolveSubmit = resolve; });
  };
  let completed = 0;
  latestState = undefined;
  const renderer = create(React.createElement(Harness, {
    options: {
      enabled: true,
      userId: "user-late-post",
      sourcePage: "name-art-generator",
      onCompleted: () => { completed += 1; },
    },
    onRender: (value) => { latestState = value; },
  }));
  await settle();
  const pending = current().start(input("late-post-1"));
  mock.set("late-post-1", {
    requestId: "late-post-1",
    status: "completed",
    imageUrls: ["https://example.test/late.webp"],
  });
  await settle();
  await act(async () => { resolveSubmit?.({ requestId: "late-post-1", status: "started" }); await pending; });
  await settle();
  assert.equal(completed, 1);
  assert.equal(current().generationRequestId, null);
  assert.equal(testWindow.localStorage.getItem("name-art:pending-async-generation:v1:user-late-post:name-art-generator"), null);
  renderer.unmount();
});

test("account change during submission cannot restore the old scoped request", async () => {
  const mock = makeMock();
  /** @type {(result: MockResult) => void} */
  let resolveSubmit;
  mock.submit = async (request) => {
    mock.submissions.push(request);
    return new Promise((resolve) => { resolveSubmit = resolve; });
  };
  latestState = undefined;
  const firstOptions = { enabled: true, userId: "user-before-change", sourcePage: "name-art-generator" };
  const renderer = create(React.createElement(Harness, {
    options: firstOptions,
    onRender: (value) => { latestState = value; },
  }));
  await settle();
  const pending = current().start(input("account-change-1"));
  await act(async () => {
    renderer.update(React.createElement(Harness, {
      options: { ...firstOptions, userId: "user-after-change" },
      onRender: (value) => { latestState = value; },
    }));
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  await act(async () => { resolveSubmit?.({ requestId: "account-change-1", status: "started" }); await pending; });
  await settle();
  assert.equal(current().generationRequestId, null);
  assert.equal(testWindow.localStorage.getItem("name-art:pending-async-generation:v1:user-before-change:name-art-generator"), null);
  assert.equal(testWindow.localStorage.getItem("name-art:pending-async-generation:v1:user-after-change:name-art-generator"), null);
  renderer.unmount();
});

test("definitive submission failure before reservation clears local state", async () => {
  const mock = makeMock();
  mock.submit = async (request) => {
    mock.submissions.push(request);
    throw { data: { code: "BAD_REQUEST", httpStatus: 400 }, message: "Rejected before reservation" };
  };
  latestState = undefined;
  const renderer = create(React.createElement(Harness, {
    options: { enabled: true, userId: "user-rejected", sourcePage: "name-art-generator" },
    onRender: (value) => { latestState = value; },
  }));
  await settle();
  await assert.rejects(
    () => current().start(input("rejected-1")),
    (error) =>
      Boolean(
        error &&
          typeof error === "object" &&
          "message" in error &&
          error.message === "Rejected before reservation",
      ),
  );
  await settle();
  assert.equal(current().generationRequestId, null);
  assert.equal(current().canResumeStatus, false);
  assert.equal(mock.submissions.length, 1);
  assert.equal(testWindow.localStorage.getItem("name-art:pending-async-generation:v1:user-rejected:name-art-generator"), null);
  renderer.unmount();
});

test("repeated null status pauses and resumes the original request without resubmitting", async () => {
  const mock = makeMock();
  latestState = undefined;
  let statusErrors = 0;
  const renderer = create(React.createElement(Harness, {
    options: {
      enabled: true,
      userId: "user-null-status",
      sourcePage: "name-art-generator",
      onStatusError: () => { statusErrors += 1; },
    },
    onRender: (value) => { latestState = value; },
  }));
  await settle();
  await act(async () => { await current().start(input("null-status-1")); });
  mock.set("null-status-1", null);
  await settle();
  await settle();
  await settle();
  assert.equal(current().canResumeStatus, true);
  assert.equal(statusErrors, 1);
  const beforeResume = mock.submissions.length;
  await act(async () => { await current().resumeStatus(); });
  await settle();
  assert.equal(mock.submissions.length, beforeResume);
  assert.equal(current().generationRequestId, "null-status-1");
  renderer.unmount();
});

test("ambiguous POST failure persists identity and remount resumes polling", async () => {
  const mock = makeMock();
  mock.submit = async (request) => {
    mock.submissions.push(request);
    mock.set(request.generationRequestId, {
      requestId: request.generationRequestId,
      status: "processing",
    });
    throw new TypeError("Failed to fetch");
  };
  const options = {
    enabled: true,
    userId: "user-2",
    sourcePage: "name-art-generator",
  };
  latestState = undefined;
  let renderer = create(React.createElement(Harness, {
    options,
    onRender: (value) => { latestState = value; },
  }));
  await settle();
  await assert.rejects(
    () => current().start(input("ambiguous-1")),
    /Failed to fetch/,
  );
  await settle();
  assert.equal(mock.submissions.length, 1);
  const persistedRequest = testWindow.localStorage.getItem(
    "name-art:pending-async-generation:v1:user-2:name-art-generator",
  );
  assert.ok(persistedRequest);
  assert.match(persistedRequest, /ambiguous-1/);
  renderer.unmount();
  renderer = create(React.createElement(Harness, {
    options,
    onRender: (value) => { latestState = value; },
  }));
  await settle();
  assert.equal(current().generationRequestId, "ambiguous-1");
  renderer.unmount();
});

test("polling failure resumes without another submission and reaches failure callback", async () => {
  const mock = makeMock();
  latestState = undefined;
  let failed = 0;
  const renderer = create(React.createElement(Harness, {
    options: {
      enabled: true,
      userId: "user-3",
      sourcePage: "name-art-generator",
      onFailed: () => { failed += 1; },
    },
    onRender: (value) => { latestState = value; },
  }));
  await settle();
  await act(async () => { await current().start(input("poll-1")); });
  mock.set("poll-1", {
    kind: "error",
    error: new TypeError("network unavailable"),
  });
  await settle();
  assert.equal(current().canResumeStatus, true);
  mock.set("poll-1", {
    requestId: "poll-1",
    status: "failed",
    errorMessage: "Generation failed. Your credits were refunded.",
  });
  await act(async () => { await current().resumeStatus(); });
  await settle();
  assert.equal(mock.submissions.length, 1);
  assert.equal(failed, 1);
  renderer.unmount();
});

test("failure terminal readback preserves localization and clears its scoped request", async () => {
  const mock = makeMock();
  latestState = undefined;
  /** @type {MockResult | undefined} */
  let failedStatus;
  const renderer = create(React.createElement(Harness, {
    options: {
      enabled: true,
      userId: "user-4",
      sourcePage: "arabic-calligraphy-generator",
      /** @param {MockResult} status */
      onFailed: (status) => { failedStatus = status; },
    },
    onRender: (value) => { latestState = value; },
  }));
  await settle();
  await act(async () => {
    await current().start(input("failed-1", "arabic-calligraphy-generator"));
  });
  mock.set("failed-1", {
    requestId: "failed-1",
    status: "failed",
    errorMessage: "تم استرداد الرصيد.",
  });
  await settle();
  assert.ok(failedStatus && "errorMessage" in failedStatus);
  assert.equal(failedStatus.errorMessage, "تم استرداد الرصيد.");
  assert.equal(
    testWindow.localStorage.getItem(
      "name-art:pending-async-generation:v1:user-4:arabic-calligraphy-generator",
    ),
    null,
  );
  renderer.unmount();
});

test.after(async () => {
  await fs.rm(bundlePath, { force: true });
});
