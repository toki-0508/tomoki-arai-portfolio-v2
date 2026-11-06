import { useEffect, useId, useState } from 'react';
import { categoryId } from '../content/categories.js';

function categoryFromHash(kind) {
  const params = new URLSearchParams(window.location.hash.split('?')[1]);
  return categoryId(kind, params.get('cat'), 'all');
}

export function useCategoryFilter(kind) {
  const [category, setCategory] = useState(() => categoryFromHash(kind));

  useEffect(() => {
    const onHashChange = () => setCategory(categoryFromHash(kind));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [kind]);

  const selectCategory = (next) => {
    const [route, query] = window.location.hash.split('?');
    const params = new URLSearchParams(query);
    if (next === 'all') params.delete('cat');
    else params.set('cat', next);
    const search = params.toString();
    window.location.hash = search ? `${route}?${search}` : route;
    setCategory(next);
  };

  return [category, selectCategory];
}

export function FilterTabs({ categories, items, value, onChange }) {
  const counts = new Map([['all', items.length]]);
  for (const { category } of items) counts.set(category, (counts.get(category) ?? 0) + 1);

  return (
    <div className="filters" role="group" aria-label="カテゴリで絞り込む">
      {categories.filter(({ id }) => id === 'all' || id === value || counts.has(id)).map(({ id, label }) => (
        <button key={id} type="button" className="filter" aria-pressed={value === id} onClick={() => onChange(id)}>
          {label}
          <span className="filter-count">{counts.get(id) ?? 0}</span>
        </button>
      ))}
    </div>
  );
}

export function CatalogGroups({ categories, items, value, onReset, mainTitle, otherTitle, renderItems }) {
  const headingId = useId();
  const groups = value === 'all'
    ? [
        { id: 'main', title: mainTitle, items: items.filter(({ category }) => category !== 'other') },
        { id: 'other', title: otherTitle, items: items.filter(({ category }) => category === 'other') },
      ]
    : [{ id: value, title: categories.find(({ id }) => id === value)?.label, items: items.filter(({ category }) => category === value) }];
  const visible = groups.filter((group) => group.items.length > 0);

  return (
    <div className="catalog-results" aria-live="polite">
      {visible.length ? visible.map((group) => (
        <section key={group.id} className="catalog-group" aria-labelledby={`${headingId}-${group.id}`}>
          <header className="catalog-group-head">
            <h2 id={`${headingId}-${group.id}`}>{group.title}</h2>
            <span className="catalog-total">{group.items.length}件</span>
          </header>
          {renderItems(group.items)}
        </section>
      )) : (
        <div className="empty">
          <p>このカテゴリにはまだありません。</p>
          {value !== 'all' && <button type="button" className="btn btn-secondary" onClick={onReset}>すべて表示</button>}
        </div>
      )}
    </div>
  );
}
