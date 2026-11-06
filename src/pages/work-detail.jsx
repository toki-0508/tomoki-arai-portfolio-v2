import { Fragment, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { WorkCard } from '../components/WorkCard.jsx';
import { CategoryLabel, Lightbox, Link, PageHead, SectionHead, TechList, Thumb } from '../components/ui.jsx';
import { BlockList } from '../lib/markdown.jsx';
import { WORKS, workById } from '../content/loader.js';

const hostOf = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

function CaseFacts({ work }) {
  const facts = [
    ['自分の担当', work.role],
    ['現在地', work.status],
    ['確認できた成果', work.outcome],
  ].filter(([, value]) => value);

  if (!facts.length) return null;
  return (
    <dl className="case-facts" aria-label="制作の要点">
      {facts.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function WorkDetailPage({ id }) {
  const work = workById(id);
  const [zoomed, setZoomed] = useState(false);

  if (!work) {
    return (
      <PageHead eyebrow="Works" title="作品が見つかりません" lead="URLが変わったか、作品が削除された可能性があります。">
        <Link to="/works" className="btn btn-primary page-head-action">作品一覧を見る</Link>
      </PageHead>
    );
  }

  const index = WORKS.indexOf(work);
  const previous = WORKS[index - 1] ?? null;
  const next = WORKS[index + 1] ?? null;
  const linkedWorks = work.relatedIds.map(workById).filter((w) => w && w !== work);
  const sameCategory = WORKS.filter((w) => w.category === work.category && w !== work);
  const related = [...new Set([...linkedWorks, ...sameCategory])].slice(0, 3);
  const imageAlt = work.imageAlt || `${work.name}の画像`;

  return (
    <Fragment>
      <header className="page-head detail-head">
        <div className="wrap">
          <Link to="/works" className="back-link">
            <Icon.Back width={16} height={16} />
            作品一覧へ
          </Link>
          <h1 className="page-title">{work.name}</h1>
          {work.summary && <p className="lead">{work.summary}</p>}
          <CaseFacts work={work} />

          {/* 作品の基本情報は1行にまとめ、本文の前に一目で分かるようにする */}
          <dl className="facts" aria-label="作品の情報">
            <div>
              <dt>種類</dt>
              <dd><CategoryLabel category={work.category} label={work.categoryLabel} /></dd>
            </div>
            <div>
              <dt>制作時期</dt>
              <dd><time dateTime={work.date}>{work.dateLabel}</time></dd>
            </div>
            {work.tags.length > 0 && (
              <div className="facts-wide">
                <dt>使用技術</dt>
                <dd><TechList items={work.tags} className="facts-tech" /></dd>
              </div>
            )}
            {(work.url || work.github) && (
              <div>
                <dt>リンク</dt>
                <dd className="facts-links">
                  {work.url && (
                    <a href={work.url} target="_blank" rel="noreferrer">
                      {hostOf(work.url)}
                      <Icon.External width={13} height={13} />
                    </a>
                  )}
                  {work.github && (
                    <a href={work.github} target="_blank" rel="noreferrer">
                      GitHub
                      <Icon.External width={13} height={13} />
                    </a>
                  )}
                </dd>
              </div>
            )}
          </dl>

          {work.url && (
            <a href={work.url} target="_blank" rel="noreferrer" className="btn btn-primary page-head-action">
              サイトを開く
              <Icon.External width={15} height={15} />
            </a>
          )}
        </div>
      </header>

      {work.image && (
        <figure className="wrap detail-visual-wrap">
          <button type="button" className="detail-visual" onClick={() => setZoomed(true)} aria-label={`${work.name}の画像を拡大する`}>
            <Thumb src={work.image} alt={imageAlt} />
            <span className="zoom-hint" aria-hidden="true">
              <Icon.Zoom width={14} height={14} />
              クリックで拡大
            </span>
          </button>
          {work.imageCaption && <figcaption className="detail-caption">{work.imageCaption}</figcaption>}
        </figure>
      )}
      {zoomed && <Lightbox src={work.image} alt={imageAlt} onClose={() => setZoomed(false)} />}

      {work.steps.length > 0 && (
        <section className="wrap detail-walkthrough" aria-labelledby="walkthrough-title">
          <h2 id="walkthrough-title">操作の流れ</h2>
          <ol>
            {work.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </section>
      )}

      {/* 本文は「見出しを左・文章を右」の2段組み。見出しだけを拾い読みしても流れが分かる */}
      <section className="section section-tight">
        <article className="wrap prose">
          {work.lead.length > 0 && (
            <div className="prose-lead">
              <BlockList blocks={work.lead} />
            </div>
          )}
          {work.sections.map((section) => (
            <section key={section.title} className="prose-section">
              <h2>{section.title}</h2>
              <div className="prose-body">
                <BlockList blocks={section.blocks} />
              </div>
            </section>
          ))}
        </article>
      </section>

      {(previous || next) && (
        <nav className="wrap pager" aria-label="ほかの作品">
          {previous ? (
            <Link to={`/works/${previous.id}`} className="pager-link">
              <small><Icon.Back width={14} height={14} />前の作品</small>
              <span>{previous.name}</span>
            </Link>
          ) : <span />}
          {next ? (
            <Link to={`/works/${next.id}`} className="pager-link is-next">
              <small>次の作品<Icon.Arrow width={14} height={14} /></small>
              <span>{next.name}</span>
            </Link>
          ) : <span />}
        </nav>
      )}

      {related.length > 0 && (
        <section className="section">
          <div className="wrap">
            <SectionHead
              eyebrow="Related"
              title={linkedWorks.length ? '関連する作品' : '同じカテゴリの作品'}
              link={linkedWorks.length
                ? { to: '/works', label: 'すべての作品を見る' }
                : { to: `/works?cat=${work.category}`, label: `${work.categoryLabel}の作品をすべて見る` }}
            />
            <div className="card-grid">
              {related.map((w) => <WorkCard key={w.id} work={w} />)}
            </div>
          </div>
        </section>
      )}
    </Fragment>
  );
}
