const fs = require('node:fs');
const path = require('node:path');
const { id } = require('../manifest.json');
const output = path.join('dist', id);
fs.mkdirSync(output, { recursive: true });
for (const file of ['main.js', 'manifest.json']) fs.copyFileSync(file, path.join(output, file));
console.log(`릴리스 파일 준비: ${output}/main.js, manifest.json`);
