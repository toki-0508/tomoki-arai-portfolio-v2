import { Icon } from '../Icon.jsx';
import { Link } from '../ui.jsx';
import { C, F } from '../../editor/index.jsx';
import { t } from '../../content/copy.js';
import { DOWNLOADS, WORKS } from '../../content/loader.js';
import { normalizeSkill } from '../../lib/skill-tree.js';
import { SkillEmblem } from './SkillEmblem.jsx';

export function SkillDetails({ node, onClose, onNavigate }) {
  const matches = (entry) => entry.tags.some((tag) => normalizeSkill(tag) === normalizeSkill(node.name));
  const works = WORKS.filter(matches);
  const downloads = DOWNLOADS.filter(matches);
  return (
    <aside
      className={`skill-tree-details skill-tone-${node.branch}`}
      aria-labelledby="skill-detail-title"
      aria-live="polite"
    >
      <div className="skill-tree-detail-head">
        <SkillEmblem name={node.name} icon={node.icon} />
        <div>
          <p className="skill-tree-small">
            <C k="about.tree.selected" />
          </p>
          <h3 id="skill-detail-title">
            {node.name}
          </h3>
        </div>
        <button
          className="skill-tree-tool"
          type="button"
          onClick={onClose}
          aria-label={t('about.tree.closeDetails')}
          title={t('about.tree.closeDetails')}
        >
          <Icon.Close />
        </button>
      </div>
      <p className="skill-tree-detail-count">
        <C k="about.skills.usagePrefix" />
        {works.length + downloads.length}
        <C k="about.skills.usageSuffix" />
      </p>
      {works.length + downloads.length ? (
        <ul className="skill-tree-related">
          {works.map((work) => (
            <li key={`work-${work.id}`}>
              <Link to={`/works/${work.id}`} onNavigate={onNavigate}>
                <span>
                  <F item={work} field="name" />
                </span>
                <Icon.Arrow width={16} height={16} />
              </Link>
            </li>
          ))}
          {downloads.map((download) => (
            <li key={`download-${download.id}`}>
              <Link to={`/downloads?cat=${download.category}`} onNavigate={onNavigate}>
                <span>
                  <F item={download} field="name" />
                  <small>
                    <C k="about.tree.download" />
                  </small>
                </span>
                <Icon.Arrow width={16} height={16} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="skill-tree-empty">
          <C k="about.tree.noWorks" />
        </p>
      )}
    </aside>
  );
}
