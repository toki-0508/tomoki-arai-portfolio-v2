// 音源のカバー画像。曲名から色と波形を決めて生成するので、
// 曲ごとに見た目が違いつつ、シリーズとしての統一感が出る。
function hashOf(text) {
  let h = 0;
  for (const ch of text) h = (h + ch.codePointAt(0)) | 0;
  return Math.abs(h);
}

// 曲名ごとに毎回同じ波形になるよう、シード付きの乱数を使う
function seeded(seed) {
  let a = seed || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VARIANTS = ['accent', 'ink', 'tint'];
const BAR_COUNT = 26;

export function SoundCover({ name, length }) {
  const h = hashOf(name);
  const variant = VARIANTS[h % VARIANTS.length];
  const rand = seeded(h);
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const envelope = Math.sin(((i + 0.5) / BAR_COUNT) * Math.PI);
    return 5 + (rand() * 0.7 + 0.3) * envelope * 34;
  });

  return (
    <svg className={`sound-cover sound-cover-${variant}`} viewBox="0 0 120 120" role="img" aria-label={`${name} のカバー`}>
      <rect className="sc-bg" width="120" height="120" />
      <text className="sc-label" x="12" y="21">SOUND{length ? ` · ${length}` : ''}</text>
      <g className="sc-bars">
        {bars.map((barHeight, i) => (
          <rect key={i} x={12 + i * 3.7} y={60 - barHeight / 2} width="2" height={barHeight} rx="1" />
        ))}
      </g>
      <text className="sc-title" x="12" y="104">{name}</text>
    </svg>
  );
}
