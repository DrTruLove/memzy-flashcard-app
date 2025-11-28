#!/bin/bash

# Generate app icons from memzy-logo.png for iOS and Android
# This script requires ImageMagick (install with: brew install imagemagick)

SOURCE_IMAGE="public/memzy-logo.png"

if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "Error: Source image $SOURCE_IMAGE not found!"
    exit 1
fi

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is not installed. Installing..."
    brew install imagemagick
fi

echo "Generating Android app icons..."

# Android mipmap-hdpi (72x72)
convert "$SOURCE_IMAGE" -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
convert "$SOURCE_IMAGE" -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
convert "$SOURCE_IMAGE" -resize 162x162 android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png

# Android mipmap-mdpi (48x48)
convert "$SOURCE_IMAGE" -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
convert "$SOURCE_IMAGE" -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
convert "$SOURCE_IMAGE" -resize 108x108 android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png

# Android mipmap-xhdpi (96x96)
convert "$SOURCE_IMAGE" -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
convert "$SOURCE_IMAGE" -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
convert "$SOURCE_IMAGE" -resize 216x216 android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png

# Android mipmap-xxhdpi (144x144)
convert "$SOURCE_IMAGE" -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
convert "$SOURCE_IMAGE" -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
convert "$SOURCE_IMAGE" -resize 324x324 android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png

# Android mipmap-xxxhdpi (192x192)
convert "$SOURCE_IMAGE" -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
convert "$SOURCE_IMAGE" -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png
convert "$SOURCE_IMAGE" -resize 432x432 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png

echo "Android icons generated successfully!"

echo "Generating iOS app icons..."

# iOS App Icon sizes (for Assets.xcassets/AppIcon.appiconset/)
IOS_ICON_DIR="ios/App/App/Assets.xcassets/AppIcon.appiconset"

# iPhone Notification - iOS 7-15 - 20pt
convert "$SOURCE_IMAGE" -resize 40x40 "$IOS_ICON_DIR/40.png"
convert "$SOURCE_IMAGE" -resize 60x60 "$IOS_ICON_DIR/60.png"

# iPhone Settings - iOS 7-15 - 29pt
convert "$SOURCE_IMAGE" -resize 58x58 "$IOS_ICON_DIR/58.png"
convert "$SOURCE_IMAGE" -resize 87x87 "$IOS_ICON_DIR/87.png"

# iPhone Spotlight - iOS 7-15 - 40pt
convert "$SOURCE_IMAGE" -resize 80x80 "$IOS_ICON_DIR/80.png"
convert "$SOURCE_IMAGE" -resize 120x120 "$IOS_ICON_DIR/120.png"

# iPhone App - iOS 7-15 - 60pt
convert "$SOURCE_IMAGE" -resize 180x180 "$IOS_ICON_DIR/180.png"

# iPad Notifications - iOS 7-15 - 20pt
convert "$SOURCE_IMAGE" -resize 20x20 "$IOS_ICON_DIR/20.png"

# iPad Settings - iOS 7-15 - 29pt
convert "$SOURCE_IMAGE" -resize 29x29 "$IOS_ICON_DIR/29.png"

# iPad Spotlight - iOS 7-15 - 40pt
convert "$SOURCE_IMAGE" -resize 40x40 "$IOS_ICON_DIR/40.png"

# iPad App - iOS 7-15 - 76pt
convert "$SOURCE_IMAGE" -resize 76x76 "$IOS_ICON_DIR/76.png"
convert "$SOURCE_IMAGE" -resize 152x152 "$IOS_ICON_DIR/152.png"

# iPad Pro App - iOS 9-15 - 83.5pt
convert "$SOURCE_IMAGE" -resize 167x167 "$IOS_ICON_DIR/167.png"

# App Store
convert "$SOURCE_IMAGE" -resize 1024x1024 "$IOS_ICON_DIR/1024.png"

# Additional common sizes
convert "$SOURCE_IMAGE" -resize 50x50 "$IOS_ICON_DIR/50.png"
convert "$SOURCE_IMAGE" -resize 100x100 "$IOS_ICON_DIR/100.png"
convert "$SOURCE_IMAGE" -resize 114x114 "$IOS_ICON_DIR/114.png"
convert "$SOURCE_IMAGE" -resize 144x144 "$IOS_ICON_DIR/144.png"
convert "$SOURCE_IMAGE" -resize 57x57 "$IOS_ICON_DIR/57.png"
convert "$SOURCE_IMAGE" -resize 72x72 "$IOS_ICON_DIR/72.png"

echo "iOS icons generated successfully!"

echo ""
echo "✅ All app icons have been generated!"
echo ""
echo "Next steps:"
echo "1. For iOS: Open Xcode and verify the icons in Assets.xcassets/AppIcon.appiconset"
echo "2. For Android: The icons are already in place"
echo "3. Rebuild your app with: npx cap sync"
echo "4. Build for iOS: npx cap open ios (then build in Xcode)"
echo "5. Build for Android: npx cap open android (then build in Android Studio)"
