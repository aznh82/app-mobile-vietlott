const sharp = require('sharp');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');
const BG_COLOR = '#111a24';
const ACCENT = '#e8722a';

// SVG template for icon with "6/45" text
function createIconSvg(size) {
  const fontSize = Math.round(size * 0.33);
  const cx = Math.round(size / 2);
  const cy = Math.round(size / 2);

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="${ACCENT}" rx="${Math.round(size * 0.18)}"/>
    <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
      font-family="Arial,Helvetica,sans-serif" font-weight="900" font-size="${fontSize}" fill="#ffffff">
      6/45
    </text>
  </svg>`;
}

// Foreground SVG for adaptive icon (transparent bg, just the content)
function createForegroundSvg(size) {
  const fontSize = Math.round(size * 0.26);
  const cx = Math.round(size / 2);
  const cy = Math.round(size / 2);

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
      font-family="Arial,Helvetica,sans-serif" font-weight="900" font-size="${fontSize}" fill="#ffffff">
      6/45
    </text>
  </svg>`;
}

// Monochrome SVG (white on transparent)
function createMonochromeSvg(size) {
  const fontSize = Math.round(size * 0.22);
  const ballR = Math.round(size * 0.23);
  const cx = Math.round(size / 2);
  const cy = Math.round(size * 0.45);
  const textY = Math.round(size * 0.5);

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${cx}" cy="${cy}" r="${ballR}" fill="#ffffff"/>
    <text x="${cx}" y="${textY}" text-anchor="middle" dominant-baseline="central"
      font-family="Arial,Helvetica,sans-serif" font-weight="900" font-size="${fontSize}" fill="#000000">
      6/45
    </text>
  </svg>`;
}

async function generate() {
  // Main icon (1024x1024)
  await sharp(Buffer.from(createIconSvg(1024)))
    .png()
    .toFile(path.join(ASSETS, 'icon.png'));
  console.log('icon.png');

  // Favicon (48x48)
  await sharp(Buffer.from(createIconSvg(48)))
    .png()
    .toFile(path.join(ASSETS, 'favicon.png'));
  console.log('favicon.png');

  // Splash icon (200x200)
  await sharp(Buffer.from(createIconSvg(200)))
    .png()
    .toFile(path.join(ASSETS, 'splash-icon.png'));
  console.log('splash-icon.png');

  // Android adaptive icon - foreground (1024x1024)
  await sharp(Buffer.from(createForegroundSvg(1024)))
    .png()
    .toFile(path.join(ASSETS, 'android-icon-foreground.png'));
  console.log('android-icon-foreground.png');

  // Android adaptive icon - background (1024x1024 solid color)
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: ACCENT }
  })
    .png()
    .toFile(path.join(ASSETS, 'android-icon-background.png'));
  console.log('android-icon-background.png');

  // Android monochrome (1024x1024)
  await sharp(Buffer.from(createMonochromeSvg(1024)))
    .png()
    .toFile(path.join(ASSETS, 'android-icon-monochrome.png'));
  console.log('android-icon-monochrome.png');

  console.log('All icons generated!');
}

generate().catch(console.error);
