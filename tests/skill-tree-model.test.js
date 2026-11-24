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
