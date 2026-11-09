import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter, parseLead, parseScalar, parseSections } from '../src/lib/markdown-parse.js';

test('frontmatter: 文字列・配列・ブロック配列・コメント・引用符', () => {
  const raw = [
    '---',
    'name: ゲームバー toki',
    'featured: 2',
    'tags: [Python, Panda3D]',
    'steps:',
    '  - 一つ目',
    '  - 二つ目',
    'note: "C# #を含む"',
    'url: https://e.example # コメント',
    'flag: true',
    '---',
    '',
    '本文',
  ].join('\n');
  const { data, body } = parseFrontmatter(raw);
  assert.deepEqual(data, {
    name: 'ゲームバー toki',
    featured: '2',
    tags: ['Python', 'Panda3D'],
    steps: ['一つ目', '二つ目'],
    note: 'C# #を含む',
    url: 'https://e.example',
    flag: true,
  });
  assert.equal(body, '\n本文');
});

test('parseScalar: 引用符は外し、コメントは捨てる', () => {
  assert.equal(parseScalar('"a # b"'), 'a # b');
  assert.equal(parseScalar('a # b'), 'a');
  assert.equal(parseScalar('false'), false);
});

test('リードとセクション', () => {
  const body = 'リード1行目\n続き\n\n## 概要\n\n段落A\n段落Aの続き\n\n- 項目1\n- 項目2\n\n## 特徴\n本文\n';
  assert.deepEqual(parseLead(body), [{ type: 'p', text: 'リード1行目 続き' }]);
  assert.deepEqual(parseSections(body), [
    { title: '概要', blocks: [{ type: 'p', text: '段落A 段落Aの続き' }, { type: 'list', items: ['項目1', '項目2'] }] },
    { title: '特徴', blocks: [{ type: 'p', text: '本文' }] },
  ]);
});
