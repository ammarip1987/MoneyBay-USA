// Diagnostic: which POST endpoints fail and how
const BASE = 'http://localhost:5001';

async function test(name, method, path, body, headers = {}, raw = false) {
  try {
    const opts = { method, headers: { ...headers } };
    if (body !== undefined) {
      opts.body = raw ? body : JSON.stringify(body);
      if (!raw) opts.headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(BASE + path, opts);
    const text = await res.text();
    console.log(`${name}: HTTP ${res.status} -> ${text.substring(0, 300)}`);
  } catch (e) {
    console.log(`${name}: FETCH ERROR -> ${e.message}`);
  }
}

(async () => {
  // Control: GET should work
  await test('GET /api/categories        ', 'GET', '/api/categories');

  // POST with invalid fields -> expect 400 "Validation failed" if pipeline OK
  await test('POST register invalid body ', 'POST', '/api/auth/register', { username: 'x', email: 'bad', password: '123' });

  // POST login nonexistent -> expect 401 INVALID_CREDENTIALS
  await test('POST login nonexistent     ', 'POST', '/api/auth/login', { email: 'nobody@nowhere.com', password: 'whatever123' });

  // POST register valid -> expect 200 (then we can test listing create)
  await test('POST register valid        ', 'POST', '/api/auth/register', { username: 'diaguser' + Date.now(), email: `diag${Date.now()}@test.com`, password: 'test123456', city: 'Florida' });

  // Broken JSON -> expect 400
  await test('POST login broken JSON     ', 'POST', '/api/auth/login', '{not json', { 'Content-Type': 'application/json' }, true);
})();
