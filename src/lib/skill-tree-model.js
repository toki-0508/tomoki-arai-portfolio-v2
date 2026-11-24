export const SKILL_TREE_FILE = 'src/content/skill-tree.json';
export const SKILL_TONES = ['web', 'app', 'backend', 'creative', 'hardware', 'tools'];
export const MAX_SKILLS = 120;

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
      !keysAre(node, ['id', 'name', 'x', 'y', 'parent', 'branch', 'notable', 'icon']) ||
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
    return {
      id: node.id,
      name: node.name.trim(),
      x: node.x,
      y: node.y,
      parent: node.parent,
      branch: node.branch,
      notable: node.notable,
      icon: node.icon,
    };
  });
  const parents = new Map(nodes.map((node) => [node.id, node.parent]));
  for (const node of nodes) {
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
      .map((node) => (node.parent === id ? { ...node, parent: removed.parent } : node)),
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
