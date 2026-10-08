import sharp from 'sharp';

async function testCrop() {
  const file = './App images/Modern Gen-Z Tailor Onboarding.png';
  const cropBox = { left: 92, top: 140, width: 840, height: 800 };
  const img = sharp(file);
  const meta = await img.metadata();
  console.log('Channels:', meta.channels);

  const cropped = await sharp(file).extract(cropBox).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = cropped;
  const { width, height, channels } = info;

  console.log(`Cropped: ${width}x${height}, channels: ${channels}`);

  const sample = (x, y) => {
    const idx = (y * width + x) * channels;
    return `rgba(${data[idx]}, ${data[idx+1]}, ${data[idx+2]}, ${data[idx+3]})`;
  };

  console.log('top-left (10, 10):', sample(10, 10));
  console.log('top-right (830, 10):', sample(830, 10));
  console.log('bot-left (10, 790):', sample(10, 790));
  console.log('bot-right (830, 790):', sample(830, 790));
  console.log('center-top (420, 10):', sample(420, 10));
  console.log('center-bot (420, 790):', sample(420, 790));
}

testCrop();
