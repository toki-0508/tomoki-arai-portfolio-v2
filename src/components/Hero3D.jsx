import { lazy, Suspense } from 'react';

const LazyCanvas = lazy(() => import('./Hero3DCanvas.jsx'));

function Fallback() {
  return (
    <div className="hero-3d" aria-hidden="true">
      <div className="hero-3d-backdrop" />
      <div className="hero-3d-canvas" />
    </div>
  );
}

// Three.js 本体はここで初めて読み込む(初期バンドルを軽く保つ)。
export function Hero3D() {
  return (
    <Suspense fallback={<Fallback />}>
      <LazyCanvas />
    </Suspense>
  );
}
