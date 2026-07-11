const sharp = require('sharp');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

async function main() {
  const W = 1024, H = 500;
  const iconSize = 380;

  const iconBuf = await sharp(path.join(ASSETS, 'android-icon-foreground.png'))
    .resize(iconSize, iconSize)
    .png()
    .toBuffer();

  const textSvg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <text x="620" y="230" font-family="Georgia, 'Times New Roman', serif" font-size="84" font-weight="bold" fill="#F4E7C1" text-anchor="middle">Solah Saar</text>
      <text x="620" y="285" font-family="Arial, sans-serif" font-size="30" fill="#CFE8CF" text-anchor="middle">Sholo Gutti &#8226; Bead 16 &#8226; Sixteen Soldiers</text>
    </svg>
  `;

  await sharp({
    create: { width: W, height: H, channels: 4, background: '#1B2A1E' },
  })
    .composite([
      { input: iconBuf, left: 60, top: Math.round((H - iconSize) / 2) },
      { input: Buffer.from(textSvg), left: 0, top: 0 },
    ])
    .png()
    .toFile(path.join(ASSETS, 'feature-graphic.png'));

  console.log('Feature graphic generated at assets/feature-graphic.png');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
