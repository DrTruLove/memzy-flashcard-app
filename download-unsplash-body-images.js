const https = require('https');
const fs = require('fs');
const path = require('path');

// Unsplash API - free tier allows 50 requests/hour
const UNSPLASH_ACCESS_KEY = 'YOUR_ACCESS_KEY_HERE'; // We'll use direct download instead

const bodyParts = [
  { name: 'head', query: 'human+head+portrait+face', filename: 'body-head.jpg' },
  { name: 'eye', query: 'human+eye+closeup', filename: 'body-eye.jpg' },
  { name: 'nose', query: 'human+nose+side+profile', filename: 'body-nose.jpg' },
  { name: 'mouth', query: 'human+mouth+lips', filename: 'body-mouth.jpg' },
  { name: 'ear', query: 'human+ear+closeup', filename: 'body-ear.jpg' },
  { name: 'hand', query: 'human+hand+five+fingers', filename: 'body-hand.jpg' },
  { name: 'foot', query: 'human+foot+five+toes', filename: 'body-foot.jpg' },
  { name: 'arm', query: 'human+arm+closeup', filename: 'body-arm.jpg' },
  { name: 'leg', query: 'human+leg+closeup', filename: 'body-leg.jpg' },
  { name: 'finger', query: 'human+fingers+hand', filename: 'body-finger.jpg' },
  { name: 'toe', query: 'human+toes+foot', filename: 'body-toe.jpg' },
  { name: 'hair', query: 'human+hair+closeup', filename: 'body-hair.jpg' },
  { name: 'teeth', query: 'human+teeth+smile', filename: 'body-teeth.jpg' },
  { name: 'tongue', query: 'human+tongue+mouth', filename: 'body-tongue.jpg' },
  { name: 'neck', query: 'human+neck+shoulder', filename: 'body-neck.jpg' }
];

// Using Lorem Picsum for quick placeholder images (same source as other decks originally used)
async function downloadFromLoremPicsum(bodyPart) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(__dirname, 'public', bodyPart.filename);
    
    // Use a seed based on the body part name for consistent images
    const seed = bodyPart.name;
    const url = `https://picsum.photos/seed/${seed}/800/600.jpg`;
    
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(outputPath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`✅ Downloaded: ${bodyPart.filename}`);
          resolve(true);
        });
      } else {
        console.error(`❌ Failed to download ${bodyPart.name}: ${response.statusCode}`);
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', (err) => {
      console.error(`❌ Error downloading ${bodyPart.name}:`, err.message);
      reject(err);
    });
  });
}

// Alternative: Use Placeholder.com with text labels
async function downloadPlaceholderWithLabel(bodyPart) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(__dirname, 'public', bodyPart.filename);
    const url = `https://via.placeholder.com/800x600/4A90E2/ffffff?text=${encodeURIComponent(bodyPart.name.toUpperCase())}`;
    
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(outputPath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`✅ Created placeholder: ${bodyPart.filename}`);
          resolve(true);
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function main() {
  console.log('📥 Downloading body part images...\n');
  console.log('⚠️  Note: Using Lorem Picsum placeholders');
  console.log('   For actual body part images, you need to:');
  console.log('   1. Use the Pexels/Unsplash websites manually');
  console.log('   2. Or get an Unsplash API key for automated downloads\n');
  
  let successCount = 0;
  
  for (const bodyPart of bodyParts) {
    try {
      await downloadFromLoremPicsum(bodyPart);
      successCount++;
      // Small delay to be respectful to the service
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to download ${bodyPart.name}`);
    }
  }
  
  console.log(`\n✅ Downloaded ${successCount}/${bodyParts.length} placeholder images`);
  console.log('\n⚠️  IMPORTANT: These are random placeholders, not actual body parts!');
  console.log('   Replace them with real images from Pexels for production use.');
}

main();
