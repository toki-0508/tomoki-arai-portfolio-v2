import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon.jsx';
import { CategoryLabel, Link } from './ui.jsx';

const PREVIEW_W = 280;
const PREVIEW_H = 175;
const OFFSET = 24;

// マウスで指せる端末だけ、行に重ねたときに作品の画像をカーソルの横に出す
const canPreview = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// 作品の目次。年・作品名・種類・技術を1行ずつ並べ、全体を短時間で見渡せるようにする。
export function WorkIndex({ works }) {
  const [active, setActive] = useState(null);
  const previewRef = useRef(null);
  const preloaded = useRef(false);

  // 画像は初めてリストにカーソルが入ったときにまとめて読み込む(トップの初回表示を重くしない)
  const preload = () => {
    if (preloaded.current || !canPreview()) return;
    preloaded.current = true;
    for (const work of works) {
      if (work.image) new Image().src = work.image;
    }
  };

  const move = (event) => {
    const el = previewRef.current;
    if (!el) return;
    const fitsRight = event.clientX + OFFSET + PREVIEW_W < window.innerWidth;
    const x = fitsRight ? event.clientX + OFFSET : event.clientX - OFFSET - PREVIEW_W;
    const y = Math.min(Math.max(event.clientY - PREVIEW_H / 2, 8), window.innerHeight - PREVIEW_H - 8);
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  useEffect(() => {
    if (!active) return undefined;
    const hide = () => setActive(null);
    window.addEventListener('scroll', hide, { passive: true });
    return () => window.removeEventListener('scroll', hide);
  }, [active]);

  return (
    <div className="work-index-wrap" onPointerEnter={preload}>
      <ul className="work-index">
        {works.map((work) => (
          <li key={work.id}>
            <Link
              to={`/works/${work.id}`}
              className="index-row"
              onMouseEnter={(event) => {
                if (!canPreview() || !work.image) return;
                move(event);
                setActive(work);
              }}
              onMouseMove={move}
              onMouseLeave={() => setActive(null)}
            >
              <time className="index-year" dateTime={work.date}>{work.date.slice(0, 4)}</time>
              <span className="index-title">{work.name}</span>
              <span className="index-cat"><CategoryLabel category={work.category} label={work.categoryLabel} /></span>
              <span className="index-tech">{work.tags.slice(0, 3).join(' · ')}</span>
              <Icon.Arrow className="index-arrow" width={16} height={16} />
            </Link>
          </li>
        ))}
      </ul>
      {/* ページ切り替えのアニメーション(transform)の影響を受けないよう body 直下に置く */}
      {createPortal(
        <div ref={previewRef} className={`index-preview ${active ? 'is-shown' : ''}`} aria-hidden="true">
          {active && <img src={active.image} alt="" />}
        </div>,
        document.body,
      )}
    </div>
  );
}
