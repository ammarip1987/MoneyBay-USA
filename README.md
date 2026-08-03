# MoneyBay (Angular + Spring Boot)

Marketplace for the USA — full-stack rewrite of Flask MoneyBay (`c:\Moneybay`).

## Stack

**Frontend:**
- Angular 21 (TypeScript)
- Tailwind CSS (utility-first для компонентов)
- @tailwindcss/typography (prose класс для UGC контента из базы)
- FontAwesome 6.5 (via CDN)
- @stomp/stompjs + sockjs-client (WebSocket)
- @angular/ssr 21 (Angular Universal Server-Side Rendering)
- JWT auth via HTTP Interceptor

**Backend:**
- Java 25 (Eclipse Temurin)
- Spring Boot 3.5
- Spring Data JPA + Hibernate
- Spring Security + JWT (jjwt 0.12.6)
- Spring WebSocket (STOMP)
- Spring Boot Mail (SMTP — Mailtrap dev, SendGrid/SES prod)
- Spring Boot DevTools (hot reload)
- Stripe Java SDK 26.6
- Bucket4j (rate limiting)
- Springdoc OpenAPI (Swagger UI)
- PostgreSQL 18
- Lombok

## Competitive Position

**Main Competitor:** Craigslist (craigslist.org)

**Advantages to Outperform:**
- **UX/UI:** Modern, responsive design vs Craigslist's outdated interface
- **Monetization:** Premium listings, featured ads, seller tools vs free-only model
- **Features:** Real-time messaging (WebSocket), favorites, search filters, email notifications
- **Mobile:** Native-like PWA experience vs Craigslist's poor mobile UX
- **Trust & Safety:** Built-in verification, dispute resolution, seller ratings
- **City Routing:** Craigslist-style subdomain isolation (newyork.moneybay.us) with modern tech stack

**Market Position:** Niche focus on USA classifieds. Goal is to capture users frustrated with Craigslist's stagnant development.

## Project Structure

```
Moneybay/
├── CLAUDE.md                          # Інструкції для Claude
├── README.md                          # Документація проекту
├── MEMORY.md                          # Memory індекс
├── package.json                       # Frontend залежності
├── angular.json                       # Angular конфігурація
├── tsconfig.json                      # TypeScript конфігурація
├── tailwind.config.js                 # Tailwind CSS конфіг
├── postcss.config.js                  # PostCSS конфіг
├── bitbucket-pipelines.yml           # CI/CD pipeline (Bitbucket)
├── docker-compose.yml                 # Docker для локальної розробки
├── Dockerfile                         # Docker image для фронтенда
├── nginx.conf                         # NGINX конфігурація
├── ngsw-config.json                   # Angular Service Worker конфіг
├── proxy.conf.json                    # Proxy для локальної розробки
│
├── src/                               # FRONTEND (Angular 21)
│   ├── app/
│   │   ├── components/                # Переиспользуемі компоненти
│   │   │   ├── header/               # Шапка сайту
│   │   │   ├── footer/               # Підвал
│   │   │   ├── listing-card/         # Карточка оголошення
│   │   │   ├── filter-chips-bar/     # Фільтри пошуку
│   │   │   ├── filter-drawer/        # Висувна панель фільтрів
│   │   │   ├── search-autocomplete/  # Автозаповнення пошуку
│   │   │   ├── image-upload/         # Завантаження фото
│   │   │   ├── skeleton-loader/      # Скелет завантаження
│   │   │   ├── theme-toggle/         # Перемикач теми
│   │   │   └── toast/                # Спливаючі сповіщення
│   │   │
│   │   ├── pages/                    # Сторінки додатку
│   │   │   ├── home/                 # Головна сторінка
│   │   │   ├── listing-detail/       # Деталі оголошення
│   │   │   ├── edit-listing/         # Редагування оголошення
│   │   │   ├── create-listing/       # Створення оголошення
│   │   │   ├── user-profile/         # Профіль користувача
│   │   │   ├── edit-profile/         # Редагування профілю
│   │   │   ├── login/                # Вхід
│   │   │   ├── register/             # Реєстрація
│   │   │   ├── forgot-password/      # Відновлення пароля
│   │   │   ├── chat/                 # Чат між користувачами
│   │   │   ├── favorites/            # Улюблені оголошення
│   │   │   ├── admin/                # Адмін-панель
│   │   │   ├── about/                # Про проект
│   │   │   ├── contact/              # Контакти
│   │   │   └── error/                # Сторінка помилки
│   │   │
│   │   ├── services/                 # API сервіси
│   │   │   ├── api.service.ts        # Базовий API клієнт
│   │   │   ├── auth.service.ts       # Аутентифікація
│   │   │   ├── listing.service.ts    # Робота з оголошеннями
│   │   │   ├── user.service.ts       # Робота з користувачами
│   │   │   ├── chat.service.ts       # Чат (WebSocket)
│   │   │   ├── payment.service.ts    # Платежі (Stripe)
│   │   │   └── city.service.ts       # City context (subdomain routing)
│   │   │
│   │   ├── guards/                   # Route guards
│   │   │   ├── auth.guard.ts         # Перевірка аутентифікації
│   │   │   └── admin.guard.ts        # Перевірка адміна
│   │   │
│   │   ├── interceptors/             # HTTP interceptors
│   │   │   ├── auth.interceptor.ts   # JWT токен
│   │   │   ├── error.interceptor.ts  # Обробка помилок
│   │   │   └── loading.interceptor.ts # Індикатор завантаження
│   │   │
│   │   ├── models/                   # TypeScript інтерфейси
│   │   │   ├── listing.model.ts
│   │   │   ├── user.model.ts
│   │   │   ├── category.model.ts
│   │   │   └── ...
│   │   │
│   │   ├── directives/               # Кастомні директиви
│   │   └── app.module.ts             # Root модуль Angular
│   │
│   ├── assets/                       # Статичні файли
│   │   ├── images/                   # Картинки
│   │   ├── icons/                    # SVG іконки
│   │   └── fonts/                    # Шрифти
│   │
│   ├── styles/                       # Глобальні стилі
│   │   ├── styles.css                # Основний CSS (Tailwind)
│   │   └── ugc.scss                  # SASS для UGC контенту
│   │
│   ├── main.ts                       # Entry point
│   ├── index.html                    # HTML шаблон
│   └── favicon.ico                   # Favicon
│
├── backend/                           # BACKEND (Spring Boot 3.5)
│   ├── src/main/java/us/moneybay/
│   │   ├── controller/               # REST контролери
│   │   │   ├── ListingController.java
│   │   │   ├── UserController.java
│   │   │   ├── AuthController.java
│   │   │   ├── CategoryController.java
│   │   │   ├── ChatController.java
│   │   │   ├── PaymentController.java
│   │   │   └── FlagController.java    # Флагування оголошень
│   │   │
│   │   ├── service/                  # Бізнес-логіка
│   │   │   ├── ListingService.java
│   │   │   ├── UserService.java
│   │   │   ├── AuthService.java
│   │   │   ├── ChatService.java
│   │   │   ├── PaymentService.java
│   │   │   ├── FlagListingService.java
│   │   │   └── KeywordFilterService.java
│   │   │
│   │   ├── repository/               # Database доступ
│   │   │   ├── ListingRepository.java
│   │   │   ├── UserRepository.java
│   │   │   ├── ChatRepository.java
│   │   │   ├── ListingFlagRepository.java
│   │   │   └── KeywordFilterRepository.java
│   │   │
│   │   ├── model/                    # JPA Entity класи
│   │   │   ├── Listing.java
│   │   │   ├── User.java
│   │   │   ├── Category.java
│   │   │   ├── Chat.java
│   │   │   ├── ListingFlag.java
│   │   │   └── KeywordFilter.java
│   │   │
│   │   ├── dto/                      # Data Transfer Objects
│   │   │   ├── ListingDTO.java
│   │   │   ├── UserDTO.java
│   │   │   ├── LoginRequest.java
│   │   │   └── ...
│   │   │
│   │   ├── config/                   # Конфігурація
│   │   │   ├── SecurityConfig.java   # Spring Security + JWT
│   │   │   ├── WebConfig.java        # CORS, WebSocket
│   │   │   ├── CacheConfig.java      # Redis кешування
│   │   │   └── FileStorageConfig.java # Cloudflare R2
│   │   │
│   │   ├── security/                 # JWT та аутентифікація
│   │   │   ├── JwtTokenProvider.java
│   │   │   ├── JwtAuthFilter.java
│   │   │   └── CityContextFilter.java # City subdomain routing
│   │   │
│   │   └── MoneyBayApplication.java  # Main клас
│   │
│   ├── src/main/resources/
│   │   ├── application.properties     # Конфігурація (dev)
│   │   ├── application-prod.properties # Production конфіг
│   │   ├── db/migration/             # Liquibase міграції БД
│   │   │   ├── V1__Initial_schema.sql
│   │   │   ├── V2__Add_JWT_tables.sql
│   │   │   └── ...
│   │   └── application.yml           # YAML конфіг
│   │
│   ├── pom.xml                       # Maven залежності
│   ├── mvnw                          # Maven Wrapper
│   └── mvnw.cmd                      # Maven Wrapper (Windows)
│
├── .claude/                           # Claude Code конфіг
│   └── settings.json                 # Налаштування Claude
│
└── dist/                              # Build output (Angular)
    └── moneybay-angular/
        ├── browser/                  # Статика для фронтенда
        └── server/                   # SSR сервер
```

### Основні технології

| Шар | Технологія | Порт | Деплой |
|------|-----------|------|---------|
| Frontend | Angular 21 + Tailwind CSS | 1100 (dev), 443 (prod) | Cloudflare Pages |
| Backend | Spring Boot 3.5 + Spring Security | 5000 | AWS EC2 |
| Database | PostgreSQL 18 | 5432 | AWS RDS |
| Real-time | WebSocket STOMP | 5000 | AWS EC2 |
| CDN фото | Cloudflare R2 | - | Cloudflare R2 |
| Платежі | Stripe | - | Stripe API |

### Flow запросів

```
User Browser
    ↓
Cloudflare Pages (moneybay.us) ← Frontend (Angular)
    ↓
AWS EC2 Backend (api.moneybay.us:5000) ← Spring Boot API
    ↓
AWS RDS PostgreSQL ← Database
```

## Setup

### Prerequisites
- Node.js 22+ or 24+
- JDK 25 (Eclipse Temurin)
- PostgreSQL 14+ on localhost:5432

### JAVA_HOME (Windows)
```cmd
setx JAVA_HOME "C:\jdk-25\jdk-25.0.3+9"
setx PATH "%PATH%;C:\jdk-25\jdk-25.0.3+9\bin"
```

### Database
```sql
CREATE DATABASE moneybay;
CREATE USER moneybay_app WITH PASSWORD 'moneybay123';
GRANT ALL PRIVILEGES ON DATABASE moneybay TO moneybay_app;
```

### Backend (Spring Boot)
```cmd
cd backend
.\mvnw spring-boot:run
```
- API: http://localhost:5000
- Swagger: http://localhost:5000/swagger-ui.html
- Health: http://localhost:5000/actuator/health

First run seeds 13 categories + 41 subcategories + 36 subsubcategories + 55 cities with subdomains.

### Frontend (Angular)
```cmd
cd c:\moneybayts
ng serve --port 1100
```
Open http://localhost:1100

## Run Modes (важно различать)

Три режима запуска фронтенда — для разных задач разработки:

| Режим | Команда | Порт | HMR | PWA | SSR | Когда |
|-------|---------|------|-----|-----|-----|-------|
| **Dev (ng serve)** | `ng serve` | 1100 | ✅ | ❌ Off | ✅ Vite | **Ежедневная разработка, 95% времени** |
| **Production-like local** | `ng build` + `npm run serve:ssr` | 4000 | ❌ | ✅ On | ✅ Express | Тестирование PWA + offline + bundle size |
| **Cloud Run production** | `gcloud builds submit` + deploy | 443 | ❌ | ✅ On | ✅ Express | Реальный production |

### Mode 1: Dev (ежедневная разработка)

**Backend (Terminal 1):**
```cmd
cd c:\moneybayts\backend
.\mvnw spring-boot:run
```
Spring Boot на 5000 + DevTools auto-reload при изменении Java-кода.

**Frontend (Terminal 2):**
```cmd
cd c:\moneybayts
ng serve
```
Angular на 1100 с HMR — изменения в `.ts/.html/.css` подхватываются за 1-2 секунды.

PWA Service Worker **отключён** в этом режиме через `enabled: !isDevMode()` в `app.config.ts`. Без этого SW кэшировал бы старые версии и блокировал HMR.

### Mode 2: Production-like local (тестирование PWA + SSR)

Используется когда нужно проверить PWA functionality, offline mode, bundle size или production-specific дефекты.

**Backend (Terminal 1):**
```cmd
cd c:\moneybayts\backend
.\mvnw spring-boot:run
```
Spring Boot работает как в Dev режиме.

**Frontend (Terminal 2):**
```cmd
cd c:\moneybayts
ng build
npm run serve:ssr
```
Express SSR server на 4000 с production bundle и активным Service Worker.

После каждого изменения кода нужна **пересборка через `ng build`** — это медленно (30-60 секунд). Поэтому этот режим только для финальной проверки, не для разработки.

**Что тестировать в Mode 2:**
- Установка как PWA через "Install" иконку в адресной строке Chrome
- Offline mode — отключи интернет в DevTools → Network → Offline, обнови страницу — должно работать из кэша
- Bundle size в DevTools → Network — проверь что initial bundle < 500 KB
- Service Worker в DevTools → Application → Service Workers — должен быть `ngsw-worker.js` зарегистрирован
- Cache Storage в DevTools → Application → Cache Storage — несколько кэшей: `assets`, `api-listings-read`, `uploads`

### Mode 3: Cloud Run production

См. раздел [Deploy to Cloud Run](#deploy-to-cloud-run) ниже.

## Categories

13 top-level categories (with FontAwesome icons and pastel colors matching Flask):
Kids & Baby, Real Estate, Vehicles, Jobs, Pets, Electronics, Fashion, Food & Grocery, Beauty & Cosmetics, Business & Services, Hobbies & Sports, Home & Garden, Housing.

Subcategory hierarchy (3 levels):
- **Vehicles** → Cars & Trucks, Motorcycles, RVs & Campers, Boats, Car Rentals, Parts
- **Food** → 18 subs (Alcohol, Pantry, Frozen, Coffee & Tea, Meat, Cheese, etc.)
- **Beauty & Cosmetics** → 12 subs + 36 subsubs (Pharmacy/Cica/Sterile, Makeup/Lips/Eyes, etc.)

## API Endpoints

### Auth (public)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/verify-email?token=...` (email verification with DB-backed tokens)

### Listings
- `GET /api/listings?page=&q=&city=&category=&sort=` (public)
- `GET /api/listings/{id}` (public)
- `GET /api/listings/suggest?q=&city=&limit=` (public, search autocomplete)
- `GET /api/listings/{id}/similar` (public, returns `same_location`, `similar_price`, `from_seller`)
- `POST /api/listings` multipart (auth)
- `PUT /api/listings/{id}` multipart (auth)
- `DELETE /api/listings/{id}` (auth)

### Reference (public)
- `GET /api/categories`
- `GET /api/subcategories/category/{slug}`
- `GET /api/subcategories/{id}/children`
- `GET /api/cities`
- `GET /api/cities/current` (returns city by subdomain context)

### User (auth)
- `GET /api/profile`
- `PUT /api/profile`
- `GET /api/my-listings`

### Messages (auth)
- `GET /api/unread-messages-count`
- `GET /api/conversations`
- `GET /api/chats/{otherUserId}/messages`
- `POST /api/chats/{otherUserId}/messages`
- WebSocket `/ws` (STOMP, `/app/chat.send`, `/user/{email}/queue/messages`)

### Favorites (auth)
- `GET /api/favorites`
- `POST /listing/{id}/like`

### Files (auth upload, public read)
- `POST /api/uploads`
- `GET /api/uploads/{filename}`

### Boost / Stripe
- `POST /api/boost/checkout` (auth) — creates Stripe Checkout Session
- `POST /api/stripe/webhook` — Stripe webhook handler

### Admin (auth, requires `is_admin`)
- `GET /api/admin/users` / `POST /api/admin/users/{id}/toggle-admin` / `DELETE /api/admin/users/{id}`
- `GET /api/admin/listings` / `POST /api/admin/listings/{id}/toggle-active` / `DELETE /api/admin/listings/{id}`
- `GET /api/admin/stats`

### SEO
- `GET /sitemap.xml`
- `GET /robots.txt`

## Authentication

1. Frontend → `POST /api/auth/login` with email/password
2. Backend validates, returns JWT + UserDto
3. Frontend stores token in `localStorage`
4. `authInterceptor` adds `Authorization: Bearer <token>` to all requests
5. Backend `JwtAuthFilter` extracts user, sets SecurityContext
6. `authGuard` protects routes that require auth

## Search Autocomplete

`SearchAutocompleteComponent` — standalone component with debounced search suggestions.

- RxJS `debounceTime(250)` — задержка перед запросом
- `distinctUntilChanged` — не дублирует одинаковые запросы
- `filter(q => q.length >= 2)` — минимум 2 символа
- Endpoint `/api/listings/suggest` возвращает top-8 (prefix matches + contains fallback)
- City context aware — учитывает subdomain как default city filter
- Image preview + price + location в dropdown
- Keyboard navigation: ArrowUp/Down, Enter (на подсказке — переход, без выбора — полный поиск), Escape (закрыть)
- Click outside через `@HostListener` закрывает dropdown

## Similar Products

На странице объявления (`ListingDetailComponent`) под основной карточкой — три горизонтальные карусели:

| Карусель | Условие |
|----------|---------|
| **Similar Products in {city}** | same category + same city, до 12 объявлений |
| **Similar Price Range** | same category + price ±20%, до 12 объявлений |
| **More from this Seller** | same category + same seller, до 12 объявлений |

Frontend: `overflow-x-auto` + `snap-x` для свайпа на mobile, кнопки ← → для desktop при > 3 карточек, smooth scroll через `scrollRow(element, offset)`.

## Email System

**EmailService** через JavaMailSender (Spring Boot Mail):
- Dev: Mailtrap sandbox (бесплатно 100 email/день)
- Prod: SendGrid/AWS SES через env vars `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`
- `@EnableAsync` + `@Async` — отправка не блокирует HTTP-запрос
- `app.mail.enabled` toggle (false по умолчанию в dev)
- Graceful degradation если SMTP не настроен — логируется WARN, registration не падает

**EmailVerificationService** — DB-backed токены:
- Entity `EmailVerificationToken` (id, token, user_id, expires_at)
- TTL 24 часа
- `@Scheduled` cleanup истёкших токенов
- При регистрации генерируется token + отправляется email со ссылкой `/verify-email?token=...`

## Rate Limiting

`RateLimitFilter` (Bucket4j) с тремя уровнями лимитов per-IP:

| Endpoint group | Лимит/мин |
|----------------|-----------|
| `/api/auth/*` (login, register, reset) | 5 |
| Write operations (POST/PUT/DELETE/PATCH) | 20 |
| General reads | 60 |

- Exempt от лимитов: `/actuator/`, `/ws`, `/swagger-ui`, `/v3/api-docs`, `/api/uploads/`, `/sitemap.xml`, `/robots.txt`
- IP resolver: `X-Forwarded-For` → `X-Real-IP` → `request.getRemoteAddr()`
- Превышение лимита: HTTP 429 + `Retry-After: 60` header
- `X-RateLimit-Remaining` header на каждый успешный запрос
- Конфигурируется через env vars: `RATE_LIMIT_ENABLED`, `RATE_LIMIT_RPM`, `RATE_LIMIT_AUTH_RPM`, `RATE_LIMIT_WRITE_RPM`

## reCAPTCHA

`RecaptchaService` — verify Google reCAPTCHA tokens (v2 или v3):
- Endpoint: `https://www.google.com/recaptcha/api/siteverify`
- v3: проверка score ≥ `app.recaptcha.min-score` (default 0.5)
- v2: только success check
- Toggle через `RECAPTCHA_ENABLED` env var (false по умолчанию в dev)
- Если disabled или secret пустой → verify() возвращает true (пропускает)

## SEO

**SeoService** (Angular) — управление meta tags для каждой страницы:
- `<title>` — динамический per page
- `<meta name="description">` — short summary
- Open Graph: `og:title`, `og:description`, `og:image`, `og:type`
- Twitter Card: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- Canonical URL
- `noindex` flag для error pages

**Sitemap.xml** — генерируется backend (`SitemapController`):
- Динамические URLs: все active listings, категории, города
- Static pages: home, about, contact, terms, privacy

**robots.txt** — статически, с правилами для `/admin/`, `/api/`, allow `/sitemap.xml`.

## Configuration

### Development (`backend/src/main/resources/application.properties`)
- Database: `localhost:5432/moneybay`
- Port: 5000
- JWT expiration: 24h
- CORS: `http://localhost:1100, http://localhost:4200`
- Mail: Mailtrap defaults (disabled by default)
- Rate limit: enabled
- reCAPTCHA: disabled

### Production (`backend/src/main/resources/application-prod.properties`)
Override via env vars:
- `DATABASE_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET` (required)
- `ALLOWED_ORIGINS`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `FRONTEND_URL`
- `UPLOAD_DIR`
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_ENABLED=true`
- `RECAPTCHA_ENABLED=true`, `RECAPTCHA_SECRET_KEY`
- `RATE_LIMIT_ENABLED=true`

Activate prod profile:
```bash
java -jar app.jar --spring.profiles.active=prod
```

## Cloudflare R2 (Photo Storage)

Фото объявлений хранятся в **Cloudflare R2** (S3-compatible object storage) вместо локального filesystem.

### Setup

#### 1. Создать R2 bucket в Cloudflare

1. Откройи https://dash.cloudflare.com
2. **R2** → **Create bucket**
3. Имя: `moneybayts-photos`
4. Region: **Eastern North America** (или любой ближайший)
5. Сохрани

#### 2. Получить R2 API Token

1. Cloudflare Dashboard → **Account** (левый нижний угол) → **API Tokens**
2. **Create Token** → выбери **Edit Cloudflare Workers** template
3. Или создай custom token с permissions:
   - **Account** → **R2** → **Object Read & Write** (ограничить на bucket `moneybayts-photos`)
4. Скопируй token

#### 3. Добавить credentials в `application.properties`

```properties
aws.r2.accessKeyId=YOUR_R2_ACCESS_KEY_ID
aws.r2.secretAccessKey=YOUR_R2_SECRET_ACCESS_KEY
aws.r2.endpoint=https://ACCOUNT_ID.r2.cloudflarestorage.com
aws.r2.bucketName=moneybayts-photos
aws.r2.region=auto
```

**Где взять:**
- `ACCESS_KEY_ID` и `SECRET_ACCESS_KEY` — при создании API Token в Cloudflare
- `ACCOUNT_ID` — в URL: `https://dash.cloudflare.com/ACCOUNT_ID/r2/overview`

#### 4. Включить Public Development URL в R2 bucket

Чтобы браузер мог скачивать фото без аутентификации:

1. Cloudflare R2 → **moneybayts-photos** → **Settings**
2. **Public Development URL** → **Enable**
3. Подтверди через диалог (введи `allow`)
4. Скопируй публичный R2 dev URL (тип: `https://pub-xxxxxx.r2.dev`)

Этот URL используется в браузере для GET (чтение фото). Backend загружает фото через account endpoint.

#### 5. Настроить CORS

1. R2 Settings → **CORS Policy**
2. Добавь JSON:
```json
[
  {
    "AllowedOrigins": [
      "http://localhost:1100",
      "https://www.moneybay.us",
      "https://moneybay.us"
    ],
    "AllowedMethods": [
      "GET"
    ],
    "AllowedHeaders": [
      "*"
    ]
  }
]
```
3. Save

### Wrangler CLI (опционально)

Для удобства проверки файлов в R2 установи Cloudflare Wrangler:

```cmd
npm install -g wrangler
wrangler login
```

После этого можешь проверять R2 bucket:

```bash
wrangler r2 object get moneybayts-photos/filename.jpg
wrangler r2 bucket info moneybayts-photos
```

### Как это работает

1. **Frontend** → POST /api/listings multipart с фото
2. **Backend (R2PhotoService)**:
   - Загружает файл на R2 (account endpoint для WRITE)
   - Возвращает публичный R2 dev URL
3. **Фото URL в БД**: сохраняется как `https://pub-xxxxx.r2.dev/moneybayts-photos/filename.jpg`
4. **Frontend (ListingDetailComponent)**:
   - Загружает фото с публичного R2 URL (GET)
   - CORS разрешает кроссдоменный запрос от localhost:1100

### Troubleshooting R2

**Фото возвращает 400 Bad Request**
- Проверь что Public Development URL включён в R2 Settings
- Убедись что CORS policy добавлен правильно (JSON format)
- Жди 1-2 минуты чтобы настройка применилась

**Failed to upload image to R2**
- Проверь credentials в `application.properties`
- Убедись что S3Client bean создан правильно (`R2Config.java`)
- Посмотри логи Spring Boot на ошибку

**Браузер не может загрузить фото**
- Hard refresh: Ctrl+Shift+R
- Проверь DevTools Console (F12) на CORS ошибки
- Убедись что Origin в CORS policy совпадает с локальным портом

## Docker

```bash
docker-compose up --build
```

Services:
- `postgres` (5432) — PostgreSQL
- `backend` (5000) — Spring Boot
- `frontend` (1100) — Angular + Nginx

## Deploy to Cloud Run

```bash
# Backend
cd backend
gcloud builds submit --tag gcr.io/PROJECT_ID/moneybay-backend
gcloud run deploy moneybay-backend \
  --image gcr.io/PROJECT_ID/moneybay-backend \
  --region us-central1 \
  --set-env-vars SPRING_PROFILES_ACTIVE=prod,JWT_SECRET=YOUR_SECRET

# Frontend
cd ..
gcloud builds submit --tag gcr.io/PROJECT_ID/moneybay-frontend
gcloud run deploy moneybay-frontend \
  --image gcr.io/PROJECT_ID/moneybay-frontend \
  --region us-central1
```

Automated via GitHub Actions (`.github/workflows/deploy.yml`) on push to master.

## CSS Architecture

**Tailwind CSS** — контролируемый UI: utility-first подход для компонентов (`bg-mb-blue`, `flex`, `rounded-2xl`).

**@tailwindcss/typography** — стилизация UGC контента (описания товаров, отзывы, HTML из WYSIWYG):
```html
<div class="prose max-w-none" [innerHTML]="listing.description"></div>
```

Плагин подключён в `tailwind.config.js` с кастомизацией под бренд:
- `mb-dark` для заголовков
- `mb-blue` для ссылок
- `pink-600` для inline code

`angular.json`:
```json
"styles": ["src/styles.css"]
```

Папки assets (для иконок, фото):
```json
"assets": [
  { "glob": "**/*", "input": "public" },
  { "glob": "**/*", "input": "src/assets", "output": "/assets" }
]
```

## City Subdomain Routing (Craigslist-style)

Площадка использует **subdomain-per-city** подход как Craigslist: каждый город имеет свой subdomain, который применяется как default city filter. Данные общие, изоляции нет, один аккаунт работает на всех subdomains.

**Структура URL:**
```
newyork.moneybay.us    → объявления New York по умолчанию
losangeles.moneybay.us → объявления Los Angeles
chicago.moneybay.us    → объявления Chicago
moneybay.us            → все города без фильтра
```

**Как работает:**

1. **Backend (`CityContextFilter`)** — парсит `Host` header, извлекает первый сегмент subdomain (`newyork.moneybay.us` → `newyork`), сохраняет в `ThreadLocal` через `CityContext`
2. **ListingController** — если в запросе нет `?city=` параметра, применяет subdomain из контекста как фильтр
3. **Frontend (`CityContextService`)** — читает `window.location.hostname`, парсит subdomain
4. **HTTP interceptor (`cityContextInterceptor`)** — добавляет `X-City-Subdomain` header ко всем запросам (fallback если backend за CDN/прокси не видит оригинальный Host)
5. **Header** — показывает текущий город из subdomain в шапке
6. **HomeComponent** — выставляет subdomain city как default city filter при загрузке

**Локальное тестирование:**

Добавить в `C:\Windows\System32\drivers\etc\hosts` (требует прав администратора):
```
127.0.0.1 moneybay.localhost
127.0.0.1 newyork.localhost
127.0.0.1 losangeles.localhost
127.0.0.1 chicago.localhost
127.0.0.1 miami.localhost
```

Открывать в браузере:
- `http://newyork.localhost:1100` — площадка с фильтром New York
- `http://losangeles.localhost:1100` — площадка с фильтром Los Angeles
- `http://localhost:1100` — все города

**Запасной вариант без правки hosts** — через `X-City-Subdomain` header в DevTools (например через расширение ModHeader):
```
X-City-Subdomain: newyork
```

**Production (Cloudflare DNS):**

Wildcard A-запись `*.moneybay.us` → IP сервера. Один билд фронтенда обслуживает все subdomains.

**Зарезервированные subdomains** (не считаются городом): `www`, `api`, `admin`, `localhost`.

## SSR (Angular Universal)

Angular 21 SSR настроен через `@angular/ssr` 21.

**Файлы:**
- `src/main.server.ts` — SSR bootstrap с `BootstrapContext`
- `src/server.ts` — Express server с `AngularNodeAppEngine`
- `src/app/app.config.server.ts` — `provideServerRendering(withRoutes(serverRoutes))`
- `src/app/app.routes.server.ts` — render mode per route

**Render modes:**
- **Server** — public pages (home, listing/:id, about, terms, privacy, refund, contact, login, register, forgot-password, reset-password)
- **Client** — auth-required pages (profile, my-listings, chat/:id, edit-listing, promote, admin, favorites, messages)

**angular.json config:**
- `outputMode: "server"`
- `ssr.entry: "src/server.ts"`
- `server: "src/main.server.ts"`
- `prerender: false` (только runtime SSR)
- `security.allowedHosts` для защиты от SSRF (localhost, 127.0.0.1, subdomains, moneybay.us/net)

## PWA (Progressive Web App)

PWA Service Worker настроен через `@angular/service-worker`. Активен **только в production build** (отключён в `ng serve` для совместимости с HMR).

**Файлы:**
- `public/manifest.webmanifest` — манифест приложения (имя, иконки, theme color, app shortcuts)
- `ngsw-config.json` — конфигурация Service Worker (asset groups + data groups + caching strategies)
- `src/app/app.config.ts` — `provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), registrationStrategy: 'registerWhenStable:30000' })`
- `src/index.html` — meta tags для iOS/Android PWA + `<link rel="manifest">`
- `angular.json` (production config) — `"serviceWorker": "ngsw-config.json"`

**Caching Strategies (data groups):**

| Группа | Endpoint | Стратегия | TTL | Max items |
|--------|----------|-----------|-----|-----------|
| **api-categories** | `/api/categories`, `/api/subcategories`, `/api/cities` | freshness (network-first, fallback cache) | 1 день | 100 |
| **api-listings-read** | `/api/listings`, `/api/listings/*`, `/api/listings/*/similar`, `/api/listings/suggest` | freshness | 5 минут | 200 |
| **uploads** | `/api/uploads/**` | performance (cache-first) | 7 дней | 500 |

**Asset groups:**

| Группа | Install mode | Content |
|--------|--------------|---------|
| **app** | prefetch | HTML shell, CSS, JS bundles, favicon, manifest |
| **assets** | lazy + prefetch updates | Иконки, fonts, статические картинки |

**Navigation URLs:**

SPA fallback на `/index.html` для всех navigation requests. Исключения (не идут через SW):
- `/api/**` — API запросы напрямую к backend
- `/ws/**` — WebSocket подключения
- `/actuator/**` — Spring Boot Actuator endpoints

**App Shortcuts (long-press app icon на mobile):**
- Post Ad → `/new-listing`
- My Listings → `/my-listings`
- Messages → `/messages`

**Как проверить PWA локально:**

```cmd
cd c:\moneybayts
ng build
npm run serve:ssr
```

Открой `http://localhost:4000` в Chrome → DevTools → Application tab:

| Section | Что проверить |
|---------|---------------|
| **Manifest** | Все детали MoneyBay PWA: name, theme_color #002f34, icons |
| **Service Workers** | `ngsw-worker.js` зарегистрирован и активен |
| **Cache Storage** | Несколько кэшей: `assets`, `api-listings-read`, `uploads` |
| **Storage** | Quota usage для PWA данных |

**Установка как приложение:**

В Chrome desktop появляется иконка установки в адресной строке. На мобильном — пункт "Add to Home Screen" в меню браузера. После установки приложение запускается в standalone окне без UI браузера (адресной строки нет).

**Offline mode:**

После первого посещения страницы кэшируются согласно стратегиям выше. DevTools → Network → "Offline" — сайт продолжает работать из кэша:
- Категории и города — из `api-categories` cache (1 день)
- Свежие listings — из `api-listings-read` cache (5 минут)
- Фото пользователей — из `uploads` cache (7 дней)
- Auth-required endpoints — недоступны offline (требуют network)

**Размер initial bundle:**

Целевой target: < 500 KB initial JS (через `budgets` в angular.json). Lazy-loaded routes подгружаются по требованию через code splitting.

## Test Data

DB seeder из Flask `generate_mass_data.py` (TODO для Java версии).

Manual SQL seed для разработки:
- 5 тестовых продавцов (`seller.john@test.moneybay.us`, ..., все с паролем `password`)
- 100 объявлений распределённых по 13 категориям и 22+ городам
- 25 дополнительных Electronics в New York для демонстрации Similar Products каруселей (ID 101-125)

Очистка тестовых данных:
```sql
DELETE FROM listings WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.moneybay.us');
DELETE FROM users WHERE email LIKE '%@test.moneybay.us';
```

## Current Status

| Component | Готовность |
|---|---|
| Frontend pages (UI) | 85-90% |
| Frontend дизайн (как Flask) | 85% |
| Navigation drawer (mobile) | 100% |
| Backend REST API | 95% |
| Categories/subcategories | 100% (13 cat + 41 sub + 36 subsub + FontAwesome) |
| Cities + city subdomain routing | 100% |
| Auth + JWT | 100% |
| Email verification (DB-backed) | 100% |
| SMTP отправка (Mailtrap dev / SendGrid prod) | 100% |
| WebSocket chat | 80% |
| Stripe Checkout | 90% (mock webhooks dev) |
| Image upload | 85% |
| SSR (Angular Universal) | 100% |
| PWA Service Worker | 100% |
| Lazy load images (loading="lazy") | 100% |
| Tailwind Typography (prose UGC) | 100% |
| Search autocomplete + debounce | 100% |
| Similar Products carousels | 100% |
| Rate Limiting (Bucket4j) | 100% |
| reCAPTCHA service | 80% (нужна интеграция в AuthController + Angular widget) |
| Sitemap.xml + robots.txt | 100% |
| SEO meta tags (SeoService) | 100% |
| DevOps files (Docker, CI/CD) | 80% |
| Tests (Spring Boot Test + Vitest) | 5% |

## TODO

### Backend
- Google OAuth login
- Google Cloud Storage для файлов (сейчас локально)
- Google Vision AI для модерации
- Telegram bot integration
- Tests (Spring Boot Test) — config готов, нужны Controller/Repository/Service тесты
- Admin: listing-specific chat
- Support chat (user → admin)
- Public view profile endpoint

### Frontend
- Интеграция reCAPTCHA widget (`ng-recaptcha`) в Login/Register формы
- Angular verify-email страница (приём token из email ссылки)
- Infinite scroll listings
- Scroll animations (fade-in-up)
- Public view profile component
- Error pages (403/404/500)
- Tests (Vitest, Playwright)
- Dark mode toggle
- i18n (Spanish для US-Latino аудитории)

### DevOps
- Тестирование Cloud Run deployment
- Cloud SQL подключение
- Domain mapping (moneybay.us, api.moneybay.us)
- SSL сертификаты
- Cloud Secret Manager для JWT_SECRET, STRIPE_*
- Cloud Logging + Monitoring alerts

## Trust & Safety (Community-Driven Moderation)

**Strategy:** Community flagging + simple keyword filters (copy Craigslist free model, improve speed)

### Phase 1 - User Flagging System (THIS WEEK)

**Implementation:**
- New `ListingFlag` entity (id, listing_id, user_id, reason, created_at, status)
- Endpoint: `POST /api/listings/{id}/flag` (auth required)
- Auto-ban after 20 flags (configurable)
- Admin dashboard to review flagged listings

**Reasons for flagging:**
- Spam/duplicate
- Prohibited items
- Fraud/scam
- Offensive content
- Invalid contact info

**Cost:** $0 (community moderation)

### Phase 2 - Keyword Filters (NEXT WEEK)

**Implementation:**
- `KeywordFilter` entity (id, word, category: SPAM/PROHIBITED/ABUSE)
- Service to scan listing title + description
- Auto-hide if matches (notify user)
- Configurable whitelist (for false positives)

**Categories:**
```
SPAM: "free money", "click here", "earn quick cash"
PROHIBITED: "gun", "drug", "fake id"  
ABUSE: (optional, for severity)
```

**Source:**
- Use existing open-source list (better-profanity)
- Or create custom list in database
- Update via admin panel

**Cost:** $0 (no AI needed)

### Phase 3 - Admin Actions (WEEK 2)

**Endpoints:**
- `DELETE /api/listings/{id}` (remove listing)
- `POST /api/users/{id}/suspend` (24h timeout)
- `POST /api/users/{id}/ban` (permanent)

**Metrics:**
- Flag count per listing
- Flagged listings per day
- Ban rate
- Appeal process (users can contact support)

### Competitive Advantage vs Craigslist

| Feature | Craigslist | MoneyBay |
|---------|-----------|----------|
| Flag-to-removal time | 1-3 days | 1 hour |
| Ban enforcement | Weak, easy to bypass | Strong, automatic |
| UI for flagging | Hidden, hard to find | Obvious, clear |
| Appeal process | None (email only) | Automatic (support ticket) |
| Cost | $0 | $0 |

### Phase 4 - User Ratings System (WEEK 3)

**Implementation:**
- `UserRating` entity (1-5 stars, categories: COMMUNICATION, ITEM_QUALITY, SELLER_TRUST, BUYER_TRUST)
- `UserRatingService` (getStats, rateUser)
- Endpoints: `POST /api/users/{id}/rate`, `GET /api/users/{id}/ratings`
- Display average rating on user profile + listing cards

**Strategy:**
- Ratings = reputation incentive (people fear bad reviews)
- Prevents repeat fraud (bad sellers get 1-2 stars, no one buys)
- Cost: $0 (community-driven)

### Future (Phase 5+)

- AI content scanning (OpenAI Moderation) — only for appeals
- Photo verification (Hive AI free tier) — optional
- Trust badge for verified sellers/buyers (once ratings stable)
- Automated KYC with IDology (when volume grows)

## Roadmap — Spring AI Integration

**Status:** Planned (not yet implemented)

**Purpose:** Add AI capabilities to enhance user experience and automate moderation.

### Planned AI Features

**Backend (Spring AI + LLM):**
- **Listing Description Generation:** AI улучшает или генерирует описания объявлений (GPT-4-mini или Claude)
- **Auto-Categorization:** Автоматическая категоризация листингов по заголовку/описанию
- **Content Moderation:** Спам-детекция, проверка на запрещенные товары
- **Search Semantics:** Семантический поиск via embeddings (понимание intent пользователя)
- **Seller Ratings Summary:** AI генерирует summary отзывов продавца

**Backend (Embeddings для семантического поиска):**
- **Embeddings Storage:** PostgreSQL `pgvector` расширение для хранения vector embeddings
- **Listing Embeddings:** Каждый листинг получает embedding при создании/обновлении
- **Semantic Search:** Пользователь вводит query → генерируется embedding → поиск по similarity в БД

**Frontend (Angular):**
- AI-powered search suggestions (как ищут другие пользователи)
- Listing preview с AI summary
- Chatbot для поддержки (FAQ)

### Embeddings Model Selection

**Option 1: OpenAI text-embedding-3-small** (Recommended)
- **Price:** $0.02 per 1M tokens
- **Dimensions:** 1536
- **Pros:** Самый безопасный дефолт, надежный, всегда актуален
- **Cons:** Зависимость от OpenAI API

**Option 2: Jina AI jina-embeddings-v3**
- **Price:** $0.02 per 1M tokens (одинаковая цена)
- **Dimensions:** 1024 (configurable до 8192)
- **Pros:** Отлично работает с длинными текстами (до 8192 токенов), главный конкурент OpenAI
- **Cons:** Менее популярен, чуть медленнее

**Рекомендация:** Начать с OpenAI, если нужна поддержка длинных текстов — переключиться на Jina AI.

Обе цены идентичны (~$0.02), разница в качестве на длинных текстах (описания листингов часто 500+ слов).

### Implementation Steps

1. Add Spring AI + pgvector dependencies to `pom.xml`:
   ```xml
   <!-- Spring AI OpenAI (for LLM + embeddings) -->
   <dependency>
       <groupId>org.springframework.ai</groupId>
       <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
       <version>0.8.1</version>
   </dependency>
   
   <!-- PostgreSQL pgvector extension (for vector similarity search) -->
   <dependency>
       <groupId>org.postgresql</groupId>
       <artifactId>postgresql</artifactId>
       <version>42.7.0</version>
   </dependency>
   
   <!-- Alternative: Jina AI embeddings (replace OpenAI if needed) -->
   <!-- <dependency>
       <groupId>org.springframework.ai</groupId>
       <artifactId>spring-ai-jina-embeddings-spring-boot-starter</artifactId>
       <version>0.8.1</version>
   </dependency> -->
   ```

2. Enable pgvector in PostgreSQL:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. Create Listing table with embedding column:
   ```sql
   ALTER TABLE listings ADD COLUMN embedding vector(1536);
   CREATE INDEX ON listings USING ivfflat (embedding vector_cosine_ops);
   ```

4. Configure API keys in `application.properties`:
   ```properties
   spring.ai.openai.api-key=${OPENAI_API_KEY}
   spring.ai.openai.chat.options.model=gpt-4-mini
   spring.ai.openai.embedding.options.model=text-embedding-3-small
   
   # Alternative for Jina AI:
   # spring.ai.jina.api-key=${JINA_API_KEY}
   # spring.ai.jina.embedding.options.model=jina-embeddings-v3
   ```

5. Create AI service classes:
   - `EmbeddingService` — генерирует embeddings для листингов (OpenAI или Jina)
   - `ListingDescriptionService` — улучшение описаний (GPT-4-mini)
   - `ContentModerationService` — модерация контента
   - `AutoCategoryService` — автокатегоризация
   - `SemanticSearchService` — поиск по similarity в pgvector

6. Add REST endpoints:
   - `POST /api/listings/enhance` — улучшить описание
   - `POST /api/listings/auto-categorize` — определить категорию
   - `POST /api/moderation/check` — проверить контент
   - `POST /api/search/semantic` — семантический поиск (query → embedding → similarity search)
   - `GET /api/listings/{id}/embedding` — получить embedding листинга

7. Update Listing creation/update flow:
   - При `POST /api/listings` автоматически генерировать embedding и сохранять в DB
   - При `PUT /api/listings/{id}` перегенерировать embedding если изменилось описание

8. Frontend integration in Angular components
   - Search page с "AI-powered search" toggle
   - Semantic search results vs keyword search
   - Listing preview с AI summary

### Cost Estimates

- **OpenAI GPT-4-Mini:** ~$0.02 per 1M input tokens, $0.06 per 1M output tokens
- **Anthropic Claude:** Similar pricing tier
- **Alternative:** Use free tier Anthropic Claude or open-source LLM (Ollama local)

### Security Considerations

- Never expose API keys in frontend
- Rate limit AI requests per user (prevent abuse)
- Implement request validation before sending to AI
- Cache AI results to reduce API calls

## Troubleshooting

### Ошибка `function lower(bytea) does not exist`

**Симптом:** при поиске объявлений Spring Boot возвращает 500, в логах:
```
Caused by: org.postgresql.util.PSQLException: ОШИБКА: function lower(bytea) does not exist
```

**Причина:** колонки `title`, `description`, `location` в таблице `listings` созданы как `bytea` (бинарные), а Entity объявляет их как `String`. Hibernate с `ddl-auto=update` не меняет тип уже созданных колонок.

**Способ устранения:**

1. Остановить Spring Boot (Ctrl+C в окне `mvnw spring-boot:run`)
2. Подключиться к базе:
   ```cmd
   set PGPASSWORD=moneybay123
   "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U moneybay_app -d moneybay -h localhost
   ```
3. Удалить таблицы:
   ```sql
   DROP TABLE IF EXISTS messages CASCADE;
   DROP TABLE IF EXISTS listing_images CASCADE;
   DROP TABLE IF EXISTS listings CASCADE;
   ```
4. Перезапустить Spring Boot — Hibernate создаст таблицы заново с типами `varchar/text` согласно Entity

Объявления теряются, категории и пользователи сохраняются.

### Ошибка `Internal server error` на `/api/listings?page=1` без q параметра

**Причина:** PostgreSQL не может определить тип параметра когда он NULL в JPQL `:q IS NULL`.

**Устранено:** заменено на `COALESCE(:q, '') = ''` в `ListingRepository.search()`.

### Boolean field NPE при загрузке User

**Симптом:** Spring Boot 500 при работе с пользователями после добавления нового boolean поля.

**Причина:** колонка с NULL значением в базе, Entity использует примитив `boolean` (не принимает NULL).

**Способ устранения:**
```sql
UPDATE users SET email_verified = false WHERE email_verified IS NULL;
```

Альтернатива — использовать обёртку `Boolean` вместо примитива `boolean` в Entity.

### Порт 5000 занят при запуске Spring Boot

**Симптом:** `Web server failed to start. Port 5000 was already in use.`

**Способ устранения:**
```cmd
netstat -ano | findstr :5000
taskkill /F /PID <PID>
```
Чаще всего это Flask MoneyBay (`c:\Moneybay\app.py`) — он тоже слушает 5000. Останови Flask перед запуском Spring Boot.

### Порт 1100 занят при `ng serve`

**Симптом:** `Port 1100 is already in use. Would you like to use a different port? (Y/n)`

**Причина:** Angular dev server уже запущен.

**Способ устранения:** не запускать второй экземпляр, открыть существующий http://localhost:1100. Если процесс завис:
```cmd
netstat -ano | findstr :1100
taskkill /F /PID <PID>
```

### Запуск площадки локально

Нужны два процесса одновременно в разных терминалах:

**Терминал 1 — Spring Boot (бэкенд):**
```cmd
cd c:\moneybayts\backend
.\mvnw spring-boot:run
```
Слушает порт **5000**, отдаёт API (`/api/categories`, `/api/listings`, ...).

**Терминал 2 — Angular (фронтенд):**
```cmd
cd c:\moneybayts
ng serve
```
Слушает порт **1100**, открыть в браузере http://localhost:1100.

Без Spring Boot фронтенд показывает только hero section и "No listings found" — запросы к `localhost:5000/api/*` получают connection refused.

### Spring Boot не подхватывает изменения Java кода

**Причина:** DevTools watching `target/classes` — нужна перекомпиляция через IDE auto-build.

**Способ устранения:**
- IntelliJ IDEA: Settings → Build → "Build project automatically"
- VS Code (Java extension): включён по умолчанию
- Eclipse: Project → "Build Automatically"

Альтернатива — ручная перекомпиляция: `./mvnw compile` (DevTools подхватит изменения classpath).

### Новый файл в `src/assets/` не отдаётся `ng serve`

**Причина:** `ng serve` сканирует assets-папки только при старте.

**Способ устранения:** перезапустить `ng serve` после добавления новой папки. После рестарта файлы внутри подхватываются автоматически.

### Similar product при клике не открывается

**Причина:** Angular Router переиспользует `ListingDetailComponent` при навигации `/listing/X` → `/listing/Y`. `ngOnInit()` запускается только при создании компонента.

**Устранено:** используется `route.paramMap.subscribe()` вместо `route.snapshot.paramMap` для реактивной подписки на изменения параметра.
