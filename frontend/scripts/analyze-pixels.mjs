import sharp from 'sharp';
import fs from 'fs';

async function analyze() {
  const f1 = './App images/Tailoring Made Easy Onboarding 1.png';
  const f2 = './App images/All with Your Phone.png';
  const out = [];

  for (const f of [f1, f2]) {
    const img = sharp(f);
    const { width, height } = await img.metadata();
    const raw = await img.raw().toBuffer();

    out.push(`Analyzing ${f} (${width}x${height}):`);
    out.push(`Top-left pixel: ${raw[0]}, ${raw[1]}, ${raw[2]}, ${raw[3]}`);
    out.push(`Top-center pixel: ${raw[Math.floor(width/2) * 4]}, ${raw[Math.floor(width/2) * 4 + 1]}, ${raw[Math.floor(width/2) * 4 + 2]}`);
    out.push(`Bottom-left pixel: ${raw[((height-1)*width)*4]}, ${raw[((height-1)*width)*4+1]}, ${raw[((height-1)*width)*4+2]}`);
    
    // Sample along y = 150 (above illustration)
    const y150 = [];
    for (let x = 100; x < width; x += 100) {
      const idx = (150 * width + x) * 4;
      y150.push(`(${x}: ${raw[idx]},${raw[idx+1]},${raw[idx+2]})`);
    }
    out.push(`y=150: ${y150.join(' ')}`);

    // Sample along y = 200
    const y200 = [];
    for (let x = 100; x < width; x += 100) {
      const idx = (200 * width + x) * 4;
      y200.push(`(${x}: ${raw[idx]},${raw[idx+1]},${raw[idx+2]})`);
    }
    out.push(`y=200: ${y200.join(' ')}`);

    // Sample along y = 800
    const y800 = [];
    for (let x = 100; x < width; x += 100) {
      const idx = (800 * width + x) * 4;
      y800.push(`(${x}: ${raw[idx]},${raw[idx+1]},${raw[idx+2]})`);
    }
    out.push(`y=800: ${y800.join(' ')}`);
  }

  fs.writeFileSync('./scripts/pixel-analysis.txt', out.join('\n'));
}

analyze().catch(e => fs.writeFileSync('./scripts/pixel-analysis.txt', e.stack));

