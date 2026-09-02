/**
 * Обёртка над обработчиком Angular, кэширующая отрисованные страницы.
 *
 * Angular собирает свой обработчик Cloudflare сам, и до кода server.ts дело не
 * доходит: заголовки, поставленные там, в ответе не появляются. Правила кэша в
 * панели тоже мимо — они касаются ответов от источника, а обработчик Cloudflare
 * считает своим. Оттого из 372 тысяч суточных обращений в кэш попадало 699.
 *
 * Здесь кэш ведётся изнутри, через хранилище самого обработчика: отрисованная
 * страница кладётся туда и на следующий раз отдаётся без повторной отрисовки.
 */
// Собранный обработчик Angular. Ссылка помечена внешней при сборке обёртки:
// в этот миг файла ещё нет, он появляется от ng build
// @ts-ignore
import angularHandler from '../dist/moneybay-angular/server/server.mjs';

/** Сколько держать страницу. Минуты хватает: новое объявление ждёт недолго. */
const TTL_SECONDS = 60;

/**
 * Кэшируются только страницы для гостей.
 *
 * У вошедшего страница своя — шапка с его именем, избранное, непрочитанное.
 * Отдать её другому означало бы показать чужой кабинет, потому наличие любой
 * куки mb_ или заголовка авторизации выводит запрос из кэша.
 */
function isCacheable(request: Request): boolean {
  if (request.method !== 'GET') return false;

  const url = new URL(request.url);
  // Обращения к серверу и служебное мимо кэша: у API свои правила давности,
  // а карта сайта и проверка состояния должны отвечать текущим
  if (url.pathname.startsWith('/api/')) return false;
  if (url.pathname === '/health' || url.pathname === '/sitemap.xml') return false;

  if (request.headers.get('authorization')) return false;
  const cookie = request.headers.get('cookie') || '';
  if (cookie.includes('mb_')) return false;

  return true;
}

export default {
  async fetch(request: Request, env: unknown, ctx: { waitUntil(p: Promise<unknown>): void }): Promise<Response> {
    if (!isCacheable(request)) {
      return (angularHandler as any).fetch(request, env, ctx);
    }

    // Ключом служит адрес без строки запроса кэша, чтобы ?nocache= и подобное
    // не размножало копии одной и той же страницы
    const url = new URL(request.url);
    url.searchParams.delete('nocache');
    url.searchParams.delete('t');
    const cacheKey = new Request(url.toString(), { method: 'GET' });

    const cache = (caches as any).default;
    const hit = await cache.match(cacheKey);
    if (hit) {
      const headers = new Headers(hit.headers);
      headers.set('X-MB-Cache', 'HIT');
      return new Response(hit.body, { status: hit.status, headers });
    }

    const fresh = await (angularHandler as any).fetch(request, env, ctx);

    // В кэш идут только удачные ответы: положив 500, обработчик отдавал бы её
    // минуту всем подряд, даже когда сбой уже прошёл
    if (fresh.status === 200) {
      const headers = new Headers(fresh.headers);
      headers.set('Cache-Control', `public, max-age=0, s-maxage=${TTL_SECONDS}`);
      headers.set('X-MB-Cache', 'MISS');

      const toStore = new Response(fresh.body, { status: 200, headers });
      // Запись идёт в фоне, ответ уходит человеку не дожидаясь её
      ctx.waitUntil(cache.put(cacheKey, toStore.clone()));
      return toStore;
    }

    return fresh;
  }
};
