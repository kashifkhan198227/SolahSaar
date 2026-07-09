const sharp = require('sharp');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

const FULL_SVG = path.join(__dirname, 'icon-source.svg');
const FOREGROUND_SVG = path.join(__dirname, 'icon-foreground-source.svg');
const MONOCHROME_SVG = path.join(__dirname, 'icon-monochrome-source.svg');

async function main() {
  // Main app icon (iOS + fallback) — full design with background and border.
  await sharp(FULL_SVG).resize(1024, 1024).png().toFile(path.join(ASSETS, 'icon.png'));

  // Android adaptive icon: foreground (transparent) + solid background color.
  await sharp(FOREGROUND_SVG).resize(1024, 1024).png().toFile(path.join(ASSETS, 'android-icon-foreground.png'));
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: '#1B2A1E' },
  }).png().toFile(path.join(ASSETS, 'android-icon-background.png'));

  // Android 13+ themed monochrome icon: solid-white shape, shape carried
  // entirely by the alpha channel — the OS applies its own tint color.
  await sharp(MONOCHROME_SVG).resize(1024, 1024).png().toFile(path.join(ASSETS, 'android-icon-monochrome.png'));

  // Splash: foreground artwork, transparent background, shown over
  // app.json's splash backgroundColor.
  await sharp(FOREGROUND_SVG).resize(1024, 1024).png().toFile(path.join(ASSETS, 'splash-icon.png'));

  // Web favicon.
  await sharp(FULL_SVG).resize(48, 48).png().toFile(path.join(ASSETS, 'favicon.png'));

  console.log('Icons generated in assets/');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
