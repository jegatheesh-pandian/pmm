const sharp = require('sharp');
const path = require('path');

// Android adaptive icon specs:
// - Full image: 1024x1024
// - Safe zone (inner 66%): ~676x676 centered
// - Content should fit within safe zone with padding

const SIZE = 1024;
const SAFE_ZONE_SIZE = Math.round(SIZE * 0.62); // 62% to fit in safe zone
const PADDING = Math.round((SIZE - SAFE_ZONE_SIZE) / 2);

async function generateIcons() {
  const iconsDir = path.join(__dirname, '..', 'src', 'assets', 'icons');
  const originalLogo = path.join(iconsDir, 'original-logo.png');

  // Use user's original logo and resize for icon.png (full size)
  await sharp(originalLogo)
    .resize(SIZE, SIZE, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 255 } })
    .png()
    .toFile(path.join(iconsDir, 'icon.png'));

  console.log('Generated icon.png (1024x1024)');

  // For adaptive icon: resize logo smaller to fit safe zone, center on white background
  const logoResized = await sharp(originalLogo)
    .resize(SAFE_ZONE_SIZE, SAFE_ZONE_SIZE, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 255 } })
    .toBuffer();

  // Create adaptive icon with logo centered in safe zone
  await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 255 } // White background
    }
  })
    .composite([{
      input: logoResized,
      left: PADDING,
      top: PADDING
    }])
    .png()
    .toFile(path.join(iconsDir, 'adaptive-icon.png'));

  console.log('Generated adaptive-icon.png (1024x1024, logo in safe zone)');

  console.log('\nDone! Now rebuild the app: cd android && ./gradlew assembleRelease');
}

generateIcons().catch(console.error);
