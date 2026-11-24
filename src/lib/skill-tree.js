import { validateSkillTree } from './skill-tree-model.js';

export const TREE_SIZE = 2400;
export const NODE_SIZE = { root: [180, 150], skill: [112, 112] };
export const normalizeSkill = (name) => String(name).trim().toLowerCase();

export function centerCamera(size, point, scale) {
  return { scale, x: size.width / 2 - point.x * scale, y: size.height / 2 - point.y * scale };
}

export function reframeCamera(camera, from, to, factor = 1) {
  const point = {
    x: (from.width / 2 - camera.x) / camera.scale,
    y: (from.height / 2 - camera.y) / camera.scale,
  };
  return centerCamera(to, point, Math.max(0.1, Math.min(2, camera.scale * factor)));
}

export function buildSkillTree(model) {
  const valid = validateSkillTree(model);
  const nodes = [
    { id: 'root', type: 'root', name: 'Tomoki Arai', ...valid.root },
    ...valid.nodes.map((node) => ({ ...node, type: 'skill' })),
  ];
  const edges = valid.nodes.map((node) => ({
    from: node.parent || 'root',
    to: node.id,
    branch: node.branch,
    id: `main-${node.id}`,
    route: node.route,
    bend: node.bend,
  }));
  return { nodes, edges };
}

export function skillRoute(from, to, kind = 'elbow', bend = 0) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const middle = {
    x: (from.x + to.x) / 2 - (dy / length) * bend,
    y: (from.y + to.y) / 2 + (dx / length) * bend,
  };
  if (kind === 'straight') return { path: `M ${from.x} ${from.y} L ${to.x} ${to.y}` };
  if (kind === 'curve') return { path: `M ${from.x} ${from.y} Q ${middle.x} ${middle.y} ${to.x} ${to.y}` };
  const diagonal = Math.min(Math.abs(dx), Math.abs(dy));
  const elbow = bend
    ? middle
    : { x: from.x + Math.sign(dx) * diagonal, y: from.y + Math.sign(dy) * diagonal };
  return { path: `M ${from.x} ${from.y} L ${elbow.x} ${elbow.y} L ${to.x} ${to.y}`, elbow };
}
export function fitCamera(size, bounds = { x: 0, y: 0, width: TREE_SIZE, height: TREE_SIZE }, padding = 24) {
  const scale = Math.max(
    0.05,
    Math.min((size.width - padding * 2) / bounds.width, (size.height - padding * 2) / bounds.height, 1),
  );
  return {
    scale,
    x: (size.width - bounds.width * scale) / 2 - bounds.x * scale,
    y: (size.height - bounds.height * scale) / 2 - bounds.y * scale,
  };
}

export function zoomCamera(camera, targetScale, point) {
  const scale = Math.max(0.1, Math.min(2, targetScale));
  const ratio = scale / camera.scale;
  return { scale, x: point.x - (point.x - camera.x) * ratio, y: point.y - (point.y - camera.y) * ratio };
}

export function constrainCamera(camera, size) {
  const margin = 100;
  return {
    ...camera,
    x: Math.max(margin - TREE_SIZE * camera.scale, Math.min(size.width - margin, camera.x)),
    y: Math.max(margin - TREE_SIZE * camera.scale, Math.min(size.height - margin, camera.y)),
  };
}

export function branchBounds(nodes, branch) {
  const filtered = branch ? nodes.filter((node) => node.branch === branch || node.id === branch) : nodes;
  const targets = filtered.length ? filtered : nodes;
  if (!targets.length) return { x: 0, y: 0, width: TREE_SIZE, height: TREE_SIZE };
  const xs = targets.map((node) => node.x);
  const ys = targets.map((node) => node.y);
  return {
    x: Math.min(...xs) - 120,
    y: Math.min(...ys) - 80,
    width: Math.max(...xs) - Math.min(...xs) + 240,
    height: Math.max(...ys) - Math.min(...ys) + 160,
  };
}
