import { useEffect, useRef, useState } from 'react';

export function useMotionCamera(target, enabled) {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [rendered, setRendered] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!enabled || reduced) {
      current.current = target;
      setRendered(target);
      return;
    }
    let frame;
    let previous = performance.now();
    const step = (now) => {
      // Time-based damping stays consistent on 60 Hz and high-refresh displays.
      const amount = 1 - Math.exp(-Math.min(64, now - previous) / 65);
      previous = now;
      const before = current.current;
      const settled =
        Math.abs(before.x - target.x) < 0.15 &&
        Math.abs(before.y - target.y) < 0.15 &&
        Math.abs(before.scale - target.scale) < 0.0002;
      const next = settled
        ? target
        : {
            x: before.x + (target.x - before.x) * amount,
            y: before.y + (target.y - before.y) * amount,
            scale: before.scale + (target.scale - before.scale) * amount,
          };
      current.current = next;
      setRendered(next);
      if (!settled) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, enabled, reduced]);
  return enabled && !reduced ? rendered : target;
}
