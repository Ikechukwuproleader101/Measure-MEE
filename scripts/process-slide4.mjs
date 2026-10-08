import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function processSlide4() {
  const inputPath = './App images/Modern Gen-Z Tailor Onboarding.png';
  const outputPath = './public/images/illustrations/onboarding-slide4-transparent.png';

  console.log(`Processing Slide 4 ${inputPath}...`);
  const cropBox = { left: 92, top: 140, width: 840, height: 800 };
  const cropped = await sharp(inputPath)
    .extract(cropBox)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = cropped;
  const { width, height } = info;
  const visited = new Uint8Array(width * height);
  const queue = [];

  function isBackground(cx, cy, idx) {
    const r = data[idx * 4];
    const g = data[idx * 4 + 1];
    const b = data[idx * 4 + 2];

    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const diff = maxC - minC;

    // Pure or near-pure background
    if (r >= 246 && g >= 246 && b >= 246 && diff <= 4) {
      return true;
    }

    // Outer borders
    if ((cx < 10 || cx > width - 10 || cy < 10 || cy > height - 10) && diff < 8 && minC > 238) {
      return true;
    }

    return false;
  }

  // Flood fill from all 4 boundaries
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

  // Set alpha of visited background pixels to 0
  let transparentCount = 0;
  for (let i = 0; i < visited.length; i++) {
    if (visited[i] === 1) {
      data[i * 4 + 3] = 0;
      transparentCount++;
    }
  }

  console.log(`Transparent pixels: ${transparentCount} / ${width * height} (${((transparentCount / (width * height)) * 100).toFixed(1)}%)`);

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`Saved pristine Slide 4 to ${outputPath}`);
}

processSlide4().catch(console.error);
