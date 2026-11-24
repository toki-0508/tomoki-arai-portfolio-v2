import fs from 'node:fs';
import { validateSkillTree } from '../src/lib/skill-tree-model.js';

const icons = JSON.parse(fs.readFileSync('src/content/skill-icons.json', 'utf8'));
const model = JSON.parse(fs.readFileSync('src/content/skill-tree.json', 'utf8'));
validateSkillTree(model, Object.keys(icons));
for (const icon of Object.values(icons)) {
  if (!/^\/images\/skills\/[a-z0-9-]+\.(svg|png)$/.test(icon.src) || !fs.existsSync(`public${icon.src}`)) {
    throw new Error(`スキルのロゴが見つかりません: ${icon.src}`);
  }
}
console.log(`スキルツリー: ${model.nodes.length}ノード・ロゴの参照を検証しました`);
