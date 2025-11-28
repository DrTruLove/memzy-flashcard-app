const https = require('https');
const fs = require('fs');
const path = require('path');

// Using a better free AI image API with more natural results
// Lexica API provides high-quality, realistic images

const bodyParts = [
  { name: "head", query: "professional+photo+closeup+human+face+head+portrait" },
  { name: "eye", query: "professional+photo+closeup+human+eye+detailed" },
  { name: "nose", query: "professional+photo+closeup+human+nose+side+profile" },
  { name: "mouth", query: "professional+photo+closeup+human+lips+mouth" },
  { name: "ear", query: "professional+photo+closeup+human+ear+side+view" },
  { name: "hand", query: "professional+photo+single+human+hand+palm+open" },
  { name: "foot", query: "professional+photo+single+human+foot+barefoot" },
  { name: "arm", query: "professional+photo+single+human+arm+extended" },
  { name: "leg", query: "professional+photo+single+human+leg+full" },
  { name: "finger", query: "professional+photo+human+hand+fingers+extended" },
  { name: "toe", query: "professional+photo+human+foot+toes+closeup" },
  { name: "hair", query: "professional+photo+human+hair+texture+closeup" },
  { name: "teeth", query: "professional+photo+human+teeth+white+smile" },
  { name: "tongue", query: "professional+photo+human+tongue+closeup" },
  { name: "neck", query: "professional+photo+human+neck+side+profile" }
];

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
        https.get(response.headers.location, (redirectResponse) => {
          if (redirectResponse.statusCode === 200) {
            const file = fs.createWriteStream(filepath);
            redirectResponse.pipe(file);
            
            file.on('finish', () => {
              file.close();
              const stats = fs.statSync(filepath);
              if (stats.size < 5000) {
                fs.unlinkSync(filepath);
                resolve(false);
              } else {
                resolve(true);
              }
            });
            
            file.on('error', (err) => {
              fs.unlink(filepath, () => {});
              resolve(false);
            });
          } else {
            resolve(false);
          }
        }).on('error', () => resolve(false));
        return;
      }
      
      if (response.statusCode !== 200) {
        resolve(false);
        return;
      }
      
      const file = fs.createWriteStream(filepath);
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(filepath);
        if (stats.size < 5000) {
          fs.unlinkSync(filepath);
          resolve(false);
        } else {
          resolve(true);
        }
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {});
        resolve(false);
      });
    }).on('error', () => resolve(false));
  });
}

async function generateImages() {
  const publicDir = path.join(__dirname, 'public');
  
  console.log('🎨 Generating realistic body part images with AI...\n');

  let successCount = 0;
  let failCount = 0;

  for (const part of bodyParts) {
    const filename = `body-${part.name}.jpg`;
    const filepath = path.join(publicDir, filename);
    
    // Using Image.AI API endpoint
    const imageUrl = `https://image.pollinations.ai/prompt/medical+photography+professional+studio+lighting+single+human+${part.name}+anatomically+correct+clear+detailed+realistic?width=800&height=800&nologo=true&enhance=true&model=flux`;
    
    console.log(`📥 Generating ${part.name}...`);
    
    try {
      const success = await downloadImage(imageUrl, filepath);
      if (success) {
        const stats = fs.statSync(filepath);
        const sizeKB = (stats.size / 1024).toFixed(1);
        console.log(`✅ ${filename} (${sizeKB}KB)`);
        successCount++;
      } else {
        console.log(`❌ Failed ${filename}`);
        failCount++;
      }
      
      // Delay to avoid rate limiting and allow AI to generate unique images
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log(`❌ Failed ${filename}: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n✅ Done! Generated ${successCount}/${bodyParts.length} images.`);
  if (failCount > 0) {
    console.log(`❌ ${failCount} images failed.`);
  }
  console.log('\nRefresh your browser to see the new images!');
}

generateImages();
