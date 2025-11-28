const https = require('https');
const fs = require('fs');
const path = require('path');

// Pixabay API - free, curated stock photos suitable for children
// These are actual photographs, not AI generated

const bodyParts = [
  { name: "head", search: "portrait+face" },
  { name: "eye", search: "human+eye+closeup" },
  { name: "nose", search: "nose+profile" },
  { name: "mouth", search: "lips+mouth" },
  { name: "ear", search: "human+ear" },
  { name: "hand", search: "open+hand+palm" },
  { name: "foot", search: "bare+foot" },
  { name: "arm", search: "arm+bicep" },
  { name: "leg", search: "human+leg" },
  { name: "finger", search: "hand+five+fingers" },
  { name: "toe", search: "foot+five+toes" },
  { name: "hair", search: "hair+texture" },
  { name: "teeth", search: "white+teeth+smile" },
  { name: "tongue", search: "tongue+mouth" },
  { name: "neck", search: "neck+profile" }
];

console.log('\n⚠️  Pixabay requires an API key.');
console.log('Unfortunately, we cannot use free AI generators reliably for body part images.');
console.log('\nThe BEST solution for child-appropriate, accurate body part images is:');
console.log('\n📸 RECOMMENDED APPROACH:');
console.log('1. Visit https://www.pexels.com (100% free, no account needed)');
console.log('2. Search for each body part (see list below)');
console.log('3. Download ONE clear photo for each part');
console.log('4. Rename and save to the public folder\n');

console.log('Search terms and filenames:\n');
bodyParts.forEach((part, i) => {
  console.log(`${i + 1}. Search: "${part.search.replace(/\+/g, ' ')}"`);
  console.log(`   Save as: body-${part.name}.jpg`);
  console.log('');
});

console.log('\nAlternatively, you can:');
console.log('• Use anatomical diagrams (search "anatomy diagram")');
console.log('• Use illustrations instead of photos');
console.log('• Find educational flashcard images\n');

console.log('All images should be saved to:');
console.log(path.join(__dirname, 'public/') + '\n');
