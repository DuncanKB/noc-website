// The site's Worker. Static files (dist/) are served by Cloudflare's asset
// handling; this script only adds:
//  - nevermadeoutdoorclub.com → www.nevermadeoutdoorclub.com (one address for Google and shares)
//  - POST /api/waitlist: stores an email address for the app-launch email, and
//    (when the DISCORD_WEBHOOK secret is set) posts "new sign-up, N on the list"
//    to a private Discord channel. The address itself never goes to Discord.
// Export or delete the list: npm run waitlist:export / npm run waitlist:delete (scripts/waitlist.mjs).

// Just the bits of Cloudflare's D1 API this file uses.
interface D1Database {
  prepare(sql: string): {
    bind(...values: unknown[]): { run(): Promise<{ meta?: { changes?: number } }> };
    first<T>(): Promise<T | null>;
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  DB: D1Database;
  DISCORD_WEBHOOK?: string; // set with: npx wrangler secret put DISCORD_WEBHOOK
}

const APEX = 'nevermadeoutdoorclub.com';
const EMAIL = /^[^\s@<>()[\]\,;:"]{1,64}@[^\s@<>()[\]\,;:"]+\.[a-z]{2,63}$/i;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === APEX) {
      url.hostname = `www.${APEX}`;
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === '/api/waitlist') {
      if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });
      return waitlist(request, env, url, ctx);
    }

    return env.ASSETS.fetch(request);
  },
};

async function waitlist(request: Request, env: Env, url: URL, ctx: ExecutionContext): Promise<Response> {
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  let back = '/';
  const reply = (status: number, result: 'ok' | 'invalid' | 'error') =>
    wantsJson
      ? Response.json(result === 'ok' ? { ok: true } : { ok: false, error: result }, { status })
      : Response.redirect(`${url.origin}${back}?waitlist=${result}#app`, 303);

  // Only accept form posts from this site.
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).hostname !== url.hostname) return reply(403, 'error');

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(400, 'invalid');
  }
  if (form.get('from') === '/nl') back = '/nl';

  // Honeypot: a field hidden from people. Pretend it worked so bots move on.
  if (String(form.get('company') ?? '').trim()) return reply(200, 'ok');

  const email = String(form.get('email') ?? '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) return reply(400, 'invalid');

  try {
    // Signing up twice is fine: the address is stored once.
    const result = await env.DB.prepare('INSERT OR IGNORE INTO waitlist (email, created_at) VALUES (?, ?)')
      .bind(email, new Date().toISOString())
      .run();
    // Only new addresses ping Discord; the answer doesn't wait for it.
    if (result.meta?.changes && env.DISCORD_WEBHOOK) ctx.waitUntil(ping(env));
  } catch (err) {
    console.error('waitlist insert failed', err);
    return reply(500, 'error');
  }
  return reply(200, 'ok');
}

// "New waitlist sign-up: 23 on the list." No address, nothing else.
async function ping(env: Env): Promise<void> {
  try {
    const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM waitlist').first<{ n: number }>();
    const n = row?.n ?? 0;
    const res = await fetch(env.DISCORD_WEBHOOK!, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        content: `New waitlist sign-up: **${n}** on the list.`,
        allowed_mentions: { parse: [] },
      }),
    });
    if (!res.ok) console.error('discord ping failed', res.status);
  } catch (err) {
    console.error('discord ping failed', err);
  }
}
