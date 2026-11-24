export const TREE_SIZE = 2400;
export const NODE_SIZE = { root: [160, 100], branch: [172, 88], track: [160, 60], skill: [208, 78] };
export const normalizeSkill = (name) => String(name).trim().toLowerCase();

const polar = (radius, angle) => ({
  x: TREE_SIZE / 2 + radius * Math.cos(angle),
  y: TREE_SIZE / 2 + radius * Math.sin(angle),
});

export function buildSkillTree(groups, definitions) {
  const skills = groups.flatMap((group, gi) =>
    group.skills.map((name, si) => ({
      id: `skill-${gi}-${si}`,
      name,
      path: `SKILL_GROUPS.${gi}.skills.${si}`,
    })),
  );
  const remaining = new Map(skills.map((skill) => [skill.id, skill]));
  const branches = definitions.map((definition) => ({
    ...definition,
    tracks: definition.tracks.map((track) => {
      const names = new Set(track.skills.map(normalizeSkill));
      const matches = [...remaining.values()].filter((skill) => names.has(normalizeSkill(skill.name)));
      matches.forEach((skill) => remaining.delete(skill.id));
      return { title: track.title, skills: matches };
    }),
  }));
  // 編集モードで名前を変えたり追加しても、未分類のスキルを消さない。
  if (remaining.size) branches.at(-1).tracks.push({ title: 'その他', skills: [...remaining.values()] });
  const nodes = [{ id: 'root', type: 'root', name: 'Tomoki Arai', x: TREE_SIZE / 2, y: TREE_SIZE / 2 }];
  const edges = [];
  for (const [bi, branch] of branches.entries()) {
    const angle = (-Math.PI * 5) / 6 + (bi * Math.PI) / 3;
    const branchId = `branch-${branch.id}`;
    const tracks = branch.tracks.filter((track) => track.skills.length);
    nodes.push({
      id: branchId,
      type: 'branch',
      branch: branch.id,
      name: branch.title,
      icon: branch.icon,
      ...polar(345, angle),
    });
    edges.push({ from: 'root', to: branchId, branch: branch.id });
    let leafIndex = 0;
    const count = tracks.reduce((sum, track) => sum + track.skills.length, 0);
    tracks.forEach((track, ti) => {
      const trackId = `${branchId}-${ti}`;
      const offset = tracks.length === 1 ? 0 : (ti / (tracks.length - 1) - 0.5) * 0.56;
      nodes.push({
        id: trackId,
        type: 'track',
        branch: branch.id,
        name: track.title,
        ...polar(590, angle + offset),
      });
      edges.push({ from: branchId, to: trackId, branch: branch.id });
      track.skills.forEach((skill) => {
        const spread = count === 1 ? 0 : (leafIndex / (count - 1) - 0.5) * 0.82;
        const radius = leafIndex % 2 ? 1040 : 850;
        nodes.push({ ...skill, type: 'skill', branch: branch.id, ...polar(radius, angle + spread) });
        edges.push({ from: trackId, to: skill.id, branch: branch.id });
        leafIndex += 1;
      });
    });
  }
  return { nodes, edges, branches };
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
  const targets = branch ? nodes.filter((node) => node.branch === branch) : nodes;
  const xs = targets.map((node) => node.x);
  const ys = targets.map((node) => node.y);
  return {
    x: Math.min(...xs) - 120,
    y: Math.min(...ys) - 80,
    width: Math.max(...xs) - Math.min(...xs) + 240,
    height: Math.max(...ys) - Math.min(...ys) + 160,
  };
}
