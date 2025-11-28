const https = require('https');
const fs = require('fs');
const path = require('path');

// Using the same AI service that generated the good quality images for other decks
// Pollinations.ai with VERY specific educational/anatomical prompts

const bodyParts = [
  { 
    name: 'head', 
    filename: 'body-head.jpg',
    prompt: 'educational anatomy diagram, simple illustration of human head profile, clean medical textbook style, white background, labeled diagram'
  },
  { 
    name: 'eye', 
    filename: 'body-eye.jpg',
    prompt: 'educational anatomy diagram, simple illustration of human eye, clean medical textbook style, white background, anatomically correct'
  },
  { 
    name: 'nose', 
    filename: 'body-nose.jpg',
    prompt: 'educational anatomy diagram, simple illustration of human nose side view, clean medical textbook style, white background'
  },
  { 
    name: 'mouth', 
    filename: 'body-mouth.jpg',
    prompt: 'educational anatomy diagram, simple illustration of human mouth and lips, clean medical textbook style, white background'
  },
  { 
    name: 'ear', 
    filename: 'body-ear.jpg',
    prompt: 'educational anatomy diagram, simple illustration of human ear, clean medical textbook style, white background, anatomically correct'
  },
  { 
    name: 'hand', 
    filename: 'body-hand.jpg',
    prompt: 'educational anatomy diagram, simple illustration of human hand with exactly 5 fingers, clean medical textbook style, white background, numbered fingers'
  },
  { 
    name: 'foot', 
    filename: 'body-foot.jpg',
    prompt: 'educational anatomy diagram, simple illustration of human foot with exactly 5 toes, clean medical textbook style, white background'
  },
  { 
    name: 'arm', 
    filename: 'body-arm.jpg',
    prompt: 'educational anatomy diagram, simple illustration of human arm, clean medical textbook style, white background'
  },
  { 
    name: 'leg', 
    filename: 'body-leg.jpg',
    prompt: 'educational anatomy diagram, simple illustration of human leg, clean medical textbook style, white background'
  },
  { 
    name: 'finger', 
    filename: 'body-finger.jpg',
    prompt: 'educational anatomy diagram, simple illustration of human finger closeup, clean medical textbook style, white background, anatomical cross-section'
  },
  { 
    name: 'toe', 
    filename: 'body-toe.jpg',
    prompt: 'educational anatomy diagram, simple illustration of human toe closeup, clean medical textbook style, white background'
  },
  { 
    name: 'hair', 
    filename: 'body-hair.jpg',
    prompt: 'educational anatomy diagram, simple illustration of human hair strands and follicle, clean medical textbook style, white background'
  },
  { 
    name: 'teeth', 
    filename: 'body-teeth.jpg',
    prompt: 'educational anatomy diagram, simple illustration of human teeth and dental anatomy, clean medical textbook style, white background'
  },
  { 
    name: 'tongue', 
    filename: 'body-tongue.jpg',
    prompt: 'educational anatomy diagram, simple illustration of human tongue anatomy, clean medical textbook style, white background'
  },
  { 
    name: 'neck', 
    filename: 'body-neck.jpg',
    prompt: 'educational anatomy diagram, simple illustration of human neck and throat, clean medical textbook style, white background'
  }
];

async function downloadImage(bodyPart, retries = 3) {
  const encodedPrompt = encodeURIComponent(bodyPart.prompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true&enhance=true&model=flux`;
  
  return new Promise((resolve, reject) => {
    const outputPath = path.join(__dirname, 'public', bodyPart.filename);
    
    console.log(`📥 Generating ${bodyPart.name}...`);
    
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(outputPath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          const stats = fs.statSync(outputPath);
          console.log(`✅ Generated: ${bodyPart.filename} (${Math.round(stats.size / 1024)}KB)`);
          resolve(true);
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        https.get(response.headers.location, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (redirectResponse) => {
          const fileStream = fs.createWriteStream(outputPath);
          redirectResponse.pipe(fileStream);
          
          fileStream.on('finish', () => {
            fileStream.close();
            console.log(`✅ Generated: ${bodyPart.filename}`);
            resolve(true);
          });
        }).on('error', reject);
      } else if (retries > 0) {
        console.log(`⚠️  Retrying ${bodyPart.name}... (${retries} attempts left)`);
        setTimeout(() => {
          downloadImage(bodyPart, retries - 1).then(resolve).catch(reject);
        }, 2000);
      } else {
        console.error(`❌ Failed: ${bodyPart.name} - HTTP ${response.statusCode}`);
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', (err) => {
      if (retries > 0) {
        console.log(`⚠️  Retrying ${bodyPart.name}... (${retries} attempts left)`);
        setTimeout(() => {
          downloadImage(bodyPart, retries - 1).then(resolve).catch(reject);
        }, 2000);
      } else {
        console.error(`❌ Error: ${bodyPart.name} - ${err.message}`);
        reject(err);
      }
    });
  });
}

async function generateImages() {
  console.log('🎨 Generating educational anatomy diagrams for body parts...\n');
  console.log('Using medical textbook style illustrations instead of photographs');
  console.log('This should avoid the anatomical accuracy issues with photo generation\n');
  
  let successCount = 0;
  
  for (const bodyPart of bodyParts) {
    try {
      await downloadImage(bodyPart);
      successCount++;
      // Longer delay between requests to get better quality
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error(`Failed to generate ${bodyPart.name}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Done! Generated ${successCount}/${bodyParts.length} images.`);
  
  if (successCount < bodyParts.length) {
    console.log('\n⚠️  Some images failed. You can run this script again to retry failed images.');
  }
}

generateImages();
