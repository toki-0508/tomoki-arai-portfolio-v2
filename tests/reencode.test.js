import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_SIDE, outputType, targetSize } from '../src/editor/live/reencode.js';

test('長辺が 2400px を超えるときだけ縮小する', () => {
  assert.equal(MAX_SIDE, 2400);
  assert.deepEqual(targetSize(4800, 3200), { width: 2400, height: 1600 });
  assert.deepEqual(targetSize(1200, 4000), { width: 720, height: 2400 });
  assert.deepEqual(targetSize(1000, 500), { width: 1000, height: 500 });
});

test('PNG は PNG のまま、それ以外は JPEG にする', () => {
  assert.equal(outputType({ type: 'image/png' }), 'image/png');
  assert.equal(outputType({ type: 'image/jpeg' }), 'image/jpeg');
  assert.equal(outputType({ type: 'image/webp' }), 'image/jpeg');
  assert.equal(outputType({ type: '' }), 'image/jpeg');
});
