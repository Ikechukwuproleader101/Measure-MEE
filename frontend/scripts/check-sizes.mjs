import sharp from 'sharp';

async function check() {
  const m1 = await sharp('./public/images/illustrations/onboarding-slide1-transparent.png').metadata();
  const m2 = await sharp('./public/images/illustrations/onboarding-slide2-transparent.png').metadata();
  const m3 = await sharp('./public/images/illustrations/onboarding-slide3-transparent.png').metadata();
  console.log('Slide 1:', m1.width, 'x', m1.height);
  console.log('Slide 2:', m2.width, 'x', m2.height);
  console.log('Slide 3:', m3.width, 'x', m3.height);
}

check();
