import { lazy, Suspense, useEffect, useState } from 'react';

// Three.js 本体(約590KB)はここで初めて読み込む。
// さらに、ページの初回表示が終わってブラウザが空いてから読み込みを始める
// (見出しなどの表示を Three.js の解析で遅らせないため)。
const LazyCanvas = lazy(() => import('./Hero3DCanvas.jsx'));

function useWhenIdle(timeout = 1200) {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setIdle(true), { timeout });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setIdle(true), 200);
    return () => window.clearTimeout(id);
  }, [timeout]);
  return idle;
}

// 手書きの注釈。見出しの下線と同じインクで、3Dモデルが何なのかを説明する。
// 線を引く演出は CSS 側(.hero-note)。モーションを減らす設定では最初から完成形で出る。
function HeroNote() {
  return (
    <div className="hero-note">
      <svg className="hero-note-arrow" viewBox="0 0 120 80" aria-hidden="true" focusable="false">
        <path pathLength="1" d="M8 74C30 71 72 58 108 14" />
        <path pathLength="1" d="M95.8 18.7 108 14l-2 12.9" />
      </svg>
      <p className="hero-note-text">
        Blenderで作ったマウスです。
        <br />
        ドラッグで回せます。
      </p>
    </div>
  );
}

export function Hero3D() {
  const ready = useWhenIdle();
  const placeholder = <div className="hero-canvas" aria-hidden="true" />;
  return (
    <div className="hero-visual">
      {ready ? <Suspense fallback={placeholder}><LazyCanvas /></Suspense> : placeholder}
      <HeroNote />
    </div>
  );
}
