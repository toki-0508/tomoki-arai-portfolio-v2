import { Icon } from './Icon.jsx';
import { WorkCard } from './WorkCard.jsx';
import { CategoryLabel, Link, TechList, Thumb } from './ui.jsx';
import { plainText } from '../lib/markdown.jsx';

// トップの注目作品。1件目は画像と要点を大きく見せ、残りは2列のカードにする。
// 採用担当の方が最初のスクロールで「何を作れる人か」をつかめるよう、
// 1件目には本文の「特徴」から要点を3つまで添える。
export function FeaturedWorks({ works }) {
  if (!works.length) return null;
  const [lead, ...rest] = works;
  return (
    <div className="featured">
      <FeatureLead work={lead} />
      {rest.length > 0 && (
        <div className="featured-pair">
          {rest.map((work) => <WorkCard key={work.id} work={work} />)}
        </div>
      )}
    </div>
  );
}

function FeatureLead({ work }) {
  return (
    <Link to={`/works/${work.id}`} className="feature-lead">
      <div className="feature-lead-visual">
        <Thumb src={work.image} alt="" />
      </div>
      <div className="feature-lead-body">
        <p className="meta">
          <CategoryLabel category={work.category} label={work.categoryLabel} />
          <time dateTime={work.date}>{work.dateLabel}</time>
        </p>
        <h3 className="feature-lead-title">{work.name}</h3>
        {work.summary && <p className="feature-lead-summary">{work.summary}</p>}
        {work.highlights.length > 0 && (
          <ul className="feature-points" aria-label="主な特徴">
            {work.highlights.map((point) => <li key={point}>{plainText(point)}</li>)}
          </ul>
        )}
        <TechList items={work.tags} className="feature-lead-tech" />
        <span className="text-link feature-lead-more" aria-hidden="true">
          作品を見る
          <Icon.Arrow width={16} height={16} />
        </span>
      </div>
    </Link>
  );
}
