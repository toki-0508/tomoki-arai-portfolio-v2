import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { findMarkers } from '../scripts/check-no-editor.mjs';

test('編集モードの目印を見つける', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dist-'));
  fs.mkdirSync(path.join(dir, 'assets'));
  fs.writeFileSync(path.join(dir, 'index.html'), '<div id="root"></div>');
  fs.writeFileSync(path.join(dir, 'assets/a.js'), 'fetch("/__editor/state")');
  fs.writeFileSync(path.join(dir, 'assets/b.png'), 'data-portfolio-editable');
  assert.deepEqual(findMarkers(dir), [{ file: path.join(dir, 'assets/a.js'), marker: '/__editor/' }]);
  fs.rmSync(path.join(dir, 'assets/a.js'));
  assert.deepEqual(findMarkers(dir), []);
});
