require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const staticPublicDir = path.join(__dirname, '.output', 'public');
const indexHtml = path.join(staticPublicDir, 'index.html');

console.log('staticPublicDir:', staticPublicDir);
console.log('indexHtml:', indexHtml);
console.log('Index exists:', fs.existsSync(indexHtml));

// Use express.static with explicit index
app.use(express.static(staticPublicDir, { index: ['index.html'] }));

// Fallback
app.get('*', (req, res) => {
  console.log('Catch-all hit for:', req.path);
  res.sendFile(indexHtml);
});

app.listen(7860, '0.0.0.0', () => {
  console.log('Server listening on 7860');
});
