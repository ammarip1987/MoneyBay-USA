# CLAUDE.md

## Владелец проекта

Вылегжанин Александр Михайлович (Oleksandr Vylegzhanin), GitHub: ammarip1987.

## Модель Claude

Используй Claude Haiku — быстрее и дешевле для работы с проектом.

## Инструкции для Claude

### Способ коммуникации
Используй только технический язык. Без эмодзи, без жаргонизмов, без наукообразности. Просто факты и техническое описание. Кратко и по делу. Прямо к сути, базовый набор текста, наибольшее количество информации. Не показывай блоки кода в чате - просто делай изменения молча. Можешь рассказать что ты изменил, но не показывай вывод Edit инструмента.

**Запрещённые выражения:** "живое", "живой", "работает", "Причины", "Прав", "правильный", "правильно" (и производные: правильность, правильнее), "решение" (и производные: решения, решением, решить, решили), "корекция", "корректировка", "корректнее", "сборка", "развёртывание", "жёсткая", "проблема" (и производные: проблемный, проблематичный, проблемы, проблемой), "известны" и производные, "фаза" (и производные: фазы, фазой, фазе, фазовый), "skype" (и производные: Skype, скайп, скайпом), "актуальный" (и производные: актуально, актуальная, актуальное, актуальные, актуальность, актуализация, актуализировать), "минимум" (и производные: минимально, минимальный, минимальная, минимальное, минимальные, минимизация, минимизировать), "Кривая обучения" (и производные: кривая обучения, кривой обучения, кривую обучения), "серьёзный" (и производные: серьёзная, серьёзное, серьёзные, серьёзно, серьёзность), "Принято" (и производные: принят, принимаю, принять, принимать), "приведены" (и производные: приведён, приведено, приведена, приведённый, приведённая, приведённое, приведённые, приводить, приводит, приводят, приведение), "именно", "hamburger", "БД", "700" (вместо: "статус 200", "сервис доступен", "возвращает ответ", "Подтверждаю", "Верно", "сборка готова", "развёртывание", "жёсткая перезагрузка", используй "уточнение", "изменение", "правка", "готово", "задеплоено", "на production", "перезагрузка с очисткой кэша"; вместо "проблема" используй "ограничение", "дефект", "требует", "несовместимо", "ошибка"; вместо "правильный/правильно" используй "верно", "точно", "соответствующий", "надлежащий"; вместо "решение" используй "подход", "способ", "метод", "вариант", "реализация", "применение"; вместо "фаза" используй "стадия процента проекта"; вместо "skype" используй "эффект", "прирост", "результат"; вместо "актуальный" используй "свежий", "новый", "обновлённый", "текущий"; вместо "минимум" используй "базовый набор", "необходимый набор", "наименьшее количество"; вместо "Кривая обучения" используй "сложность освоения", "порог входа", "период изучения"; вместо "серьёзный" используй "крупный", "значимый", "важный", "стабильный"; вместо "приведены" используй "сведены", "сокращены до", "содержат", "оформлены в", "теперь"; вместо "hamburger" используй "side menu", "navigation drawer", "off-canvas menu", "выдвижная панель навигации"; вместо "БД" используй "база"; число "700" не использовать вообще). Описывай состояние через HTTP статусы, логи, метрики. Избегай предварительных объяснений — изложи факты напрямую.

### Решения пользователя
Не оспаривай решения пользователя. Если решение несёт риски — предупреди один раз коротко и выполняй. Не повторяй предупреждения и не отказывай если пользователь настаивает. Уточняй детали если нужно для выполнения задачи.

**ВАЖНО:** Если пользователь спрашивает "что ещё добавить?" или "какие варианты?" — предложи 2-3 варианта с описанием, но НЕ РЕАЛИЗУЙ их автоматически. Жди явного подтверждения "делай" или выбора конкретного варианта перед реализацией.

### Проект

Полнофункциональная площадка объявлений на Angular 21 + Spring Boot 3.5 с поддержкой английского языка. Аналог Craigslist для США. Переписана с Flask-проекта `c:\Moneybay`.

**Основная информация:**
- Frontend: Angular 21 (TypeScript), Tailwind CSS + SASS
- Backend: Spring Boot 3.5 (Java 25), Spring Data JPA, Spring Security + JWT
- База: PostgreSQL 18 (`moneybay`, пользователь `moneybay_app`, пароль `moneybay123`)
- WebSocket: STOMP через @stomp/stompjs + sockjs-client
- Stripe Java SDK 26.6 для платежей
- SSR: @angular/ssr 21.2

**Структура:**
- `src/` — Angular frontend
- `backend/` — Spring Boot
- `backend/src/main/java/us/moneybay/` — Java код (controller, repository, model, dto, config, security, service)

**Запуск (два терминала):**

Backend (Spring Boot):
```cmd
cd c:\moneybayts\backend
.\mvnw spring-boot:run
```
Порт **5000**, API `/api/categories`, `/api/listings`, `/api/auth/login` и т.д.

Frontend (Angular):
```cmd
cd c:\moneybayts
ng serve
```
Порт **1100**, открыть `http://localhost:1100`.

**Локальное тестирование city subdomain routing:**
В `C:\Windows\System32\drivers\etc\hosts` добавить (от администратора):
```
127.0.0.1 newyork.localhost
127.0.0.1 losangeles.localhost
127.0.0.1 miami.localhost
```

### CSS архитектура

**Tailwind CSS**: контролируемый UI — utility-first подход
**SASS** (`src/ugc.scss`): стилизация UGC контента (описания объявлений из базы)

Подключение в `angular.json`:
```json
"styles": ["src/styles.css", "src/ugc.scss"],
"inlineStyleLanguage": "scss"
```

### Деплой

Этот проект **локальный**, не деплоится на production. Production — Flask-версия в `c:\Moneybay` (деплоится на Cloud Run `moneybay` в us-central1).

**Конкуренты:**
- Craigslist — главный конкурент на рынке США. Цель: УБИТЬ по UX, монетизации и функциональности.

**Стратегия против Craigslist (The Kill Strategy):**

**Craigslist преимущества:**
- 20+ лет история и сетевой эффект
- Минимум затрат (низкие комиссии)
- Простой UI (люди знают как пользоваться)

**MoneyBay контр-стратегия (где побеждаем):**
1. **Trust & Safety** — где Craigslist отстает (спам, мошенничество, боты)
   - User Flagging система (до 20 жалоб = автобан)
   - Keyword filters (свой blacklist, не OpenAI — дешевле)
   - Быстрый бан процесс (часы, не дни)
   - Результат: безопасность как преимущество

2. **UX/Design** — Craigslist UI заморожена в 2003
   - Modern design (Tailwind, responsive)
   - Mobile PWA first
   - Search + filters (Craigslist search — кошмар)
   - Real-time notifications

3. **Монетизация** — Craigslist только job/real estate комиссии
   - Premium listings (featured ads)
   - Seller tools (analytics, messaging)
   - Stripe payments встроены

4. **Скорость** — Cloud infrastructure vs Craigslist старый сервер
   - R2 CDN для фото
   - WebSocket real-time messaging
   - Global deployment (Cloud Run)

**Маркетинг:**
"Modern, safe Craigslist. No more scams. No more spam. Better design. Better trust."

**Результат:** Захватить пользователей недовольных Craigslist.

### Trust & Safety - Техническое описание

**Phase 1: User Flagging System (Week 1)**

**Entities:**
- `ListingFlag` — флаги на объявления (id, listing_id, user_id, reason, status, created_at)
- `KeywordFilter` — фильтры спама (id, word, category, severity, active)

**Repositories:**
- `ListingFlagRepository` — запросы для флагов
- `KeywordFilterRepository` — запросы для фильтров

**Services:**
- `FlagListingService` — логика флагирования (flagListing, autoBanListing)
- `KeywordFilterService` — проверка текста на спам (checkContent, getActiveFilters)

**Controllers:**
- `FlagController` — endpoints для флагирования
  - `POST /api/listings/{id}/flag` — добавить флаг (auth required)
  - `POST /api/listings/{id}/flag/resolve` — разрешить флаги (admin)

**Логика:**
1. Пользователь флагирует объявление (можно только 1 флаг на юзера)
2. Система считает флаги (flagCount++)
3. После 20 флагов объявление автоматически банится (ListingStatus.BANNED)
4. Админ может вручную разрешить флаги

**Причины флагирования:**
- SPAM
- PROHIBITED_ITEM
- FRAUD_SCAM
- OFFENSIVE_CONTENT
- INVALID_CONTACT
- DUPLICATE
- OTHER

**Phase 2: Keyword Filters (Week 2)**

**Open-source list источник:**
- better-profanity для мата/оскорблений
- Custom список для спама/запрещенных товаров

**Категории фильтров:**
- SPAM (severity 1-2): "free money", "click here"
- PROHIBITED_ITEM (severity 3): "gun", "drug", "fake id"
- ABUSE (severity 1): матные слова

**Интеграция:**
- KeywordFilterService.checkContent(title, description)
- Вызывается при создании/обновлении listing
- Если severity=2 → listing скрывается (hide)
- Если severity=3 → auto-ban (как flagging)

**API Endpoints для админа (потом):**
- `POST /api/admin/keywords` — добавить фильтр
- `DELETE /api/admin/keywords/{id}` — удалить
- `GET /api/admin/keywords?category=SPAM` — список
- `POST /api/admin/keywords/bulk-upload` — CSV импорт

**Caching:**
- KeywordFilterService использует @Cacheable("keywords")
- Кэш очищается через @CacheEvict при добавлении/удалении фильтра
- Цель: минимум DB запросов при проверке каждого listing

**Метрики для отслеживания:**
- Флаги в день (flagCount by date)
- Банированные объявления (ListingStatus.BANNED count)
- Самые частые причины (FlagReason distribution)
- Фильтры эффективность (сколько объявлений скрыто/забанено)

### Community-Driven Trust & Safety (THE RIGHT APPROACH)

**Философия:**
- Community policing > AI Vision (дешево + эффективнее)
- Ratings/Reviews > Algorithm (люди боятся плохой репутации)
- Флаги > Предмодерация (быстро + масштабируемо)

**Компоненты:**

1. **User Ratings** — репутационная система
   - Rating: 1-5 звезд (Communication, Item Quality, Seller Trust, Buyer Trust)
   - Сохраняет честность через социальное давление
   - Мошенники быстро собирают плохие отзывы → никто не торгует

2. **User Flagging** — отчет о нарушениях
   - До 20 флагов = объявление скрыто
   - После 20 флагов = объявление забанено
   - Админ может разрешить флаги

3. **Keyword Filters** — автоматическое скрывание явно спамных объявлений
   - SPAM (severity 2): скрывается
   - PROHIBITED (severity 3): автобан
   - Дешевая альтернатива AI


**Почему это работает:**
- Ratings = постоянный incentive быть честным
- Flagging = сообщество автоматически модерирует
- KYC $5k+ = защита от крупных фродов
- Стоимость: $0-500/месяц вместо $3-5k на AI

**Vs Craigslist (where we win):**
- Craigslist ratings очень примитивны
- У нас ratings = часть UX (видны везде)
- Быстрое auto-ban (20 флагов vs дни у Craigslist)
- Email + Phone verification (Craigslist только email)
- Keyword filters (Craigslist ничего нет)

**City Subdomain Routing (Craigslist-style):**
Площадка использует subdomain-per-city подход. Каждый город имеет свой subdomain (`newyork.moneybay.us`, `losangeles.moneybay.us`), который применяется как default city filter. Реализовано через `CityContextFilter` (backend) и `CityContextService` (frontend).
