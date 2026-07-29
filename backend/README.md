# MoneyBay Backend (Spring Boot)

REST API for MoneyBay marketplace.

## Stack

- Java 25
- Spring Boot 3.5
- Spring Security + JWT
- Spring Data JPA + Hibernate
- PostgreSQL
- Maven
- Stripe Java SDK
- Springdoc OpenAPI

## Quick Start

### Requirements
- JDK 25
- PostgreSQL 14+ on localhost:5432

### Database Setup
```sql
CREATE DATABASE moneybay;
CREATE USER moneybay_app WITH PASSWORD 'moneybay123';
GRANT ALL PRIVILEGES ON DATABASE moneybay TO moneybay_app;
```

### Run
```bash
./mvnw spring-boot:run
```

API starts on http://localhost:5000

First run seeds 12 categories and 53 cities automatically.

### Build JAR
```bash
./mvnw clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

## API Documentation

Swagger UI: http://localhost:5000/swagger-ui.html
OpenAPI JSON: http://localhost:5000/v3/api-docs

## Endpoints Summary

### Public
- `POST /api/auth/register` — Sign up
- `POST /api/auth/login` — Log in
- `POST /api/auth/forgot-password` — Request reset
- `POST /api/auth/reset-password` — Set new password
- `GET /api/listings` — Search listings
- `GET /api/listings/{id}` — Single listing
- `GET /api/categories` — All categories
- `GET /api/subcategories/category/{slug}` — Subcategories
- `GET /api/cities` — All cities
- `GET /api/uploads/{filename}` — Serve uploaded file
- `GET /sitemap.xml` — Sitemap
- `GET /robots.txt` — Robots
- `GET /actuator/health` — Health check

### Authenticated
- `POST /api/listings` — Create (multipart with images)
- `PUT /api/listings/{id}` — Update
- `DELETE /api/listings/{id}` — Delete own
- `POST /api/uploads` — Upload images
- `GET /api/profile` / `PUT /api/profile`
- `GET /api/my-listings`
- `GET /api/conversations`
- `GET /api/chats/{userId}/messages` / `POST` to send
- `GET /api/unread-messages-count`
- `GET /api/favorites`
- `POST /listing/{id}/like` — Toggle favorite
- `POST /api/boost/checkout` — Stripe checkout
- WebSocket `/ws` — Real-time chat

### Admin only
- `GET /api/admin/users`
- `POST /api/admin/users/{id}/toggle-admin`
- `DELETE /api/admin/users/{id}`
- `GET /api/admin/listings`
- `POST /api/admin/listings/{id}/toggle-active`
- `DELETE /api/admin/listings/{id}`
- `GET /api/admin/stats`

## Configuration

`application.properties` (dev):
- Database: `localhost:5432/moneybay`
- Port: 5000
- JWT expiration: 24 hours
- CORS: localhost:1100, localhost:4200

`application-prod.properties` (uses env vars):
- `DATABASE_URL`
- `DB_USERNAME` / `DB_PASSWORD`
- `JWT_SECRET` (required)
- `ALLOWED_ORIGINS`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `FRONTEND_URL`

Activate prod profile:
```bash
java -jar app.jar --spring.profiles.active=prod
```

## Docker

```bash
docker build -t moneybay-backend .
docker run -p 5000:8080 -e JWT_SECRET=secret moneybay-backend
```

## Deploy to Cloud Run

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/moneybay-backend
gcloud run deploy moneybay-backend \
  --image gcr.io/PROJECT_ID/moneybay-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars SPRING_PROFILES_ACTIVE=prod \
  --set-env-vars JWT_SECRET=YOUR_SECRET
```
