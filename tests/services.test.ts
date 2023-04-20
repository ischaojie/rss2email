import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { parseFeed, getFeedMeta } from "../worker/services/rss";

describe("Rss", () => {
  it("Should parse rss", async () => {
    const feed = await parseFeed("https://fly.io/blog/feed.xml");
    expect(feed.items.length).toBeGreaterThan(0);
  });
  it("Should parse feed failed", async () => {
    const feed = await parseFeed("err");
    expect(feed).toBeNull();
  });

  it("Should get feed meta", async() =>{
    const meta = await getFeedMeta("https://fly.io/blog/feed.xml")
    expect(meta).instanceOf(Map);
  })
});
