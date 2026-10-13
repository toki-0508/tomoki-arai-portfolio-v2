import { lazy, Suspense } from 'react';

// Three.js 本体はここで初めて読み込む(初期バンドルを軽く保つ)
const LazyCanvas = lazy(() => import('./Hero3DCanvas.jsx'));

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
  return (
    <div className="hero-visual">
      <Suspense fallback={<div className="hero-canvas" aria-hidden="true" />}>
        <LazyCanvas />
      </Suspense>
      <HeroNote />
    </div>
  );
}
