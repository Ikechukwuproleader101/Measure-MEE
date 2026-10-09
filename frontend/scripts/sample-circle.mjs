import sharp from 'sharp';

async function sampleLavCircle() {
  const file = './App images/Modern Gen-Z Tailor Onboarding.png';
  const cropBox = { left: 92, top: 140, width: 840, height: 800 };
  const cropped = await sharp(file).extract(cropBox).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = cropped;
  const { width, height } = info;

  // Let's sample along horizontal line y = 400 from x = 600 to 750 (inside lavender circle behind chair)
  const samples = [];
  for (let x = 620; x <= 780; x += 10) {
    const idx = (400 * width + x) * 4;
    samples.push(`(${x}, 400): [${data[idx]}, ${data[idx+1]}, ${data[idx+2]}] b-r=${data[idx+2] - data[idx]}`);
  }
  console.log('Lavender circle samples at y=400:');
  console.log(samples.join('\n'));

  // Let's sample pure background at y = 100, x from 100 to 700
  const bgSamples = [];
  for (let x = 100; x <= 700; x += 100) {
    const idx = (100 * width + x) * 4;
    bgSamples.push(`(${x}, 100): [${data[idx]}, ${data[idx+1]}, ${data[idx+2]}] diff=${Math.max(data[idx], data[idx+1], data[idx+2]) - Math.min(data[idx], data[idx+1], data[idx+2])}`);
  }
  console.log('\nBackground samples at y=100:');
  console.log(bgSamples.join('\n'));
}

sampleLavCircle();
