import { lazy, Suspense, useEffect, useState } from 'react';
import { asset } from '../asset.js';
import { t } from '../content/copy.js';
import { C } from '../editor/index.jsx';

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

export function Hero3D() {
  const loadCanvas = useWhenIdle();
  const [interactive, setInteractive] = useState(false);

  return (
    <figure className={`hero-visual${interactive ? ' is-interactive' : ''}`}>
      {!interactive && (
        <img className="hero-poster" src={asset('/images/projects/mouse-model.png')} alt={t('home.hero3d.alt')} width="320" height="320" />
      )}
      {loadCanvas && <Suspense fallback={null}><LazyCanvas onReady={setInteractive} /></Suspense>}
      <figcaption className="intro-caption hero-caption">
        <span><C k="home.hero3d.caption" /></span>
        <span><C k="home.hero3d.tool" />{interactive && ' / '}{interactive && <C k="home.hero3d.dragHint" />}</span>
      </figcaption>
    </figure>
  );
}
