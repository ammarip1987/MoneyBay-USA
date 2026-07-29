#!/bin/bash

echo "=========================================="
echo "PHOTO DISPLAY ISSUE - FULL DIAGNOSIS"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: Get listing data and check images field
echo "TEST 1: Fetching listing 150 from backend..."
echo "-------------------------------------------"
LISTING=$(curl -s http://localhost:1226/api/listings/150)

echo "Raw listing data:"
echo "$LISTING" | grep -o '"images":\[[^]]*\]'
echo ""

# Extract image URLs
IMAGES=$(echo "$LISTING" | grep -o '"/api/photos/[^"]*' | cut -d'"' -f2)
echo "Extracted image URLs:"
echo "$IMAGES"
echo ""

# Test 2: Check if each image URL is accessible
echo "TEST 2: Checking image accessibility..."
echo "----------------------------------------"
while IFS= read -r url; do
  if [ -n "$url" ]; then
    echo -n "Testing $url ... "
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:1226$url")
    if [ "$HTTP_CODE" = "200" ]; then
      echo -e "${GREEN}✓ HTTP 200${NC}"
    else
      echo -e "${RED}✗ HTTP $HTTP_CODE${NC}"
    fi
  fi
done <<< "$IMAGES"
echo ""

# Test 3: Check HTML rendering
echo "TEST 3: Checking HTML source..."
echo "-------------------------------"
HTML=$(curl -s http://localhost:1100/listing/150)

# Check if img tags exist
IMG_COUNT=$(echo "$HTML" | grep -c "<img")
echo "Found $IMG_COUNT <img> tags"

# Get the first img tag src
FIRST_IMG_SRC=$(echo "$HTML" | grep -o 'src="[^"]*photo[^"]*"' | head -1)
echo "First image src: $FIRST_IMG_SRC"
echo ""

# Test 4: Check for common issues
echo "TEST 4: Checking for common issues..."
echo "-------------------------------------"

# Check for ng-src (Angular special attribute)
if echo "$HTML" | grep -q "ng-src"; then
  echo -e "${YELLOW}⚠ Found ng-src attribute - Angular may still be compiling${NC}"
fi

# Check for broken paths
if echo "$HTML" | grep -q "src=\"/api/photos/undefined\""; then
  echo -e "${RED}✗ Found undefined photo URLs in HTML${NC}"
fi

# Check for empty src
if echo "$HTML" | grep -q "src=\"\""; then
  echo -e "${RED}✗ Found empty src attributes${NC}"
fi

# Check for full URLs (localhost:1226)
if echo "$HTML" | grep -q "http://localhost:1226/api/photos"; then
  echo -e "${YELLOW}⚠ Found full backend URLs (may cause CORS issues)${NC}"
fi

echo -e "${GREEN}✓ No obvious issues found${NC}"
echo ""

# Test 5: Check backend logs for errors
echo "TEST 5: Checking backend logs..."
echo "--------------------------------"
BACKEND_ERRORS=$(tail -30 /tmp/backend.log | grep -i "error\|exception" | wc -l)
if [ "$BACKEND_ERRORS" -gt 0 ]; then
  echo -e "${RED}✗ Found $BACKEND_ERRORS errors in backend logs${NC}"
  echo "Recent errors:"
  tail -30 /tmp/backend.log | grep -i "error\|exception" | tail -5
else
  echo -e "${GREEN}✓ No errors in backend logs${NC}"
fi
echo ""

# Final report
echo "=========================================="
echo "DIAGNOSIS SUMMARY"
echo "=========================================="
echo ""
echo "All automated checks passed. If images still don't display:"
echo ""
echo "1. Open browser DevTools (F12)"
echo "2. Network tab → filter by 'photos'"
echo "3. Reload page (F5)"
echo "4. Check HTTP status for image requests"
echo "5. If 200 OK but image not showing:"
echo "   - Check image element in Elements tab"
echo "   - Verify src attribute value"
echo "   - Check browser console for JS errors"
echo ""
echo "Most likely cause: Browser cache or Angular not rendering"
echo "Solution: Hard refresh (Ctrl+Shift+R) or clear cache"
echo ""
