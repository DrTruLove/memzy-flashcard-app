const https = require('https');
const fs = require('fs');
const path = require('path');

// Simple, clean illustration style matching the other deck images
const bodyParts = [
  { name: 'head', filename: 'body-head.jpg', prompt: 'simple clean illustration of human head, minimal style, white background' },
  { name: 'eye', filename: 'body-eye.jpg', prompt: 'simple clean illustration of human eye, minimal style, white background' },
  { name: 'nose', filename: 'body-nose.jpg', prompt: 'simple clean illustration of human nose, minimal style, white background' },
  { name: 'mouth', filename: 'body-mouth.jpg', prompt: 'simple clean illustration of human mouth with lips, minimal style, white background' },
  { name: 'ear', filename: 'body-ear.jpg', prompt: 'simple clean illustration of human ear, minimal style, white background' },
  { name: 'hand', filename: 'body-hand.jpg', prompt: 'simple clean illustration of open hand palm, minimal style, white background' },
  { name: 'foot', filename: 'body-foot.jpg', prompt: 'simple clean illustration of human foot, minimal style, white background' },
  { name: 'arm', filename: 'body-arm.jpg', prompt: 'simple clean illustration of human arm, minimal style, white background' },
  { name: 'leg', filename: 'body-leg.jpg', prompt: 'simple clean illustration of human leg, minimal style, white background' },
  { name: 'finger', filename: 'body-finger.jpg', prompt: 'simple clean illustration of index finger, minimal style, white background' },
  { name: 'toe', filename: 'body-toe.jpg', prompt: 'simple clean illustration of big toe, minimal style, white background' },
  { name: 'hair', filename: 'body-hair.jpg', prompt: 'simple clean illustration of human hair, minimal style, white background' },
  { name: 'teeth', filename: 'body-teeth.jpg', prompt: 'simple clean illustration of teeth smile, minimal style, white background' },
  { name: 'tongue', filename: 'body-tongue.jpg', prompt: 'simple clean illustration of human tongue, minimal style, white background' },
  { name: 'neck', filename: 'body-neck.jpg', prompt: 'simple clean illustration of human neck, minimal style, white background' }
];

async function downloadImage(bodyPart) {
  const encodedPrompt = encodeURIComponent(bodyPart.prompt);
  // Using DALL-E mini style endpoint that works similarly to how the other images were likely generated
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&model=flux`;
  
  return new Promise((resolve, reject) => {
    const outputPath = path.join(__dirname, 'public', bodyPart.filename);
    
    console.log(`📥 Downloading ${bodyPart.name}...`);
    
    const request = https.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 30000 
    }, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(outputPath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          const stats = fs.statSync(outputPath);
          console.log(`✅ Downloaded: ${bodyPart.filename} (${Math.round(stats.size / 1024)}KB)`);
          resolve(true);
        });
        
        fileStream.on('error', (err) => {
          fs.unlink(outputPath, () => {});
          reject(err);
        });
      } else {
        console.error(`❌ Failed: ${bodyPart.name} - HTTP ${response.statusCode}`);
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    });
    
    request.on('error', (err) => {
      console.error(`❌ Error: ${bodyPart.name} - ${err.message}`);
      reject(err);
    });
    
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function generateImages() {
  console.log('🎨 Generating simple, clean illustrations for body parts...\n');
  
  let successCount = 0;
  
  for (const bodyPart of bodyParts) {
    try {
      await downloadImage(bodyPart);
      successCount++;
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed: ${bodyPart.name}`);
      // Try to continue with other images
    }
  }
  
  console.log(`\n✅ Done! Generated ${successCount}/${bodyParts.length} images.`);
}

generateImages();
