// Diagnostic: same request through proxy (1100) vs direct (5001), plus bad-token behavior
const fs = require('fs');

async function register() {
  const res = await fetch('http://localhost:5001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'diagp' + Date.now(), email: `diagp${Date.now()}@test.com`, password: 'test123456', city: 'Florida' })
  });
  return (await res.json()).token;
}

async function createListing(name, base, token, withImage) {
  const fd = new FormData();
  fd.append('title', 'Diag ' + name + ' ' + Date.now());
  fd.append('category_id', '19');
  fd.append('description', 'diagnostic');
  fd.append('price', '10');
  fd.append('location', 'Florida');
  if (withImage) {
    const buf = fs.readFileSync('c:/Moneybay/test-images-r2/wallpaperflare.com_wallpaper.jpg');
    fd.append('images', new Blob([buf], { type: 'image/jpeg' }), 'test.jpg');
  }
  try {
    const res = await fetch(base + '/api/listings', {
      method: 'POST',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {},
      body: fd
    });
    const text = await res.text();
    console.log(`${name}: HTTP ${res.status} -> ${text.substring(0, 300)}`);
  } catch (e) {
    console.log(`${name}: FETCH ERROR -> ${e.message} (cause: ${e.cause?.message || e.cause?.code || 'n/a'})`);
  }
}

(async () => {
  const token = await register();
  await createListing('via PROXY 1100 + image ', 'http://localhost:1100', token, true);
  await createListing('via DIRECT 5001 + image', 'http://localhost:5001', token, true);
  await createListing('DIRECT 5001 BAD TOKEN  ', 'http://localhost:5001', 'Bearer.Expired.Token', false);
  await createListing('PROXY 1100 NO TOKEN    ', 'http://localhost:1100', null, false);
})();
