import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.nevermadeoutdoorclub.com',
  // privacy.html instead of privacy/index.html: the page is served at
  // /privacy with no trailing slash, the address the app links to.
  trailingSlash: 'never',
  // The CSS is small: inline it so the first paint doesn't wait for a request.
  build: { format: 'file', inlineStylesheets: 'always' },
});
