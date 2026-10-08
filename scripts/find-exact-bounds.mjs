import sharp from 'sharp';

async function findExactBounds() {
  const file = './App images/Modern Gen-Z Tailor Onboarding.png';
  const img = sharp(file);
  const meta = await img.metadata();
  const raw = await img.raw().toBuffer();
  const { width, height } = meta;

  let minX = width, maxX = 0, minY = height, maxY = 0;

  // Search in illustration area: y between 180 and 920, x between 100 and 920
  for (let y = 180; y <= 920; y++) {
    for (let x = 120; x <= 900; x++) {
      const idx = (y * width + x) * meta.channels;
      const r = raw[idx];
      const g = raw[idx + 1];
      const b = raw[idx + 2];
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const diff = maxC - minC;

      // Check if it's illustration content (not white background)
      const isBg = (r > 248 && g > 248 && b > 248) || (r > 240 && g > 240 && b > 240 && diff < 6);
      if (!isBg) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  console.log(`Illustration bounds: x=[${minX}, ${maxX}] (w=${maxX - minX}), y=[${minY}, ${maxY}] (h=${maxY - minY})`);
}

findExactBounds();
