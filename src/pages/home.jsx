import { Fragment } from 'react';
import { Icon } from '../components/Icon.jsx';
import { Hero3D } from '../components/Hero3D.jsx';
import { WorkCard } from '../components/WorkCard.jsx';
import { WorkIndex } from '../components/WorkIndex.jsx';
import { DownloadRow } from '../components/DownloadRow.jsx';
import { Link, SectionHead } from '../components/ui.jsx';
import { DOWNLOADS, WORKS, featuredWorks } from '../content/loader.js';
import { PROFILE } from '../content/site.js';
import { C, S } from '../editor/index.jsx';

// キャッチコピーは PROFILE.tagline から組み立てる(フッターや OG 画像と必ず一致させるため)。
// 「、」の後ろで改行し、「好き」に手書きの下線を引く。
function Tagline({ text }) {
  // 正規表現の後読みは古い Safari で構文エラーになるため使わない
  const parts = text.split('、');
  const phrases = parts.map((part, i) => (i < parts.length - 1 ? `${part}、` : part)).filter(Boolean);
  return phrases.map((phrase, i) => {
    const at = phrase.indexOf('好き');
    if (at < 0) return <span key={i} className="phrase">{phrase}</span>;
    return (
      <span key={i} className="phrase">
        {phrase.slice(0, at)}
        <span className="ink-mark">
          好き
          <svg viewBox="0 0 120 16" aria-hidden="true" focusable="false">
            <path pathLength="1" d="M3 10.5C26 6 52 12.5 78 8.5S108 6 117 7" />
          </svg>
        </span>
        {phrase.slice(at + 2)}
      </span>
    );
  });
}

export function HomePage() {
  const featured = featuredWorks(3);
  const others = WORKS.filter((work) => !featured.includes(work));

  return (
    <Fragment>
      <section className="hero intro-band" aria-labelledby="hero-title">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="eyebrow intro-kicker"><C k="home.hero.eyebrow" vars={{ nameEn: PROFILE.nameEn }} /></p>
            <h1 className="intro-title" id="hero-title">
              <S path="PROFILE.tagline"><Tagline text={PROFILE.tagline} /></S>
            </h1>
            <p className="intro-lead">
              <C k="home.hero.lead" vars={{ affiliation: PROFILE.affiliation, nameJa: PROFILE.nameJa }} />
            </p>
            <div className="hero-actions">
              <Link to="/works" className="btn btn-primary">
                <C k="home.hero.worksButton" />
                <Icon.Arrow width={16} height={16} />
              </Link>
              <Link to="/about" className="text-link"><C k="home.hero.profileLink" /><Icon.Arrow width={15} height={15} /></Link>
            </div>
          </div>
        </div>
        <Hero3D />
      </section>

      {featured.length > 0 && (
        <section className="section showcase-section">
          <div className="wrap">
            <SectionHead
              eyebrow={<C k="home.featured.eyebrow" />}
              title={<C k="home.featured.title" />}
              link={{ to: '/works', label: <C k="home.featured.link" /> }}
            />
            <div className="card-grid showcase-grid">
              {featured.map((work, index) => (
                <WorkCard key={work.id} work={work} number={String(index + 1).padStart(2, '0')} />
              ))}
            </div>
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="section section-flush">
          <div className="wrap">
            <SectionHead
              eyebrow={<C k="home.more.eyebrow" />}
              title={<C k="home.more.title" />}
              link={{ to: '/works', label: <C k="home.more.link" /> }}
            />
            <WorkIndex works={others} />
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap">
          <SectionHead
            eyebrow={<C k="home.downloads.eyebrow" />}
            title={<C k="home.downloads.title" />}
            link={{ to: '/downloads', label: <C k="home.downloads.link" /> }}
          />
          <div className="dl-list">
            {DOWNLOADS.slice(0, 3).map((file) => <DownloadRow key={file.id} file={file} compact />)}
          </div>
        </div>
      </section>

      <section className="section section-flush">
        <div className="wrap">
          <div className="cta">
            <div>
              <h2 className="section-title"><C k="home.cta.title" /></h2>
              <p><C k="home.cta.text" /></p>
            </div>
            <Link to="/contact" className="btn btn-primary">
              <C k="home.cta.button" />
              <Icon.Arrow width={16} height={16} />
            </Link>
          </div>
        </div>
      </section>
    </Fragment>
  );
}
