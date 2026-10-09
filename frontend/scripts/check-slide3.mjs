import sharp from 'sharp';

async function checkSlide3() {
  const img = sharp('./public/images/illustrations/onboarding-slide3-transparent.png');
  const meta = await img.metadata();
  console.log('Slide 3 transparent meta:', meta);
}

checkSlide3();
