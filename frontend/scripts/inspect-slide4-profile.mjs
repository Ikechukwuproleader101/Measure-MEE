import sharp from 'sharp';
import fs from 'fs';

async function run() {
  const file = './App images/Modern Gen-Z Tailor Onboarding.png';
  const img = sharp(file);
  const meta = await img.metadata();
  const raw = await img.raw().toBuffer();
  const { width, height } = meta;

  // Check internal phone area: x from 120 to 904
  // Let's inspect y from 100 to 1100
  const profile = [];
  for (let y = 100; y < 1100; y += 10) {
    let nonBgCount = 0;
    let minX = width;
    let maxX = 0;
    for (let x = 120; x < width - 120; x++) {
      const idx = (y * width + x) * meta.channels;
      const r = raw[idx];
      const g = raw[idx + 1];
      const b = raw[idx + 2];
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const diff = maxC - minC;
      // Background inside the screen is #FFFFFF or near white rgb(250+, 250+, 250+)
      const isBg = (r > 248 && g > 248 && b > 248) || (r > 240 && g > 240 && b > 240 && diff < 5);
      if (!isBg) {
        nonBgCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
    if (nonBgCount > 0) {
      profile.push(`y=${y}: count=${nonBgCount}, x=[${minX}, ${maxX}]`);
    }
  }

  fs.writeFileSync('./scripts/slide4-illustration-profile.txt', profile.join('\n'));
}

run();
