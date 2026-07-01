#!/usr/bin/env node
/**
 * Post-build script: generates .output/public/index.html from the Vite
 * client build output. Scans .output/public/assets/ to find the
 * content-hashed entry JS and CSS files so the HTML never goes stale.
 *
 * Run automatically by `npm run build`.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const publicDir  = path.join(__dirname, '..', 'dist', 'client');
const assetsDir  = path.join(publicDir, 'assets');

if (!fs.existsSync(assetsDir)) {
  console.error('❌  Assets directory not found:', assetsDir);
  console.error('    Run `npm run build` first.');
  process.exit(1);
}

const files = fs.readdirSync(assetsDir);

// index-<hash>.js  → the main client entry (calls hydrateRoot / createRoot)
const mainJs  = files.find(f => /^index-[A-Za-z0-9_-]+\.js$/.test(f));
// styles-<hash>.css → Tailwind / global CSS bundle
const mainCss = files.find(f => /^styles-[A-Za-z0-9_-]+\.css$/.test(f));

if (!mainJs) {
  console.error('❌  Could not find main JS entry (index-*.js) in', assetsDir);
  process.exit(1);
}

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>S. D. Model Sr. Sec. School, Karnal — School Management</title>
    <meta name="description" content="Administrative portal for S. D. Model Sr. Sec. School, Karnal." />
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@700;900&display=swap" />
    <!-- App styles -->
    ${mainCss ? `<link rel="stylesheet" href="/assets/${mainCss}" />` : ''}
  </head>
  <body>
    <!-- TanStack Start client entry — bootstraps React + router -->
    <script type="module" src="/assets/${mainJs}"></script>
  </body>
</html>
`;

fs.writeFileSync(path.join(publicDir, 'index.html'), html, 'utf-8');

console.log('✅  Generated dist/client/index.html');
console.log(`    JS : /assets/${mainJs}`);
if (mainCss) console.log(`    CSS: /assets/${mainCss}`);
