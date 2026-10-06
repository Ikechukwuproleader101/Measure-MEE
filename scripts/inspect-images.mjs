import sharp from 'sharp';
import fs from 'fs';

async function main() {
  try {
    const files = [
      './App images/Tailoring Made Easy Onboarding 1.png',
      './App images/All with Your Phone.png',
      './App images/App onboarding 1.png',
      './App images/App onboarding 2.png',
      './App images/App onboarding 3.png',
      './App images/App onboarding 4.png',
      './App images/App illustrations reference.png',
      './App images/App illustration without background.png'
    ];

    const results = [];
    for (const f of files) {
      try {
        const meta = await sharp(f).metadata();
        results.push(`${f}: ${meta.width}x${meta.height}, channels: ${meta.channels}, format: ${meta.format}`);
      } catch (e) {
        results.push(`${f} error: ${e.message}`);
      }
    }
    fs.writeFileSync('c:/Users/Ikechukwu/Downloads/Chrome dump files/Measure Me/scripts/output.txt', results.join('\n'));
  } catch (err) {
    fs.writeFileSync('c:/Users/Ikechukwu/Downloads/Chrome dump files/Measure Me/scripts/error.txt', err.stack || err.toString());
  }
}

main();
