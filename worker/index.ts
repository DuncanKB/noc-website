// The site's Worker. Static files (dist/) are served by Cloudflare's asset
// handling; this script only adds:
//  - nevermadeoutdoorclub.com → www.nevermadeoutdoorclub.com (one address for Google and shares)
//  - POST /api/waitlist: stores an email address for the app-launch email.
// Export the list: npx wrangler d1 execute noc-waitlist --remote --command "SELECT email, created_at FROM waitlist"

// Just the bits of Cloudflare's D1 API this file uses.
interface D1Database {
  prepare(sql: string): { bind(...values: unknown[]): { run(): Promise<unknown> } };
}

interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  DB: D1Database;
}

const APEX = 'nevermadeoutdoorclub.com';
const EMAIL = /^[^\s@<>()[\]\,;:"]{1,64}@[^\s@<>()[\]\,;:"]+\.[a-z]{2,63}$/i;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === APEX) {
      url.hostname = `www.${APEX}`;
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === '/api/waitlist') {
      if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });
      return waitlist(request, env, url);
    }

    return env.ASSETS.fetch(request);
  },
};

async function waitlist(request: Request, env: Env, url: URL): Promise<Response> {
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  const reply = (status: number, result: 'ok' | 'invalid' | 'error') =>
    wantsJson
      ? Response.json(result === 'ok' ? { ok: true } : { ok: false, error: result }, { status })
      : Response.redirect(`${url.origin}/?waitlist=${result}#app`, 303);

  // Only accept form posts from this site.
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).hostname !== url.hostname) return reply(403, 'error');

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(400, 'invalid');
  }

  // Honeypot: a field hidden from people. Pretend it worked so bots move on.
  if (String(form.get('company') ?? '').trim()) return reply(200, 'ok');

  const email = String(form.get('email') ?? '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) return reply(400, 'invalid');

  try {
    // Signing up twice is fine: the address is stored once.
    await env.DB.prepare('INSERT OR IGNORE INTO waitlist (email, created_at) VALUES (?, ?)')
      .bind(email, new Date().toISOString())
      .run();
  } catch (err) {
    console.error('waitlist insert failed', err);
    return reply(500, 'error');
  }
  return reply(200, 'ok');
}
