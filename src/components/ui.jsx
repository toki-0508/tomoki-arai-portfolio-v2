import { useEffect, useRef, useState } from 'react';

// ---------- ルーティング ----------
export function navigate(path) {
  window.location.hash = path;
  window.scrollTo({ top: 0, behavior: 'auto' });
}

// サイト内リンク。href は '/works' のようなルートパスで渡す。
export function Link({ to, className, children, onNavigate, ...rest }) {
  const handleClick = (e) => {
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

// ---------- セクションラベル ----------
export function SectionLabel({ children }) {
  return (
    <div className="section-label">
      <span className="section-label-dot" aria-hidden="true" />
      {children}
    </div>
  );
}

// ---------- スクロール連動の出現アニメーション ----------
// 子要素はそのまま描画し、見えたら .in を付ける。
// prefers-reduced-motion 時は CSS 側でアニメーションを無効化する。
export function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...rest }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setSeen(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${seen ? 'in' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// ---------- サムネイル ----------
// 読み込み完了までは薄いプレースホルダー、完了後にふわっと表示する。
// スクリーンショットの縦横比はバラバラなので、フレームは常に同じ比率のまま
// 横長 → cover / 縦長・正方形に近い → contain + ぼかし背景 で見え方を揃える。
export function Thumb({ src, alt = '' }) {
  const [loaded, setLoaded] = useState(false);
  const [portrait, setPortrait] = useState(false);
  if (!src) return <div className="thumb thumb-empty" aria-hidden="true" />;

  const onLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setPortrait(naturalHeight > 0 && naturalWidth / naturalHeight < 1.2);
    setLoaded(true);
  };

  return (
    <div className={`thumb ${loaded ? 'loaded' : ''} ${portrait ? 'portrait' : ''}`}>
      {portrait && <img className="thumb-backdrop" src={src} alt="" aria-hidden="true" />}
      <img className="thumb-main" src={src} alt={alt} loading="lazy" onLoad={onLoad} />
    </div>
  );
}

// ---------- カテゴリチップ ----------
export function CategoryChip({ category, label }) {
  return <span className={`cat-chip cat-${category}`}>{label}</span>;
}

// ---------- ライトボックス(画像の拡大表示) ----------
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
      <button type="button" className="lightbox-close" aria-label="閉じる" onClick={onClose}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
