import { useEffect, useState } from 'react';
import { WorkCard } from '../components/WorkCard.jsx';
import { Reveal, SectionLabel } from '../components/ui.jsx';
import { WORKS, WORK_CATEGORIES } from '../content/loader.js';

// '#/works?cat=web' のようにカテゴリ指定付きで遷移できる
function initialCategory() {
  const query = window.location.hash.split('?')[1];
  const cat = new URLSearchParams(query ?? '').get('cat');
  return WORK_CATEGORIES.some((c) => c.id === cat) ? cat : 'all';
}

export function WorksPage() {
  const [category, setCategory] = useState(initialCategory);

  useEffect(() => {
    const onHash = () => setCategory(initialCategory());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const filtered = category === 'all' ? WORKS : WORKS.filter((work) => work.category === category);
  const countOf = (id) => (id === 'all' ? WORKS.length : WORKS.filter((w) => w.category === id).length);

  return (
    <div className="page-enter">
      <section className="page-head">
        <div className="wrap">
          <SectionLabel>Works</SectionLabel>
          <h1 className="h-display">つくったもの</h1>
          <p className="h-body">
            Web・アプリ・3Dなど、これまでに制作した作品の一覧です。それぞれの詳細ページで、目的・工夫・成果を紹介しています。
          </p>
        </div>
      </section>

      <section className="block block-tight">
        <div className="wrap">
          <div className="filter-row" role="tablist" aria-label="カテゴリで絞り込む">
            {WORK_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={category === cat.id}
                className={`filter-pill ${category === cat.id ? 'active' : ''}`}
                onClick={() => setCategory(cat.id)}
              >
                {cat.label}
                <span className="filter-count">{countOf(cat.id)}</span>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="empty-note">このカテゴリの作品はまだありません。</p>
          ) : (
            <div className="grid-3">
              {filtered.map((work, i) => (
                <Reveal key={work.id} delay={(i % 3) * 60}>
                  <WorkCard work={work} index={i + 1} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
