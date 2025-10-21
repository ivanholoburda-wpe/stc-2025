const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', 'preload.js');
const dstDir = path.resolve(__dirname, '..', 'dist');
const dst = path.join(dstDir, 'preload.js');

fs.mkdirSync(dstDir, { recursive: true });
fs.copyFileSync(src, dst);
console.log(`Copied ${src} -> ${dst}`);