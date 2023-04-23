import * as htmlparser from "htmlparser2";
import { Env } from "..";
import { textEncode } from "../utils";
import Feed from "htmlparser.DomUtils";
import { EmailContent, sendEmail } from "./email";

const MAILCHANNEL_URL = "https://api.mailchannels.net/tx/v1/send";

const KV_FEEDS = "feeds";
const KV_FEED_ITEMS = "feed_items:";

export async function getFeeds(env: Env) {
  return await env.RSS2EMAIL.get(KV_FEEDS, { type: "json" });
}

export async function addFeed(env: Env, url: string) {
  const feeds = new Set((await getFeeds(env)) || []);
  const feedInfo = await parseFeed(url);
  if (feedInfo) {
    delete feedInfo.items;
    feedInfo.origin = url;
    feeds.add(feedInfo);
  }
  await env.RSS2EMAIL.put(KV_FEEDS, JSON.stringify([...feeds]));
}

export async function delFeed(env: Env, url: string) {
  const feeds = new Set((await getFeeds(env)) || []);
  for (const feed of feeds) {
    if (feed.origin === url) {
      feeds.delete(feed);
    }
  }
  await env.RSS2EMAIL.put(KV_FEEDS, JSON.stringify([...feeds]));
}

export async function parseFeed(url: string) {
  return await fetch(url)
    .then((resp) => resp.text())
    .then((text) => htmlparser.parseFeed(text))
    .catch((err) => console.error(err), null);
}

async function getNewItems(env: Env, feed: string) {
  const key = `${KV_FEED_ITEMS}${feed}`;
  const feedItems: string[] = (await env.RSS2EMAIL.get(key)) || [];

  const newItems = [];

  const feedOrigin = await parseFeed(feed);
  if (feedOrigin) {
    const newItems = feedOrigin.items.filter(
      (item) => !feedItems.includes(item.id)
    );
  }
  return newItems;
}

export function makeMailContent(items): EmailContent[] {}

export async function syncLatestRss(env: Env): boolean {
  const feeds = await getFeeds(env);
  const allNewItems;
  const allEmailStr = "";
  for (const feed of feeds) {
    const newItems = await getNewItems(env, feed.origin);
    const emailStr = `
    <h3>New posts from <a href='${feed.link}'>${feed.title}</a>:</h3>
    <ul>
      ${newItems.map(
        (item) => `<li><a href='${item.link}'>${item.title}</a></li>`
      )}
    </ul>
    `;
    allEmailStr += emailStr;
    allNewItems.url = feed.origin;
    allNewItems.items = newItems.map((item) => item.id);
  }

  // send email
  const to_email = { email: env.TO_EMAIL, name: "hakuna" };
  const subject = "[Rss2Email] New posts";
  const emailContent = { type: "text/html", value: allEmailStr };
  try {
    console.info("Sending email...");
    await sendEmail(to_email, subject, emailContent);
  } catch (err) {
    console.error(err);
    return false;
  }

  // save new posts
  for (const feed of allNewItems) {
    const key = `${KV_FEED_ITEMS}${feed.url}`;
    const feedItems: string[] = (await env.RSS2EMAIL.get(key)) || [];
    feedItems.push(...feed.items);
    await env.RSS2EMAIL.put(key, JSON.stringify(feedItems));
  }
}
