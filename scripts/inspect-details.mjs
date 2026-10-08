import sharp from 'sharp';

async function inspectIllustrationDetails() {
  const file = './App images/Modern Gen-Z Tailor Onboarding.png';
  const img = sharp(file);
  const meta = await img.metadata();
  const raw = await img.raw().toBuffer();
  const { width } = meta;

  // Let's inspect the color values along horizontal lines through the circle or desk
  // e.g. at y = 550, from x = 120 to 900
  console.log('Sampling y=550');
  const samples = [];
  for (let x = 130; x <= 880; x += 15) {
    const idx = (550 * width + x) * meta.channels;
    samples.push(`x=${x}: rgb(${raw[idx]}, ${raw[idx+1]}, ${raw[idx+2]})`);
  }
  console.log(samples.slice(0, 10).join(' | '));
  console.log(samples.slice(-10).join(' | '));
}

inspectIllustrationDetails();
