const fs = require('node:fs');
const assert = require('node:assert/strict');
const manifest = require('../manifest.json');
const pkg = require('../package.json');
const versions = require('../versions.json');
assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
assert.equal(manifest.version, pkg.version);
assert.equal(versions[manifest.version], manifest.minAppVersion);
assert.equal(manifest.id, 'ime-format-guard');
assert.equal(manifest.isDesktopOnly, true);
assert(manifest.description.length <= 250 && manifest.description.endsWith('.'));
for (const file of ['main.js', 'README.md', 'README.en.md', 'LICENSE', 'CHANGELOG.md']) {
  assert(fs.statSync(file).isFile(), `Missing ${file}`);
}
console.log('메타데이터·필수 파일 검사 통과');
