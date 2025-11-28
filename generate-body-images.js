const https = require('https');
const fs = require('fs');
const path = require('path');

// Using Picsum Photos API (working alternative, Lorem Picsum)
// We'll use specific image IDs that look appropriate for body parts

const bodyParts = [
  { name: "mouth", url: "https://picsum.photos/400/400?random=1" },
  { name: "ear", url: "https://picsum.photos/400/400?random=2" },
  { name: "hand", url: "https://picsum.photos/400/400?random=3" },
  { name: "foot", url: "https://picsum.photos/400/400?random=4" },
  { name: "arm", url: "https://picsum.photos/400/400?random=5" },
  { name: "leg", url: "https://picsum.photos/400/400?random=6" },
  { name: "finger", url: "https://picsum.photos/400/400?random=7" },
  { name: "toe", url: "https://picsum.photos/400/400?random=8" },
  { name: "hair", url: "https://picsum.photos/400/400?random=9" },
  { name: "teeth", url: "https://picsum.photos/400/400?random=10" },
  { name: "tongue", url: "https://picsum.photos/400/400?random=11" },
  { name: "neck", url: "https://picsum.photos/400/400?random=12" },
];

function downloadImage(url, filepath, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects === 0) {
      return reject(new Error('Too many redirects'));
    }

    https.get(url, (response) => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
        return downloadImage(response.headers.location, filepath, maxRedirects - 1)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        return reject(new Error(`HTTP ${response.statusCode}`));
      }

      const file = fs.createWriteStream(filepath);
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        // Check file size
        const stats = fs.statSync(filepath);
        if (stats.size < 1000) {
          fs.unlinkSync(filepath);
          return reject(new Error('File too small (likely error page)'));
        }
        console.log(`✓ Downloaded: ${path.basename(filepath)} (${Math.round(stats.size/1024)}KB)`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  const publicDir = path.join(__dirname, "public");
  
  console.log("Note: Using placeholder images from Picsum.");
  console.log("For actual body part photos, you'll need to manually download or use a paid API.\n");
  
  for (const part of bodyParts) {
    const filepath = path.join(publicDir, `human-${part.name}.jpg`);
    
    // Remove old SVG if exists
    const svgPath = path.join(publicDir, `human-${part.name}.svg`);
    if (fs.existsSync(svgPath)) {
      fs.unlinkSync(svgPath);
    }
    
    try {
      await downloadImage(part.url, filepath);
      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`✗ Failed to download ${part.name}:`, error.message);
    }
  }
  
  console.log("\n✓ Done! Placeholder images downloaded.");
  console.log("\nTo use real body part images:");
  console.log("1. Download images from Pexels, Pixabay, or similar free stock sites");
  console.log("2. Save them as human-mouth.jpg, human-ear.jpg, etc. in the public folder");
}

main().catch(console.error);

