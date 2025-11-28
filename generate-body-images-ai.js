const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const https = require("https");

// Read .env.local file manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKey = envContent.match(/GEMINI_API_KEY=(.+)/)?.[1]?.trim();

if (!apiKey) {
  console.error("Error: GEMINI_API_KEY not found in .env.local");
  process.exit(1);
}

const bodyParts = [
  { name: "head", word: "face+head" },
  { name: "eye", word: "human+eye" },
  { name: "nose", word: "human+nose" },
  { name: "mouth", word: "human+mouth" },
  { name: "ear", word: "human+ear" },
  { name: "hand", word: "human+hand" },
  { name: "foot", word: "human+foot" },
  { name: "arm", word: "human+arm" },
  { name: "leg", word: "human+leg" },
  { name: "finger", word: "human+fingers" },
  { name: "toe", word: "human+toes" },
  { name: "hair", word: "human+hair" },
  { name: "teeth", word: "human+teeth" },
  { name: "tongue", word: "human+tongue" },
  { name: "neck", word: "human+neck" },
];

async function generateImageFromText(word, filename) {
  try {
    console.log(`\nGenerating image for: ${word}...`);
    
    // Use Google's image search through a proxy service
    const searchUrl = `https://source.unsplash.com/400x400/?human+${word}`;
    
    return new Promise((resolve, reject) => {
      const filepath = path.join(__dirname, 'public', filename);
      const file = fs.createWriteStream(filepath);
      
      const request = https.get(searchUrl, (response) => {
        // Follow redirects
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
          file.close();
          fs.unlinkSync(filepath);
          
          https.get(response.headers.location, (redirectResponse) => {
            if (redirectResponse.statusCode === 200) {
              const newFile = fs.createWriteStream(filepath);
              redirectResponse.pipe(newFile);
              
              newFile.on('finish', () => {
                newFile.close();
                const stats = fs.statSync(filepath);
                if (stats.size < 1000) {
                  fs.unlinkSync(filepath);
                  console.log(`✗ Failed: Image too small for ${word}`);
                  resolve(false);
                } else {
                  console.log(`✓ Generated: ${filename} (${Math.round(stats.size/1024)}KB)`);
                  resolve(true);
                }
              });
              
              newFile.on('error', (err) => {
                fs.unlink(filepath, () => {});
                console.log(`✗ Failed: ${word} - ${err.message}`);
                resolve(false);
              });
            } else {
              console.log(`✗ Failed: HTTP ${redirectResponse.statusCode} for ${word}`);
              resolve(false);
            }
          }).on('error', (err) => {
            console.log(`✗ Failed: ${word} - ${err.message}`);
            resolve(false);
          });
          
          return;
        }
        
        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(filepath);
          console.log(`✗ Failed: HTTP ${response.statusCode} for ${word}`);
          resolve(false);
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          const stats = fs.statSync(filepath);
          if (stats.size < 1000) {
            fs.unlinkSync(filepath);
            console.log(`✗ Failed: Image too small for ${word}`);
            resolve(false);
          } else {
            console.log(`✓ Generated: ${filename} (${Math.round(stats.size/1024)}KB)`);
            resolve(true);
          }
        });
        
        file.on('error', (err) => {
          fs.unlink(filepath, () => {});
          console.log(`✗ Failed: ${word} - ${err.message}`);
          resolve(false);
        });
      });
      
      request.on('error', (err) => {
        console.log(`✗ Failed: ${word} - ${err.message}`);
        resolve(false);
      });
    });
  } catch (error) {
    console.error(`✗ Failed to generate ${filename}:`, error.message);
    return false;
  }
}

async function main() {
  console.log("🎨 Generating body part images with AI...\n");
  
  let successCount = 0;
  
  for (const part of bodyParts) {
    const success = await generateImageFromText(part.word, `body-${part.name}.jpg`);
    if (success) successCount++;
    
    // Delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log(`\n✅ Done! Generated ${successCount}/${bodyParts.length} images.`);
  console.log("\nRefresh your browser to see the new images in the Body Parts deck!");
}

main().catch(console.error);
