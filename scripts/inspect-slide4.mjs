import sharp from 'sharp';
import fs from 'fs';

async function run() {
  const file = './App images/Modern Gen-Z Tailor Onboarding.png';
  const img = sharp(file);
  const meta = await img.metadata();
  console.log('Slide 4 dimensions:', meta.width, 'x', meta.height);

  const raw = await img.raw().toBuffer();
  const width = meta.width;
  const height = meta.height;

  const lines = [`Dimensions: ${width}x${height}`];

  for (let y = 100; y <= 1200; y += 30) {
    let minX = width, maxX = 0, count = 0;
    for (let x = 60; x < width - 60; x++) {
      const idx = (y * width + x) * meta.channels;
      const r = raw[idx];
      const g = raw[idx + 1];
      const b = raw[idx + 2];
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const diff = maxC - minC;

      // Check if non-white / non-light-grey background
      const isContent = (maxC < 240) || (diff > 12);
      if (isContent) {
        count++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
    if (count > 0) {
      lines.push(`y=${y}: count=${count}, x=[${minX}, ${maxX}]`);
    } else {
      lines.push(`y=${y}: empty`);
    }
  }

  fs.writeFileSync('./scripts/slide4-bounds.txt', lines.join('\n'));
}

run().catch(err => {
  fs.writeFileSync('./scripts/slide4-bounds.txt', err.stack);
});
