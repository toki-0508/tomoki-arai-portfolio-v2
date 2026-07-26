import { useState } from 'react';
import { DownloadRow } from '../components/DownloadRow.jsx';
import { Reveal, SectionLabel } from '../components/ui.jsx';
import { DOWNLOADS, DOWNLOAD_CATEGORIES } from '../content/loader.js';

export function DownloadsPage() {
  const [category, setCategory] = useState('all');
  const filtered = category === 'all' ? DOWNLOADS : DOWNLOADS.filter((file) => file.category === category);
  const countOf = (id) => (id === 'all' ? DOWNLOADS.length : DOWNLOADS.filter((f) => f.category === id).length);

  return (
    <div className="page-enter">
      <section className="page-head">
        <div className="wrap">
          <SectionLabel>Downloads</SectionLabel>
          <h1 className="h-display">公開データ</h1>
          <p className="h-body">
            制作したツールや音源などを自由にダウンロードできます。音源はその場で試聴できます。
          </p>
        </div>
      </section>

      <section className="block block-tight">
        <div className="wrap">
          <div className="filter-row" role="tablist" aria-label="カテゴリで絞り込む">
            {DOWNLOAD_CATEGORIES.map((cat) => (
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
            <p className="empty-note">このカテゴリの公開データはまだありません。</p>
          ) : (
            <div className="dl-list">
              {filtered.map((file, i) => (
                <Reveal key={file.id} delay={i * 50}>
                  <DownloadRow file={file} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
