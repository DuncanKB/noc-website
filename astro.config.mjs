import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.nevermadeoutdoorclub.com',
  // privacy.html instead of privacy/index.html: the page is served at
  // /privacy with no trailing slash, the address the app links to.
  build: { format: 'file' },
  trailingSlash: 'never',
});
