import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  branchBounds,
  buildSkillTree,
  constrainCamera,
  fitCamera,
  NODE_SIZE,
  TREE_SIZE,
  zoomCamera,
} from '../src/lib/skill-tree.js';

const model = JSON.parse(fs.readFileSync('src/content/skill-tree.json', 'utf8'));
const icons = JSON.parse(fs.readFileSync('src/content/skill-icons.json', 'utf8'));
const tree = buildSkillTree(model);

test('JSONのすべてのスキルが重複なくツリーに入り、IDも維持する', () => {
  const skills = tree.nodes.filter((node) => node.type === 'skill');
  assert.equal(
    skills.length,
    model.nodes.length,
  );
  assert.equal(new Set(skills.map((node) => node.id)).size, skills.length);
  for (const skill of skills) {
    assert.equal(skill.name, model.nodes.find((node) => node.id === skill.id).name);
  }
});

test('すべてのノードは中心からつながり、範囲内に収まる', () => {
  const ids = new Set(tree.nodes.map((node) => node.id));
  assert.equal(tree.edges.length, tree.nodes.length - 1);
  for (const edge of tree.edges) {
    assert.ok(ids.has(edge.from));
    assert.ok(ids.has(edge.to));
  }
  const reachable = new Set(['root']);
  for (let pass = 0; pass < tree.nodes.length; pass += 1) {
    for (const edge of tree.edges) if (reachable.has(edge.from)) reachable.add(edge.to);
  }
  assert.equal(reachable.size, ids.size);
  for (const node of tree.nodes) {
    const [width, height] = NODE_SIZE[node.type];
    assert.ok(node.x - width / 2 >= 0 && node.x + width / 2 <= TREE_SIZE, node.name);
    assert.ok(node.y - height / 2 >= 0 && node.y + height / 2 <= TREE_SIZE, node.name);
  }
});

test('現在のスキルではノード同士が重ならない', () => {
  for (const [index, node] of tree.nodes.entries()) {
    const [width, height] = NODE_SIZE[node.type];
    for (const other of tree.nodes.slice(index + 1)) {
      const [otherWidth, otherHeight] = NODE_SIZE[other.type];
      const overlap =
        Math.abs(node.x - other.x) < (width + otherWidth) / 2 + 8 &&
        Math.abs(node.y - other.y) < (height + otherHeight) / 2 + 8;
      assert.ok(!overlap, `${node.name} / ${other.name}`);
    }
  }
});

test('編集で未知のスキルが増えてもツリーから消さない', () => {
  const result = buildSkillTree({ ...model, nodes: [{ ...model.nodes[0], id: 'new', name: '新しいスキル', parent: null }] });
  assert.equal(result.nodes.filter((node) => node.type === 'skill').length, 1);
  assert.ok(result.nodes.some((node) => node.name === '新しいスキル'));
  assert.equal(result.edges.length, 1);
});

test('分類名・用途名は表示用のノードとして生成しない', () => {
  assert.ok(tree.nodes.every((node) => node.type === 'root' || node.type === 'skill'));
});

test('参照する技術アイコンとライセンスはローカルにそろっている', () => {
  for (const glyph of Object.values(icons)) {
    if (!glyph.src.endsWith('.svg')) { assert.ok(fs.existsSync(`public${glyph.src}`)); continue; }
    const svg = fs.readFileSync(`public${glyph.src}`, 'utf8');
    assert.match(svg, /<svg/);
    assert.doesNotMatch(svg, /<script|foreignObject|\son\w+=/i);
  }
  assert.ok(fs.existsSync('public/images/skills/LICENSE.txt'));
});

test('スキルが空でもツリーとカメラは有限の座標になる', () => {
  const result = buildSkillTree({ ...model, nodes: [] });
  assert.equal(result.nodes.filter((node) => node.type === 'skill').length, 0);
  const camera = fitCamera({ width: 320, height: 300 }, branchBounds(result.nodes));
  assert.ok(Object.values(camera).every(Number.isFinite));
});

test('ズームは指した地点を固定し、倍率の上限と下限を守る', () => {
  const before = { scale: 0.5, x: 80, y: -40 };
  const point = { x: 200, y: 300 };
  const after = zoomCamera(before, 1, point);
  assert.equal((point.x - before.x) / before.scale, (point.x - after.x) / after.scale);
  assert.equal((point.y - before.y) / before.scale, (point.y - after.y) / after.scale);
  assert.equal(zoomCamera(before, 100, point).scale, 2);
  assert.equal(zoomCamera(before, 0, point).scale, 0.1);
});

test('ドラッグでツリー全体を画面外に失わない', () => {
  const size = { width: 375, height: 500 };
  for (const direction of [-1, 1]) {
    const camera = constrainCamera({ scale: 1, x: 100000 * direction, y: 100000 * direction }, size);
    assert.ok(camera.x < size.width && camera.x + TREE_SIZE > 0);
    assert.ok(camera.y < size.height && camera.y + TREE_SIZE > 0);
  }
});
