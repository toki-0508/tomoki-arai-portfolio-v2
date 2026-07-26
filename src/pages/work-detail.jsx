import { Icon } from '../components/Icon.jsx';
import { CategoryChip, Link, Reveal, Thumb } from '../components/ui.jsx';
import { BlockList } from '../lib/markdown.jsx';
import { WORKS, workById } from '../content/loader.js';

export function WorkDetailPage({ id }) {
  const work = workById(id);

  if (!work) {
    return (
      <div className="page-enter">
        <section className="page-head">
          <div className="wrap">
            <h1 className="h-display">作品が見つかりません</h1>
            <p className="h-body">URLが変更されたか、削除された可能性があります。</p>
            <Link to="/works" className="btn btn-primary">作品一覧へ戻る</Link>
          </div>
        </section>
      </div>
    );
  }

  const index = WORKS.indexOf(work);
  const prev = WORKS[index + 1] ?? null; // 日付降順なので次=古い方
  const next = WORKS[index - 1] ?? null;

  return (
    <div className="page-enter">
      <article>
        <section className="page-head detail-head">
          <div className="wrap">
            <Link to="/works" className="back-link"><Icon.Back width={16} height={16} /> 作品一覧へ戻る</Link>
            <div className="detail-meta">
              <CategoryChip category={work.category} label={work.categoryLabel} />
              <span className="detail-date">{work.dateLabel}</span>
            </div>
            <h1 className="h-display">{work.name}</h1>
            {work.summary && <p className="h-body detail-summary">{work.summary}</p>}
            <div className="detail-toolbar">
              <div className="tags">
                {work.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
              </div>
              <div className="detail-links">
                {work.url && (
                  <a href={work.url} target="_blank" rel="noreferrer" className="btn btn-primary">
                    サイトを見る <Icon.External width={15} height={15} />
                  </a>
                )}
                {work.github && (
                  <a href={work.github} target="_blank" rel="noreferrer" className="btn btn-ghost">
                    <Icon.GitHub width={15} height={15} /> GitHub
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {work.image && (
          <section className="block block-tight">
            <div className="wrap">
              <Reveal className="detail-visual">
                <Thumb src={work.image} alt={`${work.name} のスクリーンショット`} />
              </Reveal>
            </div>
          </section>
        )}

        <section className="block block-tight">
          <div className="wrap detail-body">
            {work.lead.length > 0 && (
              <Reveal className="detail-section">
                <BlockList blocks={work.lead} />
              </Reveal>
            )}
            {work.sections.map((section, i) => (
              <Reveal key={section.title + i} className="detail-section">
                <h2><span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>{section.title}</h2>
                <BlockList blocks={section.blocks} />
              </Reveal>
            ))}
          </div>
        </section>

        <section className="block block-tight">
          <div className="wrap detail-nav">
            {prev ? (
              <Link to={`/works/${prev.id}`} className="detail-nav-link prev">
                <small><Icon.Back width={14} height={14} /> 前の作品</small>
                <span>{prev.name}</span>
              </Link>
            ) : <span />}
            {next ? (
              <Link to={`/works/${next.id}`} className="detail-nav-link next">
                <small>次の作品 <Icon.Arrow width={14} height={14} /></small>
                <span>{next.name}</span>
              </Link>
            ) : <span />}
          </div>
        </section>
      </article>
    </div>
  );
}
