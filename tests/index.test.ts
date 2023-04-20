import { unstable_dev } from "wrangler";
import type { UnstableDevWorker } from "wrangler";
import { describe, expect, it, beforeAll, afterAll } from "vitest";

describe("Worker", () => {
  let worker: UnstableDevWorker;

  beforeAll(async () => {
    worker = await unstable_dev("worker/index.ts", {
      experimental: { disableExperimentalWarning: true },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it("should add feed", async () => {
    const resp = await worker.fetch("/api/feed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: "https://chaojie.fun/atom.xml",
      }),
    });
    if (resp) {
      const data = await resp.json();
      console.info(data.feeds);
      expect(data.feeds.length).toBe(1);
    }
  });
});
