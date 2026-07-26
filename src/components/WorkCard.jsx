import { Icon } from './Icon.jsx';
import { CategoryChip, Link, Thumb } from './ui.jsx';

// 作品一覧・トップで使う作品カード。カード全体がリンク。
export function WorkCard({ work, index }) {
  return (
    <Link to={`/works/${work.id}`} className="work-card">
      <div className="work-card-visual">
        <Thumb src={work.image} alt={work.name} />
        <CategoryChip category={work.category} label={work.categoryLabel} />
      </div>
      <div className="work-card-body">
        <div className="work-card-head">
          {typeof index === 'number' && (
            <span className="work-card-num">{String(index).padStart(2, '0')}</span>
          )}
          <span className="work-card-date">{work.dateLabel}</span>
        </div>
        <h3 className="work-card-title">{work.name}</h3>
        <p className="work-card-desc">{work.summary}</p>
        <div className="work-card-foot">
          <div className="tags">
            {work.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
          <span className="work-card-more" aria-hidden="true"><Icon.Arrow /></span>
        </div>
      </div>
    </Link>
  );
}
