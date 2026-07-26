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
export function Thumb({ src, alt = '' }) {
  const [loaded, setLoaded] = useState(false);
  if (!src) return <div className="thumb thumb-empty" aria-hidden="true" />;
  return (
    <div className={`thumb ${loaded ? 'loaded' : ''}`}>
      <img src={src} alt={alt} loading="lazy" onLoad={() => setLoaded(true)} />
    </div>
  );
}

// ---------- カテゴリチップ ----------
export function CategoryChip({ category, label }) {
  return <span className={`cat-chip cat-${category}`}>{label}</span>;
}
