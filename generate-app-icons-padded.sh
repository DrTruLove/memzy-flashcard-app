#!/bin/bash

# Generate app icons with padding from memzy-logo.png for iOS and Android
# This script requires ImageMagick (install with: brew install imagemagick)

SOURCE_IMAGE="public/memzy-logo.png"

if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "Error: Source image $SOURCE_IMAGE not found!"
    exit 1
fi

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
    echo "ImageMagick is not installed. Installing..."
    brew install imagemagick
fi

# Use 'magick' if available, otherwise fallback to 'convert'
if command -v magick &> /dev/null; then
    CMD="magick"
else
    CMD="convert"
fi

echo "Generating Android app icons with padding..."

# Function to generate icon with padding (75% of target size for better visibility)
generate_icon_with_padding() {
    local input=$1
    local output=$2
    local size=$3
    
    # Calculate the logo size (75% of target for safe padding)
    local logo_size=$(echo "$size * 0.75" | bc | cut -d'.' -f1)
    
    # Create icon with transparent background and centered logo
    $CMD "$input" -resize ${logo_size}x${logo_size} \
            -background none -gravity center \
            -extent ${size}x${size} \
            "$output"
}

# Android mipmap-hdpi (72x72)
generate_icon_with_padding "$SOURCE_IMAGE" android/app/src/main/res/mipmap-hdpi/ic_launcher.png 72
generate_icon_with_padding "$SOURCE_IMAGE" android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png 72
generate_icon_with_padding "$SOURCE_IMAGE" android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png 162

# Android mipmap-mdpi (48x48)
generate_icon_with_padding "$SOURCE_IMAGE" android/app/src/main/res/mipmap-mdpi/ic_launcher.png 48
generate_icon_with_padding "$SOURCE_IMAGE" android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png 48
generate_icon_with_padding "$SOURCE_IMAGE" android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png 108

# Android mipmap-xhdpi (96x96)
generate_icon_with_padding "$SOURCE_IMAGE" android/app/src/main/res/mipmap-xhdpi/ic_launcher.png 96
generate_icon_with_padding "$SOURCE_IMAGE" android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png 96
generate_icon_with_padding "$SOURCE_IMAGE" android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png 216

# Android mipmap-xxhdpi (144x144)
generate_icon_with_padding "$SOURCE_IMAGE" android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png 144
generate_icon_with_padding "$SOURCE_IMAGE" android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png 144
generate_icon_with_padding "$SOURCE_IMAGE" android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png 324

# Android mipmap-xxxhdpi (192x192)
generate_icon_with_padding "$SOURCE_IMAGE" android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png 192
generate_icon_with_padding "$SOURCE_IMAGE" android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png 192
generate_icon_with_padding "$SOURCE_IMAGE" android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png 486

echo "Generating iOS app icons with padding..."

IOS_ICON_DIR="ios/App/App/Assets.xcassets/AppIcon.appiconset"

# iOS App Icon sizes (all required sizes for iOS)
generate_icon_with_padding "$SOURCE_IMAGE" "$IOS_ICON_DIR/20.png" 20
generate_icon_with_padding "$SOURCE_IMAGE" "$IOS_ICON_DIR/40.png" 40
generate_icon_with_padding "$SOURCE_IMAGE" "$IOS_ICON_DIR/60.png" 60
generate_icon_with_padding "$SOURCE_IMAGE" "$IOS_ICON_DIR/58.png" 58
generate_icon_with_padding "$SOURCE_IMAGE" "$IOS_ICON_DIR/80.png" 80
generate_icon_with_padding "$SOURCE_IMAGE" "$IOS_ICON_DIR/87.png" 87
generate_icon_with_padding "$SOURCE_IMAGE" "$IOS_ICON_DIR/120.png" 120
generate_icon_with_padding "$SOURCE_IMAGE" "$IOS_ICON_DIR/180.png" 180
generate_icon_with_padding "$SOURCE_IMAGE" "$IOS_ICON_DIR/1024.png" 1024

# Additional iOS sizes
generate_icon_with_padding "$SOURCE_IMAGE" "$IOS_ICON_DIR/29.png" 29
generate_icon_with_padding "$SOURCE_IMAGE" "$IOS_ICON_DIR/76.png" 76
generate_icon_with_padding "$SOURCE_IMAGE" "$IOS_ICON_DIR/152.png" 152
generate_icon_with_padding "$SOURCE_IMAGE" "$IOS_ICON_DIR/167.png" 167

echo "✅ All app icons have been generated with padding to prevent cutoff!"
echo "Run 'npx cap sync' to apply the changes to your native projects."
