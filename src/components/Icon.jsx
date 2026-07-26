// 線画で統一した小さなアイコンセット。stroke は currentColor を使う。
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const Icon = {
  Arrow: (p) => (
    <svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  ),
  Back: (p) => (
    <svg {...base} {...p}><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
  ),
  External: (p) => (
    <svg {...base} {...p}><path d="M14 4h6v6M20 4L10 14M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" /></svg>
  ),
  Download: (p) => (
    <svg {...base} {...p}><path d="M12 4v11M6.5 10.5 12 16l5.5-5.5M4 20h16" /></svg>
  ),
  Mail: (p) => (
    <svg {...base} {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
  ),
  Monitor: (p) => (
    <svg {...base} {...p}><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M9 21h6M12 17v4" /></svg>
  ),
  Smartphone: (p) => (
    <svg {...base} {...p}><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></svg>
  ),
  Box: (p) => (
    <svg {...base} {...p}><path d="m12 2.5 8.5 4.9v9.2L12 21.5l-8.5-4.9V7.4z" /><path d="m3.5 7.4 8.5 4.9 8.5-4.9M12 12.3v9.2" /></svg>
  ),
  Chart: (p) => (
    <svg {...base} {...p}><path d="M4 20V4M4 20h16" /><path d="M8 16v-5M12 16V8M16 16v-3" /></svg>
  ),
  Pen: (p) => (
    <svg {...base} {...p}><path d="m14.5 5 4.5 4.5L8.5 20 3.5 20.5 4 15.5zM12.5 7l4.5 4.5" /></svg>
  ),
  Play: (p) => (
    <svg {...base} {...p} fill="currentColor" stroke="none"><path d="M8 5.5v13l11-6.5z" /></svg>
  ),
  Pause: (p) => (
    <svg {...base} {...p} fill="currentColor" stroke="none"><rect x="7" y="5" width="3.4" height="14" rx="1" /><rect x="13.6" y="5" width="3.4" height="14" rx="1" /></svg>
  ),
  Sun: (p) => (
    <svg {...base} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" /></svg>
  ),
  Moon: (p) => (
    <svg {...base} {...p}><path d="M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5Z" /></svg>
  ),
  GitHub: (p) => (
    <svg {...base} {...p} fill="currentColor" stroke="none"><path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-1.9c-3.12.68-3.78-1.32-3.78-1.32-.51-1.3-1.25-1.64-1.25-1.64-1.02-.7.08-.68.08-.68 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.64 1.22 3.28.93.1-.72.4-1.22.71-1.5-2.49-.28-5.1-1.24-5.1-5.54 0-1.22.44-2.22 1.16-3-.12-.28-.5-1.42.1-2.97 0 0 .95-.3 3.08 1.15a10.7 10.7 0 0 1 5.6 0c2.14-1.45 3.08-1.15 3.08-1.15.61 1.55.23 2.69.11 2.97.72.78 1.16 1.78 1.16 3 0 4.3-2.62 5.25-5.12 5.53.4.35.76 1.03.76 2.07v3.07c0 .3.2.65.78.54A11.2 11.2 0 0 0 12 .8Z" /></svg>
  ),
  X: (p) => (
    <svg {...base} {...p} fill="currentColor" stroke="none"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23zm-1.16 17.52h1.83L7.08 4.13H5.12z" /></svg>
  ),
  Spark: (p) => (
    <svg {...base} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></svg>
  ),
  Zoom: (p) => (
    <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m20.5 20.5-4.6-4.6M11 8v6M8 11h6" /></svg>
  ),
  Up: (p) => (
    <svg {...base} {...p}><path d="M12 19V5M6 11l6-6 6 6" /></svg>
  ),
};
