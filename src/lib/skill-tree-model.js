export const SKILL_TREE_FILE = 'src/content/skill-tree.json';
export const SKILL_TONES = ['web', 'app', 'backend', 'creative', 'hardware', 'tools'];
export const MAX_SKILLS = 120;
export const SKILL_SHAPES = ['circle', 'diamond', 'square', 'hexagon'];
export const SKILL_ROUTES = ['straight', 'elbow', 'curve'];
export const SKILL_EXPERIENCE = {
  reported: '使用経験あり（本人申告）',
  project: '制作で使用',
  coursework: '授業で使用',
  indirect: '他のツールを通して使用',
  learning: '学習中',
};
export const SKILL_LEVELS = [
  '自己評価待ち',
  '学習中',
  '使用経験あり',
  '実践経験あり',
  '自立して活用可能',
  '得意分野',
];

export class SkillTreeError extends Error {}

function keysAre(value, allowed) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).every((key) => allowed.includes(key))
  );
}

function coordinate(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 100 && value <= 2300;
}

export function validateSkillTree(value, iconIds = null) {
  if (
    !keysAre(value, ['version', 'root', 'nodes']) ||
    value.version !== 1 ||
    !keysAre(value.root, ['x', 'y']) ||
    !coordinate(value.root.x) ||
    !coordinate(value.root.y) ||
    !Array.isArray(value.nodes) ||
    value.nodes.length > MAX_SKILLS
  ) {
    throw new SkillTreeError('ツリーの形式・座標・ノード数を確認してください');
  }
  const ids = new Set();
  const names = new Set();
  const nodes = value.nodes.map((node) => {
    if (
      !keysAre(node, [
        'id',
        'name',
        'x',
        'y',
        'parent',
        'branch',
        'notable',
        'icon',
        'shape',
        'size',
        'route',
        'bend',
        'related',
        'level',
        'experience',
      ]) ||
      typeof node.id !== 'string' ||
      !/^[a-z][a-z0-9-]{0,63}$/.test(node.id) ||
      ['root', 'constructor', 'prototype'].includes(node.id) ||
      ids.has(node.id) ||
      typeof node.name !== 'string' ||
      !node.name.trim() ||
      node.name.length > 80 ||
      /[\r\n]/.test(node.name) ||
      names.has(node.name.trim().toLowerCase()) ||
      !coordinate(node.x) ||
      !coordinate(node.y) ||
      !SKILL_TONES.includes(node.branch) ||
      typeof node.notable !== 'boolean' ||
      !(node.parent === null || typeof node.parent === 'string') ||
      !(node.icon === null || (typeof node.icon === 'string' && /^[a-z0-9-]+$/.test(node.icon))) ||
      (iconIds && node.icon !== null && !iconIds.includes(node.icon))
    ) {
      throw new SkillTreeError(
        'ノードの名前・座標・色・ロゴ・IDを確認してください。名前とIDは重複できません',
      );
    }
    ids.add(node.id);
    names.add(node.name.trim().toLowerCase());
    const shape = node.shape ?? (node.notable ? 'diamond' : 'circle');
    const size = node.size ?? (node.notable ? 82 : 64);
    const route = node.route ?? 'elbow';
    const bend = node.bend ?? 0;
    const related = node.related ?? [];
    const level = node.level ?? null;
    const experience = node.experience ?? 'reported';
    if (
      !SKILL_SHAPES.includes(shape) ||
      !Number.isFinite(size) ||
      size < 44 ||
      size > 112 ||
      !SKILL_ROUTES.includes(route) ||
      !Number.isFinite(bend) ||
      Math.abs(bend) > 300 ||
      !Array.isArray(related) ||
      related.length > 12 ||
      new Set(related).size !== related.length ||
      related.some((id) => typeof id !== 'string' || id === node.id) ||
      !(level === null || (Number.isInteger(level) && level >= 1 && level <= 5)) ||
      !Object.hasOwn(SKILL_EXPERIENCE, experience)
    ) {
      throw new SkillTreeError('形・大きさ・線・関連先・習熟度を確認してください');
    }
    return {
      id: node.id,
      name: node.name.trim(),
      x: node.x,
      y: node.y,
      parent: node.parent,
      branch: node.branch,
      notable: node.notable,
      icon: node.icon,
      shape,
      size,
      route,
      bend,
      related,
      level,
      experience,
    };
  });
  const parents = new Map(nodes.map((node) => [node.id, node.parent]));
  for (const node of nodes) {
    if (node.related.some((id) => !ids.has(id))) throw new SkillTreeError('関連先のノードが存在しません');
    const visited = new Set([node.id]);
    let parent = node.parent;
    while (parent !== null) {
      if (!ids.has(parent) || visited.has(parent))
        throw new SkillTreeError('接続先が存在しないか、接続が循環しています');
      visited.add(parent);
      parent = parents.get(parent);
    }
  }
  return { version: 1, root: { x: value.root.x, y: value.root.y }, nodes };
}

export function moveSkill(model, id, x, y, snap = false) {
  const position = (value) =>
    Math.max(100, Math.min(2300, snap ? Math.round(value / 20) * 20 : Math.round(value)));
  const point = { x: position(x), y: position(y) };
  return id === 'root'
    ? { ...model, root: point }
    : { ...model, nodes: model.nodes.map((node) => (node.id === id ? { ...node, ...point } : node)) };
}

export function removeSkill(model, id) {
  const removed = model.nodes.find((node) => node.id === id);
  if (!removed) throw new SkillTreeError('削除するノードが見つかりません');
  return {
    ...model,
    nodes: model.nodes
      .filter((node) => node.id !== id)
      .map((node) => ({
        ...node,
        parent: node.parent === id ? removed.parent : node.parent,
        ...(node.related ? { related: node.related.filter((target) => target !== id) } : {}),
      })),
  };
}

export function isDescendant(model, candidate, ancestor) {
  const parents = new Map(model.nodes.map((node) => [node.id, node.parent]));
  const seen = new Set();
  let current = candidate;
  while (current && !seen.has(current)) {
    if (current === ancestor) return true;
    seen.add(current);
    current = parents.get(current);
  }
  return false;
}
