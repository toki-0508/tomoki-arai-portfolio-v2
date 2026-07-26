import { Fragment, useEffect, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';
import { Link, navigate } from './ui.jsx';
import { EasterEgg } from './EasterEgg.jsx';
import { CLICKS_NEEDED, WINDOW_MS } from '../effects/index.js';
import { NAV_LINKS, PROFILE } from '../content/site.js';

// ---------- テーマ(ライト / ダーク) ----------
// 初期値は index.html のインラインスクリプトが決める(FOUC 回避)。
// ここではトグルと localStorage への保存だけを行う。
function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch { /* プライベートモードなどで保存できなくても動作は継続する */ }
    setTheme(next);
  };
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      {theme === 'dark' ? <Icon.Sun /> : <Icon.Moon />}
    </button>
  );
}

// ---------- ロゴ ----------
// onRapidClicks が渡されたときだけ連打を数える(Home 表示時のみ)。
function Logo({ onRapidClicks }) {
  const clicks = useRef([]);
  const handleClick = (e) => {
    e.preventDefault();
    navigate('/');
    if (!onRapidClicks) return;
    const now = Date.now();
    clicks.current = clicks.current.filter((t) => now - t < WINDOW_MS);
    clicks.current.push(now);
    if (clicks.current.length >= CLICKS_NEEDED) {
      clicks.current = [];
      const box = e.currentTarget.getBoundingClientRect();
      onRapidClicks({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
    }
  };
  return (
    <a href="#/" className="brand" onClick={handleClick}>
      <span className="brand-mark" aria-hidden="true">TA</span>
      <span className="brand-name">
        <span className="brand-jp">{PROFILE.nameJa}</span>
        <span className="brand-en">{PROFILE.nameEn}</span>
      </span>
    </a>
  );
}

// ---------- ナビゲーション ----------
export function Nav({ route }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [eggOrigin, setEggOrigin] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isActive = (id) => (id === '/' ? route === '/' : route.startsWith(id));

  return (
    <Fragment>
      {eggOrigin && <EasterEgg origin={eggOrigin} onDone={() => setEggOrigin(null)} />}
      <a href="#main" className="skip-link">本文へスキップ</a>
      <header className={`nav ${scrolled ? 'scrolled' : ''} ${open ? 'nav-open' : ''}`}>
        <div className="wrap nav-inner">
          <Logo onRapidClicks={route === '/' ? setEggOrigin : null} />
          <nav className="nav-links" aria-label="メインナビゲーション">
            {NAV_LINKS.map((link) => (
              <Link key={link.id} to={link.id} className={`nav-link ${isActive(link.id) ? 'active' : ''}`}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="nav-actions">
            <ThemeToggle />
            <button
              type="button"
              className={`burger ${open ? 'open' : ''}`}
              aria-label="メニュー"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>
      <div className={`mobile-menu ${open ? 'open' : ''}`}>
        <nav className="mobile-menu-inner" aria-label="モバイルナビゲーション">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.id}
              to={link.id}
              onNavigate={() => setOpen(false)}
              className={`mobile-link ${isActive(link.id) ? 'active' : ''}`}
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              <span className="mobile-link-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="mobile-link-label">{link.label}</span>
              <Icon.Arrow />
            </Link>
          ))}
        </nav>
      </div>
    </Fragment>
  );
}

// ---------- スクロール進捗バー ----------
// ページをどこまで読んだかを最上部の細いバーで示す。
export function ScrollProgress() {
  const barRef = useRef(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className="scroll-progress" aria-hidden="true">
      <div ref={barRef} className="scroll-progress-bar" />
    </div>
  );
}

// ---------- トップへ戻るボタン ----------
export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      className={`back-to-top ${show ? 'show' : ''}`}
      aria-label="ページの先頭へ戻る"
      tabIndex={show ? 0 : -1}
      onClick={toTop}
    >
      <Icon.Up />
    </button>
  );
}

// ---------- フッター ----------
export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Logo />
          <p className="footer-tagline">{PROFILE.tagline}</p>
          <p className="footer-desc">
            {PROFILE.nameJa}({PROFILE.reading} / {PROFILE.nickname} / {PROFILE.romaji})のポートフォリオサイト。
            Web制作・アプリ開発・3D制作の作品と公開データを紹介しています。
          </p>
          <div className="footer-socials">
            {PROFILE.socials.map((social) => (
              <a key={social.id} href={social.url} target="_blank" rel="noreferrer" aria-label={social.label}>
                {social.id === 'github' ? <Icon.GitHub width={16} height={16} /> : <Icon.X width={14} height={14} />}
              </a>
            ))}
          </div>
        </div>
        <nav className="footer-col" aria-label="フッターナビゲーション">
          <h5>メニュー</h5>
          <ul className="footer-menu-links">
            {NAV_LINKS.filter((link) => link.id !== '/').map((link) => (
              <li key={link.id}>
                <Link to={link.id}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="wrap footer-bottom">
        <span>© 2026 {PROFILE.nameEn} All Rights Reserved.</span>
      </div>
    </footer>
  );
}
