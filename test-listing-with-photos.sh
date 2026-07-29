#!/bin/bash

# Тестирование загрузки фото в объявления

echo "=== Test: Create listing with photo ==="

# 1. Логин
echo "1. Логин..."
LOGIN=$(curl -s -X POST http://localhost:1226/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser2@example.com","password":"password123"}')

TOKEN=$(echo $LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token: ${TOKEN:0:30}..."

if [ -z "$TOKEN" ]; then
  echo "❌ Логин не удался"
  exit 1
fi

# 2. Создать простое тестовое изображение (1x1 pixel PNG)
echo "2. Создание тестового изображения..."
TEST_IMAGE="/tmp/test-photo.png"
echo -ne '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18r\xc3\x00\x00\x00\x00IEND\xaeB`\x82' > $TEST_IMAGE
echo "✓ Изображение создано"

# 3. Создать объявление с фото
echo "3. Создание объявления с фото..."
RESPONSE=$(curl -s -X POST http://localhost:1226/api/listings \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Test Photo Upload" \
  -F "description=Testing photo upload functionality" \
  -F "price=100" \
  -F "location=Test City" \
  -F "category_id=1" \
  -F "images=@$TEST_IMAGE")

echo "Response: $RESPONSE"

# 4. Извлечь ID объявления и URL фото
LISTING_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)
PHOTO_URL=$(echo $RESPONSE | grep -o '"/api/photos/[^"]*' | cut -d'"' -f2)

echo ""
echo "=== Результаты ==="
echo "Listing ID: $LISTING_ID"
echo "Photo URL: $PHOTO_URL"

if [ -z "$LISTING_ID" ]; then
  echo "❌ Объявление не создалось"
  exit 1
fi

# 5. Проверить доступность фото через API
echo ""
echo "4. Проверка доступности фото..."
if [ -n "$PHOTO_URL" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:1226$PHOTO_URL)
  echo "HTTP Status: $HTTP_CODE"

  if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Фото доступно через API"
  else
    echo "❌ Фото не доступно (HTTP $HTTP_CODE)"
  fi
else
  echo "❌ Photo URL не найден в ответе"
fi

# 6. Получить объявление и проверить есть ли фото в БД
echo ""
echo "5. Проверка объявления в БД..."
LISTING=$(curl -s http://localhost:1226/api/listings/$LISTING_ID)
echo "Listing data: $LISTING"

IMAGES=$(echo $LISTING | grep -o '"images":\[[^]]*\]')
if [ -n "$IMAGES" ]; then
  echo "✓ Images found: $IMAGES"
else
  echo "❌ Images not found in listing"
fi

echo ""
echo "=== Тест завершен ==="
