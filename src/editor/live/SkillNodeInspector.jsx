import { useEffect, useState } from 'react';
import ICONS from '../../content/skill-icons.json';
import { isDescendant, SKILL_TONES } from '../../lib/skill-tree-model.js';
import { SkillEmblem } from '../../components/skill-tree/SkillEmblem.jsx';

const colors = ['青緑', '青', '紫', 'オレンジ', '緑', 'ピンク'];

export function SkillNodeInspector({ node, model, onApply, onDelete, onPending }) {
  const [form, setForm] = useState(node);
  const [error, setError] = useState('');
  useEffect(() => {
    setForm(node);
    setError('');
  }, [node]);
  useEffect(() => {
    onPending(JSON.stringify(form) !== JSON.stringify(node));
  }, [form, node, onPending]);
  const root = node.id === 'root';
  const field = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  function submit(event) {
    event.preventDefault();
    const next = root
      ? { ...model, root: { x: Number(form.x), y: Number(form.y) } }
      : {
          ...model,
          nodes: model.nodes.map((candidate) =>
            candidate.id === node.id ? { ...form, x: Number(form.x), y: Number(form.y) } : candidate,
          ),
        };
    try {
      onApply(next);
      setError('');
    } catch (failure) {
      setError(failure.message);
    }
  }
  return (
    <form className="sle-inspector" onSubmit={submit}>
      <h2>{root ? '制作元' : 'ノードの設定'}</h2>
      {!root && (
        <div className={`sle-icon-preview skill-tone-${form.branch}`}>
          <SkillEmblem name={form.name} icon={form.icon} />
        </div>
      )}
      {!root && (
        <label>
          名前
          <input
            value={form.name}
            maxLength={80}
            onChange={(event) => field('name', event.target.value)}
            required
          />
        </label>
      )}
      <div className="sle-coordinate-row">
        <label>
          X
          <input
            type="number"
            min="100"
            max="2300"
            step="1"
            value={form.x}
            onChange={(event) => field('x', event.target.value)}
            required
          />
        </label>
        <label>
          Y
          <input
            type="number"
            min="100"
            max="2300"
            step="1"
            value={form.y}
            onChange={(event) => field('y', event.target.value)}
            required
          />
        </label>
      </div>
      {!root && (
        <>
          <label>
            接続先
            <select
              value={form.parent || ''}
              aria-label="接続先"
              onChange={(event) => field('parent', event.target.value || null)}
            >
              <option value="">制作元</option>
              {model.nodes
                .filter((candidate) => !isDescendant(model, candidate.id, node.id))
                .map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            枝の色
            <select
              aria-label="枝の色"
              value={form.branch}
              onChange={(event) => field('branch', event.target.value)}
            >
              {SKILL_TONES.map((tone, index) => (
                <option key={tone} value={tone}>
                  {colors[index]}
                </option>
              ))}
            </select>
          </label>
          <label>
            形
            <select
              value={form.notable ? 'diamond' : 'circle'}
              aria-label="形"
              onChange={(event) => field('notable', event.target.value === 'diamond')}
            >
              <option value="circle">円</option>
              <option value="diamond">大きな菱形</option>
            </select>
          </label>
          <label>
            ロゴ
            <select
              aria-label="ロゴ"
              value={form.icon || ''}
              onChange={(event) => field('icon', event.target.value || null)}
            >
              <option value="">未選択</option>
              {Object.entries(ICONS)
                .sort(([, a], [, b]) => a.label.localeCompare(b.label))
                .map(([id, icon]) => (
                  <option key={id} value={id}>
                    {icon.label}
                  </option>
                ))}
            </select>
          </label>
        </>
      )}
      {error && (
        <p role="alert" className="sle-error">
          {error}
        </p>
      )}
      <button type="submit" className="sle-primary">
        変更を適用
      </button>
      {!root && (
        <button type="button" className="sle-delete" onClick={onDelete}>
          このノードを削除
        </button>
      )}
    </form>
  );
}
