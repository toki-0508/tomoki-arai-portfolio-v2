import { Icon } from '../Icon.jsx';
import { asset } from '../../asset.js';
import { SKILL_GLYPHS } from '../../content/skill-nodes.js';

export function SkillEmblem({ name, root = false }) {
  const glyph = SKILL_GLYPHS[name];
  const Glyph = Icon[glyph?.glyph] || Icon.Spark;
  return (
    <span className={`skill-emblem ${glyph?.monochrome ? 'is-monochrome' : ''}`} aria-hidden="true">
      <span className="skill-emblem-inner">
        {root ? (
          <span className="skill-emblem-mark">TA</span>
        ) : glyph?.icon ? (
          <img src={asset(`/images/skills/${glyph.icon}.svg`)} alt="" draggable="false" />
        ) : glyph?.mark ? (
          <span className="skill-emblem-mark">{glyph.mark}</span>
        ) : (
          <Glyph width={30} height={30} />
        )}
      </span>
    </span>
  );
}
