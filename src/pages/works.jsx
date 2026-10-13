import { Fragment, useEffect, useState } from 'react';
import { WorkCard } from '../components/WorkCard.jsx';
import { PageHead } from '../components/ui.jsx';
import { WORKS, WORK_CATEGORIES } from '../content/loader.js';

// '#/works?cat=web' のようにカテゴリ指定付きで開ける
function categoryFromHash() {
  const query = window.location.hash.split('?')[1];
  const cat = new URLSearchParams(query ?? '').get('cat');
  return WORK_CATEGORIES.some((c) => c.id === cat) ? cat : 'all';
}

export function FilterTabs({ categories, items, value, onChange, label }) {
  const countOf = (id) => (id === 'all' ? items.length : items.filter((i) => i.category === id).length);
  return (
    <div className="filters" role="group" aria-label={label}>
      {categories
        .filter((cat) => cat.id === 'all' || countOf(cat.id) > 0)
        .map((cat) => (
          <button
            key={cat.id}
            type="button"
            className="filter"
            aria-pressed={value === cat.id}
            onClick={() => onChange(cat.id)}
          >
            {cat.label}
            <span className="filter-count">{countOf(cat.id)}</span>
          </button>
        ))}
    </div>
  );
}

export function WorksPage() {
  const [category, setCategory] = useState(categoryFromHash);

  useEffect(() => {
    const onHash = () => setCategory(categoryFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const filtered = category === 'all' ? WORKS : WORKS.filter((work) => work.category === category);

  return (
    <Fragment>
      <PageHead
        eyebrow="Works"
        title="作品"
        lead="これまでに作ったWebサイト・アプリ・3Dモデルです。各作品のページで、作った理由や学んだことを紹介しています。"
      />
      <section className="section section-tight">
        <div className="wrap">
          <FilterTabs categories={WORK_CATEGORIES} items={WORKS} value={category} onChange={setCategory} label="カテゴリで絞り込む" />
          {filtered.length > 0 ? (
            <div className="card-grid" aria-live="polite">
              {filtered.map((work) => <WorkCard key={work.id} work={work} />)}
            </div>
          ) : (
            <div className="empty">
              <p>このカテゴリの作品はまだありません。</p>
              <button type="button" className="btn btn-secondary" onClick={() => setCategory('all')}>すべての作品を見る</button>
            </div>
          )}
        </div>
      </section>
    </Fragment>
  );
}
