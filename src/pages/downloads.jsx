import { Fragment, useState } from 'react';
import { DownloadRow } from '../components/DownloadRow.jsx';
import { PageHead } from '../components/ui.jsx';
import { FilterTabs } from './works.jsx';
import { DOWNLOADS, DOWNLOAD_CATEGORIES } from '../content/loader.js';

export function DownloadsPage() {
  const [category, setCategory] = useState('all');
  const filtered = category === 'all' ? DOWNLOADS : DOWNLOADS.filter((file) => file.category === category);

  return (
    <Fragment>
      <PageHead
        eyebrow="Downloads"
        title="ダウンロード"
        lead="自作のツールや音源を、自由にダウンロードできます。音源はその場で試聴できます。"
      />
      <section className="section section-tight">
        <div className="wrap">
          <FilterTabs categories={DOWNLOAD_CATEGORIES} items={DOWNLOADS} value={category} onChange={setCategory} label="カテゴリで絞り込む" />
          <div className="dl-list" aria-live="polite">
            {filtered.map((file) => <DownloadRow key={file.id} file={file} />)}
          </div>
        </div>
      </section>
    </Fragment>
  );
}
