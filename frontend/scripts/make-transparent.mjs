import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function extractAndRemoveBackground(inputPath, cropBox, outputPath, isSlide1 = false) {
  console.log(`Processing ${inputPath}...`);
  const cropped = await sharp(inputPath)
    .extract(cropBox)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = cropped;
  const { width, height, channels } = info;

  const visited = new Uint8Array(width * height);
  const queue = [];

  function isBackground(cx, cy, idx) {
    const r = data[idx * 4];
    const g = data[idx * 4 + 1];
    const b = data[idx * 4 + 2];
    
    // For slide 1 top-left corner shadow
    if (isSlide1 && cx < 500 && cy < 130) {
      return true;
    }

    // Near white or light background
    return r >= 225 && g >= 225 && b >= 225;
  }

  // Push all border pixels
  for (let x = 0; x < width; x++) {
    const topIdx = 0 * width + x;
    const botIdx = (height - 1) * width + x;
    if (isBackground(x, 0, topIdx)) {
      visited[topIdx] = 1;
      queue.push(topIdx);
    }
    if (isBackground(x, height - 1, botIdx)) {
      visited[botIdx] = 1;
      queue.push(botIdx);
    }
  }

  for (let y = 0; y < height; y++) {
    const leftIdx = y * width + 0;
    const rightIdx = y * width + (width - 1);
    if (!visited[leftIdx] && isBackground(0, y, leftIdx)) {
      visited[leftIdx] = 1;
      queue.push(leftIdx);
    }
    if (!visited[rightIdx] && isBackground(width - 1, y, rightIdx)) {
      visited[rightIdx] = 1;
      queue.push(rightIdx);
    }
  }

  // BFS Flood-fill
  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    const neighbors = [
      cx > 0 ? curr - 1 : -1,
      cx < width - 1 ? curr + 1 : -1,
      cy > 0 ? curr - width : -1,
      cy < height - 1 ? curr + width : -1,
    ];

    for (const n of neighbors) {
      if (n >= 0 && !visited[n]) {
        const nx = n % width;
        const ny = Math.floor(n / width);
        if (isBackground(nx, ny, n)) {
          visited[n] = 1;
          queue.push(n);
        }
      }
    }
  }

  console.log(`Flood filled ${queue.length} background pixels out of ${width * height}`);

  for (let i = 0; i < visited.length; i++) {
    if (visited[i] === 1) {
      data[i * 4 + 3] = 0; // Transparent
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(outputPath);

  console.log(`Saved clean backgroundless image to ${outputPath}`);
}

async function run() {
  const outDir = './public/images/illustrations';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Slide 1: Tailoring Made Easy
  await extractAndRemoveBackground(
    './App images/Tailoring Made Easy Onboarding 1.png',
    { left: 60, top: 200, width: 904, height: 780 },
    path.join(outDir, 'onboarding-slide1-transparent.png'),
    true
  );

  // Slide 2: All with Your Phone
  await extractAndRemoveBackground(
    './App images/All with Your Phone.png',
    { left: 80, top: 130, width: 864, height: 780 },
    path.join(outDir, 'onboarding-slide2-transparent.png'),
    false
  );
}

run().catch(console.error);
