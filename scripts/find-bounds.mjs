import sharp from 'sharp';
import fs from 'fs';

async function mapImage(filePath, label) {
  const img = sharp(filePath);
  const { width, height } = await img.metadata();
  const raw = await img.raw().toBuffer();

  const out = [`=== ${label} (${width}x${height}) ===`];

  // Let's find rows where non-background pixels exist between y=100 and y=1100
  // Background in the phone mockup is near white/light gray
  // Let's inspect horizontal lines at various Y coordinates
  for (let y = 140; y <= 1000; y += 40) {
    let minX = width, maxX = 0, count = 0;
    for (let x = 80; x < width - 80; x++) {
      const idx = (y * width + x) * 4;
      const r = raw[idx], g = raw[idx+1], b = raw[idx+2];
      // If noticeably different from white/light gray background (rgb > 245)
      // or if it has color saturation:
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC - minC;
      const isContent = (maxC < 242) || (sat > 10);
      if (isContent) {
        count++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
    if (count > 0) {
      out.push(`y=${y}: count=${count}, x=[${minX}, ${maxX}]`);
    } else {
      out.push(`y=${y}: empty`);
    }
  }

  return out.join('\n');
}

async function run() {
  const r1 = await mapImage('./App images/Tailoring Made Easy Onboarding 1.png', 'Slide 1 (Tailoring Made Easy)');
  const r2 = await mapImage('./App images/All with Your Phone.png', 'Slide 2 (All with Your Phone)');
  fs.writeFileSync('./scripts/bounds.txt', r1 + '\n\n' + r2);
}

run().catch(e => fs.writeFileSync('./scripts/bounds.txt', e.stack));
