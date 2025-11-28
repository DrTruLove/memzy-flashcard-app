const https = require('https');
const fs = require('fs');
const path = require('path');

const bodyParts = [
  { name: 'head', prompt: 'close-up photograph of a human head, face and head visible, neutral expression, clear detailed photo' },
  { name: 'eye', prompt: 'close-up photograph of a human eye, detailed iris and pupil, clear detailed photo' },
  { name: 'nose', prompt: 'close-up photograph of a human nose, front view, clear detailed photo' },
  { name: 'mouth', prompt: 'close-up photograph of a human mouth, lips, clear detailed photo, neutral expression' },
  { name: 'ear', prompt: 'close-up photograph of a human ear, side view, clear detailed photo' },
  { name: 'hand', prompt: 'photograph of a human hand, palm up, fingers extended, clear detailed photo' },
  { name: 'foot', prompt: 'photograph of a human foot, side view, clear detailed photo' },
  { name: 'arm', prompt: 'photograph of a human arm, extended, clear detailed photo' },
  { name: 'leg', prompt: 'photograph of a human leg, standing position, clear detailed photo' },
  { name: 'finger', prompt: 'close-up photograph of human fingers, hand with fingers extended, clear detailed photo' },
  { name: 'toe', prompt: 'close-up photograph of human toes, foot showing toes, clear detailed photo' },
  { name: 'hair', prompt: 'close-up photograph of human hair, healthy hair texture, clear detailed photo' },
  { name: 'teeth', prompt: 'close-up photograph of human teeth, smiling showing white teeth, clear detailed photo' },
  { name: 'tongue', prompt: 'close-up photograph of a human tongue, mouth open showing tongue, clear detailed photo' },
  { name: 'neck', prompt: 'photograph of a human neck, side profile, clear detailed photo' }
];

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        const stats = fs.statSync(filepath);
        
        // Check if file is too small (likely an error page)
        if (stats.size < 1000) {
          fs.unlinkSync(filepath);
          reject(new Error('File too small'));
          return;
        }
        
        resolve(stats.size);
      });

      fileStream.on('error', (err) => {
        fs.unlinkSync(filepath);
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function generateImages() {
  const publicDir = path.join(__dirname, 'public');
  
  console.log('🎨 Generating body part images with Pollinations.ai...\n');

  let successCount = 0;
  let failCount = 0;

  for (const part of bodyParts) {
    const filename = `body-${part.name}.jpg`;
    const filepath = path.join(publicDir, filename);
    
    // Encode prompt for URL
    const encodedPrompt = encodeURIComponent(part.prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true&enhance=true`;
    
    console.log(`📥 Downloading ${part.name}...`);
    
    try {
      const size = await downloadImage(imageUrl, filepath);
      const sizeKB = (size / 1024).toFixed(1);
      console.log(`✅ ${filename} (${sizeKB}KB)`);
      successCount++;
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`❌ Failed ${filename}: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n✅ Done! Generated ${successCount}/${bodyParts.length} images.`);
  if (failCount > 0) {
    console.log(`❌ ${failCount} images failed. You may need to retry or download manually.`);
  }
}

generateImages();
