import { Fragment } from 'react';
import { Icon } from '../components/Icon.jsx';
import { Hero3D } from '../components/Hero3D.jsx';
import { WorkCard } from '../components/WorkCard.jsx';
import { WorkIndex } from '../components/WorkIndex.jsx';
import { DownloadRow } from '../components/DownloadRow.jsx';
import { Link, SectionHead } from '../components/ui.jsx';
import { DOWNLOADS, WORKS, featuredWorks } from '../content/loader.js';
import { PROFILE } from '../content/site.js';

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
  const leadWork = featured[0];
  const others = WORKS.filter((work) => !featured.includes(work));

  return (
    <Fragment>
      <section className="hero" aria-labelledby="hero-title">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{PROFILE.nameEn} / {PROFILE.fieldsEn}</p>
            <h1 className="hero-title" id="hero-title">
              <Tagline text={PROFILE.tagline} />
            </h1>
            <p className="hero-lead">
              {PROFILE.affiliation}の{PROFILE.nameJa}です。写真をまとめるアプリから、基板を設計したマウスまで。日常の小さな不便を見つけて、使える形にしています。
            </p>
            <div className="hero-actions">
              <Link to={leadWork ? `/works/${leadWork.id}` : '/works'} className="btn btn-primary">
                {leadWork ? `${leadWork.name}を見る` : '作品を見る'}
                <Icon.Arrow width={16} height={16} />
              </Link>
              <Link to="/works" className="text-link">作品一覧</Link>
            </div>
          </div>
        </div>
        <Hero3D />
      </section>

      {featured.length > 0 && (
        <section className="section showcase-section">
          <div className="wrap">
            <SectionHead eyebrow="Selected Works" title="代表作" link={{ to: '/works', label: 'すべての作品を見る' }} />
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
            <SectionHead eyebrow="More Works" title="そのほかの作品" link={{ to: '/works', label: '作品一覧へ' }} />
            <WorkIndex works={others} />
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap">
          <SectionHead eyebrow="Downloads" title="ダウンロード" link={{ to: '/downloads', label: 'すべて見る' }} />
          <div className="dl-list">
            {DOWNLOADS.slice(0, 3).map((file) => <DownloadRow key={file.id} file={file} compact />)}
          </div>
        </div>
      </section>

      <section className="section section-flush">
        <div className="wrap">
          <div className="cta">
            <div>
              <h2 className="section-title">一緒に何か作りませんか？</h2>
              <p>インターンや制作のご相談など、お気軽にご連絡ください。</p>
            </div>
            <Link to="/contact" className="btn btn-primary">
              お問い合わせ
              <Icon.Arrow width={16} height={16} />
            </Link>
          </div>
        </div>
      </section>
    </Fragment>
  );
}
