import sharp from 'sharp';
import fs from 'fs';

async function scanSlide1() {
  const img = sharp('./App images/Tailoring Made Easy Onboarding 1.png');
  const { width, height } = await img.metadata();
  const raw = await img.raw().toBuffer();

  const lines = [];
  // Find where the card and airplane actually are:
  // Card is on the right side: x > 600
  // Airplane is on the left: x < 350
  for (let y = 140; y < 350; y += 10) {
    let cardPixels = 0, planePixels = 0;
    for (let x = 600; x < 900; x++) {
      const idx = (y * width + x) * 4;
      const r = raw[idx], g = raw[idx+1], b = raw[idx+2];
      // Purple colors or borders
      if (b > r + 15 && b > 140) cardPixels++;
    }
    for (let x = 200; x < 350; x++) {
      const idx = (y * width + x) * 4;
      const r = raw[idx], g = raw[idx+1], b = raw[idx+2];
      if (b > r + 15 && b > 140) planePixels++;
    }
    lines.push(`y=${y}: cardPurple=${cardPixels}, planePurple=${planePixels}`);
  }

  fs.writeFileSync('./scripts/slide1-objects.txt', lines.join('\n'));
}

scanSlide1().catch(e => fs.writeFileSync('./scripts/slide1-objects.txt', e.stack));
