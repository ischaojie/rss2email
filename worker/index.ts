import { Router, RouterType } from "itty-router";
import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
import manifestJSON from "__STATIC_CONTENT_MANIFEST";
import { addFeed, delFeed, getFeeds } from "./services/rss";
import { parseFeed } from "./services/rss";

const assetManifest = JSON.parse(manifestJSON);

export interface Env {
  // KV
  RSS2EMAIL: KVNamespace;
  TO_EMAIL: string;

  router?: RouterType;
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log(`Hello World!`);
  },

  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    if (env.router === undefined) {
      env.router = buildRouter(env);
    }
    return env.router.handle(request, env, ctx).then((resp) => {
      resp.headers.set("Access-Control-Allow-Origin", "*");
      return resp;
    });
  },
};

function buildRouter(env: Env): RouterType {
  const router = Router({ base: "/" });
  const apiRouter = Router({ base: "/api" });

  // root router
  router.all("/api/*", apiRouter.handle);
  router.all("*", async (request: Request, env: Env, ctx: ExecutionContext) => {
    // https://github.com/kwhitley/itty-router/pull/12#issue-727621053
    try {
      return await getAssetFromKV(
        {
          request,
          waitUntil(promise) {
            return ctx.waitUntil(promise);
          },
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
        }
      );
    } catch (error) {
      return new Response(`${error}`, { status: 404 });
    }
  });

  // api router
  apiRouter.get("/feeds", async (request: Request, env: Env) => {
    return Response.json({ feeds: await getFeeds(env) });
  });
  apiRouter.post("/feeds", async (request: Request, env: Env) => {
    const data = await request.json();
    await addFeed(env, data.url);
    return Response.json({ feeds: await getFeeds(env) });
  });
  apiRouter.delete("/feeds", async (request: Request, env: Env) => {
    const url = await request.query.url;
    await delFeed(env, url);
    return Response.json({ feeds: await getFeeds(env) });
  });
  return router;
}
