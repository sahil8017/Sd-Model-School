/**
 * scripts/generate-index.cjs
 *
 * Post-build script: scans dist/client/assets/ and generates dist/client/index.html
 * that loads the correct content-hashed JS/CSS entry files.
 *
 * Run: node scripts/generate-index.cjs
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const clientDir = path.join(__dirname, '..', 'dist', 'client');
const assetsDir = path.join(clientDir, 'assets');

if (!fs.existsSync(assetsDir)) {
  console.error('❌ dist/client/assets/ not found. Run `npm run build` first.');
  process.exit(1);
}

const files = fs.readdirSync(assetsDir);

// Find the main CSS entry (styles-*.css)
const cssFile = files.find(f => f.startsWith('styles') && f.endsWith('.css'));

// Find the main JS entry — the largest JS file that isn't a chunk
// The main entry is typically named "index-*.js" or the biggest root-level bundle.
const mainJs = files.find(f => f.startsWith('index') && f.endsWith('.js'))
  || files.filter(f => f.endsWith('.js')).sort((a, b) => {
       const sa = fs.statSync(path.join(assetsDir, a)).size;
       const sb = fs.statSync(path.join(assetsDir, b)).size;
       return sb - sa;
     })[0];

if (!mainJs) {
  console.error('❌ Could not find a main JS entry in dist/client/assets/');
  process.exit(1);
}

const cssTag = cssFile
  ? `  <link rel="stylesheet" href="/assets/${cssFile}" />`
  : '';

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>S.D. Model Sr. Sec. School — Management System</title>
    <meta name="description" content="School Management System for S.D. Model Sr. Sec. School, Karnal" />
    <link rel="icon" type="image/png" href="/assets/logo-BBMZYM9Y.png" />
${cssTag}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/${mainJs}"></script>
  </body>
</html>
`;

const outPath = path.join(clientDir, 'index.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log(`✅ Generated: dist/client/index.html`);
console.log(`   CSS: ${cssFile || '(none)'}`);
console.log(`   JS:  ${mainJs}`);
