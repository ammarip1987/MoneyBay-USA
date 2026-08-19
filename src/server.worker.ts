import { AngularAppEngine } from '@angular/ssr';

/**
 * Точка входа для Cloudflare Workers.
 *
 * Штатный src/server.ts написан под Node.js с Express и здесь неприменим.
 * AngularAppEngine — среда-независимый движок; сборка идёт с
 * ssr.experimentalPlatform = "neutral", иначе Angular добавляет в polyfills
 * обращение createRequire из node:module и Worker не стартует.
 *
 * Статику отдаёт привязка ASSETS: до серверной отрисовки доходят только
 * адреса, для которых файла нет.
 */
const angularApp = new AngularAppEngine();

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) return asset;

    const rendered = await angularApp.handle(request);
    return rendered ?? new Response('Not found', { status: 404 });
  }
};
