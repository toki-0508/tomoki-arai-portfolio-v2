import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { isDescendant, moveSkill, removeSkill, validateSkillTree } from '../src/lib/skill-tree-model.js';

const model = JSON.parse(fs.readFileSync('src/content/skill-tree.json', 'utf8'));
const icons = Object.keys(JSON.parse(fs.readFileSync('src/content/skill-icons.json', 'utf8')));
const fresh = () => structuredClone(model);

test('公開するスキルはすべてロゴを持ち、Premiere Proも含まれる', () => {
  const validated = validateSkillTree(model, icons);
  assert.ok(validated.nodes.every((node) => node.icon && icons.includes(node.icon)));
  assert.ok(validated.nodes.some((node) => node.name === 'Adobe Premiere Pro'));
});

test('不正な座標、重複、接続先、循環、ロゴ、未知のフィールドを拒否する', () => {
  const edits = [
    (m) => {
      m.nodes[0].x = Infinity;
    },
    (m) => {
      m.nodes[0].y = 10;
    },
    (m) => {
      m.nodes[1].id = m.nodes[0].id;
    },
    (m) => {
      m.nodes[1].name = m.nodes[0].name;
    },
    (m) => {
      m.nodes[0].parent = 'missing';
    },
    (m) => {
      m.nodes[0].parent = m.nodes[0].id;
    },
    (m) => {
      m.nodes[0].parent = m.nodes[1].id;
      m.nodes[1].parent = m.nodes[0].id;
    },
    (m) => {
      m.nodes[0].icon = '../../secret';
    },
    (m) => {
      m.nodes[0].icon = 'missing';
    },
    (m) => {
      m.nodes[0].notable = 'yes';
    },
    (m) => {
      m.nodes[0].src = 'https://example.com';
    },
    (m) => {
      m.root.x = NaN;
    },
    (m) => {
      m.nodes[0].name = '';
    },
    (m) => {
      m.nodes[0].id = 'constructor';
    },
    (m) => {
      m.version = 2;
    },
  ];
  for (const edit of edits) {
    const next = fresh();
    edit(next);
    assert.throws(() => validateSkillTree(next, icons));
  }
});

test('削除時は子を元の親につなぎ直し、元データを壊さない', () => {
  const before = JSON.stringify(model);
  const next = removeSkill(model, 'react');
  assert.equal(
    next.nodes.some((node) => node.id === 'react'),
    false,
  );
  assert.equal(next.nodes.find((node) => node.id === 'next-js').parent, 'javascript');
  validateSkillTree(next, icons);
  assert.equal(JSON.stringify(model), before);
});

test('ドラッグは盤面内に収まり、20刻みのスナップと制作元移動に対応する', () => {
  const next = moveSkill(model, 'react', 947, 1014, true);
  assert.equal(next.nodes.find((node) => node.id === 'react').x, 940);
  assert.equal(next.nodes.find((node) => node.id === 'react').y, 1020);
  assert.deepEqual(moveSkill(model, 'root', -100, 9999).root, { x: 100, y: 2300 });
});

test('自分と子孫を接続先候補から除外できる', () => {
  assert.equal(isDescendant(model, 'react', 'react'), true);
  assert.equal(isDescendant(model, 'next-js', 'react'), true);
  assert.equal(isDescendant(model, 'javascript', 'react'), false);
});

test('形・サイズ・線・自己評価・関連先を検証する', () => {
  for (const patch of [
    { shape: 'triangle' },
    { size: 1000 },
    { size: '64' },
    { route: 'script' },
    { bend: Infinity },
    { related: ['missing'] },
    { related: [model.nodes[0].id] },
    { related: [model.nodes[1].id, model.nodes[1].id] },
    { level: 6 },
    { level: '5' },
    { experience: 'expert' },
  ]) {
    const next = fresh();
    Object.assign(next.nodes[0], patch);
    assert.throws(() => validateSkillTree(next, icons), JSON.stringify(patch));
  }
  for (const shape of ['circle', 'diamond', 'square', 'hexagon']) {
    const next = fresh();
    Object.assign(next.nodes[0], {
      shape,
      size: 90,
      route: 'curve',
      bend: -80,
      level: 2,
      experience: 'coursework',
    });
    assert.equal(validateSkillTree(next, icons).nodes[0].shape, shape);
  }
});

test('以前の下書きは形と大きさを引き継ぎ、習熟度を勝手に付けない', () => {
  const next = fresh();
  for (const node of next.nodes)
    for (const key of ['shape', 'size', 'route', 'bend', 'related', 'level', 'experience']) delete node[key];
  const validated = validateSkillTree(next, icons);
  assert.equal(validated.nodes[0].shape, next.nodes[0].notable ? 'diamond' : 'circle');
  assert.equal(validated.nodes[0].level, null);
});

test('削除したノードは横断する関連先からも外れる', () => {
  const next = fresh();
  next.nodes[1].related = [next.nodes[0].id];
  const removed = removeSkill(next, next.nodes[0].id);
  assert.deepEqual(removed.nodes.find((node) => node.id === next.nodes[1].id).related, []);
  validateSkillTree(removed, icons);
});

test('言語・製品・実行環境の接続を混同しない', () => {
  const parent = (name) => model.nodes.find((node) => node.name === name)?.parent;
  const id = (name) => model.nodes.find((node) => node.name === name)?.id;
  for (const name of [
    'C',
    'C++',
    'C#',
    'Python',
    'Java',
    'Dart',
    'ChatGPT',
    'Claude',
    'Qwen',
    'KiCad',
    'Figma',
    'Blender',
    'GarageBand',
  ])
    assert.equal(parent(name), null, name);
  assert.equal(parent('Flutter'), id('Dart'));
  assert.equal(parent('Next.js'), id('React'));
  assert.equal(parent('Google Apps Script'), id('JavaScript'));
  assert.equal(parent('GitHub Actions'), id('GitHub'));
  for (const name of ['PyTorch', 'PostgreSQL'])
    assert.equal(model.nodes.find((node) => node.name === name).experience, 'indirect');
  for (const name of ['Express.js', 'Prisma', 'EJS'])
    assert.equal(model.nodes.find((node) => node.name === name).experience, 'coursework');
  assert.ok(model.nodes.every((node) => node.level === null));
});
