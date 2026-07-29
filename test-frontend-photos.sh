#!/bin/bash

echo "=========================================="
echo "FRONTEND PHOTO DISPLAY TESTS"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test listing with photo
LISTING_ID=150
LISTING_URL="http://localhost:1100/listing/$LISTING_ID"

echo "TEST 1: Fetch listing page HTML"
echo "--------------------------------"
HTML=$(curl -s "$LISTING_URL")

if [ -z "$HTML" ]; then
  echo -e "${RED}✗ Failed to fetch page${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Page fetched successfully${NC}"
echo ""

# Test 2: Check if img tag exists
echo "TEST 2: Check if <img> tag exists"
echo "----------------------------------"
if echo "$HTML" | grep -q "<img"; then
  echo -e "${GREEN}✓ <img> tag found in HTML${NC}"
else
  echo -e "${RED}✗ <img> tag NOT found in HTML${NC}"
fi
echo ""

# Test 3: Check for API photo URL in HTML
echo "TEST 3: Check for /api/photos/ URL"
echo "-----------------------------------"
if echo "$HTML" | grep -q "/api/photos/"; then
  PHOTO_URLS=$(echo "$HTML" | grep -o '/api/photos/[a-zA-Z0-9\-\.]*' | head -5)
  echo -e "${GREEN}✓ Found photo URLs in HTML:${NC}"
  echo "$PHOTO_URLS" | sed 's/^/  /'
else
  echo -e "${RED}✗ No /api/photos/ URLs found in HTML${NC}"
fi
echo ""

# Test 4: Check src attribute format
echo "TEST 4: Check img src attribute"
echo "-------------------------------"
SRC_VALUE=$(echo "$HTML" | grep -o 'src="[^"]*photo[^"]*"' | head -1)
if [ -n "$SRC_VALUE" ]; then
  echo -e "${GREEN}✓ Found src attribute: $SRC_VALUE${NC}"
else
  echo -e "${YELLOW}⚠ No src attribute with 'photo' found${NC}"
fi
echo ""

# Test 5: Check Angular component rendering
echo "TEST 5: Check Angular components"
echo "--------------------------------"
if echo "$HTML" | grep -q "ng-reflect\|app-listing"; then
  echo -e "${GREEN}✓ Angular components detected${NC}"
else
  echo -e "${YELLOW}⚠ Angular components not found (page may be loading)${NC}"
fi
echo ""

# Test 6: Check for error messages
echo "TEST 6: Check for error messages"
echo "--------------------------------"
if echo "$HTML" | grep -q "404\|error\|Error"; then
  echo -e "${RED}✗ Error message detected in HTML${NC}"
  echo "$HTML" | grep -i "error\|404" | head -3
else
  echo -e "${GREEN}✓ No error messages${NC}"
fi
echo ""

# Test 7: Direct photo URL test
echo "TEST 7: Test direct photo URL access"
echo "------------------------------------"
PHOTO_RESPONSE=$(curl -s -w "\n%{http_code}" "http://localhost:1226/api/photos/51a3bf6a-8417-4a16-929d-4beb8d66fcd8.png")
HTTP_CODE=$(echo "$PHOTO_RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Photo URL accessible (HTTP $HTTP_CODE)${NC}"
else
  echo -e "${RED}✗ Photo URL NOT accessible (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 8: Check CORS headers
echo "TEST 8: Check CORS headers"
echo "--------------------------"
CORS_HEADERS=$(curl -s -I "http://localhost:1226/api/photos/51a3bf6a-8417-4a16-929d-4beb8d66fcd8.png" | grep -i "access-control\|content-type")
if [ -n "$CORS_HEADERS" ]; then
  echo -e "${GREEN}✓ CORS headers present:${NC}"
  echo "$CORS_HEADERS" | sed 's/^/  /'
else
  echo -e "${YELLOW}⚠ No CORS headers detected${NC}"
fi
echo ""

# Test 9: Check if Angular is running in dev mode
echo "TEST 9: Check Angular dev server"
echo "--------------------------------"
ANGULAR_CHECK=$(curl -s "http://localhost:1100" | grep -i "angular\|ng-")
if [ -n "$ANGULAR_CHECK" ]; then
  echo -e "${GREEN}✓ Angular is running${NC}"
else
  echo -e "${RED}✗ Angular may not be running${NC}"
fi
echo ""

echo "=========================================="
echo "FRONTEND TESTS COMPLETED"
echo "=========================================="
echo ""
echo "DIAGNOSTIC CHECKLIST:"
echo "  1. Open http://localhost:1100/listing/$LISTING_ID in browser"
echo "  2. Press F12 to open DevTools"
echo "  3. Go to Network tab"
echo "  4. Reload page (F5)"
echo "  5. Look for requests to /api/photos/"
echo "  6. Check the response - should be image data"
echo "  7. Check Console tab for any JavaScript errors"
echo ""
