#!/bin/bash

# This script opens Pexels search pages for each body part image you need
# It will open 12 browser tabs with the appropriate searches

echo "🔍 Opening Pexels searches for body part images..."
echo ""
echo "Instructions:"
echo "1. Each tab will show search results for a body part"
echo "2. Click on a good photo in each tab"
echo "3. Click 'Free Download' button"
echo "4. Save with the filename shown below"
echo "5. Move all files to: /Users/dawnclarke/Downloads/memzy-flashcard-app/public/"
echo ""
echo "Press Enter to open browser tabs..."
read

open "https://www.pexels.com/search/human%20lips/"
echo "Tab 1: Save as → human-mouth.jpg"
sleep 2

open "https://www.pexels.com/search/human%20ear/"
echo "Tab 2: Save as → human-ear.jpg"
sleep 2

open "https://www.pexels.com/search/open%20hand%20palm/"
echo "Tab 3: Save as → human-hand.jpg"
sleep 2

open "https://www.pexels.com/search/bare%20foot/"
echo "Tab 4: Save as → human-foot.jpg"
sleep 2

open "https://www.pexels.com/search/human%20arm%20bicep/"
echo "Tab 5: Save as → human-arm.jpg"
sleep 2

open "https://www.pexels.com/search/human%20leg/"
echo "Tab 6: Save as → human-leg.jpg"
sleep 2

open "https://www.pexels.com/search/pointing%20finger/"
echo "Tab 7: Save as → human-finger.jpg"
sleep 2

open "https://www.pexels.com/search/human%20toes/"
echo "Tab 8: Save as → human-toe.jpg"
sleep 2

open "https://www.pexels.com/search/human%20hair/"
echo "Tab 9: Save as → human-hair.jpg"
sleep 2

open "https://www.pexels.com/search/white%20teeth%20smile/"
echo "Tab 10: Save as → human-teeth.jpg"
sleep 2

open "https://www.pexels.com/search/human%20tongue/"
echo "Tab 11: Save as → human-tongue.jpg"
sleep 2

open "https://www.pexels.com/search/human%20neck%20profile/"
echo "Tab 12: Save as → human-neck.jpg"

echo ""
echo "✅ All tabs opened!"
echo ""
echo "Next steps:"
echo "1. Download one image from each tab"
echo "2. Rename to the filenames shown above"
echo "3. Move all to: /Users/dawnclarke/Downloads/memzy-flashcard-app/public/"
echo "4. Refresh your browser - the correct images will appear!"
