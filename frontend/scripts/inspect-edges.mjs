import sharp from 'sharp';

async function inspectEdges() {
  const file = './App images/Modern Gen-Z Tailor Onboarding.png';
  const cropBox = { left: 92, top: 140, width: 840, height: 800 };
  const cropped = await sharp(file).extract(cropBox).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = cropped;
  const { width, height } = info;

  console.log('Inspecting border edges...');
  let nonBgCount = 0;
  for (let x = 0; x < width; x++) {
    for (const y of [0, 1, 2, height - 3, height - 2, height - 1]) {
      const idx = (y * width + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
      if (maxC < 240 || maxC - minC > 6) {
        nonBgCount++;
      }
    }
  }
  for (let y = 0; y < height; y++) {
    for (const x of [0, 1, 2, width - 3, width - 2, width - 1]) {
      const idx = (y * width + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
      if (maxC < 240 || maxC - minC > 6) {
        nonBgCount++;
      }
    }
  }
  console.log('Non-bg count on outer 3px rim:', nonBgCount);
}

inspectEdges();
