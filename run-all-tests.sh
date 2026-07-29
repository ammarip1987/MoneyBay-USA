#!/bin/bash

echo "=========================================="
echo "MONEYBAY PHOTO UPLOAD & DISPLAY TESTS"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Backend connectivity
echo "TEST 1: Backend Connectivity"
echo "----------------------------"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:1226/api/categories)
if [ "$BACKEND_STATUS" = "200" ]; then
  echo -e "${GREEN}✓ Backend is running (HTTP $BACKEND_STATUS)${NC}"
else
  echo -e "${RED}✗ Backend is NOT running (HTTP $BACKEND_STATUS)${NC}"
  exit 1
fi
echo ""

# Test 2: Frontend connectivity
echo "TEST 2: Frontend Connectivity"
echo "-----------------------------"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:1100)
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo -e "${GREEN}✓ Frontend is running (HTTP $FRONTEND_STATUS)${NC}"
else
  echo -e "${RED}✗ Frontend is NOT running (HTTP $FRONTEND_STATUS)${NC}"
  exit 1
fi
echo ""

# Test 3: R2 photo upload
echo "TEST 3: R2 Photo Upload"
echo "----------------------"
echo "Creating test listing with photo..."

# Create test image
TEST_IMAGE="/tmp/test-upload.png"
echo -ne '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18r\xc3\x00\x00\x00\x00IEND\xaeB`\x82' > $TEST_IMAGE

# Login
LOGIN=$(curl -s -X POST http://localhost:1226/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser2@example.com","password":"password123"}')
TOKEN=$(echo $LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ Failed to login${NC}"
  exit 1
fi

# Create listing with photo
RESPONSE=$(curl -s -X POST http://localhost:1226/api/listings \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Test Photo" \
  -F "description=Test" \
  -F "price=50" \
  -F "location=Test" \
  -F "category_id=1" \
  -F "images=@$TEST_IMAGE")

LISTING_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
PHOTO_URL=$(echo $RESPONSE | grep -o '"/api/photos/[^"]*' | cut -d'"' -f2)

if [ -n "$LISTING_ID" ] && [ -n "$PHOTO_URL" ]; then
  echo -e "${GREEN}✓ Listing created (ID: $LISTING_ID)${NC}"
  echo -e "${GREEN}✓ Photo uploaded to R2 (URL: $PHOTO_URL)${NC}"
else
  echo -e "${RED}✗ Failed to create listing with photo${NC}"
  exit 1
fi
echo ""

# Test 4: Photo accessibility via API
echo "TEST 4: Photo Accessibility"
echo "----------------------------"
PHOTO_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:1226$PHOTO_URL)
if [ "$PHOTO_STATUS" = "200" ]; then
  echo -e "${GREEN}✓ Photo accessible via API (HTTP $PHOTO_STATUS)${NC}"
else
  echo -e "${RED}✗ Photo NOT accessible (HTTP $PHOTO_STATUS)${NC}"
  exit 1
fi
echo ""

# Test 5: Photo in database
echo "TEST 5: Photo in Database"
echo "-------------------------"
LISTING_DATA=$(curl -s http://localhost:1226/api/listings/$LISTING_ID)
if echo $LISTING_DATA | grep -q "api/photos"; then
  echo -e "${GREEN}✓ Photo found in database${NC}"
  echo "  Images: $(echo $LISTING_DATA | grep -o '"images":\[[^]]*\]')"
else
  echo -e "${RED}✗ Photo NOT found in database${NC}"
  exit 1
fi
echo ""

# Test 6: Security config
echo "TEST 6: Security Configuration"
echo "------------------------------"
SECURITY_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:1226/api/photos/test.jpg)
if [ "$SECURITY_TEST" = "404" ] || [ "$SECURITY_TEST" = "200" ]; then
  echo -e "${GREEN}✓ /api/photos/** endpoint is publicly accessible${NC}"
else
  echo -e "${RED}✗ /api/photos/** endpoint has security issues (HTTP $SECURITY_TEST)${NC}"
fi
echo ""

# Test 7: Frontend can access photo
echo "TEST 7: Frontend Photo Display"
echo "------------------------------"
echo "Opening listing in browser..."
echo "URL: http://localhost:1100/listing/$LISTING_ID"
echo -e "${GREEN}✓ Check browser for photo display${NC}"
echo ""

echo "=========================================="
echo "ALL TESTS COMPLETED"
echo "=========================================="
echo ""
echo "Summary:"
echo "  Backend: Running on localhost:1226"
echo "  Frontend: Running on localhost:1100"
echo "  Test Listing ID: $LISTING_ID"
echo "  Test Photo URL: $PHOTO_URL"
echo ""
echo "Next steps:"
echo "  1. Open http://localhost:1100/listing/$LISTING_ID in browser"
echo "  2. Check if photo displays"
echo "  3. Open DevTools (F12) → Network tab"
echo "  4. Reload page and check if photo request succeeds"
