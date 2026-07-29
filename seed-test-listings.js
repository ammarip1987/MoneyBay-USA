// Seed 5000 test listings (is_test=true) via /api/test/seed-listings
// Usage: node seed-test-listings.js [count]
const BASE = 'http://localhost:5001';
const COUNT = parseInt(process.argv[2] || '5000', 10);

const EMAIL = 'testseed@moneybay.local';
const PASSWORD = 'testseed12345';

async function req(method, path, body, token) {
  const opts = { method, headers: {} };
  if (body !== undefined) {
    opts.body = JSON.stringify(body);
    opts.headers['Content-Type'] = 'application/json';
  }
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(BASE + path, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text.substring(0, 500) }; }
  return { status: res.status, json };
}

(async () => {
  // 1. Register (ignore "already exists" style errors)
  const reg = await req('POST', '/api/auth/register', {
    username: 'testseed', email: EMAIL, password: PASSWORD, city: 'Florida'
  });
  console.log('register:', reg.status, JSON.stringify(reg.json).substring(0, 200));

  // 2. Login to get JWT
  let token = reg.json.token || reg.json.accessToken;
  if (!token) {
    const login = await req('POST', '/api/auth/login', { email: EMAIL, password: PASSWORD });
    console.log('login:', login.status, JSON.stringify(login.json).substring(0, 200));
    token = login.json.token || login.json.accessToken;
  }
  if (!token) {
    console.error('NO TOKEN - cannot continue');
    process.exit(1);
  }
  console.log('got JWT token');

  // 2.5 Optionally purge previous test listings first
  if (process.argv.includes('--purge')) {
    const purge = await req('DELETE', '/api/test/purge-test-listings', undefined, token);
    console.log('purge:', purge.status, JSON.stringify(purge.json));
  }

  // 3. Seed listings
  console.log(`seeding ${COUNT} test listings...`);
  const t0 = Date.now();
  const seed = await req('POST', `/api/test/seed-listings?count=${COUNT}`, undefined, token);
  console.log(`seed: HTTP ${seed.status} in ${((Date.now() - t0) / 1000).toFixed(1)}s ->`, JSON.stringify(seed.json).substring(0, 300));

  // 4. Verify counts
  const cnt = await req('GET', '/api/test/count-test-listings');
  console.log('count:', cnt.status, JSON.stringify(cnt.json));

  // 5. Sanity: public search sees them
  const list = await req('GET', '/api/listings?page=1');
  console.log('public /api/listings total:', list.json.total);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
