import { Fragment } from 'react';
import { CatalogGroups, FilterTabs, useCategoryFilter } from '../components/Catalog.jsx';
import { WorkCard } from '../components/WorkCard.jsx';
import { PageHead } from '../components/ui.jsx';
import { WORK_CATEGORIES } from '../content/categories.js';
import { WORKS } from '../content/loader.js';
import { C } from '../editor/index.jsx';

export function WorksPage() {
  const [category, setCategory] = useCategoryFilter('work');

  return (
    <Fragment>
      <PageHead
        eyebrow={<C k="works.head.eyebrow" />}
        title={<C k="works.head.title" />}
        lead={<C k="works.head.lead" />}
      />
      <section className="section section-tight">
        <div className="wrap">
          <FilterTabs categories={WORK_CATEGORIES} items={WORKS} value={category} onChange={setCategory} />
          <CatalogGroups
            categories={WORK_CATEGORIES}
            items={WORKS}
            value={category}
            onReset={() => setCategory('all')}
            mainTitle={<C k="works.groups.main" />}
            otherTitle={<C k="works.groups.other" />}
            renderItems={(works) => (
              <div className="card-grid">
                {works.map((work) => <WorkCard key={work.id} work={work} />)}
              </div>
            )}
          />
        </div>
      </section>
    </Fragment>
  );
}
