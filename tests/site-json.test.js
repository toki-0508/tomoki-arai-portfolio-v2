import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('site.json にプロフィール系データがそろっている', () => {
  const site = JSON.parse(fs.readFileSync('src/content/site.json', 'utf8'));
  assert.deepEqual(Object.keys(site), ['PROFILE', 'NAV_LINKS', 'MVV', 'INTERESTS', 'SKILL_GROUPS', 'HISTORY', 'NOW_UPDATED', 'NOW']);
  assert.equal(typeof site.PROFILE.tagline, 'string');
  assert.ok(site.HISTORY.length > 0);
});

test('site.js はデータを持たず、site.json を書き出すだけ', () => {
  const source = fs.readFileSync('src/content/site.js', 'utf8');
  assert.match(source, /import SITE from '\.\/site\.json';/);
  assert.doesNotMatch(source, /tagline:/);
});
