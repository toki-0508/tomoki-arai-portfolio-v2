import { CategoryLabel, Link, TechList, Thumb } from './ui.jsx';
import { Icon } from './Icon.jsx';

// 作品一覧・トップ・関連作品で共通の作品カード。カード全体がリンク。
export function WorkCard({ work, number }) {
  return (
    <Link to={`/works/${work.id}`} className="work-card">
      <div className="work-card-visual">
        <Thumb src={work.image} alt="" fit={work.imageFit} />
        {number && <span className="work-card-number" aria-hidden="true">{number}</span>}
      </div>
      <div className="work-card-body">
        <p className="meta">
          <CategoryLabel category={work.category} label={work.categoryLabel} />
          <time dateTime={work.date}>{work.dateLabel}</time>
        </p>
        <div className="work-card-heading">
          <h3 className="work-card-title">{work.name}</h3>
          <Icon.Arrow width={16} height={16} />
        </div>
        <p className="work-card-summary">{work.summary}</p>
        {number && (work.outcome || work.role) && <p className="work-card-role">{work.outcome || work.role}</p>}
        <TechList items={work.tags} className="work-card-tech" />
      </div>
    </Link>
  );
}
