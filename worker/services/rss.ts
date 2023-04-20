/*
https://github.com/fb55/htmlparser2
*/
import * as htmlparser from "htmlparser2";
import { Env } from "..";
import { textEncode } from "../utils";
import Feed from "htmlparser.DomUtils";

export type Email = {
  email: string;
  name: string;
};

export type EmailContent = {
  type: string;
  value: string;
};
const MAILCHANNEL_URL = "https://api.mailchannels.net/tx/v1/send";

const KV_FEEDS = "feeds";
const KV_FEED_READED_ITEMS = "feeds_readed_items:";

const MAIL_TO: Email = [{ name: "chaojie", email: "hi@chaojie.fun" }];
const MAIL_FROM: Email = { name: "Rss2mail", email: "hi@rss2mail.service" };

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

export async function syncLatestFeed(env: Env) {
  const feedList = await getFeeds(env);
  if (feedList.length === 0) return;
  const feedsNewItems = await getNewItems(env, feedList);

  let emailContents: Array<EmailContent> = feedsNewItems
    .entries()
    .map(([feed, items]) => {
      return {
        type: "text/html",
        value: `
            <h1>${feed}</h1>
            <ul>
                ${items
                  .map(
                    (item) =>
                      `<li><a href="${item.link}">${item.title}</a></li>`
                  )
                  .join("")}
            </ul>
            `,
      };
    });

  // send email
  try {
    await sendEmail(MAIL_TO, MAIL_FROM, `[Rss2mail] New posts`, emailContents);
  } catch (error) {
    console.error(`send email error: ${error}`);
    return;
  }

  // save new items
  for (const [feedId, items] of feedsNewItems.entries()) {
    let feedReadedItems =
      (await env.KV_AUTOMATE.get(
        `${KV_FEED_READED_ITEMS}${textEncode(feedId)}`
      )) || "";
    feedReadedItems = feedReadedItems.split("|");
    feedReadedItems = feedReadedItems.concat(items.map((item) => item.id));
    await env.KV_AUTOMATE.put(
      `${KV_FEED_READED_ITEMS}${textEncode(feedId)}`,
      feedReadedItems.join("|")
    );
  }
}

async function getNewItems(env: Env, feeds: Array<string>) {
  let feedsNewItems = new Map();
  for (const feedAddr: string of feeds) {
    console.info(`process ${feedAddr}...`);

    let feed;

    try {
      feed = await parseFeed(feedAddr);
    } catch (error) {
      console.error(`parse feed (${feedAddr}) error: ${error}`);
      continue;
    }

    const key = `${KV_FEED_READED_ITEMS}${textEncode(feed.id)}`;
    let feedReadedItems = env.KV_AUTOMATE.get(key) || "";
    feedReadedItems = feedReadedItems.split("|");
    const feedNewItems = feed.items.filter(
      (item) => !feedReadedItems.includes(item.id)
    );
    feedsNewItems.set(feed.id, feedNewItems);
  }
  return feedsNewItems;
}

/*
ref: https://blog.cloudflare.com/sending-email-from-workers-with-mailchannels/
*/
export async function sendEmail(
  toEmail: Array<Email>,
  fromEmail: Email,
  subject: string,
  content: Array<EmailContent>
) {
  return await fetch(MAILCHANNEL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: toEmail }],
      from: fromEmail,
      subject: subject,
      content: content,
    }),
  }).then((resp) => resp.json());
}
