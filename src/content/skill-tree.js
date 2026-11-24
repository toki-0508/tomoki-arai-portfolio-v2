// 分岐だけを定義する。スキル名と編集パスは site.json を唯一のデータ源にする。
export const SKILL_BRANCHES = [
  {
    id: 'web',
    title: 'Web',
    icon: 'Monitor',
    tracks: [
      { title: '言語', skills: ['JavaScript', 'TypeScript'] },
      { title: 'UI・表現', skills: ['React', 'Next.js', 'Three.js'] },
      { title: '制作環境', skills: ['Vite', 'Tailwind CSS'] },
    ],
  },
  {
    id: 'app',
    title: 'App & Game',
    icon: 'Smartphone',
    tracks: [
      { title: 'アプリ', skills: ['Flutter', 'Dart', 'Chrome Extensions'] },
      { title: '言語・ゲーム', skills: ['Python', 'Java', 'C', 'Minecraft Forge'] },
    ],
  },
  {
    id: 'backend',
    title: 'Backend',
    icon: 'Box',
    tracks: [
      { title: 'データ', skills: ['Firebase', 'SQLite', 'Supabase'] },
      { title: '連携・公開', skills: ['Node.js', 'Google Apps Script', 'Vercel', 'GitHub Actions'] },
    ],
  },
  {
    id: 'creative',
    title: 'Creative',
    icon: 'Pen',
    tracks: [
      { title: '立体・音', skills: ['Blender', 'GarageBand'] },
      { title: 'デザイン', skills: ['Figma', 'Adobe Illustrator', 'Adobe Photoshop'] },
    ],
  },
  {
    id: 'hardware',
    title: 'Hardware',
    icon: 'Chip',
    tracks: [
      { title: '回路・基板', skills: ['KiCad', 'Arduino'] },
      { title: '組み込み', skills: ['nRF52840', 'Zephyr'] },
    ],
  },
  {
    id: 'tools',
    title: 'Tools & AI',
    icon: 'Spark',
    tracks: [
      { title: '制作ツール', skills: ['Git', 'VS Code', 'Notion'] },
      { title: 'AIとつくる', skills: ['ChatGPT', 'Claude', 'Codex', 'Qwen'] },
    ],
  },
];
