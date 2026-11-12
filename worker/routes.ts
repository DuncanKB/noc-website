// GET /api/routes?lat=52.35&lon=4.9&activity=walk&km=5 — "Routes near you" in
// the NOC app (lib/osm-routes.ts in nevermade-app).
//
// Finds waymarked routes from OpenStreetMap with the Overpass API and keeps the
// answer for each area for 30 days in D1 (table route_cache, worker/schema.sql),
// so only the first person in an area waits for Overpass (often 30–40 s) and the
// free Overpass server isn't asked the same thing again and again.
//
// Privacy: the app sends a point already rounded to a 0.05° grid (about 4–5 km),
// and this worker rounds again, so no precise location ever arrives here. The
// cache holds route data per grid square only: nothing about who asked.
//
// Data © OpenStreetMap contributors (ODbL). Keep the query in step with
// overpassQuery() in nevermade-app/lib/osm-routes-model.ts.

interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  run(): Promise<unknown>;
  first<T>(): Promise<T | null>;
}
interface D1Like {
  prepare(sql: string): D1Statement;
}

const ROUTE_TYPES: Record<string, string> = {
  walk: 'hiking|foot',
  hike: 'hiking|foot',
  run: 'running|foot|fitness_trail',
  ride: 'bicycle|mtb',
};
const RANGES = new Set([5, 10, 15, 25, 50]);
const GRID = 20; // 1 / 0.05°
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
// The main server is often briefly busy (502/504): one retry after a pause, then a mirror.
const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const KEEP_TAGS = ['name', 'ref', 'route', 'network', 'distance', 'roundtrip'];

const snap = (v: number) => Math.round(v * GRID) / GRID;

const json = (body: unknown, status = 200, cache = 'no-store') =>
  Response.json(body, { status, headers: { 'cache-control': cache } });

export async function routes(request: Request, db: D1Like): Promise<Response> {
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: { allow: 'GET' } });
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get('lat'));
  const lon = Number(url.searchParams.get('lon'));
  const activity = url.searchParams.get('activity') ?? '';
  const km = Number(url.searchParams.get('km'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 85 || Math.abs(lon) > 180) {
    return json({ error: 'invalid' }, 400);
  }
  const types = ROUTE_TYPES[activity];
  if (!types || !RANGES.has(km)) return json({ error: 'invalid' }, 400);

  const at = { lat: snap(lat), lon: snap(lon) };
  const key = `${activity}:${km}:${at.lat.toFixed(2)}:${at.lon.toFixed(2)}`;

  const cached = await db
    .prepare('SELECT body, fetched_at FROM route_cache WHERE key = ?')
    .bind(key)
    .first<{ body: string; fetched_at: string }>();
  if (cached && Date.now() - Date.parse(cached.fetched_at) < TTL_MS) {
    return new Response(cached.body, {
      headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600', 'x-noc-cache': 'hit' },
    });
  }

  const query =
    `[out:json][timeout:50];` +
    `relation["type"="route"]["route"~"^(${types})$"]["name"](around:${km * 1000},${at.lat},${at.lon});` +
    `out tags center 60;`;

  let payload: { elements?: unknown } | null = null;
  for (const [i, endpoint] of OVERPASS.entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, 2000));
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'user-agent': 'NEVERMADE-app/1.0 (+https://www.nevermadeoutdoorclub.com)',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) {
        console.warn('overpass not ok', { endpoint, status: res.status });
        continue;
      }
      payload = (await res.json()) as { elements?: unknown };
      if (Array.isArray(payload.elements)) break;
      payload = null;
    } catch (err) {
      console.warn('overpass failed', { endpoint, err: String(err) });
    }
  }

  if (!payload || !Array.isArray(payload.elements)) {
    // Serve an old answer rather than nothing.
    if (cached) {
      return new Response(cached.body, { headers: { 'content-type': 'application/json', 'x-noc-cache': 'stale' } });
    }
    return json({ error: 'busy' }, 503);
  }

  // Only what the app shows: no member lists, no geometry.
  const elements = payload.elements.flatMap((raw) => {
    const e = raw as { type?: unknown; id?: unknown; center?: unknown; tags?: Record<string, unknown> };
    if (e.type !== 'relation' || typeof e.id !== 'number') return [];
    const tags: Record<string, string> = {};
    for (const k of KEEP_TAGS) if (typeof e.tags?.[k] === 'string') tags[k] = e.tags[k] as string;
    return [{ type: 'relation', id: e.id, center: e.center, tags }];
  });
  const body = JSON.stringify({ at, elements, fetched_at: new Date().toISOString() });

  try {
    await db
      .prepare('INSERT OR REPLACE INTO route_cache (key, body, fetched_at) VALUES (?, ?, ?)')
      .bind(key, body, new Date().toISOString())
      .run();
  } catch (err) {
    console.error('route cache write failed', String(err));
  }
  return new Response(body, {
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600', 'x-noc-cache': 'miss' },
  });
}
