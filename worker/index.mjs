// src/worker.ts
import angularHandler from "../dist/moneybay-angular/server/server.mjs";
var TTL_SECONDS = 60;
function isCacheable(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return false;
  if (url.pathname === "/health" || url.pathname === "/sitemap.xml") return false;
  if (request.headers.get("authorization")) return false;
  const cookie = request.headers.get("cookie") || "";
  if (cookie.includes("mb_")) return false;
  return true;
}
var worker_default = {
  async fetch(request, env, ctx) {
    if (!isCacheable(request)) {
      return angularHandler.fetch(request, env, ctx);
    }
    const url = new URL(request.url);
    url.searchParams.delete("nocache");
    url.searchParams.delete("t");
    const cacheKey = new Request(url.toString(), { method: "GET" });
    const cache = caches.default;
    const hit = await cache.match(cacheKey);
    if (hit) {
      const headers = new Headers(hit.headers);
      headers.set("X-MB-Cache", "HIT");
      return new Response(hit.body, { status: hit.status, headers });
    }
    const fresh = await angularHandler.fetch(request, env, ctx);
    if (fresh.status === 200) {
      const headers = new Headers(fresh.headers);
      headers.set("Cache-Control", `public, max-age=0, s-maxage=${TTL_SECONDS}`);
      headers.set("X-MB-Cache", "MISS");
      const toStore = new Response(fresh.body, { status: 200, headers });
      ctx.waitUntil(cache.put(cacheKey, toStore.clone()));
      return toStore;
    }
    return fresh;
  }
};
export {
  worker_default as default
};
