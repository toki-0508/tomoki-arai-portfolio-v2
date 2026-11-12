import { Fragment } from 'react';
import { CatalogGroups, FilterTabs, useCategoryFilter } from '../components/Catalog.jsx';
import { DownloadRow } from '../components/DownloadRow.jsx';
import { PageHead } from '../components/ui.jsx';
import { DOWNLOAD_CATEGORIES } from '../content/categories.js';
import { DOWNLOADS } from '../content/loader.js';
import { C } from '../editor/index.jsx';

export function DownloadsPage() {
  const [category, setCategory] = useCategoryFilter('download');

  return (
    <Fragment>
      <PageHead
        eyebrow={<C k="downloads.head.eyebrow" />}
        title={<C k="downloads.head.title" />}
        lead={<C k="downloads.head.lead" />}
      />
      <section className="section section-tight">
        <div className="wrap">
          <FilterTabs categories={DOWNLOAD_CATEGORIES} items={DOWNLOADS} value={category} onChange={setCategory} />
          <CatalogGroups
            categories={DOWNLOAD_CATEGORIES}
            items={DOWNLOADS}
            value={category}
            onReset={() => setCategory('all')}
            mainTitle={<C k="downloads.groups.main" />}
            otherTitle={<C k="downloads.groups.other" />}
            renderItems={(files) => (
              <div className="dl-list">
                {files.map((file) => <DownloadRow key={file.id} file={file} />)}
              </div>
            )}
          />
        </div>
      </section>
    </Fragment>
  );
}
