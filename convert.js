const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const INPUT = 'C:\\Users\\mehbo\\.gemini\\antigravity\\brain\\24c681ba-b903-4b13-9322-6d4b8cbd94ce\\demo_video_1777588515532.webp';
const FRAMES_DIR = path.join(__dirname, 'frames');
const OUTPUT = path.join(process.env.USERPROFILE, 'Desktop', 'TaskFlow_Demo.mp4');

async function run() {
  if (!fs.existsSync(FRAMES_DIR)) fs.mkdirSync(FRAMES_DIR, { recursive: true });

  // Get metadata without loading full image
  console.log('Reading metadata...');
  const meta = await sharp(INPUT, { animated: true, pages: 1 }).metadata();
  const pages = meta.pages || 1;
  const delay = meta.delay || [];
  const avgDelay = delay.length > 0 ? delay.reduce((a, b) => a + b, 0) / delay.length : 100;
  const fps = Math.max(1, Math.min(30, Math.round(1000 / avgDelay)));
  
  console.log(`Found ${pages} frames, FPS: ${fps}`);
  console.log('Extracting frames one at a time...');

  // Extract frames one by one to avoid pixel limit
  for (let i = 0; i < pages; i++) {
    const outPath = path.join(FRAMES_DIR, `frame_${String(i).padStart(5, '0')}.png`);
    await sharp(INPUT, { page: i, pages: 1 })
      .png()
      .toFile(outPath);
    if (i % 100 === 0) console.log(`  Frame ${i + 1}/${pages}`);
  }
  console.log('All frames extracted!');

  console.log('Encoding MP4...');
  const cmd = `ffmpeg -y -framerate ${fps} -i "${FRAMES_DIR}\\frame_%05d.png" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${OUTPUT}"`;
  execSync(cmd, { stdio: 'inherit' });

  console.log(`\nDone! Video saved to: ${OUTPUT}`);
  fs.rmSync(FRAMES_DIR, { recursive: true });
}

run().catch(err => console.error('Error:', err.message));
