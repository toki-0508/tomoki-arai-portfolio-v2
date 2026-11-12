import { Fragment, useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { WorkCard } from '../components/WorkCard.jsx';
import { CategoryLabel, Lightbox, Link, PageHead, SectionHead, TechList, Thumb } from '../components/ui.jsx';
import { BlockList } from '../lib/markdown.jsx';
import { WORKS, downloadById, workById } from '../content/loader.js';
import { t } from '../content/copy.js';
import { C, EditableImage, F, L, Prose, SectionTitle } from '../editor/index.jsx';

const hostOf = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

const CASE_FACTS = [
  ['work.facts.role', 'role'],
  ['work.facts.status', 'status'],
  ['work.facts.outcome', 'outcome'],
];

function CaseFacts({ work }) {
  const facts = CASE_FACTS.filter(([, field]) => work[field]);
  if (!facts.length) return null;
  return (
    <dl className="case-facts" aria-label={t('work.facts.label')}>
      {facts.map(([labelKey, field]) => (
        <div key={field}>
          <dt><C k={labelKey} /></dt>
          <dd><F item={work} field={field} /></dd>
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
      <PageHead eyebrow={<C k="work.notFound.eyebrow" />} title={<C k="work.notFound.title" />} lead={<C k="work.notFound.lead" />}>
        <Link to="/works" className="btn btn-primary page-head-action"><C k="work.notFound.button" /></Link>
      </PageHead>
    );
  }

  const index = WORKS.indexOf(work);
  const previous = WORKS[index - 1] ?? null;
  const next = WORKS[index + 1] ?? null;
  const linkedWorks = work.relatedIds.map(workById).filter((w) => w && w !== work);
  const sameCategory = WORKS.filter((w) => w.category === work.category && w !== work);
  const related = [...new Set([...linkedWorks, ...sameCategory])].slice(0, 3);
  const imageAlt = work.imageAlt || t('work.image.altFallback', { name: work.name });
  const download = downloadById(work.downloadId);

  return (
    <Fragment>
      <header className="page-head detail-head">
        <div className="wrap">
          <Link to="/works" className="back-link">
            <Icon.Back width={16} height={16} />
            <C k="work.back" />
          </Link>
          <h1 className="page-title"><F item={work} field="name" /></h1>
          {work.summary && <p className="lead"><F item={work} field="summary" /></p>}
          <CaseFacts work={work} />

          {/* 作品の基本情報は1行にまとめ、本文の前に一目で分かるようにする */}
          <dl className="facts" aria-label={t('work.info.label')}>
            <div>
              <dt><C k="work.info.category" /></dt>
              <dd><CategoryLabel category={work.category} label={work.categoryLabel} /></dd>
            </div>
            <div>
              <dt><C k="work.info.date" /></dt>
              <dd><time dateTime={work.date}>{work.dateLabel}</time></dd>
            </div>
            {work.tags.length > 0 && (
              <div className="facts-wide">
                <dt><C k="work.info.tech" /></dt>
                <dd><TechList items={work.tags} className="facts-tech" /></dd>
              </div>
            )}
            {(work.url || work.github) && (
              <div>
                <dt><C k="work.info.links" /></dt>
                <dd className="facts-links">
                  {work.url && (
                    <a href={work.url} target="_blank" rel="noreferrer">
                      {hostOf(work.url)}
                      <Icon.External width={13} height={13} />
                    </a>
                  )}
                  {work.github && (
                    <a href={work.github} target="_blank" rel="noreferrer">
                      <C k="work.info.github" />
                      <Icon.External width={13} height={13} />
                    </a>
                  )}
                </dd>
              </div>
            )}
          </dl>

          {work.url && (
            <a href={work.url} target="_blank" rel="noreferrer" className="btn btn-primary page-head-action">
              <C k="work.openSite" />
              <Icon.External width={15} height={15} />
            </a>
          )}
          {download?.file && (
            <div className="work-download page-head-action">
              <div className="work-download-actions">
                <a href={download.file} download className="btn btn-primary">
                  <Icon.Download width={16} height={16} />
                  {download.downloadLabel ? <F item={download} field="downloadLabel" /> : <C k="common.download.button" />}
                </a>
                {download.guide && <a href={download.guide} className="text-link"><C k="common.download.guide" /><Icon.Arrow width={15} height={15} /></a>}
              </div>
              <p className="dl-spec">{[download.platform, download.size].filter(Boolean).join(' · ')}</p>
              {download.note && <p className="dl-note"><F item={download} field="note" /></p>}
            </div>
          )}
        </div>
      </header>

      {work.image && (
        <figure className="wrap detail-visual-wrap">
          <EditableImage item={work}>
            <button type="button" className="detail-visual" onClick={() => setZoomed(true)} aria-label={t('work.image.zoomLabel', { name: work.name })}>
              <Thumb src={work.image} alt={imageAlt} />
              <span className="zoom-hint" aria-hidden="true">
                <Icon.Zoom width={14} height={14} />
                <C k="work.image.zoomHint" />
              </span>
            </button>
          </EditableImage>
          {work.imageCaption && <figcaption className="detail-caption"><F item={work} field="imageCaption" /></figcaption>}
        </figure>
      )}
      {zoomed && <Lightbox src={work.image} alt={imageAlt} onClose={() => setZoomed(false)} />}

      {work.steps.length > 0 && (
        <section className="wrap detail-walkthrough" aria-labelledby="walkthrough-title">
          <h2 id="walkthrough-title"><C k="work.steps.title" /></h2>
          <L item={work} field="steps">
            <ol>
              {work.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </L>
        </section>
      )}

      {/* 本文は「見出しを左・文章を右」の2段組み。見出しだけを拾い読みしても流れが分かる */}
      <section className="section section-tight">
        <article className="wrap prose">
          {work.lead.length > 0 && (
            <div className="prose-lead">
              <Prose item={work} part="lead"><BlockList blocks={work.lead} /></Prose>
            </div>
          )}
          {work.sections.map((section, i) => (
            <section key={section.title} className="prose-section">
              <h2><SectionTitle item={work} section={i} /></h2>
              <div className="prose-body">
                <Prose item={work} part="body" section={i}><BlockList blocks={section.blocks} /></Prose>
              </div>
            </section>
          ))}
        </article>
      </section>

      {(previous || next) && (
        <nav className="wrap pager" aria-label={t('work.pager.label')}>
          {previous ? (
            <Link to={`/works/${previous.id}`} className="pager-link">
              <small><Icon.Back width={14} height={14} /><C k="work.pager.prev" /></small>
              <span><F item={previous} field="name" /></span>
            </Link>
          ) : <span />}
          {next ? (
            <Link to={`/works/${next.id}`} className="pager-link is-next">
              <small><C k="work.pager.next" /><Icon.Arrow width={14} height={14} /></small>
              <span><F item={next} field="name" /></span>
            </Link>
          ) : <span />}
        </nav>
      )}

      {related.length > 0 && (
        <section className="section">
          <div className="wrap">
            <SectionHead
              eyebrow={<C k="work.related.eyebrow" />}
              title={linkedWorks.length ? <C k="work.related.titleLinked" /> : <C k="work.related.titleSame" />}
              link={linkedWorks.length
                ? { to: '/works', label: <C k="work.related.allLink" /> }
                : { to: `/works?cat=${work.category}`, label: <C k="work.related.categoryLink" vars={{ category: work.categoryLabel }} /> }}
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
