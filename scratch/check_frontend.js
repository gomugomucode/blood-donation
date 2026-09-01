const https = require('https');

const routes = [
  '/',
  '/login',
  '/register',
  '/admin/login',
  '/dashboard',
  '/history',
  '/profile',
  '/admin',
  '/admin/requests',
  '/admin/donors',
  '/admin/audit-logs',
  '/forgot-password',
  '/reset-password'
];

async function checkRoute(route) {
  return new Promise((resolve) => {
    https.get('https://client-sigma-peach.vercel.app' + route, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          route,
          status: res.statusCode,
          hasRoot: data.includes('id="root"'),
          title: (data.match(/<title>([^<]*)<\/title>/i) || [])[1] || 'Unknown'
        });
      });
    }).on('error', err => resolve({ route, error: err.message, status: 0 }));
  });
}

async function run() {
  console.log('=== VERCEL SPA ROUTING & AVAILABILITY AUDIT ===');
  for (const r of routes) {
    const res = await checkRoute(r);
    console.log(`Route: ${r.padEnd(22)} Status: ${res.status}  SPA Root: ${res.hasRoot}  Title: ${res.title}`);
  }
}
run();
