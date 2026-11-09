import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const COPY = JSON.parse(fs.readFileSync('src/content/copy.json', 'utf8'));

function sources(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sources(full);
    return /\.(js|jsx)$/.test(entry.name) ? [fs.readFileSync(full, 'utf8')] : [];
  });
}
const SOURCE = sources('src').join('\n');
const USED = new Set(
  [...SOURCE.matchAll(/\bt\(\s*['"]([\w.]+)['"]/g), ...SOURCE.matchAll(/\bk=["']([\w.]+)["']/g)].map((m) => m[1]),
);

test('コードで使っている文言のキーは、すべて copy.json にある', () => {
  const missing = [...USED].filter((key) => !(key in COPY));
  assert.deepEqual(missing, []);
});

test('copy.json のキーは、すべてコードのどこかで使われている', () => {
  const unused = Object.keys(COPY).filter((key) => !SOURCE.includes(`'${key}'`) && !SOURCE.includes(`"${key}"`));
  assert.deepEqual(unused, []);
});

test('値はすべて空でない文字列', () => {
  for (const [key, value] of Object.entries(COPY)) {
    assert.equal(typeof value, 'string', key);
    assert.ok(value.trim(), key);
  }
});
