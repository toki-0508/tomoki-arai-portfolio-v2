// 画像のない配布物のカバー。名前から色と模様を決めて生成するので、
// 1件ごとに見た目が違いつつ、シリーズとしての統一感が出る。
//   pattern="wave"   … 音源(波形)
//   pattern="blocks" … それ以外(ブロック)
function hashOf(text) {
  let h = 0;
  for (const ch of text) h = (h + ch.codePointAt(0)) | 0;
  return Math.abs(h);
}

// 名前ごとに毎回同じ模様になるよう、シード付きの乱数を使う
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

function Wave({ rand }) {
  const count = 26;
  return Array.from({ length: count }, (_, i) => {
    const envelope = Math.sin(((i + 0.5) / count) * Math.PI);
    const h = 5 + (rand() * 0.7 + 0.3) * envelope * 34;
    return <rect key={i} x={12 + i * 3.7} y={60 - h / 2} width="2" height={h} rx="1" />;
  });
}

function Blocks({ rand }) {
  const cols = 8;
  const rows = 4;
  const size = 10;
  const blocks = [];
  for (let c = 0; c < cols; c++) {
    // 列ごとに高さの違う「積み上げたブロック」にする
    const height = 1 + Math.floor(rand() * rows);
    for (let r = 0; r < height; r++) {
      blocks.push(<rect key={`${c}-${r}`} x={12 + c * 12} y={84 - (r + 1) * 12} width={size} height={size} rx="1.5" opacity={0.55 + rand() * 0.45} />);
    }
  }
  return blocks;
}

export function GeneratedCover({ name, label, pattern = 'wave' }) {
  const h = hashOf(name);
  const variant = VARIANTS[h % VARIANTS.length];
  const rand = seeded(h);

  return (
    <svg className={`gen-cover gen-cover-${variant}`} viewBox="0 0 120 120" role="img" aria-label={`${name} のカバー`}>
      <rect className="gc-bg" width="120" height="120" />
      <text className="gc-label" x="12" y="21">{label}</text>
      <g className="gc-shapes">{pattern === 'blocks' ? <Blocks rand={rand} /> : <Wave rand={rand} />}</g>
      <text className="gc-title" x="12" y="104">{name}</text>
    </svg>
  );
}
