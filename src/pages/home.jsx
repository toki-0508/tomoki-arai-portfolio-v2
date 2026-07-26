import { Icon } from '../components/Icon.jsx';
import { Hero3D } from '../components/Hero3D.jsx';
import { WorkCard } from '../components/WorkCard.jsx';
import { DownloadRow } from '../components/DownloadRow.jsx';
import { Link, Reveal, SectionLabel } from '../components/ui.jsx';
import { DOWNLOADS, WORKS, featuredWorks } from '../content/loader.js';
import { PROFILE } from '../content/site.js';

const CATEGORY_LINKS = [
  { title: 'Web', desc: 'Web制作を見る', icon: Icon.Monitor, to: '/works?cat=web' },
  { title: 'App', desc: 'アプリ開発を見る', icon: Icon.Smartphone, to: '/works?cat=app' },
  { title: '3D', desc: '3D制作を見る', icon: Icon.Box, to: '/works?cat=3d' },
];

export function HomePage() {
  const featured = featuredWorks(3);
  const latestUpdate = WORKS[0]?.dateLabel ?? '-';

  return (
    <div className="page-enter">
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <SectionLabel>Hello! I'm {PROFILE.nameEn}</SectionLabel>
            <h1 className="h-display">
              <span className="line">Web、アプリ、3Dを活用し</span>
              <span className="line"><em>面白い</em>を形にする</span>
            </h1>
            <p className="h-body">
              使って便利で楽しいと感じられるようなサービスやコンテンツを作ることを掲げ、学習しながら制作活動を行っています。
              このポートフォリオでは、制作物や公開データを通じて、私の考え方とスキルを紹介します。
            </p>
            <div className="hero-ctas">
              <Link to="/works" className="btn btn-primary">作品を見る <Icon.Arrow className="arrow" /></Link>
              <Link to="/downloads" className="btn btn-ghost">ダウンロード <Icon.Arrow /></Link>
            </div>
            <dl className="hero-stats" aria-label="サイトの概況">
              <div><dt>Works</dt><dd>{WORKS.length}</dd></div>
              <div><dt>Downloads</dt><dd>{DOWNLOADS.length}</dd></div>
              <div><dt>Last update</dt><dd>{latestUpdate}</dd></div>
            </dl>
          </div>
          <div className="hero-visual">
            <Hero3D />
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <Reveal className="section-head">
            <div>
              <SectionLabel>Featured Works</SectionLabel>
              <h2 className="h-section">注目の作品</h2>
            </div>
            <Link to="/works" className="section-link">すべての作品を見る <Icon.Arrow /></Link>
          </Reveal>
          <div className="grid-3">
            {featured.map((work, i) => (
              <Reveal key={work.id} delay={i * 80}>
                <WorkCard work={work} index={i + 1} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="block category-band">
        <div className="wrap category-grid">
          {CATEGORY_LINKS.map(({ title, desc, icon: Ico, to }, i) => (
            <Reveal key={title} delay={i * 60}>
              <Link to={to} className="category-link">
                <span className="category-icon"><Ico /></span>
                <span className="category-text"><strong>{title}</strong><small>{desc}</small></span>
                <Icon.Arrow />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <Reveal className="section-head">
            <div>
              <SectionLabel>Downloads</SectionLabel>
              <h2 className="h-section">公開データ</h2>
            </div>
            <Link to="/downloads" className="section-link">公開データを見る <Icon.Arrow /></Link>
          </Reveal>
          <div className="dl-list">
            {DOWNLOADS.slice(0, 3).map((file, i) => (
              <Reveal key={file.id} delay={i * 60}>
                <DownloadRow file={file} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <Reveal className="cta-panel">
            <div>
              <h2 className="h-section">一緒に何か作りませんか?</h2>
              <p>制作のご相談・ご依頼など、お気軽にご連絡ください。</p>
            </div>
            <Link to="/contact" className="btn btn-primary">お問い合わせ <Icon.Arrow className="arrow" /></Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
