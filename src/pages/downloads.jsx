import { Fragment } from 'react';
import { CatalogGroups, FilterTabs, useCategoryFilter } from '../components/Catalog.jsx';
import { DownloadRow } from '../components/DownloadRow.jsx';
import { PageHead } from '../components/ui.jsx';
import { DOWNLOAD_CATEGORIES } from '../content/categories.js';
import { DOWNLOADS } from '../content/loader.js';

export function DownloadsPage() {
  const [category, setCategory] = useCategoryFilter('download');

  return (
    <Fragment>
      <PageHead
        eyebrow="Downloads"
        title="ダウンロード"
        lead="自作のツールや3Dモデルを配布しています。音源などはOtherから探せます。"
      />
      <section className="section section-tight">
        <div className="wrap">
          <FilterTabs categories={DOWNLOAD_CATEGORIES} items={DOWNLOADS} value={category} onChange={setCategory} />
          <CatalogGroups
            categories={DOWNLOAD_CATEGORIES}
            items={DOWNLOADS}
            value={category}
            onReset={() => setCategory('all')}
            mainTitle="ツール・素材"
            otherTitle="そのほかの配布物"
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
