import { Icon } from '../Icon.jsx';
import { asset } from '../../asset.js';
import ICONS from '../../content/skill-icons.json';

export function SkillEmblem({ name, icon, root = false, shape = 'circle' }) {
  const glyph = ICONS[icon];
  const Glyph = Icon[glyph?.glyph] || Icon.Spark;
  return (
    <span
      className={`skill-emblem shape-${shape} ${glyph?.monochrome ? 'is-monochrome' : ''}`}
      aria-hidden="true"
    >
      <span className="skill-emblem-inner">
        {root ? (
          <span className="skill-emblem-mark">TA</span>
        ) : glyph?.src ? (
          <img src={asset(glyph.src)} alt="" draggable="false" />
        ) : glyph?.mark ? (
          <span className="skill-emblem-mark">{glyph.mark}</span>
        ) : (
          <Glyph width={30} height={30} />
        )}
      </span>
    </span>
  );
}
