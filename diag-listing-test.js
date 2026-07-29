ить// Diagnostic: POST /api/listings with and without image
const BASE = 'http://localhost:5001';
const fs = require('fs');

async function register() {
  const res = await fetch(BASE + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'diagl' + Date.now(), email: `diagl${Date.now()}@test.com`, password: 'test123456', city: 'Florida' })
  });
  const data = await res.json();
  console.log('register:', res.status);
  return data.token;
}

async function createListing(name, token, imagePath) {
  const fd = new FormData();
  fd.append('title', 'Diag listing ' + Date.now());
  fd.append('category_id', '19'); // Home & Garden
  fd.append('description', 'diagnostic test listing');
  fd.append('price', '10');
  fd.append('location', 'Florida');
  if (imagePath) {
    const buf = fs.readFileSync(imagePath);
    fd.append('images', new Blob([buf], { type: 'image/jpeg' }), 'test.jpg');
  }
  const res = await fetch(BASE + '/api/listings', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: fd
  });
  const text = await res.text();
  console.log(`${name}: HTTP ${res.status} -> ${text.substring(0, 400)}`);
}

(async () => {
  const token = await register();
  await createListing('listing WITHOUT image', token, null);
  await createListing('listing WITH image   ', token, 'c:/Moneybay/test-images-r2/wallpaperflare.com_wallpaper.jpg');
})();
