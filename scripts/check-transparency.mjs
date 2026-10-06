import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function checkTransparency() {
  const dir = './public/images/illustrations';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
  const results = [];

  for (const f of files) {
    const fullPath = path.join(dir, f);
    const img = sharp(fullPath);
    const { width, height, channels } = await img.metadata();
    const raw = await img.raw().toBuffer();
    
    let transparentCount = 0;
    let whiteCount = 0;
    let total = width * height;

    for (let i = 0; i < total; i++) {
      const alpha = channels === 4 ? raw[i * channels + 3] : 255;
      const r = raw[i * channels];
      const g = raw[i * channels + 1];
      const b = raw[i * channels + 2];

      if (alpha === 0) {
        transparentCount++;
      } else if (r > 240 && g > 240 && b > 240) {
        whiteCount++;
      }
    }

    const cornerAlpha = [
      raw[3], // top-left alpha
      raw[(width - 1) * channels + 3], // top-right alpha
      raw[((height - 1) * width) * channels + 3], // bottom-left alpha
      raw[((height - 1) * width + width - 1) * channels + 3] // bottom-right alpha
    ];

    results.push(`${f} (${width}x${height}): transparent=${(transparentCount/total*100).toFixed(1)}%, near-white=${(whiteCount/total*100).toFixed(1)}%, cornerAlphas=[${cornerAlpha.join(',')}]`);
  }

  fs.writeFileSync('./scripts/transparency-check.txt', results.join('\n'));
}

checkTransparency().catch(e => {
  fs.writeFileSync('./scripts/transparency-check.txt', e.stack);
});
