// ============================================================
// サイト全体で使うプロフィール・固定コンテンツ
// 作品・ダウンロードは works/ downloads/ の md で管理する。
// ============================================================

export const PROFILE = {
  nameJa: '新井智己',
  nameEn: 'Tomoki Arai',
  role: 'Web / App / 3D Creator',
  tagline: '身の回りを、ちょっと好きになる。',
  email: 'toki.zeno.0508@gmail.com',
  socials: [
    { id: 'github', label: 'GitHub', url: 'https://github.com/toki-0508' },
    { id: 'x', label: 'X', url: 'https://x.com/zeno_arai' },
  ],
};

export const NAV_LINKS = [
  { id: '/', label: 'Home' },
  { id: '/about', label: 'About' },
  { id: '/works', label: 'Works' },
  { id: '/downloads', label: 'Downloads' },
  { id: '/contact', label: 'Contact' },
];

export const MVV = [
  {
    label: 'Mission',
    title: '身近な不便を、触って楽しいモノに変える',
    text: '日常の中にある小さな困りごとや退屈を、Web・アプリ・3Dの力で使いやすく、少しでもワクワクするような形にしていきます。',
  },
  {
    label: 'Vision',
    title: '全てのものに愛着が持てる社会を作る',
    text: '身の回りにあるものにはこだわって欲しいし、それを好きになれることはとても幸せで、QOLが高くてより幸せな世界だと思います。',
  },
  {
    label: 'Values',
    title: 'わかりやすく、気持ちよく、続けて磨く',
    text: '見た目の良さだけでなく、使う人が迷わないこと、触って心地よいこと、作った後も使い続けられることを大切にします。',
  },
];

export const INTERESTS = [
  { icon: 'pen', title: 'つくること', text: 'アイデアを形にするのが好きです。' },
  { icon: 'play', title: 'あそぶこと', text: '作ったものを自分で触って試すのが好きです。' },
  { icon: 'box', title: '3Dと空間表現', text: '思ったものを簡単に形にできるのが好きです。' },
  { icon: 'chart', title: 'データ・仕組み', text: 'AIと一緒に最適解を導き出すのが楽しいです。' },
];

export const SKILL_GROUPS = [
  { title: 'Frontend', skills: ['React', 'TypeScript', 'JavaScript', 'Next.js', 'Three.js', 'Tailwind CSS'] },
  { title: 'Backend / Tools', skills: ['Node.js', 'Firebase', 'Supabase', 'GitHub'] },
  { title: '3D / Design', skills: ['Blender', 'Three.js', 'Figma', 'Adobe Illustrator', 'Adobe Photoshop'] },
  { title: 'AIs', skills: ['ChatGPT', 'Codex', 'Claude', 'qwen'] },
  { title: 'Other', skills: ['Git', 'VS Code', 'Vite', 'Notion'] },
];

export const HISTORY = [
  { time: '小学生の頃〜', text: 'ものづくり(工作)に興味を持つ' },
  { time: '中学時代', text: 'ゲームに触れプログラミングに興味を持つ' },
  { time: '高専時代〜現在', text: 'バイブコーディングでWeb・アプリ制作を学ぶ、3Dは独学' },
  { time: 'これから', text: '身近な人が今よりちょっと幸せになれるようなものを作っていきたい' },
];

export const NOW = [
  { title: '制作中のこと', text: '3Dインタラクション作品' },
  { title: '学んでいること', text: 'WebGL / Shader / UIアニメーション' },
  { title: '興味があること', text: 'AI / XR / データビジュアライズ' },
];
