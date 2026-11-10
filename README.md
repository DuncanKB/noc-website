# NEVERMADE OUTDOOR CLUB — website

The site for **nevermadeoutdoorclub.com**: a landing page, the app's privacy policy at `/privacy`
(Apple needs this address) and a 404 page. Built with [Astro](https://astro.build) as plain static
files: no CMS, no cookies, no tracking. Fonts are self-hosted.

## Working on it

```bash
npm install
npm run dev      # live preview at http://localhost:4321
npm run build    # writes the finished site to dist/
```

- Pages: `src/pages/index.astro`, `src/pages/privacy.astro`, `src/pages/404.astro`
- Colours and type: `src/styles/global.css` (the app's volcanic palette)
- Discord / Instagram links: `src/links.ts`
- Images in `public/` are made from the app's club badge by `npm run images`
  (`scripts/make-images.mjs`); only rerun it if the badge changes.

**Privacy policy:** `src/pages/privacy.astro` is the policy the app links to. Keep it in step with
what the app does, update the date at the top when it changes, and never remove the page.

## Hosting (free)

Cloudflare Pages, connected to this GitHub repo: every push to `main` is published automatically.
Build command `npm run build`, output folder `dist`. See the steps the site was set up with in
the commit history / hand-over notes.

## Waitlist (app-launch email)

The "Get told first" form stores email addresses in a Cloudflare D1 database
(`noc-waitlist`), via `worker/index.ts`. Only the address and the signup date
are kept, and the form promises one email at launch, so use it for that only.

- See or export the list: Cloudflare dashboard → Storage & databases → D1 →
  `noc-waitlist` → Console: `SELECT email, created_at FROM waitlist ORDER BY created_at;`
- Delete someone on request: `DELETE FROM waitlist WHERE email = 'their@address';`
- Same from a terminal: `npx wrangler d1 execute noc-waitlist --remote --command "…"`
