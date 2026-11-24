import { useState } from 'react';
import { t } from '../../content/copy.js';
import { PROFILE } from '../../content/site.js';
import { usageOf } from '../../content/loader.js';
import { NODE_SIZE, TREE_SIZE, skillRoute } from '../../lib/skill-tree.js';
import { SkillEmblem } from './SkillEmblem.jsx';

const shortNames = {
  'Chrome Extensions': 'Chrome',
  'Google Apps Script': 'Apps Script',
  'Minecraft Forge': 'Forge',
  'Adobe Illustrator': 'Illustrator',
  'Adobe Photoshop': 'Photoshop',
  'Tailwind CSS': 'Tailwind',
  'Adobe Premiere Pro': 'Premiere Pro',
};

export function SkillGraph({ tree, camera, selected, interactive = false, onSelect }) {
  const [hovered, setHovered] = useState(null);
  const active = hovered || selected;
  const ancestry = new Set(active ? [active] : []);
  const parent = new Map(tree.edges.filter((edge) => !edge.cross).map((edge) => [edge.to, edge.from]));
  let cursor = active;
  while (parent.has(cursor) && !ancestry.has(parent.get(cursor))) {
    cursor = parent.get(cursor);
    ancestry.add(cursor);
  }
  const byId = new Map(tree.nodes.map((node) => [node.id, node]));
  const origin = byId.get('root');
  return (
    <div
      className="skill-tree-world"
      style={{
        width: TREE_SIZE,
        height: TREE_SIZE,
        transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
      }}
    >
      <svg className="skill-tree-lines" width={TREE_SIZE} height={TREE_SIZE} aria-hidden="true">
        <g className="skill-tree-origin" transform={`translate(${origin.x - 1200} ${origin.y - 1200})`}>
          <circle cx="1200" cy="1200" r="116" />
          <circle cx="1200" cy="1200" r="134" />
          <path d="M 1060 1200 H 1080 M 1320 1200 H 1340 M 1200 1060 V 1080 M 1200 1320 V 1340" />
        </g>
        {tree.edges.map((edge) => {
          const from = byId.get(edge.from);
          const to = byId.get(edge.to);
          const { path, elbow } = skillRoute(from, to, edge.route, edge.bend);
          const lit = edge.cross ? edge.from === active || edge.to === active : ancestry.has(edge.to);
          return (
            <g
              key={edge.id}
              className={`skill-tone-${edge.branch} ${edge.from === 'root' ? 'is-origin-edge' : ''} ${edge.cross ? 'is-cross' : ''} ${lit ? 'is-lit' : ''}`}
            >
              <path className="skill-path-shadow" d={path} />
              <path className="skill-path" d={path} />
              {elbow && <circle className="skill-relay" cx={elbow.x} cy={elbow.y} r="5" />}
            </g>
          );
        })}
      </svg>
      {tree.nodes.map((node) => {
        const root = node.type === 'root';
        const [baseWidth, baseHeight] = NODE_SIZE[node.type];
        const width = Math.max(baseWidth, interactive ? 44 / camera.scale : 0);
        const height = Math.max(baseHeight, interactive ? 44 / camera.scale : 0);
        const count = root ? 0 : usageOf(node.name);
        const className = `skill-tree-node skill-tone-${node.branch || 'root'} ${camera.scale < 0.45 ? 'is-overview' : ''} ${camera.scale < 0.2 ? 'is-distant' : ''} ${root ? 'is-root' : ''} ${node.notable ? 'is-notable' : ''} ${count ? 'has-work' : ''} ${ancestry.has(node.id) ? 'is-lit' : ''} ${selected === node.id ? 'is-selected' : ''}`;
        const style = {
          left: node.x - width / 2,
          top: node.y - height / 2,
          width,
          height,
          '--emblem-scale': Math.max(1, Math.min(0.48, camera.scale * 2.2) / camera.scale),
          '--label-size': `${Math.max(22, Math.min(12, camera.scale * 60) / camera.scale)}px`,
          ...(!root ? { '--node-size': `${node.size}px` } : {}),
        };
        const content = (
          <>
            <SkillEmblem name={node.name} icon={node.icon} root={root} shape={node.shape} />
            <span className="skill-tree-node-name">
              {root ? PROFILE.nameEn : shortNames[node.name] || node.name}
            </span>
          </>
        );
        return interactive ? (
          <button
            key={node.id}
            type="button"
            className={className}
            style={style}
            data-node-id={node.id}
            aria-label={root ? t('about.tree.all') : t('about.tree.skillLabel', { name: node.name, count })}
            aria-pressed={root ? undefined : selected === node.id}
            title={node.name}
            onClick={() => onSelect(node.id)}
            onMouseEnter={() => setHovered(node.id)}
            onMouseLeave={() => setHovered(null)}
            onFocus={(event) => {
              if (event.target.matches(':focus-visible')) onSelect(node.id, true);
            }}
          >
            {content}
          </button>
        ) : (
          <div key={node.id} className={className} style={style}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
