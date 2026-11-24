import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Icon } from '../../components/Icon.jsx';
import { SkillGraph } from '../../components/skill-tree/SkillGraph.jsx';
import { useTreeCamera } from '../../components/skill-tree/useTreeCamera.js';
import { buildSkillTree } from '../../lib/skill-tree.js';
import { MAX_SKILLS, moveSkill, removeSkill, validateSkillTree } from '../../lib/skill-tree-model.js';
import ICONS from '../../content/skill-icons.json';
import { SkillNodeInspector } from './SkillNodeInspector.jsx';
import '../../styles/tokens.css';
import '../../styles/base.css';
import '../../components/skill-tree/skill-tree.css';
import './skill-tree-editor.css';

const iconIds = Object.keys(ICONS);
const historyInitial = { past: [], model: null, future: [] };
function history(state, action) {
  if (action.type === 'load') return { past: [], model: action.model, future: [] };
  if (action.type === 'replace')
    return { past: [...state.past, state.model].slice(-50), model: action.model, future: [] };
  if (action.type === 'undo' && state.past.length)
    return {
      past: state.past.slice(0, -1),
      model: state.past.at(-1),
      future: [state.model, ...state.future],
    };
  if (action.type === 'redo' && state.future.length)
    return { past: [...state.past, state.model], model: state.future[0], future: state.future.slice(1) };
  return state;
}

async function request(method, body) {
  const response = await fetch('/__editor/skill-tree', {
    method,
    headers: { 'X-Editor': '1', 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '保存窓口につながりませんでした');
  return result;
}

export function SkillTreeEditor() {
  const [state, dispatch] = useReducer(history, historyInitial);
  const [selected, setSelected] = useState('root');
  const [revision, setRevision] = useState(null);
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [tool, setTool] = useState('nodes');
  const [snap, setSnap] = useState(true);
  const [drag, setDrag] = useState(null);
  const dragRef = useRef(null);
  const fileInput = useRef(null);
  const viewport = useRef(null);
  const model = state.model;
  const visibleModel = useMemo(
    () => (model && drag ? moveSkill(model, drag.id, drag.x, drag.y, snap) : model),
    [model, drag, snap],
  );
  const tree = useMemo(
    () => (visibleModel ? buildSkillTree(visibleModel) : { nodes: [], edges: [] }),
    [visibleModel],
  );
  const { camera, fit, zoom, handlers } = useTreeCamera(viewport, tree.nodes);
  const creator = useMemo(() => model && { id: 'root', name: 'Tomoki Arai', ...model.root }, [model?.root]);
  const node =
    selected === 'root' ? creator : model?.nodes.find((candidate) => candidate.id === selected) || creator;
  const dirty = Boolean(model && JSON.stringify(model) !== saved);
  const onPending = useCallback((value) => setPending(value), []);

  const load = useCallback(async () => {
    setError('');
    try {
      const result = await request('GET');
      const next = validateSkillTree(result.model, iconIds);
      dispatch({ type: 'load', model: next });
      setSaved(JSON.stringify(next));
      setRevision(result.revision);
      setSelected('root');
    } catch (failure) {
      setError(failure.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!dirty && !pending) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, pending]);
  useEffect(() => {
    if (model && selected !== 'root' && !model.nodes.some((candidate) => candidate.id === selected))
      setSelected('root');
  }, [model, selected]);

  function apply(next) {
    const valid = validateSkillTree(next, iconIds);
    if (JSON.stringify(valid) === JSON.stringify(model)) {
      setError('');
      return;
    }
    dispatch({ type: 'replace', model: valid });
    setError('');
  }
  async function save() {
    if (!model || saving || pending) return;
    setSaving(true);
    setError('');
    try {
      const snapshot = validateSkillTree(model, iconIds);
      const result = await request('POST', { model: snapshot, revision });
      setRevision(result.revision);
      setSaved(JSON.stringify(snapshot));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }
  useEffect(() => {
    const key = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  function choose(id, focus = false) {
    if (pending && !window.confirm('未適用のノード設定を破棄して選択を変えますか？')) return;
    setSelected(id);
    if (focus) requestAnimationFrame(() => fit(id));
  }
  function add() {
    if (!model || model.nodes.length >= MAX_SKILLS) return;
    let name = '新しいスキル';
    for (let index = 2; model.nodes.some((candidate) => candidate.name === name); index++)
      name = `新しいスキル ${index}`;
    const id = `skill-${crypto.randomUUID()}`;
    const next = {
      id,
      name,
      x: 1200,
      y: 1050,
      parent: selected === 'root' ? null : selected,
      branch: node.branch || 'web',
      notable: false,
      icon: null,
    };
    apply({ ...model, nodes: [...model.nodes, next] });
    choose(id, true);
  }
  function remove() {
    if (!window.confirm('このノードを削除しますか？ 子ノードは親へつなぎ直します。')) return;
    apply(removeSkill(model, selected));
    setSelected('root');
  }
  function startDrag(event) {
    if (tool !== 'nodes' || !model || pending || (event.pointerType === 'mouse' && event.button !== 0))
      return;
    const id = event.target.closest('[data-node-id]')?.dataset.nodeId;
    if (!id) return;
    const target = id === 'root' ? model.root : model.nodes.find((candidate) => candidate.id === id);
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: target.x,
      y: target.y,
      scale: camera.scale,
    };
    setSelected(id);
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveDrag(event) {
    const start = dragRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    event.stopPropagation();
    setDrag({
      id: start.id,
      x: start.x + (event.clientX - start.startX) / start.scale,
      y: start.y + (event.clientY - start.startY) / start.scale,
    });
  }
  function endDrag(event) {
    const start = dragRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const x = start.x + (event.clientX - start.startX) / start.scale;
    const y = start.y + (event.clientY - start.startY) / start.scale;
    if (event.type === 'pointerup' && Math.hypot(x - start.x, y - start.y) > 2)
      apply(moveSkill(model, start.id, x, y, snap));
    dragRef.current = null;
    setDrag(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  async function importFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (file.size > 256 * 1024) throw new Error('JSONは256KBまでです');
      const next = validateSkillTree(JSON.parse(await file.text()), iconIds);
      if ((dirty || pending) && !window.confirm('現在の編集を読み込んだファイルに置き換えますか？')) return;
      apply(next);
      setSelected('root');
    } catch (failure) {
      setError(failure.message);
    }
  }
  function exportFile() {
    const url = URL.createObjectURL(
      new Blob([`${JSON.stringify(model, null, 2)}\n`], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `skill-tree-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <main className="skill-layout-editor">
      <header className="sle-toolbar">
        <h1>スキルツリーを編集</h1>
        <div className="sle-history">
          <button
            type="button"
            title="元に戻す"
            aria-label="元に戻す"
            disabled={!state.past.length || pending}
            onClick={() => dispatch({ type: 'undo' })}
          >
            <Icon.Undo />
          </button>
          <button
            type="button"
            title="やり直す"
            aria-label="やり直す"
            disabled={!state.future.length || pending}
            onClick={() => dispatch({ type: 'redo' })}
          >
            <Icon.Redo />
          </button>
        </div>
        <button type="button" disabled={!model || pending || model.nodes.length >= MAX_SKILLS} onClick={add}>
          <Icon.Plus />
          ノード追加
        </button>
        <button
          type="button"
          title="JSONを書き出す"
          aria-label="JSONを書き出す"
          disabled={!model || pending}
          onClick={exportFile}
        >
          <Icon.Download />
        </button>
        <button
          type="button"
          title="JSONを読み込む"
          aria-label="JSONを読み込む"
          onClick={() => fileInput.current.click()}
        >
          <Icon.Up />
        </button>
        <input ref={fileInput} hidden type="file" accept=".json,application/json" onChange={importFile} />
        <button type="button" className="sle-primary" disabled={!dirty || saving || pending} onClick={save}>
          <Icon.Save />
          {saving ? '保存中…' : '下書きを保存'}
        </button>
        <a href="/#/about" target="_blank" rel="noreferrer">
          Aboutを確認
          <Icon.External width={14} height={14} />
        </a>
      </header>
      <div className="sle-status" role={error ? 'alert' : 'status'}>
        {error ||
          (pending
            ? '右側の「変更を適用」でノードの編集を確定してください'
            : dirty
              ? '未保存の変更があります'
              : model
                ? '保存済み。変更した内容の公開は、下書き確認後に行います。'
                : '読み込んでいます…')}
        {error && (
          <button
            type="button"
            onClick={() => {
              if (!dirty || window.confirm('未保存の変更を破棄して再読み込みしますか？')) load();
            }}
          >
            再読み込み
          </button>
        )}
      </div>
      <div className="sle-workspace">
        <nav className="sle-node-list" aria-label="ノード一覧">
          <button
            type="button"
            aria-current={selected === 'root' ? 'true' : undefined}
            onClick={() => choose('root', true)}
          >
            制作元
          </button>
          {model?.nodes.map((candidate) => (
            <button
              type="button"
              key={candidate.id}
              aria-current={selected === candidate.id ? 'true' : undefined}
              onClick={() => choose(candidate.id, true)}
            >
              {candidate.name}
            </button>
          ))}
        </nav>
        <section className="sle-canvas-area">
          <div className="sle-canvas-toolbar">
            <div role="group" aria-label="ドラッグ操作">
              <button type="button" aria-pressed={tool === 'nodes'} onClick={() => setTool('nodes')}>
                ノードを動かす
              </button>
              <button type="button" aria-pressed={tool === 'pan'} onClick={() => setTool('pan')}>
                画面を動かす
              </button>
            </div>
            <label>
              <input type="checkbox" checked={snap} onChange={(event) => setSnap(event.target.checked)} />
              20刻み
            </label>
            <button type="button" title="全体を表示" aria-label="全体を表示" onClick={() => fit()}>
              <Icon.Fit />
            </button>
          </div>
          <div
            ref={viewport}
            className="skill-tree-viewport sle-canvas"
            tabIndex={0}
            role="group"
            aria-label="ノードを配置するキャンバス"
            {...handlers}
            onPointerDownCapture={startDrag}
            onPointerMoveCapture={moveDrag}
            onPointerUpCapture={endDrag}
            onPointerCancelCapture={endDrag}
          >
            {model && (
              <SkillGraph tree={tree} camera={camera} selected={selected} interactive onSelect={choose} />
            )}
          </div>
          <div className="sle-zoom">
            <button type="button" aria-label="縮小" onClick={() => zoom(1 / 1.25)}>
              <Icon.Minus />
            </button>
            <output>{Math.round(camera.scale * 100)}%</output>
            <button type="button" aria-label="拡大" onClick={() => zoom(1.25)}>
              <Icon.Plus />
            </button>
          </div>
        </section>
        <aside className="sle-sidebar">
          {model && (
            <label className="sle-node-select">
              ノードを選ぶ
              <select
                aria-label="ノードを選ぶ"
                value={node.id}
                onChange={(event) => choose(event.target.value, true)}
              >
                <option value="root">制作元</option>
                {model.nodes.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {node && (
            <SkillNodeInspector
              key={node.id}
              node={node}
              model={model}
              onApply={apply}
              onDelete={remove}
              onPending={onPending}
            />
          )}
        </aside>
      </div>
    </main>
  );
}
