import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Обращения к API идут через тот же домен, а не на api.moneybay.us.
 *
 * Cookie с обновляющим токеном ставилась с чужого имени, и браузеры —
 * и Chrome, и Опера — отбрасывали её как стороннюю: вход не переживал
 * обновления страницы. С единым именем она своя и сохраняется.
 *
 * Заголовки передаются как есть, включая Set-Cookie в ответе.
 */
const API_ORIGIN = 'https://api.moneybay.us';

app.use('/api', async (req, res) => {
  const target = API_ORIGIN + req.originalUrl;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === 'string' && !['host', 'connection'].includes(k)) headers.set(k, v);
  }

  const init: RequestInit = { method: req.method, headers, redirect: 'manual' };
  if (!['GET', 'HEAD'].includes(req.method)) {
    const raw = await new Promise<Buffer>((resolve) => {
      const parts: Buffer[] = [];
      req.on('data', (c) => parts.push(c));
      req.on('end', () => resolve(Buffer.concat(parts)));
    });
    init.body = new Uint8Array(raw);
  }

  try {
    const upstream = await fetch(target, init);
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding') res.setHeader(key, value);
    });
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    res.status(502).json({ message: 'Upstream unavailable' });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
