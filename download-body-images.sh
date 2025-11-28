#!/bin/bash

# Download body part images from Lorem Picsum (random photos) with specific IDs
# These are placeholder images - you should replace with actual body part photos

cd "$(dirname "$0")/public"

echo "Downloading placeholder body part images..."

# Using Lorem Picsum with specific seed values for consistency
curl -L "https://picsum.photos/seed/mouth123/400/400" -o human-mouth.jpg
curl -L "https://picsum.photos/seed/ear456/400/400" -o human-ear.jpg  
curl -L "https://picsum.photos/seed/hand789/400/400" -o human-hand.jpg
curl -L "https://picsum.photos/seed/foot012/400/400" -o human-foot.jpg
curl -L "https://picsum.photos/seed/arm345/400/400" -o human-arm.jpg
curl -L "https://picsum.photos/seed/leg678/400/400" -o human-leg.jpg
curl -L "https://picsum.photos/seed/finger901/400/400" -o human-finger.jpg
curl -L "https://picsum.photos/seed/toe234/400/400" -o human-toe.jpg
curl -L "https://picsum.photos/seed/hair567/400/400" -o human-hair.jpg
curl -L "https://picsum.photos/seed/teeth890/400/400" -o human-teeth.jpg
curl -L "https://picsum.photos/seed/tongue123/400/400" -o human-tongue.jpg
curl -L "https://picsum.photos/seed/neck456/400/400" -o human-neck.jpg

echo ""
echo "✓ Done! Placeholder images downloaded."
echo ""
echo "NOTE: These are random placeholder images."
echo "For accurate body part images, please:"
echo "1. Visit https://www.pexels.com or https://pixabay.com"
echo "2. Search for 'human mouth', 'human ear', 'human hand', etc."
echo "3. Download free images and save as human-mouth.jpg, human-ear.jpg, etc."
echo "4. Replace the files in the public/ folder"
