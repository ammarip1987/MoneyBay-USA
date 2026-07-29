# MEMORY — История сессий moneybayts (Angular + Spring Boot)

Краткие итоги работ по проекту между сессиями. Каждая запись — дата + список заданий пользователя + что было выполнено.

---

## Сессия 26.05.2026 — Архитектурные подходы

**Что просил:**
- Объяснить multi-tenancy и почему я выбрал TENANT_ID + JWT claim
- Сравнить с подходом Craigslist
- Какие платформы используют похожий подход
- Выбрать вариант для MoneyBay
- Реализовать Craigslist-стиль subdomain-per-city

**Что сделано:**
- Backend: добавлен `subdomain` field в City entity
- `CityContextFilter` извлекает subdomain из Host header, сохраняет в `CityContext` (ThreadLocal)
- `ListingController` применяет subdomain как default city filter
- `CityController` новый endpoint `GET /api/cities/current`
- `DataInitializer.upsertCitySubdomains()` заполняет subdomains для 55 городов
- Frontend: `CityContextService` детектит subdomain из `window.location.hostname`
- `cityContextInterceptor` добавляет `X-City-Subdomain` header ко всем API запросам
- Header показывает текущий город рядом с логотипом
- HomeComponent применяет subdomain city как default city filter через `effect`
- Документация в README с инструкцией по hosts файлу

## Сессия 26.05.2026 — SSR + Tailwind Typography

**Что просил:**
- Завершить настройку SSR (Angular Universal) — было 60%
- Установить Tailwind Typography плагин

**Что сделано:**
- `@tailwindcss/typography` установлен
- `tailwind.config.js` обновлён с кастомизацией под бренд (mb-dark для заголовков, mb-blue для ссылок, pink для inline code)
- `listing-detail.component.ts` использует `<div class="prose max-w-none" [innerHTML]="...">`
- `ugc.scss` удалён, ссылка из `angular.json` styles убрана
- `angular.json` — `outputMode: "server"`, `ssr.entry: "src/server.ts"`, `server: "src/main.server.ts"`
- `app.routes.server.ts` — Server mode для публичных страниц (home, listing/:id, about, terms, privacy, refund, contact, login, register, forgot-password, reset-password), Client mode для auth-required (profile, my-listings, chat/:id, edit-listing, promote, admin, favorites, messages)
- `app.config.server.ts` — `provideServerRendering(withRoutes(serverRoutes))`
- `security.allowedHosts` содержит localhost, subdomains, moneybay.us/net (защита от SSRF)
- `main.server.ts` обновлён под Angular 21 API с `BootstrapContext`
- Build прошёл, SSR протестирован: `curl http://localhost:4001/terms` возвращает 33 KB HTML с серверно отрендеренным "WELCOME TO MONEYBAY"
- SSR готовность: 60% → 100%
- Tailwind Typography готовность: 0% → 100%

## Сессия 26.05.2026 — Terms of Service переписан

**Что просил:**
- Записать в Terms of Use меры против fraud (FTC, FOSTA-SESTA, Fair Housing Act)
- Переписать в стиле Craigslist (без нумерации разделов)
- Убрать упоминание Section 230
- Убрать LIQUIDATED DAMAGES раздел
- Изменить Arbitration: убрать "$10,000", добавить opt-out на 30 дней

**Что сделано:**
- `terms.component.ts` переписан в Craigslist-стиле
- Разделы: WELCOME TO MONEYBAY, LICENSE, USE, FEES, DISCLAIMER & LIABILITY, CLAIMS & INDEMNITY, TRADEMARKS, MISC
- Без Section 230, без нумерации разделов
- Arbitration через AAA с opt-out (30 дней через `legal@moneybay.us`)
- Florida governing law, Miami-Dade County jurisdiction
- Все запрещённые категории контента документированы

## Сессия 26.05.2026 — Дефект bytea колонок

**Что просил:**
- Объяснить ошибку `function lower(bytea) does not exist`
- Перевести сообщение PostgreSQL
- Очистить Java-сущности от `@Lob` и пересоздать таблицы

**Что сделано:**
- Установлено: колонки `title`, `description`, `location` в таблице `listings` созданы как `bytea` вместо `varchar/text`
- В Java entities `@Lob` и `byte[]` не найдены — Entity объявляет `String`
- DROP TABLE listings/listing_images/messages CASCADE
- Spring Boot перезапущен — Hibernate пересоздал таблицы с верными типами
- Verified: `\d listings` показывает varchar(200), text, varchar(255)
- README обновлён с Troubleshooting секцией

## Сессия 26.05.2026 — Subcategory hierarchy

**Что просил:**
- Доделать подкатегории и под-подкатегории
- Старые категории без FontAwesome иконок убрать

**Что сделано:**
- DataInitializer: 13 категорий + 41 подкатегория + 36 под-подкатегорий с FontAwesome иконками
- Cosmetics: 12 subs + 36 subsubs (Pharmacy/Cica, Lips, Eyes, Body Care, etc.)
- Food: 18 subs
- Vehicles: 6 subs
- Старые категории удалены через SQL DELETE по slugs

## Сессия 26.05.2026 — Memory файлы

**Что просил:**
- Создать MEMORY.md в обоих проектах
- Изменить назначение MEMORY.md — хранить краткое содержание сессий и задания

**Что сделано:**
- Создан этот файл с историей сессий
- Создан аналог в `c:\Moneybay\MEMORY.md`
- Документация о различиях файлов (README vs CLAUDE.md vs MEMORY.md)

---

## Связь с проектами

- `c:\moneybayts` — этот локальный проект на Angular + Spring Boot
- `c:\Moneybay` — production Flask. См. `c:\Moneybay\MEMORY.md`
- `c:\moneybayts\CLAUDE.md` — инструкции для Claude (запрещённые слова, архитектура)
- `C:\Users\admin\.claude\projects\c--Moneybay\memory\MEMORY.md` — auto-memory Claude (личные предпочтения, не в git)

## Текущая готовность проекта

Общая готовность: **~70%**

100% готово:
- Auth (login, register, forgot/reset)
- Categories + Subcategories + Sub-subcategories
- Cities + city subdomain routing
- Favorites, Profile, My Listings
- Static pages (about, privacy, terms, refund, contact)
- SSR (Angular Universal)
- Tailwind Typography

0% (не начато):
- Google Cloud (GCS, Vision, Translation, Secret Manager)
- Google OAuth, Telegram bot, reCAPTCHA, Rate limiting
- Tests, PWA, Infinite scroll, Search autocomplete
- Cloud Run deployment

## Формат записей

Каждая сессия — отдельный заголовок `## Сессия ДД.ММ.ГГГГ — Краткая тема`. Внутри:
- **Что просил:** маркированный список заданий пользователя
- **Что сделано:** маркированный список выполненных правок
