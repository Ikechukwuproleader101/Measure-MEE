import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputImagePath = './App images/App illustration without background.png';
const outputDir = './public/images/illustrations';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  const metadata = await sharp(inputImagePath).metadata();
  const W = metadata.width;
  const H = metadata.height;
  console.log('Image dimensions:', W, 'x', H);

  // Exact coordinates on 612 x 408
  const crops = {
    'mascot-waving.png': { left: 10, top: 70, width: 75, height: 95 },
    'man-standing.png': { left: 105, top: 55, width: 65, height: 135 },
    'man-blue-tracking.png': { left: 185, top: 50, width: 75, height: 140 },
    'man-green-frame.png': { left: 270, top: 45, width: 75, height: 145 },
    'man-lidar-scan.png': { left: 355, top: 45, width: 85, height: 145 },
    'suit-jacket.png': { left: 445, top: 65, width: 75, height: 95 },
    'comment-box.png': { left: 525, top: 85, width: 75, height: 55 },
    'suit-full.png': { left: 10, top: 225, width: 75, height: 140 },
    'camera-capture.png': { left: 100, top: 220, width: 68, height: 155 },
    'speech-cloud.png': { left: 185, top: 260, width: 65, height: 55 },
    'desk-lamp-light.png': { left: 265, top: 230, width: 75, height: 65 },
    'desk-lamp-tape.png': { left: 355, top: 215, width: 75, height: 75 },
    'ghost-gyro-orbit.png': { left: 440, top: 215, width: 75, height: 75 },
    'globe-link.png': { left: 525, top: 225, width: 75, height: 65 },
    'suit-trousers-pair.png': { left: 265, top: 305, width: 75, height: 75 },
    'globe-chart.png': { left: 360, top: 310, width: 65, height: 65 },
    'ghost-stats-widget.png': { left: 445, top: 315, width: 65, height: 55 },
    'desk-lamp.png': { left: 535, top: 300, width: 60, height: 75 },
  };

  for (const [filename, box] of Object.entries(crops)) {
    const left = Math.max(0, Math.min(box.left, W - 1));
    const top = Math.max(0, Math.min(box.top, H - 1));
    const width = Math.min(box.width, W - left);
    const height = Math.min(box.height, H - top);

    try {
      await sharp(inputImagePath)
        .extract({ left, top, width, height })
        .toFile(path.join(outputDir, filename));
      console.log(`Saved ${filename}`);
    } catch (err) {
      console.error(`Failed ${filename}:`, err.message);
    }
  }

  // Also extract the full hero graphic from "App onboarding 1.png"
  const onb1Meta = await sharp('./App images/App onboarding 1.png').metadata();
  // In App onboarding 1.png (dimensions: 250 x 541 approx), extract the central illustration area
  const onb1W = onb1Meta.width;
  const onb1H = onb1Meta.height;
  console.log('App onboarding 1 dimensions:', onb1W, 'x', onb1H);
  
  // The illustration is in the middle third of App onboarding 1.png
  await sharp('./App images/App onboarding 1.png')
    .extract({
      left: Math.round(onb1W * 0.05),
      top: Math.round(onb1H * 0.44),
      width: Math.round(onb1W * 0.90),
      height: Math.round(onb1H * 0.40)
    })
    .toFile(path.join(outputDir, 'onboarding-slide1-hero.png'));
  console.log('Saved onboarding-slide1-hero.png');
}

run().catch(console.error);
