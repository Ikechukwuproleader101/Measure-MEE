import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function processSlide1(inputPath, outputPath) {
  console.log(`Processing Slide 1 ${inputPath}...`);
  // Crop inside the phone bezel
  const cropBox = { left: 100, top: 160, width: 824, height: 800 };
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

    // Outer edge columns/rows of phone screen
    if (cx < 20 || cx > width - 20) {
      if (diff < 20) return true;
    }

    // Shadow gradient across top area (down to cy < 270 on left, and cy < 135 across center/right)
    if (cy < 125 && cx < 535) {
      const isNotifPurple = (b > r + 30 && b > 140);
      const isHair = (maxC < 70);
      const isSkin = (r > 130 && r > g + 20 && diff > 25);
      const isCard = (cx > 520 && cy > 90);
      if (!isNotifPurple && !isHair && !isSkin && !isCard && diff < 22) {
        return true;
      }
    }

    if (cy < 270 && cx < 380) {
      const isNotifPurple = (b > r + 30 && b > 140);
      const isHair = (maxC < 70);
      const isSkin = (r > 130 && r > g + 20 && diff > 25);
      if (!isNotifPurple && !isHair && !isSkin && diff < 20) {
        return true;
      }
    }

    // Top-right shadow above the card
    if (cy < 80 && cx > 380) {
      if (diff < 18) return true;
    }

    // Standard background: pure white or near-white
    if (r >= 238 && g >= 238 && b >= 238) {
      return true;
    }

    // Very light off-white background
    if (r >= 225 && g >= 225 && b >= 225 && diff < 8) {
      return true;
    }

    return false;
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

  // Flood fill
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

  for (let i = 0; i < visited.length; i++) {
    if (visited[i] === 1) {
      data[i * 4 + 3] = 0;
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`Saved pristine Slide 1 to ${outputPath}`);
}

async function processSlide2(inputPath, outputPath) {
  console.log(`Processing Slide 2 ${inputPath}...`);
  // Crop inside the phone bezel
  const cropBox = { left: 95, top: 140, width: 834, height: 800 };
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

    // Phone bezel border columns at edges
    if (cx < 15 || cx > width - 15) {
      if (diff < 20) return true;
    }

    // Wall background in Slide 2 is rgb(250, 250, 250) or pure white
    if (r >= 244 && g >= 244 && b >= 244) {
      return true;
    }

    // Soft border pixels that have no saturation
    if (r >= 238 && g >= 238 && b >= 238 && diff < 6) {
      return true;
    }

    return false;
  }

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

  for (let i = 0; i < visited.length; i++) {
    if (visited[i] === 1) {
      data[i * 4 + 3] = 0;
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`Saved pristine Slide 2 to ${outputPath}`);
}

async function processSlide3(inputPath, outputPath) {
  console.log(`Processing Slide 3 ${inputPath}...`);
  const cropBox = { left: 92, top: 130, width: 840, height: 720 };
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

    if (cx < 5 || cx > width - 5 || cy < 5 || cy > height - 5) {
      if (diff < 15 && minC > 235) return true;
    }

    if (r >= 246 && g >= 246 && b >= 246 && diff < 6) {
      return true;
    }

    return false;
  }

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

  for (let i = 0; i < visited.length; i++) {
    if (visited[i] === 1) {
      data[i * 4 + 3] = 0;
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`Saved pristine Slide 3 to ${outputPath}`);
}

async function processSlide4(inputPath, outputPath) {
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

  for (let i = 0; i < visited.length; i++) {
    if (visited[i] === 1) {
      data[i * 4 + 3] = 0;
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`Saved pristine Slide 4 to ${outputPath}`);
}

async function main() {
  const outDir = './public/images/illustrations';
  await processSlide1(
    './App images/Tailoring Made Easy Onboarding 1.png',
    path.join(outDir, 'onboarding-slide1-transparent.png')
  );
  await processSlide2(
    './App images/All with Your Phone.png',
    path.join(outDir, 'onboarding-slide2-transparent.png')
  );
  await processSlide3(
    './App images/Manage Clients, Body Measurements.png',
    path.join(outDir, 'onboarding-slide3-transparent.png')
  );
  await processSlide4(
    './App images/Modern Gen-Z Tailor Onboarding.png',
    path.join(outDir, 'onboarding-slide4-transparent.png')
  );
}

main().catch(console.error);
