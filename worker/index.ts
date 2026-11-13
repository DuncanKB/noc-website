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

    return secure(await env.ASSETS.fetch(request), url.pathname);
  },
};

// Standard browser safety headers on every page and file: HTTPS only, no
// framing by other sites, no MIME sniffing, and only the origin sent along
// when someone follows a link away.
const SECURITY_HEADERS: Record<string, string> = {
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'content-security-policy': "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  'referrer-policy': 'strict-origin-when-cross-origin',
  'cross-origin-opener-policy': 'same-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};

function secure(res: Response, path = ''): Response {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
  if (res.status === 200) {
    // Files in /_astro/ have a content hash in their name: they never change,
    // so browsers may keep them for a year. Images in public/ keep their name
    // when replaced, so a day. Pages stay fresh (the default).
    if (path.startsWith('/_astro/')) out.headers.set('cache-control', 'public, max-age=31536000, immutable');
    else if (/\.(webp|png|svg|ico)$/.test(path)) out.headers.set('cache-control', 'public, max-age=86400');
  }
  return out;
}

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
    const isNew = Boolean(result.meta?.changes);
    if (isNew && env.DISCORD_WEBHOOK) ctx.waitUntil(ping(env));
    else console.log('waitlist: no ping', { isNew, webhookSet: Boolean(env.DISCORD_WEBHOOK) });
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
    // Log the outcome with the webhook's id only (never its token).
    const id = env.DISCORD_WEBHOOK!.match(/webhooks\/(\d+)/)?.[1] ?? 'not a webhook URL';
    if (res.ok) console.log('discord ping sent', { status: res.status, webhook: id });
    else console.error('discord ping failed', { status: res.status, webhook: id, body: (await res.text()).slice(0, 200) });
  } catch (err) {
    console.error('discord ping failed', err);
  }
}
