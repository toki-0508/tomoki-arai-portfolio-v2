import { Fragment } from 'react';
import { CatalogGroups, FilterTabs, useCategoryFilter } from '../components/Catalog.jsx';
import { WorkCard } from '../components/WorkCard.jsx';
import { PageHead } from '../components/ui.jsx';
import { WORK_CATEGORIES } from '../content/categories.js';
import { WORKS } from '../content/loader.js';

export function WorksPage() {
  const [category, setCategory] = useCategoryFilter('work');

  return (
    <Fragment>
      <PageHead
        eyebrow="Works"
        title="作品"
        lead="アプリ、電子工作、ゲーム、高専祭の企画。実際に使ったものや、作り方に工夫を重ねたものから紹介します。"
      />
      <section className="section section-tight">
        <div className="wrap">
          <FilterTabs categories={WORK_CATEGORIES} items={WORKS} value={category} onChange={setCategory} />
          <CatalogGroups
            categories={WORK_CATEGORIES}
            items={WORKS}
            value={category}
            onReset={() => setCategory('all')}
            mainTitle="主な作品"
            otherTitle="その他の作品"
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
