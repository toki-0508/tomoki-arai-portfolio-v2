import { useEffect, useState } from 'react';
import { Icon } from './Icon.jsx';

// ---------- ルーティング ----------
export function navigate(path) {
  window.location.hash = path;
  window.scrollTo({ top: 0, behavior: 'auto' });
}

// サイト内リンク。to は '/works' のようなルートパスで渡す。
export function Link({ to, className, children, onNavigate, ...rest }) {
  const handleClick = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // 新しいタブで開く操作は邪魔しない
    e.preventDefault();
    navigate(to);
    onNavigate?.();
  };
  return (
    <a href={`#${to}`} className={className} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

// ---------- 見出し ----------
// ページ見出し: 英語の小見出し(=ナビの表記)+ 日本語の h1 + リード文。全ページこの形にそろえる。
export function PageHead({ eyebrow, title, lead, children }) {
  return (
    <header className="page-head">
      <div className="wrap">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {children}
      </div>
    </header>
  );
}

// セクション見出し: 英語の小見出し + h2 + 任意の補足 + 任意の「すべて見る」リンク。
// 小見出しはページ見出し(PageHead)と同じ「英語 → 日本語」の組み立てにそろえる。
export function SectionHead({ eyebrow, title, note, link }) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && <p className="eyebrow section-eyebrow">{eyebrow}</p>}
        <h2 className="section-title">{title}</h2>
        {note && <p className="section-note">{note}</p>}
      </div>
      {link && (
        <Link to={link.to} className="text-link">
          {link.label}
          <Icon.Arrow width={16} height={16} />
        </Link>
      )}
    </div>
  );
}

// ---------- カテゴリ ----------
const CATEGORY_ICONS = {
  web: Icon.Monitor,
  app: Icon.Smartphone,
  '3d': Icon.Box,
  electronics: Icon.Chip,
  sounds: Icon.Note,
  other: Icon.Spark,
};

export function CategoryLabel({ category, label }) {
  const Ico = CATEGORY_ICONS[category] ?? Icon.Spark;
  return (
    <span className="cat-label">
      <Ico width={14} height={14} />
      {label}
    </span>
  );
}

// 使用技術を「React · Three.js · Vite」の形で並べる
export function TechList({ items, className = '' }) {
  if (!items?.length) return null;
  return (
    <ul className={`tech-list ${className}`} aria-label="使用技術">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

// ---------- サムネイル ----------
// スクリーンショットの縦横比はばらばらなので、枠は常に同じ比率に固定し、
// 横長は cover、縦長や正方形に近いものは contain にして、下地の上に影付きで置く。
export function Thumb({ src, alt = '' }) {
  const [loaded, setLoaded] = useState(false);
  const [portrait, setPortrait] = useState(false);
  if (!src) return <div className="thumb thumb-empty" aria-hidden="true" />;

  const onLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setPortrait(naturalHeight > 0 && naturalWidth / naturalHeight < 1.2);
    setLoaded(true);
  };

  return (
    <div className={`thumb ${loaded ? 'is-loaded' : ''} ${portrait ? 'is-portrait' : ''}`}>
      <img className="thumb-main" src={src} alt={alt} loading="lazy" decoding="async" onLoad={onLoad} />
    </div>
  );
}

// ---------- ライトボックス ----------
// 背景クリック・Esc・閉じるボタンで閉じる。表示中は背面のスクロールを止める。
export function Lightbox({ src, alt = '', onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={alt || '画像の拡大表示'} onClick={onClose}>
      <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
      <button type="button" className="lightbox-close" aria-label="閉じる" onClick={onClose} autoFocus>
        <Icon.Close width={20} height={20} />
      </button>
    </div>
  );
}
