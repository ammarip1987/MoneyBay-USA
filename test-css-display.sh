#!/bin/bash

echo "=========================================="
echo "CSS & DOM VISIBILITY TESTS"
echo "=========================================="
echo ""

LISTING_URL="http://localhost:1100/listing/150"

# Fetch and analyze CSS
echo "Analyzing image element styling..."
HTML=$(curl -s "$LISTING_URL")

# Check for display: none
if echo "$HTML" | grep -q "display.*none\|visibility.*hidden"; then
  echo "⚠️  WARNING: Found display:none or visibility:hidden in CSS"
  echo "$HTML" | grep -i "display.*none\|visibility.*hidden" | head -3
fi

# Check image dimensions
if echo "$HTML" | grep -q "width.*0\|height.*0"; then
  echo "⚠️  WARNING: Found zero width/height"
fi

echo ""
echo "NEXT STEPS:"
echo "1. Open DevTools (F12)"
echo "2. Elements tab → find <img> tag with /api/photos/"
echo "3. Check computed styles - should show:"
echo "   - display: block (or inline-block)"
echo "   - width: should be > 0"
echo "   - height: should be > 0"
echo "   - visibility: visible"
echo "4. Check if image loads in Network tab"
echo ""
echo "If image is hidden:"
echo "   - Clear browser cache (Ctrl+Shift+Delete)"
echo "   - Hard reload (Ctrl+Shift+R)"
echo ""
