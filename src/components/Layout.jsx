import { Fragment, useEffect, useRef, useState } from 'react';
import { Icon } from './Icon.jsx';
import { Link, navigate } from './ui.jsx';
import { EasterEgg } from './EasterEgg.jsx';
import { CLICKS_NEEDED, WINDOW_MS } from '../effects/index.js';
import { NAV_LINKS, PROFILE } from '../content/site.js';
import { t } from '../content/copy.js';
import { C, S } from '../editor/index.jsx';

// ---------- テーマ(ライト / ダーク) ----------
// 初期値は index.html のインラインスクリプトが決める(ちらつき防止)。
// ここではトグルと localStorage への保存だけを行う。
function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#0e1222' : '#f4f5f9');
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* 保存できない環境でも切り替え自体は続行する */
    }
    setTheme(next);
  };
  const label = theme === 'dark' ? t('layout.theme.toLight') : t('layout.theme.toDark');
  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label={label} title={label}>
      {theme === 'dark' ? <Icon.Sun /> : <Icon.Moon />}
    </button>
  );
}

// ---------- ロゴ ----------
// onRapidClicks を渡したときだけ連打を数える(トップページでのみ有効な隠し演出)
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
    <a href="#/" className="brand" onClick={handleClick} aria-label={t('layout.logo.label', { nameJa: PROFILE.nameJa })}>
      <span className="brand-mark" aria-hidden="true">TA</span>
      <span className="brand-name">
        <span className="brand-ja"><S path="PROFILE.nameJa" /></span>
        <span className="brand-en"><S path="PROFILE.nameEn" /></span>
      </span>
    </a>
  );
}

const isActive = (route, id) => route === id || route.startsWith(`${id}/`);

// ---------- ナビゲーション ----------
export function Nav({ route }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [eggOrigin, setEggOrigin] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ページが変わったら(戻る・進むも含めて)メニューを閉じる
  useEffect(() => {
    setOpen(false);
  }, [route]);

  // デスクトップ幅になったらメニューを閉じる(開いたまま画面を広げた場合に背面のスクロールが固まらないように)
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 961px)');
    const onChange = (e) => e.matches && setOpen(false);
    desktop.addEventListener('change', onChange);
    return () => desktop.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <Fragment>
      {eggOrigin && <EasterEgg origin={eggOrigin} onDone={() => setEggOrigin(null)} />}
      {/* ハッシュで画面を切り替えているので、#main へのリンクにはせずフォーカスだけ移す */}
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        <C k="layout.skipLink" />
      </a>
      <header className={`site-header ${scrolled || open ? 'is-raised' : ''}`}>
        <div className="wrap header-inner">
          <Logo onRapidClicks={route === '/' ? setEggOrigin : null} />
          <nav className="nav" aria-label={t('layout.nav.label')}>
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.id}
                to={link.id}
                className="nav-link"
                aria-current={isActive(route, link.id) ? 'page' : undefined}
              >
                <S path={`NAV_LINKS.${i}.label`} />
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <ThemeToggle />
            <button
              type="button"
              className={`icon-btn menu-btn ${open ? 'is-open' : ''}`}
              aria-label={open ? t('layout.menu.close') : t('layout.menu.open')}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen(!open)}
            >
              <span /><span />
            </button>
          </div>
        </div>
      </header>
      <div id="mobile-menu" className={`mobile-menu ${open ? 'is-open' : ''}`} hidden={!open}>
        <nav className="wrap mobile-menu-inner" aria-label={t('layout.mobileNav.label')}>
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.id}
              to={link.id}
              onNavigate={() => setOpen(false)}
              className="mobile-link"
              aria-current={isActive(route, link.id) ? 'page' : undefined}
            >
              <span className="mobile-link-en"><S path={`NAV_LINKS.${i}.label`} /></span>
              <span className="mobile-link-ja"><S path={`NAV_LINKS.${i}.title`} /></span>
              <Icon.Arrow />
            </Link>
          ))}
        </nav>
      </div>
    </Fragment>
  );
}

// ---------- フッター ----------
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Logo />
          <p className="footer-tagline"><S path="PROFILE.tagline" /></p>
          <p className="footer-desc">
            <C k="layout.footer.desc" vars={{ nameJa: PROFILE.nameJa, reading: PROFILE.reading, nickname: PROFILE.nickname, nameEn: PROFILE.nameEn, fields: PROFILE.fields }} />
          </p>
          <div className="footer-socials">
            {PROFILE.socials.map((social) => (
              <a key={social.id} className="icon-btn" href={social.url} target="_blank" rel="noreferrer" aria-label={t('common.newTab', { label: social.label })}>
                {social.id === 'github' ? <Icon.GitHub width={16} height={16} /> : <Icon.X width={14} height={14} />}
              </a>
            ))}
          </div>
        </div>
        <nav className="footer-nav" aria-label={t('layout.footerNav.label')}>
          <ul>
            {NAV_LINKS.map((link, i) => (
              <li key={link.id}>
                <Link to={link.id}>
                  <span className="footer-nav-en"><S path={`NAV_LINKS.${i}.label`} /></span>
                  <span className="footer-nav-ja"><S path={`NAV_LINKS.${i}.title`} /></span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="wrap footer-bottom">
        <small><C k="layout.footer.copyright" vars={{ nameEn: PROFILE.nameEn }} /></small>
      </div>
    </footer>
  );
}

// ---------- トップへ戻る ----------
export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 800);
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
      className={`icon-btn back-to-top ${show ? 'is-shown' : ''}`}
      aria-label={t('layout.backToTop')}
      tabIndex={show ? 0 : -1}
      onClick={toTop}
    >
      <Icon.Up />
    </button>
  );
}
