// ============================================================
// サイト全体で使うプロフィール・固定コンテンツ
// 作品・ダウンロードは works/ downloads/ の md で管理する。
//
// 表記ルール(全ページ共通。reports/README.md にも同じものを載せている)
//   - 文体は「です・ます」。見出しのみ体言止め
//   - 約物は全角(、。！？「」（）)、英数字は半角。和欧間にスペースは入れない
//   - 技術名は公式表記(JavaScript / Three.js / Firebase / GarageBand など)
//   - 「作る」は漢字、「もの」はひらがな
//   - キャッチコピーは PROFILE.tagline の1つだけ。ほかの言い回しを増やさない
// ============================================================

export const PROFILE = {
  nameJa: '新井智己',
  nameEn: 'Tomoki Arai',
  reading: 'あらいともき',
  nickname: 'あらとも',
  affiliation: '神山まるごと高専2期生',
  fields: 'アプリ・3D・電子工作',
  // トップの小見出しなど英語で並べる場所用(fields と同じ順番にする)
  fieldsEn: 'App / 3D / Electronics',
  tagline: '身の回りを、ちょっと好きになる。',
  email: 'toki.zeno.0508@gmail.com',
  socials: [
    { id: 'github', label: 'GitHub', url: 'https://github.com/toki-0508' },
    { id: 'x', label: 'X', url: 'https://x.com/zeno_arai' },
  ],
};

// ナビは英語、ページ内の見出しは日本語、という役割分担で統一する。
// title はページの h1 とブラウザタブのタイトルに使う。
export const NAV_LINKS = [
  { id: '/about', label: 'About', title: 'プロフィール' },
  { id: '/works', label: 'Works', title: '作品' },
  { id: '/downloads', label: 'Downloads', title: 'ダウンロード' },
  { id: '/contact', label: 'Contact', title: 'お問い合わせ' },
];

export const MVV = [
  {
    label: 'Mission',
    title: '身近な不便を、触って楽しいものに変える',
    text: '日常の小さな困りごとや退屈を、アプリ・3D・電子工作の力で、使いやすく少しワクワクする形に変えていきます。',
  },
  {
    label: 'Vision',
    title: 'すべてのものに、愛着を持てる社会を作る',
    text: '身の回りのものにこだわり、それを好きになれることは、暮らしをより幸せにしてくれると考えています。',
  },
  {
    label: 'Values',
    title: 'わかりやすく、気持ちよく、続けて磨く',
    text: '見た目の良さだけでなく、使う人が迷わないこと、触って心地よいこと、作ったあとも使い続けられることを大切にしています。',
  },
];

// Values を3つの行動に分けたもの。トップページで「どう考えて作るか」を短く伝える。
export const INTERESTS = [
  { icon: 'pen', title: '作ること', text: 'アイデアを形にするのが好きです。' },
  { icon: 'play', title: '遊ぶこと', text: '作ったものを、自分で触って試すのが好きです。' },
  { icon: 'box', title: '3Dと空間表現', text: '思い描いたものを、そのまま形にできるのが好きです。' },
  { icon: 'chart', title: 'データと仕組み', text: 'AIと一緒に、最適な方法を考えるのが好きです。' },
];

// 作品・ダウンロードの tags に含まれる技術は、プロフィールで「作品で使用」と表示される。
// (判定は loader.js の techUsage。名前は tags と同じ表記で書くこと)
export const SKILL_GROUPS = [
  { title: '開発', skills: ['React', 'JavaScript', 'TypeScript', 'Next.js', 'Flutter', 'Dart', 'Python', 'Java', 'C', 'Three.js', 'Vite', 'Tailwind CSS', 'Chrome Extensions', 'Minecraft Forge'] },
  { title: 'バックエンド・公開', skills: ['Firebase', 'Google Apps Script', 'SQLite', 'Supabase', 'Node.js', 'Vercel', 'GitHub Actions'] },
  { title: '3D・デザイン・サウンド', skills: ['Blender', 'Figma', 'Adobe Illustrator', 'Adobe Photoshop', 'GarageBand'] },
  { title: '電子工作', skills: ['KiCad', 'nRF52840', 'Zephyr', 'Arduino'] },
  { title: 'ツール・AI', skills: ['Git', 'VS Code', 'Notion', 'ChatGPT', 'Claude', 'Codex', 'Qwen'] },
];

export const HISTORY = [
  { time: '小学生のころ', text: '工作をきっかけに、ものづくりに興味を持ちました。' },
  { time: '中学生のころ', text: 'ゲームをきっかけに、プログラミングに興味を持ちました。' },
  { time: '高専〜現在', text: '生成AIを活用しながらアプリ開発を学んでいます。3Dは独学で、最近は電子工作にも力を入れています。' },
  { time: 'これから', text: '身近な人が、今よりちょっと幸せになれるものを作っていきたいです。' },
];

// 「いま」の内容は古くなりやすいので、いつ時点の情報かを必ず表示する。
export const NOW_UPDATED = '2026-10';
export const NOW = [
  { title: 'いま作っているもの', text: '電子工作で作るオリジナルのガジェット' },
  { title: '学んでいること', text: '回路・基板設計（KiCad）とマイコンのプログラミング' },
  { title: '興味があること', text: 'AI・XR・データビジュアライゼーション' },
];
